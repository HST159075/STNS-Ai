import { Router } from 'express';
import { placeBid, getProjectBids } from '../controllers/bidController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/:projectId', getProjectBids);
router.post('/', requireAuth, placeBid);

export default router;
