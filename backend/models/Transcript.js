import mongoose from 'mongoose';

const transcriptSchema = new mongoose.Schema({
  callId: { type: mongoose.Schema.Types.ObjectId, ref: 'Call', index: true },
  providerId: { type: String },
  content: { type: String, default: '' },
  summary: { type: String, default: '' },
  sentiment: {
    score: { type: Number, default: 0 },
    label: { type: String, default: 'neutral' },
  },
  emotions: [{ type: String }],
  keywords: [{ type: String }],
  confidence: { type: Number, default: 0 },
  language: { type: String, default: 'hi' },
  recordingUrl: { type: String, default: '' },
  stereoRecordingUrl: { type: String, default: '' },
  userId: { type: String, default: 'default' },
}, { timestamps: true });

export default mongoose.model('Transcript', transcriptSchema);
