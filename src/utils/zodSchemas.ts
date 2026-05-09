import { z } from 'zod';

export const UserSyncSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().optional(),
});

export const ProjectCreateSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),
  clientId: z.string(),
  tags: z.array(z.string()).optional(),
});

export const BidCreateSchema = z.object({
  amount: z.number().positive(),
  coverLetter: z.string().min(50),
  deliveryDays: z.number().int().positive(),
  projectId: z.string(),
  freelancerId: z.string(),
});

export const BlogCreateSchema = z.object({
  title: z.string().min(5),
  content: z.string().min(100),
  slug: z.string(),
  authorId: z.string(),
  tags: z.array(z.string()).optional(),
});
