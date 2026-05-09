import prisma from '../config/prisma';
import { io } from '../index';

export const notificationService = {
  /**
   * Creates a notification in the database and sends it in real-time
   */
  send: async (data: {
    userId: string;
    type: any;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
  }) => {
    try {
      // 1. Persist to Database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.message,
          // link: data.link, // Temporarily disabled until prisma generate succeeds
          metadata: data.metadata || {},
        },
      });

      // 2. Emit via Socket.io (Real-time)
      // We target the room named after the userId
      if (io) {
        io.to(data.userId).emit('new_notification', notification);
        console.log(`Real-time notification sent to User: ${data.userId}`);
      }

      return notification;
    } catch (error) {
      console.error('Notification Service Error:', error);
      return null;
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string) => {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  },

  /**
   * Get user's notifications
   */
  getUserNotifications: async (userId: string) => {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
};
