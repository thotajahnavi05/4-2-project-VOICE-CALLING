import Campaign from '../models/Campaign.js';
import Call from '../models/Call.js';
import Assistant from '../models/Assistant.js';
import { bolnaRequest } from '../services/bolnaService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const createCampaign = asyncHandler(async (req, res) => {
  const { name, description, assistantId, phoneNumbers, direction } = req.body;

  if (!name || !assistantId) {
    return res.status(400).json({ success: false, error: 'name and assistantId are required' });
  }

  const campaign = new Campaign({
    name, description, assistantId,
    phoneNumbers: phoneNumbers || [],
    direction: direction || 'outbound',
    totalCalls: phoneNumbers?.length || 0,
    userId: req.userId,
  });

  await campaign.save();
  res.status(201).json({ success: true, data: campaign });
});

export const getAllCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await Campaign.find({ userId: req.userId })
    .sort({ createdAt: -1 }).populate('assistantId', 'name');
  res.json({ success: true, data: campaigns });
});

export const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).populate('assistantId', 'name');
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  res.json({ success: true, data: campaign });
});

export const startCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

  const assistant = await Assistant.findById(campaign.assistantId);
  if (!assistant?.providerId) {
    return res.status(400).json({ success: false, error: 'Assistant not configured with Bolna' });
  }

  campaign.status = 'active';
  campaign.startDate = new Date();
  await campaign.save();

  const fromPhone = process.env.BOLNA_DEFAULT_PHONE_NUMBER;
  let completed = 0, failed = 0;

  for (const phone of campaign.phoneNumbers) {
    try {
      const callResponse = await bolnaRequest('POST', '/call', {
        agent_id: assistant.providerId,
        recipient_phone_number: phone,
        from_phone_number: fromPhone,
      });

      await Call.create({
        providerId: callResponse.execution_id || callResponse.id,
        executionId: callResponse.execution_id || callResponse.id,
        provider: 'bolna',
        assistantId: assistant._id,
        assistantProviderId: assistant.providerId,
        status: 'queued', direction: 'outbound',
        phoneNumber: fromPhone, customerPhone: phone,
        campaignId: campaign._id, userId: req.userId,
        startedAt: new Date(),
      });
      completed++;
    } catch (err) {
      console.error(`[Campaign] Failed to call ${phone}:`, err.message?.substring(0, 100));
      failed++;
    }
  }

  campaign.completedCalls = completed;
  campaign.failedCalls = failed;
  await campaign.save();

  res.json({ success: true, data: campaign, callsInitiated: completed, callsFailed: failed });
});

export const pauseCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  campaign.status = 'paused';
  await campaign.save();
  res.json({ success: true, data: campaign });
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  await Campaign.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Campaign deleted' });
});
