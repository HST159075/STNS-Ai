import { Router } from 'express';
import * as messageController from '../controllers/messageController';
import { withAuth, requireAuth } from '../middleware/auth';

const router = Router();

router.use(withAuth);
router.use(requireAuth);

router.post('/conversations', messageController.startConversation);
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:conversationId', messageController.getConversationMessages);
router.post('/conversations/:conversationId/messages', messageController.sendDirectMessage);

export default router;
