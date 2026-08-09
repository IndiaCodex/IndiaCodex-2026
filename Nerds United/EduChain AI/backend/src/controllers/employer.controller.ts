import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';

export const searchCandidates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { skills, role } = req.query;

    const candidates = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        profile: {
          skills: skills ? { hasSome: (skills as string).split(',') } : undefined,
        },
      },
      include: {
        profile: true,
        rewardWallet: true,
        certificates: { take: 5 },
        achievements: { include: { achievement: true }, take: 5 },
      },
      take: 20,
    });

    return res.status(200).json({ candidates: candidates.map((c) => ({
      id: c.id,
      name: c.name,
      walletAddress: c.walletAddress,
      skills: (c as any).profile?.skills || [],
      xp: (c as any).rewardWallet?.xp || 0,
      certCount: (c as any).certificates?.length || 0,
      achievementCount: (c as any).achievements?.length || 0,
    })) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCandidateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const candidate = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        rewardWallet: true,
        certificates: { include: { enrollment: { include: { course: true } } } },
        achievements: { include: { achievement: true } },
        enrollments: { include: { course: true } },
      },
    });

    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    return res.status(200).json({ candidate: {
      id: candidate.id,
      name: candidate.name,
      profile: (candidate as any).profile,
      xp: (candidate as any).rewardWallet?.xp || 0,
      certificates: (candidate as any).certificates,
      achievements: (candidate as any).achievements,
      coursesCompleted: (candidate as any).enrollments.filter((e: any) => e.progress >= 100).length,
    }});
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
