import { Router } from 'express';
import { createContract, getContractDetails } from '../controllers/contractController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, createContract);
router.get('/:contractId', requireAuth, getContractDetails);

export default router;
