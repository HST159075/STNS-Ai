import { Router } from 'express';
import { getSkills, createSkill } from '../controllers/skillController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', getSkills);
router.post('/', requireAuth, createSkill);

export default router;
