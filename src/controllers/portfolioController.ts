import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const addPortfolio = async (req: Request, res: Response) => {
  const { title, description, liveUrl, githubUrl, tags, freelancerId, imageUrl, imagePublicId } = req.body;

  try {
    const portfolio = await prisma.portfolio.create({
      data: {
        title,
        description,
        liveUrl,
        githubUrl,
        tags,
        freelancerId: String(freelancerId),
        imageUrl,
        imagePublicId,
      },
    });

    res.status(201).json({ success: true, portfolio });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFreelancerPortfolio = async (req: Request, res: Response) => {
  const freelancerId = String(req.params.freelancerId);

  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { freelancerId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, portfolios });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
