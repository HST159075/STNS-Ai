import { Router } from 'express';
import { addPortfolio, getFreelancerPortfolio } from '../controllers/portfolioController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/:freelancerId', getFreelancerPortfolio);
router.post('/', requireAuth, addPortfolio);

export default router;
