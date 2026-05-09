import { Router } from 'express';
import { notificationService } from '../services/notificationService';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get current user's notifications
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.auth.userId);
    res.status(200).json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    await notificationService.markAsRead(req.params.id as string);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
