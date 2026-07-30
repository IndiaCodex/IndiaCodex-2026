"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgressReport = exports.analyzeCareer = void 0;
const ai_service_1 = require("../services/ai.service");
const db_1 = __importDefault(require("../config/db"));
const analyzeCareer = async (req, res) => {
    try {
        const { targetRole, experience } = req.body;
        if (!targetRole)
            return res.status(400).json({ error: 'targetRole required' });
        const profile = await db_1.default.profile.findUnique({ where: { userId: req.user.id } });
        const skills = profile?.skills || [];
        const raw = await (0, ai_service_1.analyzeCareerGap)({ skills, targetRole, experience: experience || '0-1 years' });
        let analysis;
        try {
            analysis = JSON.parse(raw);
        }
        catch {
            analysis = { raw };
        }
        return res.status(200).json({ analysis });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.analyzeCareer = analyzeCareer;
const getProgressReport = async (req, res) => {
    try {
        const studentId = req.user.id;
        const [sessions, quizAttempts, enrollments, wallet] = await Promise.all([
            db_1.default.studySession.findMany({ where: { studentId }, orderBy: { startTime: 'desc' }, take: 30 }),
            db_1.default.quizAttempt.findMany({ where: { studentId }, orderBy: { completedAt: 'desc' }, take: 20 }),
            db_1.default.enrollment.findMany({ where: { studentId }, include: { course: true } }),
            db_1.default.rewardWallet.findUnique({ where: { userId: studentId } }),
        ]);
        const totalStudySeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
        const avgQuizScore = quizAttempts.length
            ? quizAttempts.reduce((acc, a) => acc + (a.score / a.maxScore) * 100, 0) / quizAttempts.length
            : 0;
        const examReadiness = Math.min(Math.round((avgQuizScore * 0.4) +
            (Math.min(totalStudySeconds / 360, 100) * 0.3) +
            (enrollments.reduce((acc, e) => acc + e.progress, 0) / Math.max(enrollments.length, 1)) * 0.3), 100);
        return res.status(200).json({
            report: {
                totalStudyHours: Math.round(totalStudySeconds / 3600 * 10) / 10,
                avgQuizScore: Math.round(avgQuizScore),
                coursesEnrolled: enrollments.length,
                coursesCompleted: enrollments.filter((e) => e.progress >= 100).length,
                examReadiness,
                xp: wallet?.xp || 0,
                coins: wallet?.coins || 0,
                streak: wallet?.streakCount || 0,
                recentSessions: sessions.slice(0, 7).map((s) => ({
                    date: s.startTime,
                    minutes: Math.round(s.durationSeconds / 60),
                })),
                quizHistory: quizAttempts.slice(0, 10).map((a) => ({
                    date: a.completedAt,
                    score: a.score,
                    max: a.maxScore,
                    percent: Math.round((a.score / a.maxScore) * 100),
                })),
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getProgressReport = getProgressReport;
