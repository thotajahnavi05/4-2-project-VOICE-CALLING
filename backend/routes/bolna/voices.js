import { Router } from 'express';
import { getVoices } from '../../controllers/bolnaVoiceController.js';

const router = Router();
router.get('/', getVoices);
export default router;
