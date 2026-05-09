import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { ProjectCreateSchema } from '../utils/zodSchemas';
import logger from '../utils/logger';

export const createProject = async (req: Request, res: Response) => {
  const clientId = (req as any).auth?.userId;

  if (!clientId) {
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized: You must be logged in to post a project." 
    });
  }

  // Validate Input
  const validation = ProjectCreateSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      message: "Validation failed", 
      errors: validation.error.flatten().fieldErrors 
    });
  }

  const { title, description, budgetMin, budgetMax, tags, category, imageUrl } = validation.data;

  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        budgetMin,
        budgetMax,
        clientId,
        tags: tags || [],
        category,
        imageUrl,
        status: 'OPEN',
      },
    });

    logger.info(`Project created: ${project.id} by client ${clientId}`);
    res.status(201).json({ success: true, project });
  } catch (error: any) {
    logger.error(`Error creating project: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error while creating project. Please try again later." 
    });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  const budget = req.query.budget ? String(req.query.budget) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;

  let where: any = { status: 'OPEN' };

  if (category && category !== 'All') {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } }
    ];
  }

  // Budget range mapping
  if (budget && budget !== 'All') {
    if (budget === 'Under $500') {
      where.budgetMax = { lte: 500 };
    } else if (budget === '$500 - $2000') {
      where.budgetMin = { gte: 500 };
      where.budgetMax = { lte: 2000 };
    } else if (budget === '$2000 - $5000') {
      where.budgetMin = { gte: 2000 };
      where.budgetMax = { lte: 5000 };
    } else if (budget === 'Above $5000') {
      where.budgetMin = { gte: 5000 };
    }
  }

  try {
    const projects = await prisma.project.findMany({
      where,
      include: {
        client: {
          select: { name: true, avatarUrl: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProjectById = async (req: Request, res: Response) => {
  const projectId = String(req.params.projectId);

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: {
          select: { name: true, avatarUrl: true, bio: true }
        },
        bids: {
          include: {
            freelancer: {
              select: { name: true, avatarUrl: true }
            }
          }
        }
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.status(200).json({ success: true, project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyProjects = async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;

  try {
    const projects = await prisma.project.findMany({
      where: { clientId: userId },
      include: {
        _count: {
          select: { bids: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
