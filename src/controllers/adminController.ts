import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const [userCount, projectCount, bidCount, activeContracts] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.bid.count(),
      prisma.contract.count({ where: { status: 'ACTIVE' } })
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true, role: true }
    });

    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } } }
    });

    res.status(200).json({
      success: true,
      stats: {
        userCount,
        projectCount,
        bidCount,
        activeContracts,
        recentUsers,
        recentProjects
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { postedProjects: true, bids: true }
        }
      }
    });

    res.status(200).json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUserInfo = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role, isOnboarded } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: String(userId) },
      data: { role, isOnboarded }
    });

    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPendingApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.user.findMany({
      where: { applicationStatus: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        freelancerApplicationData: true,
        createdAt: true
      }
    });

    res.status(200).json({ success: true, applications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const status = (req.query.status as string) || undefined;

  const skip = (page - 1) * limit;

  try {
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
          status: status as any
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { name: true, email: true } } }
      }),
      prisma.project.count({
        where: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
          status: status as any
        }
      })
    ]);

    res.status(200).json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
