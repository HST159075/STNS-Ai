import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getCachedData, setCachedData } from '../utils/cache';

export const syncUser = async (req: Request, res: Response) => {
  const { id, email, name, avatarUrl } = req.body;

  try {
    const user = await prisma.user.upsert({
      where: { email }, // Usually email is safer if id is not yet known or changing
      update: {
        name,
        avatarUrl,
        image: avatarUrl,
      },
      create: {
        id,
        email,
        name,
        emailVerified: false,
        avatarUrl,
        image: avatarUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'FREELANCER',
      },
    });

    res.status(200).json({ success: true, user });
  } catch (error: any) {
    console.error('Error in syncUser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: { include: { skill: true } },
        portfolios: true,
        receivedReviews: {
          include: {
            reviewer: { select: { name: true, image: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            postedProjects: true, 
            clientContracts: true, 
            freelanceContracts: true, 
            receivedReviews: true
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Calculate dynamic stats
    const stats = {
      totalProjects: user.role === 'CLIENT' ? user._count.postedProjects : user._count.freelanceContracts,
      totalHires: user._count.clientContracts,
      rating: user.receivedReviews.length > 0 
        ? user.receivedReviews.reduce((acc, r: any) => acc + r.rating, 0) / user.receivedReviews.length 
        : 5.0,
      trustScore: 98,
    };

    res.status(200).json({ success: true, user, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { 
    name, image, bio, location, hourlyRate, portfolioUrl, githubUrl,
    firstName, lastName, dob, nationality, phoneNumber, serviceType,
    role, skills
  } = req.body;

  try {
    // 1. Update basic fields
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        image,
        avatarUrl: image, // Sync avatarUrl for consistency
        bio,
        location,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        portfolioUrl,
        githubUrl,
        firstName,
        lastName,
        dob: dob ? new Date(dob) : undefined,
        nationality,
        phoneNumber,
        serviceType,
        role: role || undefined,
        isOnboarded: true,
      },
    });

    // 2. Update skills if provided
    if (skills && Array.isArray(skills)) {
      await prisma.userSkill.deleteMany({
        where: { userId }
      });

      for (const skillName of skills) {
        const skill = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName, category: "General" }
        });

        // Check if user already has this skill
        const existingUserSkill = await prisma.userSkill.findUnique({
          where: {
            userId_skillId: {
              userId,
              skillId: skill.id
            }
          }
        });

        if (!existingUserSkill) {
          await prisma.userSkill.create({
            data: {
              userId,
              skillId: skill.id
            }
          });
        }
      }
    }

    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitFreelancerApplication = async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const applicationData = req.body;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        applicationStatus: 'PENDING',
        freelancerApplicationData: applicationData,
      }
    });

    // Create notification for all Super Admins
    const admins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM',
          title: 'New Freelancer Application',
          body: `A user has applied to become a freelancer. Please review the application.`,
          metadata: { applicantId: userId }
        }
      });
    }

    res.status(200).json({ success: true, message: "Application submitted for review." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const approveFreelancerApplication = async (req: Request, res: Response) => {
  const { applicantId } = req.body;
  const adminId = (req as any).auth?.userId;

  try {
    const applicant = await prisma.user.findUnique({
      where: { id: applicantId },
      select: { freelancerApplicationData: true }
    });

    if (!applicant) return res.status(404).json({ success: false, error: "Applicant not found" });

    const appData = applicant.freelancerApplicationData as any;

    await prisma.user.update({
      where: { id: applicantId },
      data: {
        role: 'FREELANCER',
        applicationStatus: 'APPROVED',
        isOnboarded: true,
        firstName: appData.firstName,
        lastName: appData.lastName,
        dob: appData.dob ? new Date(appData.dob) : undefined,
        nationality: appData.nationality,
        phoneNumber: appData.phoneNumber,
        serviceType: appData.serviceType,
        // Sync skills if any
      }
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: applicantId,
        type: 'SYSTEM',
        title: 'Application Approved',
        body: `Congratulations! Your freelancer application has been approved.`,
      }
    });

    res.status(200).json({ success: true, message: "Application approved successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
export const getAllFreelancers = async (req: Request, res: Response) => {
  const { search, category, minPrice, maxPrice, page = 1, limit = 6 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const cacheKey = `freelancers:${search || ''}:${category || ''}:${minPrice || ''}:${maxPrice || ''}:${page}:${limit}`;

  try {
    // 1. Try Cache
    const cached = await getCachedData(cacheKey);
    if (cached) return res.status(200).json(cached);

    const where: any = { role: 'FREELANCER' };
    // ... filtering logic ...

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { bio: { contains: String(search), mode: 'insensitive' } },
        { serviceType: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.serviceType = { contains: String(category), mode: 'insensitive' };
    }

    if (minPrice || maxPrice) {
      where.hourlyRate = {
        gte: minPrice ? parseFloat(String(minPrice)) : undefined,
        lte: maxPrice ? parseFloat(String(maxPrice)) : undefined,
      };
    }

    const [freelancers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          skills: { include: { skill: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where })
    ]);

    const response = { 
      success: true, 
      freelancers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    };

    // 4. Set Cache (5 mins)
    await setCachedData(cacheKey, response, 300);

    res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, totalEarnings: true, activeJobs: true, completedJobs: true }
    });

    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    // 1. Calculate Total Spent/Earned
    // For simplicity, we use the fields in the user model or aggregate transactions
    const totalAmount = user.role === 'CLIENT' 
      ? await prisma.transaction.aggregate({
          where: { clientId: userId, status: 'COMPLETED' },
          _sum: { amount: true }
        }).then(res => res._sum.amount || 0)
      : user.totalEarnings;

    // 2. Active Jobs
    const activeJobsCount = await prisma.contract.count({
      where: {
        OR: [{ clientId: userId }, { freelancerId: userId }],
        status: 'ACTIVE'
      }
    });

    // 3. Unread Messages
    const unreadMessagesCount = await prisma.message.count({
      where: {
        conversation: {
          participants: { some: { userId } }
        },
        senderId: { not: userId },
        isRead: false
      }
    });

    // 4. Unread Notifications
    const unreadNotificationsCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    // 5. Recent Activity (Latest 5 transactions)
    const transactions = await prisma.transaction.findMany({
      where: { OR: [{ clientId: userId }, { freelancerId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 5. Monthly Chart Data (Mocking structured data based on user history)
    const chartData = [
      { month: 'Jan', amount: 400 },
      { month: 'Feb', amount: 800 },
      { month: 'Mar', amount: 600 },
      { month: 'Apr', amount: 1200 },
      { month: 'May', amount: totalAmount > 2000 ? 2100 : 1500 },
    ];

    res.status(200).json({
      success: true,
      stats: {
        totalAmount,
        activeJobs: activeJobsCount,
        unreadMessages: unreadMessagesCount,
        unreadNotifications: unreadNotificationsCount,
        recentActivity: transactions,
        chartData
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getContractHistory = async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const contracts = await prisma.contract.findMany({
      where: user.role === 'CLIENT' ? { clientId: userId } : { freelancerId: userId },
      include: {
        freelancer: {
          select: { id: true, name: true, avatarUrl: true }
        },
        client: {
          select: { id: true, name: true, avatarUrl: true }
        },
        project: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, history: contracts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTransactionHistory = async (req: Request, res: Response) => {
  const userId = (req as any).auth?.userId;
  const { page = 1, limit = 10, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const where: any = {
      OR: [{ clientId: userId }, { freelancerId: userId }]
    };

    if (search) {
      where.OR = [
        { note: { contains: String(search), mode: 'insensitive' } },
        { id: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.transaction.count({ where })
    ]);

    res.status(200).json({ 
      success: true, 
      transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const getPublicStats = async (req: Request, res: Response) => {
  try {
    const [userCount, projectCount, completedContracts] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.contract.count({ where: { status: 'COMPLETED' } })
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: userCount > 1000 ? (userCount / 1000).toFixed(1) + 'k+' : userCount.toString(),
        projects: projectCount > 1000 ? (projectCount / 1000).toFixed(1) + 'k+' : projectCount.toString(),
        predictions: '99%',
        successRate: projectCount > 0 ? Math.round((completedContracts / projectCount) * 100) + '%' : '98%'
      },
      testimonials: await prisma.review.findMany({
        where: { rating: 5 },
        take: 3,
        include: { reviewer: { select: { name: true, image: true, role: true } } }
      }),
      faqs: await (prisma as any).faq?.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        take: 6
      }) || []
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
