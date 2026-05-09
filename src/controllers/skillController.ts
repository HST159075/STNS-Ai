import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getSkills = async (req: Request, res: Response) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json({ success: true, skills });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createSkill = async (req: Request, res: Response) => {
  const { name, category } = req.body;
  try {
    const skill = await prisma.skill.create({
      data: { name, category }
    });
    res.status(201).json({ success: true, skill });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
