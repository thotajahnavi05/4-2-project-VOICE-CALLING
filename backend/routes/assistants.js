import { Router } from 'express';
import {
  createAssistant, getAllAssistants, getAssistantById,
  updateAssistant, deleteAssistant,
} from '../controllers/assistantController.js';

const router = Router();

router.post('/', createAssistant);
router.get('/', getAllAssistants);
router.get('/:id', getAssistantById);
router.put('/:id', updateAssistant);
router.delete('/:id', deleteAssistant);

export default router;
