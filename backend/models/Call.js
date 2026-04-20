import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  providerId: { type: String, index: true },
  executionId: { type: String, index: true },
  provider: { type: String, default: 'bolna' },
  assistantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assistant' },
  assistantProviderId: { type: String },
  status: {
    type: String,
    enum: ['queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled'],
    default: 'queued',
  },
  direction: { type: String, enum: ['inbound', 'outbound'], default: 'outbound' },
  phoneNumber: { type: String },
  customerPhone: { type: String },
  duration: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  transcript: { type: String, default: '' },
  recordingUrl: { type: String, default: '' },
  summary: { type: String, default: '' },
  sentiment: { type: String, default: '' },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  startedAt: { type: Date },
  endedAt: { type: Date },
  userId: { type: String, default: 'default' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('Call', callSchema);
