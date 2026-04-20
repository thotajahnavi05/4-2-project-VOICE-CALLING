import mongoose from 'mongoose';

const assistantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  providerId: { type: String, index: true },
  provider: { type: String, default: 'bolna' },
  systemPrompt: { type: String, default: '' },
  firstMessage: { type: String, default: 'Hello! How can I help you today?' },
  language: { type: String, default: 'hi' },
  country: { type: String, default: 'IN' },
  voiceId: { type: String, default: '' },
  voiceProvider: { type: String, default: 'polly' },
  model: { type: String, default: 'gpt-4o-mini' },
  enableBookingExtraction: { type: Boolean, default: false },
  useCase: { type: String, default: 'general' },
  bookingConfig: {
    businessName: { type: String, default: '' },
    openingTime: { type: String, default: '10:00' },
    closingTime: { type: String, default: '22:00' },
    slotDuration: { type: Number, default: 60 },
    maxCapacityPerSlot: { type: Number, default: 50 },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  hangupKeywords: { type: [String], default: ['bye', 'goodbye', 'alvida', 'dhanyavaad'] },
  isActive: { type: Boolean, default: true },
  userId: { type: String, default: 'default' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('Assistant', assistantSchema);
