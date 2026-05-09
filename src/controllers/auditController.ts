import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createAuditLog = async (req: Request, res: Response) => {
  const { action, adminId, targetId, note, metadata } = req.body;

  try {
    const log = await prisma.auditLog.create({
      data: {
        action,
        adminId: String(adminId),
        targetId: String(targetId),
        note,
        metadata,
      },
    });

    res.status(201).json({ success: true, log });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        admin: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
