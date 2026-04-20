import { Router } from 'express';
import Call from '../models/Call.js';
import Assistant from '../models/Assistant.js';
import { bolnaRequest } from '../services/bolnaService.js';
import { extractBookingFromTranscript } from '../services/transcriptExtractionService.js';
import { validateBookingData, checkAvailabilityWithDB, createBooking } from '../services/bookingService.js';
import { BOOKING_STATUS } from '../constants/index.js';

const router = Router();

// ═══════════════════════════════════════════════════════════
// BOLNA WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { event, data, agent_id, execution_id } = req.body;
    console.log(`[Webhook] Event: ${event}, Agent: ${agent_id}, Execution: ${execution_id}`);

    switch (event) {
      case 'call_started': {
        let call = await Call.findOne({ executionId: execution_id });
        if (!call) {
          const assistant = await Assistant.findOne({ providerId: agent_id });
          call = new Call({
            executionId: execution_id,
            providerId: execution_id,
            provider: 'bolna',
            assistantId: assistant?._id,
            assistantProviderId: agent_id,
            status: 'in-progress',
            direction: data?.direction || 'inbound',
            customerPhone: data?.caller_number || data?.recipient_phone_number || '',
            phoneNumber: data?.called_number || data?.from_phone_number || '',
            startedAt: new Date(),
            userId: assistant?.userId || 'default',
          });
          await call.save();
        } else {
          call.status = 'in-progress';
          call.startedAt = new Date();
          await call.save();
        }
        break;
      }

      case 'transcription': {
        const call = await Call.findOne({ executionId: execution_id });
        if (call) {
          const text = data?.text || data?.transcript || '';
          if (text) {
            call.transcript = (call.transcript || '') + ' ' + text;
            await call.save();
          }

          // Check hangup keywords
          if (call.assistantId) {
            const assistant = await Assistant.findById(call.assistantId);
            if (assistant?.hangupKeywords?.length) {
              const lower = text.toLowerCase();
              const shouldHangup = assistant.hangupKeywords.some(kw => lower.includes(kw.toLowerCase()));
              if (shouldHangup) {
                console.log(`[Webhook] Hangup keyword detected in ${execution_id}`);
                try {
                  await bolnaRequest('POST', `/call/${execution_id}/stop`);
                } catch (err) {
                  console.error('[Webhook] Failed to stop call:', err.message?.substring(0, 100));
                }
              }
            }
          }
        }
        break;
      }

      case 'call_ended': {
        const call = await Call.findOne({ executionId: execution_id });
        if (call) {
          call.status = 'completed';
          call.endedAt = new Date();
          if (call.startedAt) call.duration = Math.round((call.endedAt - call.startedAt) / 1000);
          if (data?.recording_url) call.recordingUrl = data.recording_url;
          if (data?.cost) call.cost = data.cost;
          await call.save();

          // Background booking extraction
          processBookingInBackground(call, execution_id, agent_id).catch(err => {
            console.error('[Webhook] Background booking error:', err.message);
          });
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${event}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Webhook Error]', err.message);
    res.status(200).json({ success: true }); // Always 200 for webhooks
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bolna-webhooks', features: ['call_events', 'transcription', 'booking_extraction'] });
});

async function processBookingInBackground(call, executionId, agentId) {
  if (!call.assistantId) return;

  const assistant = await Assistant.findById(call.assistantId);
  if (!assistant?.enableBookingExtraction && assistant?.useCase !== 'restaurant_booking') return;

  // Fetch transcript
  let transcript = call.transcript || '';
  if (!transcript || transcript.length < 20) {
    try {
      const transcriptData = await bolnaRequest('GET', `/agent/${agentId}/execution/${executionId}/log`);
      transcript = transcriptData?.transcript || transcriptData?.full_transcript || '';
      if (transcript) {
        call.transcript = transcript;
        await call.save();
      }
    } catch (err) {
      console.error('[Webhook] Transcript fetch error:', err.message?.substring(0, 100));
      return;
    }
  }

  if (!transcript || transcript.length < 20) return;

  // Extract & create booking
  const extracted = await extractBookingFromTranscript(transcript);
  const validation = validateBookingData(extracted);
  if (!validation.passed) return;

  const availability = await checkAvailabilityWithDB(extracted.date, extracted.time, extracted.guestCount);

  await createBooking({
    callId: call._id,
    assistantId: call.assistantId,
    source: 'bolna_voice',
    status: availability.available ? BOOKING_STATUS.CONFIRMED : BOOKING_STATUS.SLOT_UNAVAILABLE,
    intent: extracted.intent,
    customerName: extracted.customerName,
    email: extracted.email,
    phone: extracted.phone,
    date: new Date(extracted.date),
    time: extracted.time,
    guestCount: extracted.guestCount,
    extraction: {
      rawTranscript: transcript,
      confidence: extracted.confidence,
      language: extracted.detectedLanguage,
      model: extracted.model,
      extractedAt: extracted.extractedAt,
    },
    validation: { passed: true, failures: [], validatedAt: new Date() },
    availability: {
      checked: true,
      available: availability.available,
      alternativeSlots: availability.alternativeSlots,
      checkedAt: new Date(),
    },
    userId: call.userId,
  });

  console.log(`[Webhook] Booking processed for call ${call._id}`);
}

export default router;
