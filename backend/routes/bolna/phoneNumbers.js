import { Router } from 'express';
import { getPhoneNumbers } from '../../controllers/bolnaVoiceController.js';

const router = Router();
router.get('/', getPhoneNumbers);
export default router;
