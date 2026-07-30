import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/db';

export const getRewardWallet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wallet = await prisma.rewardWallet.findUnique({
      where: { userId: req.user!.id },
    });
    return res.status(200).json({ wallet });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAchievements = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [all, unlocked] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId: req.user!.id },
        include: { achievement: true },
      }),
    ]);

    const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

    return res.status(200).json({
      achievements: all.map((a) => ({
        ...a,
        unlocked: unlockedIds.has(a.id),
        unlockedAt: unlocked.find((u) => u.achievementId === a.id)?.unlockedAt || null,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const claimDailyReward = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const wallet = await prisma.rewardWallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) return res.status(404).json({ error: 'Reward wallet not found' });

    const lastClaim = new Date(wallet.lastActiveDate);
    const now = new Date();
    const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

    if (diffHours < 20) {
      return res.status(400).json({
        error: 'Daily reward already claimed',
        nextClaimAt: new Date(lastClaim.getTime() + 20 * 60 * 60 * 1000),
      });
    }

    const dailyXp = 50 + wallet.streakCount * 10;
    const dailyCoins = 10 + Math.floor(wallet.streakCount / 3);

    const updated = await prisma.rewardWallet.update({
      where: { userId: req.user!.id },
      data: { xp: { increment: dailyXp }, coins: { increment: dailyCoins }, lastActiveDate: now },
    });

    return res.status(200).json({
      message: 'Daily reward claimed!',
      xpEarned: dailyXp,
      coinsEarned: dailyCoins,
      wallet: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
