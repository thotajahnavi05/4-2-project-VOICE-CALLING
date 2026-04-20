import { Router } from 'express';
import { getModels } from '../../controllers/bolnaVoiceController.js';

const router = Router();
router.get('/', getModels);
export default router;
