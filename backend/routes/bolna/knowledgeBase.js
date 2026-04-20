import { Router } from 'express';
import { getKnowledgeBases } from '../../controllers/bolnaVoiceController.js';

const router = Router();
router.get('/', getKnowledgeBases);
export default router;
