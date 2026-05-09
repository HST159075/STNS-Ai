import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getUserNotifications = async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  const notificationId = String(req.params.notificationId);

  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
