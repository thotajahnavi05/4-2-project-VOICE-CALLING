import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  callId: { type: mongoose.Schema.Types.ObjectId, ref: 'Call' },
  assistantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assistant' },
  source: {
    type: String,
    enum: ['bolna_voice', 'manual', 'api'],
    default: 'bolna_voice',
  },
  status: {
    type: String,
    enum: [
      'pending_extraction', 'extraction_failed', 'validation_failed',
      'pending_availability', 'slot_unavailable', 'needs_manual_followup',
      'confirmed', 'cancelled', 'completed',
    ],
    default: 'pending_extraction',
  },
  intent: {
    type: String,
    enum: ['book_table', 'book_appointment', 'cancel_booking', 'modify_booking', 'inquiry', 'other'],
  },
  customerName: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  date: { type: Date },
  time: { type: String },
  guestCount: { type: Number, default: 1 },
  specialRequests: { type: String, default: '' },
  extraction: {
    rawTranscript: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    language: { type: String, default: 'en' },
    model: { type: String, default: '' },
    extractedAt: { type: Date },
    notes: { type: String, default: '' },
  },
  validation: {
    passed: { type: Boolean, default: false },
    failures: [{ type: String }],
    validatedAt: { type: Date },
  },
  availability: {
    checked: { type: Boolean, default: false },
    available: { type: Boolean, default: false },
    alternativeSlots: [{ type: String }],
    checkedAt: { type: Date },
  },
  emailNotification: {
    sent: { type: Boolean, default: false },
    messageId: { type: String, default: '' },
    sentAt: { type: Date },
  },
  businessConfig: {
    businessName: { type: String, default: '' },
    openingTime: { type: String, default: '10:00' },
    closingTime: { type: String, default: '22:00' },
    slotDuration: { type: Number, default: 60 },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  userId: { type: String, default: 'default' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    const random = Math.floor(10000 + Math.random() * 90000);
    this.bookingId = `BK-IND-${random}`;
  }
  next();
});

export default mongoose.model('Booking', bookingSchema);
