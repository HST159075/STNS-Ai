import { Router } from 'express';
import { 
  syncUser, getUserProfile, updateProfile, 
  getAllFreelancers, getDashboardStats, 
  getContractHistory, getTransactionHistory,
  submitFreelancerApplication, approveFreelancerApplication,
  getPublicStats
} from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/public-stats', getPublicStats);
router.post('/sync', syncUser);
router.get('/freelancers', getAllFreelancers);
router.get('/stats', requireAuth, getDashboardStats);
router.get('/history', requireAuth, getTransactionHistory);
router.get('/hire-history', requireAuth, getContractHistory);
router.get('/profile/:userId', getUserProfile); // Publicly accessible as per requirement
router.put('/profile', requireAuth, updateProfile);
router.post('/apply-freelancer', requireAuth, submitFreelancerApplication);
router.post('/approve-freelancer', requireAuth, approveFreelancerApplication);

export default router;
