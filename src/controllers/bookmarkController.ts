import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const toggleBookmark = async (req: Request, res: Response) => {
  const { userId, targetId, type } = req.body;

  try {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_targetId_type: { userId, targetId, type }
      }
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id }
      });
      return res.status(200).json({ success: true, message: 'Bookmark removed', action: 'REMOVED' });
    }

    const bookmark = await prisma.bookmark.create({
      data: { 
        userId: String(userId), 
        targetId: String(targetId), 
        type 
      }
    });

    res.status(201).json({ success: true, bookmark, action: 'ADDED' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserBookmarks = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, bookmarks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
