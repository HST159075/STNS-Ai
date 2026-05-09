import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createTransaction = async (req: Request, res: Response) => {
  const { amount, contractId, clientId, freelancerId, note } = req.body;

  try {
    const transaction = await prisma.transaction.create({
      data: {
        amount: Number(amount),
        contractId,
        clientId,
        freelancerId,
        note,
        status: 'COMPLETED',
      },
    });

    res.status(201).json({ success: true, transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserTransactions = async (req: Request, res: Response) => {
  const userId = String(req.params.userId);

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { clientId: userId },
          { freelancerId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
