import { Router } from 'express';
import { toggleBookmark, getUserBookmarks } from '../controllers/bookmarkController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/:userId', requireAuth, getUserBookmarks);
router.post('/toggle', requireAuth, toggleBookmark);

export default router;
