import Booking from '../models/Booking.js';
import dispatcher, { EVENTS } from './eventDispatcher.js';

export function validateBookingData(data) {
  const failures = [];

  const validIntents = ['book_table', 'book_appointment'];
  if (!data.intent || !validIntents.includes(data.intent)) {
    failures.push('invalidIntent');
  }
  if (!data.date) failures.push('missingDate');
  if (!data.time) failures.push('missingTime');
  if (!data.guestCount || data.guestCount < 1) failures.push('missingGuestCount');
  if (!data.email) failures.push('missingEmail');
  if (data.confidence !== undefined && data.confidence < 0.75) {
    failures.push('lowConfidence');
  }
  if (data.date) {
    const bookingDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) failures.push('pastDate');
  }

  return { passed: failures.length === 0, failures };
}

export function checkAvailability(date, time, guestCount, config = {}) {
  const {
    openingTime = '10:00',
    closingTime = '22:00',
    slotDuration = 60,
    maxCapacityPerSlot = 50,
  } = config;

  const allSlots = [];
  const [openH, openM] = openingTime.split(':').map(Number);
  const [closeH, closeM] = closingTime.split(':').map(Number);

  for (let h = openH; h <= closeH; h++) {
    const slotTime = `${String(h).padStart(2, '0')}:00`;
    if (h === closeH && closeM === 0) continue;
    allSlots.push({
      time: slotTime,
      available: true,
      currentCapacity: 0,
      maxCapacity: maxCapacityPerSlot,
    });
  }

  return {
    date,
    requestedTime: time,
    available: true,
    alternativeSlots: allSlots.filter(s => s.available).map(s => s.time),
    allSlots,
  };
}

export async function checkAvailabilityWithDB(date, time, guestCount, config = {}) {
  const {
    maxCapacityPerSlot = 50,
    openingTime = '10:00',
    closingTime = '22:00',
  } = config;

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const existingBookings = await Booking.find({
    date: { $gte: dayStart, $lte: dayEnd },
    status: 'confirmed',
  });

  const slotMap = {};
  for (const booking of existingBookings) {
    const slot = booking.time;
    if (!slotMap[slot]) slotMap[slot] = 0;
    slotMap[slot] += booking.guestCount || 1;
  }

  const requestedCapacity = slotMap[time] || 0;
  const available = (requestedCapacity + guestCount) <= maxCapacityPerSlot;

  const allSlots = [];
  const [openH] = openingTime.split(':').map(Number);
  const [closeH] = closingTime.split(':').map(Number);

  for (let h = openH; h < closeH; h++) {
    const slotTime = `${String(h).padStart(2, '0')}:00`;
    const cap = slotMap[slotTime] || 0;
    allSlots.push({
      time: slotTime,
      available: cap + guestCount <= maxCapacityPerSlot,
      currentCapacity: cap,
      maxCapacity: maxCapacityPerSlot,
    });
  }

  const alternativeSlots = allSlots
    .filter(s => s.available && s.time !== time)
    .map(s => s.time);

  return { date, requestedTime: time, available, alternativeSlots, allSlots };
}

export async function createBooking(data) {
  const booking = new Booking(data);
  await booking.save();

  await dispatcher.emit(EVENTS.BOOKING_CONFIRMED, {
    bookingId: booking.bookingId,
    customerName: booking.customerName,
    date: booking.date,
    time: booking.time,
    email: booking.email,
  });

  return booking;
}

export async function getBookings(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.source) query.source = filters.source;
  if (filters.userId) query.userId = filters.userId;
  if (filters.date) {
    const d = new Date(filters.date);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    query.date = { $gte: d, $lte: end };
  }
  return Booking.find(query).sort({ createdAt: -1 });
}

export async function getBookingStats(userId) {
  const match = userId ? { userId } : {};
  const stats = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalGuests: { $sum: '$guestCount' },
      },
    },
  ]);

  const result = { total: 0, confirmed: 0, failed: 0, pending: 0, totalGuests: 0 };
  for (const s of stats) {
    result.total += s.count;
    result.totalGuests += s.totalGuests;
    if (s._id === 'confirmed' || s._id === 'completed') result.confirmed += s.count;
    else if (s._id.includes('failed')) result.failed += s.count;
    else result.pending += s.count;
  }
  return result;
}
