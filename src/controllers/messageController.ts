import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { createNotification } from '../utils/notification';

export const startConversation = async (req: Request, res: Response) => {
  const { participantId } = req.body;
  const currentUserId = (req as any).auth?.userId;

  if (!currentUserId) return res.status(401).json({ success: false, error: "Unauthorized" });

  try {
    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: String(currentUserId) } } },
          { participants: { some: { userId: String(participantId) } } }
        ]
      },
      include: {
        participants: { include: { user: true } }
      }
    });

    if (existing) {
      return res.status(200).json({ success: true, conversation: existing });
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: String(currentUserId) },
            { userId: String(participantId) }
          ]
        }
      },
      include: {
        participants: { include: { user: true } }
      }
    });

    res.status(201).json({ success: true, conversation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  const currentUserId = (req as any).auth?.userId;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: currentUserId } }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.status(200).json({ success: true, conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getConversationMessages = async (req: Request, res: Response) => {
  const conversationId = String(req.params.conversationId);

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: String(conversationId) },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    res.status(200).json({ success: true, messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendDirectMessage = async (req: Request, res: Response) => {
  const conversationId = String(req.params.conversationId);
  const { content, attachmentUrl, attachmentType } = req.body;
  const senderId = (req as any).auth?.userId;

  if (!senderId) return res.status(401).json({ success: false, error: "Unauthorized" });
  if (!content && !attachmentUrl) return res.status(400).json({ success: false, error: "Content or attachment is required" });

  try {
    // Verify user is a participant
    const participant = await prisma.participant.findUnique({
      where: {
        userId_conversationId: {
          userId: String(senderId),
          conversationId: conversationId
        }
      }
    });

    if (!participant) {
      console.error(`User ${senderId} tried to send message to conversation ${conversationId} without being a participant`);
      return res.status(403).json({ success: false, error: "Access Denied: Not a participant" });
    }

    const message = await prisma.message.create({
      data: {
        content: String(content || ""),
        senderId: String(senderId),
        conversationId: conversationId,
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachmentType || null,
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    // Notify the other participant
    const otherParticipant = await prisma.participant.findFirst({
      where: {
        conversationId: conversationId,
        userId: { not: String(senderId) }
      },
      include: { user: { select: { name: true } } }
    });

    if (otherParticipant) {
      await createNotification(
        otherParticipant.userId,
        'MESSAGE_RECEIVED',
        `New Message from ${message.sender.name}`,
        content.length > 50 ? content.substring(0, 50) + '...' : content,
        { conversationId, senderId }
      );
    }

    // Emit message via socket
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('receive_message', message);
    }

    res.status(201).json({ success: true, message });
  } catch (error: any) {
    console.error('Send Message Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
