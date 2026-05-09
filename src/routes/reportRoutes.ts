import { Router } from 'express';
import { createReport, getReports } from '../controllers/reportController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getReports);
router.post('/', requireAuth, createReport);

export default router;
