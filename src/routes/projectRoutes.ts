import { Router } from 'express';
import { createProject, getProjects, getProjectById, getMyProjects, updateProject, deleteProject } from '../controllers/projectController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', getProjects);
router.get('/my/all', requireAuth, getMyProjects);
router.get('/:projectId', getProjectById);
router.post('/', requireAuth, createProject);
router.put('/:projectId', requireAuth, updateProject);
router.delete('/:projectId', requireAuth, deleteProject);

export default router;
