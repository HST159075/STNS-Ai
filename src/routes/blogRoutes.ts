import { Router } from 'express';
import { createBlog, getBlogs } from '../controllers/blogController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', getBlogs);
router.post('/', requireAuth, createBlog);

export default router;
