import { bolnaRequest } from '../services/bolnaService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getVoices = asyncHandler(async (req, res) => {
  const voices = await bolnaRequest('GET', '/voices');
  res.json({ success: true, data: voices });
});

export const getModels = asyncHandler(async (req, res) => {
  // Bolna doesn't have a models endpoint - return empty
  res.json({ success: true, data: [] });
});

export const getKnowledgeBases = asyncHandler(async (req, res) => {
  try {
    const kbs = await bolnaRequest('GET', '/knowledge-base');
    res.json({ success: true, data: kbs });
  } catch {
    res.json({ success: true, data: [] });
  }
});

export const getPhoneNumbers = asyncHandler(async (req, res) => {
  try {
    const numbers = await bolnaRequest('GET', '/phone-numbers/all');
    res.json({ success: true, data: numbers });
  } catch {
    // Fallback to env
    const envNumbers = (process.env.BOLNA_AVAILABLE_PHONE_NUMBERS || '').split(',').filter(Boolean);
    res.json({ success: true, data: envNumbers.map(n => ({ phone_number: n.trim() })) });
  }
});

export const getExecutions = asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  if (!agentId) return res.status(400).json({ success: false, error: 'agentId is required' });
  const executions = await bolnaRequest('GET', `/agent/${agentId}/executions`);
  res.json({ success: true, data: executions });
});

export const getTranscript = asyncHandler(async (req, res) => {
  const { executionId } = req.params;
  if (!executionId) return res.status(400).json({ success: false, error: 'executionId is required' });
  const data = await bolnaRequest('GET', `/execution/${executionId}`);
  res.json({ success: true, data });
});
