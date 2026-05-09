import { Router } from 'express';
import { createAuditLog, getAuditLogs } from '../controllers/auditController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getAuditLogs);
router.post('/', requireAuth, createAuditLog);

export default router;
