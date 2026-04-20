import { Router } from 'express';
import {
  processTranscript, extractFromTranscript, checkSlotAvailability,
  createBookingManual, getAllBookings, getBookingById,
  updateBookingStatus, getStats,
} from '../controllers/bookingController.js';

const router = Router();

router.post('/process-transcript', processTranscript);
router.post('/extract', extractFromTranscript);
router.post('/availability', checkSlotAvailability);
router.post('/create', createBookingManual);
router.get('/', getAllBookings);
router.get('/stats', getStats);
router.get('/:bookingId', getBookingById);
router.patch('/:bookingId/status', updateBookingStatus);

export default router;
