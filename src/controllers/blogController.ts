import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const createBlog = async (req: Request, res: Response) => {
  const { title, content, slug, tags, authorId, coverImageUrl, coverImagePublicId } = req.body;

  try {
    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        slug,
        tags,
        authorId,
        coverImageUrl,
        coverImagePublicId,
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    res.status(201).json({ success: true, blog });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBlogs = async (req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        author: { select: { name: true, avatarUrl: true } }
      },
      orderBy: { publishedAt: 'desc' },
    });

    res.status(200).json({ success: true, blogs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
