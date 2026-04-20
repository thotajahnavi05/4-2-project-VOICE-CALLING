export const PROVIDERS = {
  BOLNA: 'bolna',
};

export const CALL_STATUS = {
  QUEUED: 'queued',
  RINGING: 'ringing',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BUSY: 'busy',
  NO_ANSWER: 'no-answer',
  CANCELED: 'canceled',
};

export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const CAMPAIGN_DIRECTION = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
};

export const BOOKING_STATUS = {
  PENDING_EXTRACTION: 'pending_extraction',
  EXTRACTION_FAILED: 'extraction_failed',
  VALIDATION_FAILED: 'validation_failed',
  PENDING_AVAILABILITY: 'pending_availability',
  SLOT_UNAVAILABLE: 'slot_unavailable',
  NEEDS_MANUAL_FOLLOWUP: 'needs_manual_followup',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

export const BOOKING_INTENT = {
  BOOK_TABLE: 'book_table',
  BOOK_APPOINTMENT: 'book_appointment',
  CANCEL_BOOKING: 'cancel_booking',
  MODIFY_BOOKING: 'modify_booking',
  INQUIRY: 'inquiry',
  OTHER: 'other',
};

export const BOOKING_SOURCE = {
  BOLNA_VOICE: 'bolna_voice',
  MANUAL: 'manual',
  API: 'api',
};

export const CACHE_DURATION = {
  PHONE_NUMBERS: 5 * 60 * 1000,
  RECENT_CALLS: 30 * 1000,
  CALL_DETAIL: 60 * 1000,
};

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const TIMEZONE = {
  IST: 'Asia/Kolkata',
};
