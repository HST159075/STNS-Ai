import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createReview = async (req: Request, res: Response) => {
  const { rating, comment, type, reviewerId, revieweeId, projectId } = req.body;

  try {
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        type,
        reviewerId: String(reviewerId),
        revieweeId: String(revieweeId),
        projectId: String(projectId),
      },
    });

    // Update reviewee's average rating (simplified logic)
    const allReviews = await prisma.review.findMany({
      where: { revieweeId },
      select: { rating: true }
    });
    
    const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

    await prisma.user.update({
      where: { id: revieweeId },
      data: { 
        avgRating,
        totalReviews: allReviews.length
      }
    });

    res.status(201).json({ success: true, review });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserReviews = async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  try {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { name: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

