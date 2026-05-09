import { Router } from 'express';
import { 
  getSmartInsights, 
  chatWithAI, 
  generateProjectBrief, 
  suggestProjectTags,
  optimizeProfile,
  auditProjectBids,
  generateCoverLetter
} from '../controllers/aiController';
import { requireAuth } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply strict rate limiting to all AI routes
router.use(aiLimiter);

router.get('/insights', requireAuth, getSmartInsights);
router.post('/chat', chatWithAI);
router.post('/generate-brief', requireAuth, generateProjectBrief);
router.post('/cover-letter', requireAuth, generateCoverLetter);
router.post('/suggest-tags', requireAuth, suggestProjectTags);
router.get('/optimize-profile', requireAuth, optimizeProfile);
router.get('/audit-bids/:projectId', requireAuth, auditProjectBids);

export default router;
