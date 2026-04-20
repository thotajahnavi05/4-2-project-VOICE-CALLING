import { Router } from 'express';
import { bolnaRequest } from '../../services/bolnaService.js';
import Call from '../../models/Call.js';
import Transcript from '../../models/Transcript.js';
import Assistant from '../../models/Assistant.js';

const router = Router();

// ═══════════════════════════════════════════════════════════
// GET ALL TRANSCRIPTS (from all agents)
// ═══════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const agents = await Assistant.find({ provider: 'bolna', providerId: { $exists: true, $ne: '' } }).lean();
    const allTranscripts = [];

    for (const agent of agents) {
      try {
        const executions = await bolnaRequest('GET', `/agent/${agent.providerId}/executions`);
        const execList = Array.isArray(executions) ? executions : (executions?.data || executions?.executions || []);

        for (const exec of execList) {
          const execId = exec.execution_id || exec.id;
          if (!execId) continue;

          // Extract transcript content
          let content = exec.transcript || exec.full_transcript || exec.callTranscript || '';

          // Build from messages if no direct transcript
          const messages = exec.messages || exec.callMessages || exec.conversation || [];
          if ((!content || content.length < 10) && messages.length > 0) {
            content = messages
              .filter(m => m.message || m.text || m.content || m.transcript || m.speech)
              .map(m => {
                const role = (m.role || m.type || m.speaker || 'unknown').toUpperCase();
                const text = m.message || m.text || m.content || m.transcript || m.speech;
                return `${role}: ${text}`;
              })
              .join('\n\n');
          }

          // Extract recording URL
          const recordingUrl = exec.recording_url || exec.recordingUrl || exec.recording || '';

          allTranscripts.push({
            id: execId,
            executionId: execId,
            agentId: agent.providerId,
            agentName: agent.name,
            content,
            recordingUrl,
            status: exec.status || 'unknown',
            duration: exec.conversation_duration || exec.duration || 0,
            cost: exec.total_cost || exec.cost || 0,
            createdAt: exec.created_at || exec.start_time,
            endedAt: exec.ended_at || exec.end_time,
            recipient: exec.recipient_phone_number || exec.to || '',
            from: exec.from_phone_number || exec.from || '',
          });
        }
      } catch (err) {
        console.warn(`[Transcripts] Error fetching for ${agent.name}:`, err.message?.substring(0, 100));
      }
    }

    // Sort newest first
    allTranscripts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ success: true, data: allTranscripts });
  } catch (err) {
    console.error('[Transcripts] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET TRANSCRIPT BY EXECUTION ID
// ═══════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let transcript = null;

    // Find the call in DB to get the agent ID
    const call = await Call.findOne({ $or: [{ executionId: id }, { providerId: id }] });
    const agentId = call?.assistantProviderId;

    // Method 1: Fetch via agent executions (WORKS on Bolna API)
    if (agentId) {
      try {
        const executions = await bolnaRequest('GET', `/agent/${agentId}/executions`);
        const execList = Array.isArray(executions) ? executions : (executions?.data || executions?.executions || []);
        const exec = execList.find(e => (e.execution_id || e.id) === id);

        if (exec) {
          let content = exec.transcript || exec.full_transcript || exec.callTranscript || '';
          const messages = exec.messages || exec.callMessages || exec.conversation || [];
          if ((!content || content.length < 10) && messages.length > 0) {
            content = messages
              .filter(m => m.message || m.text || m.content)
              .map(m => {
                const role = (m.role || m.type || m.speaker || 'unknown').toUpperCase();
                const text = m.message || m.text || m.content || m.transcript || m.speech;
                return `${role}: ${text}`;
              })
              .join('\n\n');
          }

          transcript = {
            id,
            executionId: id,
            content,
            recordingUrl: exec.recording_url || exec.recordingUrl || exec.recording || '',
            messages,
            status: exec.status,
            duration: exec.conversation_duration || exec.duration || 0,
            cost: exec.total_cost || exec.cost || 0,
            createdAt: exec.created_at || exec.start_time,
            endedAt: exec.ended_at || exec.end_time,
            recipient: exec.recipient_phone_number || '',
            from: exec.from_phone_number || '',
          };
        }
      } catch (err) {
        console.warn('[Transcript] Agent executions failed:', err.message?.substring(0, 100));
      }
    }

    // Method 2: Try /execution/{id} directly (may work on some Bolna versions)
    if (!transcript) {
      try {
        const exec = await bolnaRequest('GET', `/execution/${id}`);
        transcript = {
          id, executionId: id,
          content: exec.transcript || exec.full_transcript || '',
          recordingUrl: exec.recording_url || exec.recordingUrl || '',
          status: exec.status,
          duration: exec.conversation_duration || exec.duration || 0,
          cost: exec.total_cost || exec.cost || 0,
          createdAt: exec.created_at, endedAt: exec.ended_at,
        };
      } catch {}
    }

    // Method 3: Search all agents for this execution
    if (!transcript) {
      try {
        const agents = await Assistant.find({ provider: 'bolna', providerId: { $exists: true, $ne: '' } }).lean();
        for (const agent of agents) {
          try {
            const executions = await bolnaRequest('GET', `/agent/${agent.providerId}/executions`);
            const execList = Array.isArray(executions) ? executions : (executions?.data || []);
            const exec = execList.find(e => (e.execution_id || e.id) === id);
            if (exec) {
              transcript = {
                id, executionId: id,
                content: exec.transcript || exec.full_transcript || '',
                recordingUrl: exec.recording_url || exec.recordingUrl || '',
                status: exec.status,
                duration: exec.conversation_duration || exec.duration || 0,
                cost: exec.total_cost || exec.cost || 0,
                createdAt: exec.created_at,
              };
              break;
            }
          } catch {}
        }
      } catch {}
    }

    if (!transcript) {
      return res.status(404).json({ success: false, error: 'Transcript not found' });
    }

    // Update call record in DB
    if (transcript.content || transcript.recordingUrl) {
      await Call.updateOne(
        { $or: [{ executionId: id }, { providerId: id }] },
        {
          $set: {
            ...(transcript.content && { transcript: transcript.content }),
            ...(transcript.recordingUrl && { recordingUrl: transcript.recordingUrl }),
            ...(transcript.status && { status: transcript.status === 'ended' ? 'completed' : transcript.status }),
            ...(transcript.duration && { duration: transcript.duration }),
          },
        }
      );
    }

    res.json({ success: true, data: transcript });
  } catch (err) {
    console.error('[Transcript] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
