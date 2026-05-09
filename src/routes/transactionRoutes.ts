import { Router } from 'express';
import { createTransaction, getUserTransactions } from '../controllers/transactionController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/:userId', requireAuth, getUserTransactions);
router.post('/', requireAuth, createTransaction);

export default router;
