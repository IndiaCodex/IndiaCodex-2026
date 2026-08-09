"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCandidateProfile = exports.searchCandidates = void 0;
const db_1 = __importDefault(require("../config/db"));
const searchCandidates = async (req, res) => {
    try {
        const { skills, role } = req.query;
        const candidates = await db_1.default.user.findMany({
            where: {
                role: 'STUDENT',
                profile: {
                    skills: skills ? { hasSome: skills.split(',') } : undefined,
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
                skills: c.profile?.skills || [],
                xp: c.rewardWallet?.xp || 0,
                certCount: c.certificates?.length || 0,
                achievementCount: c.achievements?.length || 0,
            })) });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.searchCandidates = searchCandidates;
const getCandidateProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const candidate = await db_1.default.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
                rewardWallet: true,
                certificates: { include: { enrollment: { include: { course: true } } } },
                achievements: { include: { achievement: true } },
                enrollments: { include: { course: true } },
            },
        });
        if (!candidate)
            return res.status(404).json({ error: 'Candidate not found' });
        return res.status(200).json({ candidate: {
                id: candidate.id,
                name: candidate.name,
                profile: candidate.profile,
                xp: candidate.rewardWallet?.xp || 0,
                certificates: candidate.certificates,
                achievements: candidate.achievements,
                coursesCompleted: candidate.enrollments.filter((e) => e.progress >= 100).length,
            } });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getCandidateProfile = getCandidateProfile;
