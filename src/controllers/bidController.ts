import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { notificationService } from '../services/notificationService';

export const placeBid = async (req: Request, res: Response) => {
  const { amount, coverLetter, deliveryDays, projectId } = req.body;
  const authState = (req as any).auth;
  const freelancerId = authState.userId;

  try {
    const bid = await prisma.bid.create({
      data: {
        amount: Number(amount),
        coverLetter: String(coverLetter),
        deliveryDays: Number(deliveryDays),
        projectId: String(projectId),
        freelancerId: String(freelancerId),
        status: 'PENDING',
      },
      include: {
        project: true,
        freelancer: true
      }
    });

    // Notify Project Owner
    await notificationService.send({
      userId: bid.project.clientId,
      type: 'BID_RECEIVED',
      title: 'New Bid Received!',
      message: `${bid.freelancer.name} bid $${bid.amount} on your project: ${bid.project.title}`,
      link: `/projects/${bid.projectId}`
    });

    res.status(201).json({ success: true, bid });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProjectBids = async (req: Request, res: Response) => {
  const projectId = String(req.params.projectId);

  try {
    const bids = await prisma.bid.findMany({
      where: { projectId },
      include: {
        freelancer: {
          select: { name: true, avatarUrl: true, avgRating: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, bids });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
