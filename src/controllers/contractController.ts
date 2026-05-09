import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createContract = async (req: Request, res: Response) => {
  const { agreedAmount, projectId, freelancerId, clientId } = req.body;

  try {
    const contract = await prisma.contract.create({
      data: {
        agreedAmount: Number(agreedAmount),
        projectId: String(projectId),
        freelancerId: String(freelancerId),
        clientId: String(clientId),
        status: 'ACTIVE',
      },
    });

    // Update project status to IN_PROGRESS
    await prisma.project.update({
      where: { id: String(projectId) },
      data: { status: 'IN_PROGRESS' },
    });

    res.status(201).json({ success: true, contract });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getContractDetails = async (req: Request, res: Response) => {
  const contractId = String(req.params.contractId);

  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        project: true,
        freelancer: { select: { name: true, email: true } },
        client: { select: { name: true, email: true } },
      },
    });

    res.status(200).json({ success: true, contract });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
