import { Router } from 'express';
import { getAdminStats, getUsers, updateUserInfo, getPendingApplications, getProjects } from '../controllers/adminController';
import { requireAuth, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.get('/stats', requireAuth, requireSuperAdmin, getAdminStats);
router.get('/users', requireAuth, requireSuperAdmin, getUsers);
router.patch('/users/:userId', requireAuth, requireSuperAdmin, updateUserInfo);
router.get('/applications', requireAuth, requireSuperAdmin, getPendingApplications);
router.get('/projects', requireAuth, requireSuperAdmin, getProjects);

export default router;
