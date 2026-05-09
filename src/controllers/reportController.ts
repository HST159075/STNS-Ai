import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createReport = async (req: Request, res: Response) => {
  const { type, reason, reportedBy, projectId, reviewId, bidId } = req.body;

  try {
    const report = await prisma.report.create({
      data: {
        type,
        reason,
        reportedBy: String(reportedBy),
        projectId: projectId ? String(projectId) : undefined,
        reviewId: reviewId ? String(reviewId) : undefined,
        bidId: bidId ? String(bidId) : undefined,
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, reports });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
