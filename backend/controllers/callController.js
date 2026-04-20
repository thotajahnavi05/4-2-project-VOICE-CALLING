import Call from '../models/Call.js';
import Assistant from '../models/Assistant.js';
import { bolnaRequest } from '../services/bolnaService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

let callsCache = null;
let callsCacheTime = 0;

// ═══════════════════════════════════════════════════════════
// CREATE CALL
// ═══════════════════════════════════════════════════════════
export const createCall = asyncHandler(async (req, res) => {
  const { assistantId, customerPhone, phoneNumber } = req.body;

  if (!assistantId) {
    return res.status(400).json({ error: 'Missing assistantId', message: 'Please select an AI assistant before making a call' });
  }
  if (!customerPhone) {
    return res.status(400).json({ error: 'Missing phone number', message: 'Please enter the phone number you want to call' });
  }

  // Validate and normalize phone number to E.164 format
  let cleanNumber = customerPhone.replace(/[\s\-\(\)]/g, '');
  // If it's a 10-digit Indian number, add +91
  if (/^\d{10}$/.test(cleanNumber)) {
    cleanNumber = '+91' + cleanNumber;
  }
  // If starts with 91 and is 12 digits, add +
  else if (/^91\d{10}$/.test(cleanNumber)) {
    cleanNumber = '+' + cleanNumber;
  }
  // If starts with 0, remove 0 and add +91
  else if (/^0\d{10}$/.test(cleanNumber)) {
    cleanNumber = '+91' + cleanNumber.substring(1);
  }
  // If no + prefix but has country code
  else if (!cleanNumber.startsWith('+') && cleanNumber.length > 10) {
    cleanNumber = '+' + cleanNumber;
  }

  if (cleanNumber.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ error: 'Invalid phone number', message: 'Phone number must be at least 10 digits' });
  }

  // Look up assistant - resolve MongoDB _id to Bolna agent_id
  let assistant;
  let bolnaAgentId;

  if (assistantId.match(/^[0-9a-fA-F]{24}$/)) {
    // MongoDB ObjectId
    assistant = await Assistant.findById(assistantId);
    if (!assistant || !assistant.providerId) {
      return res.status(400).json({
        error: 'Assistant not configured',
        message: assistant
          ? 'Assistant has no Bolna provider ID. Please delete and recreate the assistant.'
          : `Assistant ${assistantId} not found.`,
      });
    }
    bolnaAgentId = assistant.providerId;
  } else {
    // Might be a Bolna provider ID directly
    assistant = await Assistant.findOne({ providerId: assistantId, provider: 'bolna' });
    bolnaAgentId = assistantId;
  }

  const fromPhone = phoneNumber || process.env.BOLNA_DEFAULT_PHONE_NUMBER;
  if (!fromPhone) {
    return res.status(400).json({ error: 'Missing from phone number', message: 'No caller ID configured. Set BOLNA_DEFAULT_PHONE_NUMBER.' });
  }

  // ═══════════════════════════════════════════════════════════
  // VERIFY AGENT IN BOLNA (non-blocking - don't fail the call)
  // ═══════════════════════════════════════════════════════════
  try {
    const agentDetails = await bolnaRequest('GET', `/v2/agent/${bolnaAgentId}`);
    console.log(`[Call] Agent verified: ${agentDetails.agent_name}`);
  } catch (err) {
    // Don't block the call - agent might still work even if verification fails (DNS issues etc.)
    console.warn('[Call] Agent verification skipped:', err.message?.substring(0, 100));
  }

  // ═══════════════════════════════════════════════════════════
  // MAKE THE CALL
  // ═══════════════════════════════════════════════════════════
  console.log(`[Call] Initiating call to ${customerPhone} via agent ${bolnaAgentId}`);

  const callPayload = {
    agent_id: bolnaAgentId,
    recipient_phone_number: cleanNumber,
    from_phone_number: fromPhone,
  };

  const callResponse = await bolnaRequest('POST', '/call', callPayload);
  console.log('[Call] Bolna response:', JSON.stringify(callResponse));

  // Save to DB
  const executionId = callResponse.execution_id || callResponse.id || callResponse.call_id;

  if (executionId) {
    const call = await Call.create({
      providerId: executionId,
      executionId: executionId,
      provider: 'bolna',
      assistantId: assistant?._id || null,
      assistantProviderId: bolnaAgentId,
      status: callResponse.status || 'queued',
      direction: 'outbound',
      phoneNumber: fromPhone,
      customerPhone: cleanNumber,
      userId: req.userId,
      startedAt: new Date(),
    });

    callsCache = null;

    // ═══════════════════════════════════════════════════════════
    // START BACKGROUND TRANSCRIPT POLLING (like original repo)
    // ═══════════════════════════════════════════════════════════
    setImmediate(async () => {
      try {
        console.log(`[Poll] Starting auto-transcript polling for: ${executionId}`);
        let attempts = 0;
        const maxAttempts = 80; // 80 * 15s = 20 minutes

        const pollTranscript = async () => {
          attempts++;
          try {
            // Use /agent/{id}/executions which is the working Bolna endpoint
            const allExecs = await bolnaRequest('GET', `/agent/${bolnaAgentId}/executions`);
            const execList = Array.isArray(allExecs) ? allExecs : (allExecs?.data || allExecs?.executions || []);
            const exec = execList.find(e => (e.execution_id || e.id) === executionId);

            if (!exec) {
              console.log(`[Poll] Attempt ${attempts}/${maxAttempts} - Execution not found yet`);
              if (attempts < maxAttempts) setTimeout(pollTranscript, 15000);
              return;
            }

            console.log(`[Poll] Attempt ${attempts}/${maxAttempts} - Status: ${exec.status}`);

            if (exec.status === 'completed' || exec.status === 'ended' || exec.status === 'failed') {
              console.log(`[Poll] Call ended: ${executionId}, extracting transcript...`);

              try {
                const transcript = exec.transcript || exec.full_transcript || '';

                if (transcript && transcript.trim().length > 10) {
                  console.log(`[Poll] Transcript received (${transcript.length} chars)`);

                  const recordingUrl = exec.recording_url || exec.recordingUrl || exec.recording || '';
                  await Call.updateOne(
                    { providerId: executionId },
                    {
                      status: exec.status === 'ended' ? 'completed' : exec.status,
                      transcript,
                      ...(recordingUrl && { recordingUrl }),
                      duration: exec.conversation_duration || exec.duration || 0,
                      cost: exec.total_cost || exec.cost || 0,
                      endedAt: new Date(),
                    }
                  );
                  console.log('[Poll] Call record updated with transcript');

                  // Auto booking extraction
                  if (assistant?.enableBookingExtraction || assistant?.useCase === 'restaurant_booking') {
                    try {
                      const { processTranscript } = await import('./bookingController.js');
                      await processTranscript(
                        {
                          body: { callId: executionId, transcript, agentId: bolnaAgentId },
                          userId: req.userId,
                        },
                        { status: () => ({ json: (d) => console.log('[Poll] Booking:', d.success ? 'Success' : 'Failed') }), json: () => {} }
                      );
                    } catch (bookErr) {
                      console.error('[Poll] Booking extraction error:', bookErr.message);
                    }
                  }
                }
              } catch (tErr) {
                console.error('[Poll] Transcript fetch error:', tErr.message?.substring(0, 200));
              }
              return;
            }

            if (attempts < maxAttempts) {
              setTimeout(pollTranscript, 15000);
            }
          } catch (pollErr) {
            console.error(`[Poll] Error (attempt ${attempts}):`, pollErr.message?.substring(0, 100));
            if (attempts < maxAttempts) setTimeout(pollTranscript, 15000);
          }
        };

        setTimeout(pollTranscript, 30000);
      } catch (err) {
        console.error('[Poll] Setup error:', err.message);
      }
    });

    res.json({
      success: true,
      data: call,
      execution_id: executionId,
      status: callResponse.status || 'queued',
    });
  } else {
    res.json({ success: true, ...callResponse });
  }
});

// ═══════════════════════════════════════════════════════════
// GET ALL CALLS
// ═══════════════════════════════════════════════════════════
export const getAllCalls = asyncHandler(async (req, res) => {
  const now = Date.now();
  const forceRefresh = req.query.refresh === 'true';

  if (!forceRefresh && callsCache && (now - callsCacheTime) < 30000) {
    return res.json({ success: true, data: callsCache, cached: true });
  }

  // If force refresh, also sync from Bolna
  if (forceRefresh) {
    try {
      const agents = await Assistant.find({ provider: 'bolna', providerId: { $exists: true, $ne: '' } }).select('providerId name').lean();

      for (const agent of agents) {
        try {
          const executions = await bolnaRequest('GET', `/agent/${agent.providerId}/executions`);
          const execList = Array.isArray(executions) ? executions : (executions?.data || executions?.executions || []);

          for (const exec of execList) {
            const execId = exec.execution_id || exec.id;
            if (!execId) continue;

            await Call.updateOne(
              { providerId: execId },
              {
                $setOnInsert: {
                  providerId: execId,
                  executionId: execId,
                  provider: 'bolna',
                  assistantId: agent._id || null,
                  assistantProviderId: agent.providerId,
                  customerPhone: exec.recipient_phone_number || exec.to || '',
                  phoneNumber: exec.from_phone_number || exec.from || '',
                  userId: req.userId,
                  createdAt: exec.created_at ? new Date(exec.created_at) : new Date(),
                },
                $set: {
                  status: exec.status || (exec.ended_at ? 'completed' : 'in-progress'),
                  duration: exec.conversation_duration || exec.duration || 0,
                  cost: exec.total_cost || exec.cost || 0,
                  endedAt: exec.ended_at ? new Date(exec.ended_at) : undefined,
                },
              },
              { upsert: true }
            );
          }
        } catch (err) {
          console.warn(`[Calls] Sync error for ${agent.name}:`, err.message?.substring(0, 100));
        }
      }
    } catch (err) {
      console.error('[Calls] Sync error:', err.message);
    }
  }

  const calls = await Call.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('assistantId', 'name providerId');

  callsCache = calls;
  callsCacheTime = now;

  res.json({ success: true, data: calls });
});

// ═══════════════════════════════════════════════════════════
// GET CALL BY ID
// ═══════════════════════════════════════════════════════════
export const getCallById = asyncHandler(async (req, res) => {
  const call = await Call.findById(req.params.id).populate('assistantId', 'name providerId');
  if (!call) {
    return res.status(404).json({ success: false, error: 'Call not found' });
  }

  // Fetch latest from Bolna via agent executions endpoint
  if (call.executionId && call.assistantProviderId) {
    try {
      const allExecs = await bolnaRequest('GET', `/agent/${call.assistantProviderId}/executions`);
      const execList = Array.isArray(allExecs) ? allExecs : (allExecs?.data || []);
      const exec = execList.find(e => (e.execution_id || e.id) === call.executionId);
      if (exec) {
        call.status = exec.status === 'ended' ? 'completed' : (exec.status || call.status);
        if (exec.conversation_duration) call.duration = exec.conversation_duration;
        if (exec.transcript || exec.full_transcript) call.transcript = exec.transcript || exec.full_transcript;
        if (exec.recording_url || exec.recordingUrl) call.recordingUrl = exec.recording_url || exec.recordingUrl;
        if (exec.ended_at) call.endedAt = new Date(exec.ended_at);
        if (exec.total_cost) call.cost = exec.total_cost;
        await call.save();
      }
    } catch (err) {
      console.log('[Call] Status fetch error:', err.message?.substring(0, 100));
    }
  }

  res.json({ success: true, data: call });
});

// ═══════════════════════════════════════════════════════════
// STOP CALL
// ═══════════════════════════════════════════════════════════
export const stopCall = asyncHandler(async (req, res) => {
  const call = await Call.findById(req.params.id);
  if (!call) {
    return res.status(404).json({ success: false, error: 'Call not found' });
  }

  const callId = call.executionId || call.providerId;
  if (callId) {
    try {
      await bolnaRequest('POST', `/call/${callId}/stop`);
      console.log(`[Call] Stopped: ${callId}`);
    } catch (err) {
      console.log('[Call] Stop error:', err.message?.substring(0, 100));
    }
  }

  call.status = 'completed';
  call.endedAt = new Date();
  if (call.startedAt) call.duration = Math.round((call.endedAt - call.startedAt) / 1000);
  await call.save();
  callsCache = null;

  res.json({ success: true, data: call });
});
