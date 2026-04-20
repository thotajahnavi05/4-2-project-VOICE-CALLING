import { Router } from 'express';
import { bolnaRequest } from '../../services/bolnaService.js';
import Call from '../../models/Call.js';

const router = Router();

// GET /agent/:agentId/execution/:executionId
router.get('/agent/:agentId/execution/:executionId', async (req, res) => {
  try {
    const exec = await bolnaRequest('GET', `/agent/${req.params.agentId}/execution/${req.params.executionId}`);
    res.json({ success: true, data: exec });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message?.substring(0, 200) });
  }
});

// GET /agent/:agentId - all executions for agent
router.get('/agent/:agentId', async (req, res) => {
  try {
    const result = await bolnaRequest('GET', `/agent/${req.params.agentId}/executions`);
    const executions = Array.isArray(result) ? result : (result?.data || result?.executions || result?.items || []);
    res.json({ success: true, data: executions });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// GET /:executionId - single execution
router.get('/:executionId', async (req, res) => {
  try {
    const exec = await bolnaRequest('GET', `/execution/${req.params.executionId}`);

    // Also get raw logs
    let logs = [];
    try {
      const logData = await bolnaRequest('GET', `/execution/${req.params.executionId}/raw-logs`);
      logs = logData?.data || logData || [];
    } catch {}

    const data = {
      id: req.params.executionId,
      executionId: req.params.executionId,
      status: exec.status,
      transcript: exec.transcript || exec.full_transcript || exec.callTranscript || '',
      recordingUrl: exec.recording_url || exec.recordingUrl || exec.recording || '',
      duration: exec.conversation_duration || exec.duration || 0,
      cost: exec.total_cost || exec.cost || 0,
      createdAt: exec.created_at || exec.start_time,
      endedAt: exec.ended_at || exec.end_time,
      recipient: exec.recipient_phone_number || '',
      from: exec.from_phone_number || '',
      messages: exec.messages || exec.callMessages || exec.conversation || [],
      logs,
      raw: exec,
    };

    // Update DB
    await Call.updateOne(
      { $or: [{ executionId: req.params.executionId }, { providerId: req.params.executionId }] },
      {
        $set: {
          status: data.status === 'ended' ? 'completed' : data.status,
          transcript: data.transcript,
          recordingUrl: data.recordingUrl,
          duration: data.duration,
          cost: data.cost,
        },
      }
    );

    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message?.substring(0, 200) });
  }
});

// GET /:executionId/raw-logs
router.get('/:executionId/raw-logs', async (req, res) => {
  try {
    const logs = await bolnaRequest('GET', `/execution/${req.params.executionId}/raw-logs`);
    res.json({ success: true, data: logs?.data || logs || [] });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

export default router;
