import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';

export const getSystemStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [users, courses, enrollments, certificates, sessions] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.certificate.count(),
      prisma.studySession.count(),
    ]);

    const roleBreakdown = await prisma.user.groupBy({ by: ['role'], _count: true });

    return res.status(200).json({
      stats: { users, courses, enrollments, certificates, sessions },
      roleBreakdown: roleBreakdown.reduce((acc: any, r) => { acc[r.role] = r._count; return acc; }, {}),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const listUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', role } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where = role ? { role: role as any } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, walletAddress: true, createdAt: true },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({ users, total, page: parseInt(page as string) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) return res.status(400).json({ error: 'userId and role required' });

    const user = await prisma.user.update({ where: { id: userId }, data: { role } });
    return res.status(200).json({ user: { id: user.id, role: user.role } });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
