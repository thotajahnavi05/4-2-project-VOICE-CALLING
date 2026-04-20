import Call from '../models/Call.js';
import Booking from '../models/Booking.js';
import Assistant from '../models/Assistant.js';
import { extractBookingFromTranscript } from '../services/transcriptExtractionService.js';
import {
  validateBookingData, checkAvailabilityWithDB, createBooking,
  getBookings, getBookingStats,
} from '../services/bookingService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { BOOKING_STATUS } from '../constants/index.js';

export const processTranscript = asyncHandler(async (req, res) => {
  const { callId, transcript, agentId } = req.body;

  if (!transcript) {
    return res.status(400).json({ success: false, error: 'transcript is required' });
  }

  // Stage 1: Extract
  let extracted;
  try {
    extracted = await extractBookingFromTranscript(transcript);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Extraction failed',
      stage: 'extraction',
      details: err.message,
    });
  }

  // Stage 2: Validate
  const validation = validateBookingData(extracted);
  if (!validation.passed) {
    return res.json({
      success: false,
      stage: 'validation',
      extracted,
      validation,
    });
  }

  // Stage 3: Check availability
  const availability = await checkAvailabilityWithDB(
    extracted.date, extracted.time, extracted.guestCount
  );

  if (!availability.available) {
    return res.json({
      success: false,
      stage: 'availability',
      extracted,
      validation,
      availability,
    });
  }

  // Stage 4: Create booking
  const booking = await createBooking({
    callId: callId || null,
    assistantId: agentId || null,
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
      notes: extracted.extractionNotes || '',
    },
    validation: { passed: true, failures: [], validatedAt: new Date() },
    availability: {
      checked: true,
      available: true,
      alternativeSlots: availability.alternativeSlots,
      checkedAt: new Date(),
    },
    userId: req.userId,
  });

  res.status(201).json({
    success: true,
    data: booking,
    stages: { extraction: 'passed', validation: 'passed', availability: 'passed', booking: 'created' },
  });
});

export const extractFromTranscript = asyncHandler(async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ success: false, error: 'transcript is required' });
  }

  const extracted = await extractBookingFromTranscript(transcript);
  res.json({ success: true, data: extracted });
});

export const checkSlotAvailability = asyncHandler(async (req, res) => {
  const { date, time, guestCount } = req.body;
  if (!date || !time) {
    return res.status(400).json({ success: false, error: 'date and time are required' });
  }

  const availability = await checkAvailabilityWithDB(date, time, guestCount || 1);
  res.json({ success: true, data: availability });
});

export const createBookingManual = asyncHandler(async (req, res) => {
  const { date, time, guestCount, customerName, email, phone, specialRequests } = req.body;

  if (!date || !time || !email) {
    return res.status(400).json({ success: false, error: 'date, time, and email are required' });
  }

  const availability = await checkAvailabilityWithDB(date, time, guestCount || 1);

  const booking = await createBooking({
    source: 'manual',
    status: BOOKING_STATUS.CONFIRMED,
    intent: 'book_table',
    customerName: customerName || '',
    email,
    phone: phone || '',
    date: new Date(date),
    time,
    guestCount: guestCount || 1,
    specialRequests: specialRequests || '',
    availability: {
      checked: true,
      available: availability.available,
      alternativeSlots: availability.alternativeSlots,
      checkedAt: new Date(),
    },
    userId: req.userId,
  });

  res.status(201).json({ success: true, data: booking });
});

export const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await getBookings({
    userId: req.userId,
    status: req.query.status,
    source: req.query.source,
    date: req.query.date,
  });
  res.json({ success: true, data: bookings });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }
  res.json({ success: true, data: booking });
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }
  booking.status = status;
  await booking.save();
  res.json({ success: true, data: booking });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await getBookingStats(req.userId);
  res.json({ success: true, data: stats });
});
