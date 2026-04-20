import Call from '../models/Call.js';
import Assistant from '../models/Assistant.js';
import { bolnaRequest } from './bolnaService.js';
import { extractBookingFromTranscript } from './transcriptExtractionService.js';
import { validateBookingData, checkAvailabilityWithDB, createBooking } from './bookingService.js';
import { BOOKING_STATUS } from '../constants/index.js';

const processedCallIds = new Set();

async function processCallBooking(call) {
  try {
    if (!call.executionId || !call.assistantProviderId) return;

    const transcriptData = await bolnaRequest('GET', `/agent/${call.assistantProviderId}/execution/${call.executionId}/log`);
    const transcript = typeof transcriptData === 'string'
      ? transcriptData
      : transcriptData?.transcript || transcriptData?.full_transcript || '';

    if (!transcript || transcript.length < 20) return;

    call.transcript = transcript;
    await call.save();

    const extracted = await extractBookingFromTranscript(transcript);
    const validation = validateBookingData(extracted);
    if (!validation.passed) return;

    const availability = await checkAvailabilityWithDB(extracted.date, extracted.time, extracted.guestCount);
    if (!availability.available) return;

    await createBooking({
      callId: call._id,
      assistantId: call.assistantId,
      source: 'bolna_voice',
      status: BOOKING_STATUS.CONFIRMED,
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
      availability: { checked: true, available: true, alternativeSlots: availability.alternativeSlots, checkedAt: new Date() },
      userId: call.userId,
    });

    console.log(`[AutoPoller] Booking created for call ${call._id}`);
  } catch (err) {
    console.error(`[AutoPoller] Error processing call ${call._id}:`, err.message?.substring(0, 100));
  }
}

export function startAutoBookingPoller(intervalMs = 30000) {
  console.log(`[AutoPoller] Starting with ${intervalMs}ms interval`);

  setInterval(async () => {
    try {
      const assistants = await Assistant.find({ enableBookingExtraction: true });
      if (assistants.length === 0) return;

      const assistantIds = assistants.map(a => a._id);
      const recentCalls = await Call.find({
        assistantId: { $in: assistantIds },
        status: 'completed',
        createdAt: { $gte: new Date(Date.now() - 3600000) },
      });

      for (const call of recentCalls) {
        const callKey = call._id.toString();
        if (processedCallIds.has(callKey)) continue;
        processedCallIds.add(callKey);
        await processCallBooking(call);
      }

      if (processedCallIds.size > 1000) {
        const arr = [...processedCallIds];
        arr.slice(0, arr.length - 1000).forEach(id => processedCallIds.delete(id));
      }
    } catch (err) {
      console.error('[AutoPoller] Poll error:', err.message?.substring(0, 100));
    }
  }, intervalMs);
}
