import { Router } from 'express';
import { createCall, getAllCalls, getCallById, stopCall } from '../controllers/callController.js';

const router = Router();

router.post('/', createCall);
router.get('/', getAllCalls);
router.get('/:id', getCallById);
router.delete('/:id', stopCall);

export default router;
