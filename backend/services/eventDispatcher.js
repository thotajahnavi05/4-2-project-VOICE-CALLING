class EventDispatcher {
  constructor() {
    this.listeners = {};
    this.eventLog = [];
  }

  on(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }

  async emit(event, data) {
    this.eventLog.push({ event, data, timestamp: new Date() });
    console.log(`[Event] ${event}`, JSON.stringify(data).slice(0, 200));

    const handlers = this.listeners[event] || [];
    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (err) {
        console.error(`[Event Handler Error] ${event}:`, err.message);
      }
    }
  }

  getLog(limit = 50) {
    return this.eventLog.slice(-limit);
  }
}

export const EVENTS = {
  TRANSCRIPT_RECEIVED: 'transcript_received',
  EXTRACTION_COMPLETED: 'extraction_completed',
  VALIDATION_FAILED: 'validation_failed',
  AVAILABILITY_CHECKED: 'availability_checked',
  BOOKING_CONFIRMED: 'booking_confirmed',
  EMAIL_SENT: 'email_sent',
  NEEDS_FOLLOWUP: 'needs_followup',
};

const dispatcher = new EventDispatcher();

// Default handler: log booking confirmations
dispatcher.on(EVENTS.BOOKING_CONFIRMED, async (data) => {
  console.log(`[Booking Confirmed] ${data.bookingId} for ${data.customerName} on ${data.date} at ${data.time}`);
});

export default dispatcher;
