"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimDailyReward = exports.getAchievements = exports.getRewardWallet = void 0;
const db_1 = __importDefault(require("../config/db"));
const getRewardWallet = async (req, res) => {
    try {
        const wallet = await db_1.default.rewardWallet.findUnique({
            where: { userId: req.user.id },
        });
        return res.status(200).json({ wallet });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getRewardWallet = getRewardWallet;
const getAchievements = async (req, res) => {
    try {
        const [all, unlocked] = await Promise.all([
            db_1.default.achievement.findMany(),
            db_1.default.userAchievement.findMany({
                where: { userId: req.user.id },
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getAchievements = getAchievements;
const claimDailyReward = async (req, res) => {
    try {
        const wallet = await db_1.default.rewardWallet.findUnique({ where: { userId: req.user.id } });
        if (!wallet)
            return res.status(404).json({ error: 'Reward wallet not found' });
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
        const updated = await db_1.default.rewardWallet.update({
            where: { userId: req.user.id },
            data: { xp: { increment: dailyXp }, coins: { increment: dailyCoins }, lastActiveDate: now },
        });
        return res.status(200).json({
            message: 'Daily reward claimed!',
            xpEarned: dailyXp,
            coinsEarned: dailyCoins,
            wallet: updated,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.claimDailyReward = claimDailyReward;
