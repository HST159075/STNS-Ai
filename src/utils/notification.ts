import prisma from '../config/prisma';
import { NotificationType } from '@prisma/client';

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  metadata?: any
) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        metadata: metadata || {},
        isRead: false
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
