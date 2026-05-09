import { Router } from 'express';
import { createReview, getUserReviews } from '../controllers/reviewController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/:userId', getUserReviews);
router.post('/', requireAuth, createReview);

export default router;
