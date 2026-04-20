import { Router } from 'express';
import {
  createCampaign, getAllCampaigns, getCampaignById,
  startCampaign, pauseCampaign, deleteCampaign,
} from '../controllers/campaignController.js';

const router = Router();

router.post('/', createCampaign);
router.get('/', getAllCampaigns);
router.get('/:id', getCampaignById);
router.post('/:id/start', startCampaign);
router.post('/:id/pause', pauseCampaign);
router.delete('/:id', deleteCampaign);

export default router;
