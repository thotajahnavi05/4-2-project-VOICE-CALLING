import { bolnaRequest } from './bolnaService.js';
import { CACHE_DURATION } from '../constants/index.js';

let cachedNumbers = null;
let cacheTimestamp = 0;

export async function getAvailablePhoneNumbers() {
  const now = Date.now();
  if (cachedNumbers && (now - cacheTimestamp) < CACHE_DURATION.PHONE_NUMBERS) {
    return cachedNumbers;
  }

  try {
    const numbers = await bolnaRequest('GET', '/phone-numbers/all');
    cachedNumbers = Array.isArray(numbers) ? numbers : [];
    cacheTimestamp = now;
    return cachedNumbers;
  } catch (err) {
    console.error('[PhoneNumbers] Error fetching:', err.message?.substring(0, 100));
    const envNumbers = process.env.BOLNA_AVAILABLE_PHONE_NUMBERS || '';
    return envNumbers.split(',').filter(Boolean).map(n => ({ phone_number: n.trim() }));
  }
}

export function getDefaultPhoneNumber() {
  return process.env.BOLNA_DEFAULT_PHONE_NUMBER || '+911234567890';
}
