import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { notificationService } from '../services/notificationService';

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
      include: {
        project: true,
        client: { select: { name: true } }
      }
    });

    // Update project status to IN_PROGRESS
    await prisma.project.update({
      where: { id: String(projectId) },
      data: { status: 'IN_PROGRESS' },
    });

    // Notify Freelancer
    await notificationService.send({
      userId: freelancerId,
      type: 'CONTRACT_CREATED',
      title: 'You were Hired!',
      message: `${contract.client.name} hired you for the project: ${contract.project.title}`,
      link: `/bookings`
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
