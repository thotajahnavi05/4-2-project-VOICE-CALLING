import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  assistantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assistant' },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
  },
  direction: { type: String, enum: ['inbound', 'outbound'], default: 'outbound' },
  phoneNumbers: [{ type: String }],
  totalCalls: { type: Number, default: 0 },
  completedCalls: { type: Number, default: 0 },
  failedCalls: { type: Number, default: 0 },
  costPerCall: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  startDate: { type: Date },
  endDate: { type: Date },
  userId: { type: String, default: 'default' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('Campaign', campaignSchema);
