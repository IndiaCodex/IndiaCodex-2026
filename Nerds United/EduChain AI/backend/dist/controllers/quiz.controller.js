"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.submitQuizAttempt = exports.generateQuizHandler = void 0;
const ai_service_1 = require("../services/ai.service");
const db_1 = __importDefault(require("../config/db"));
const generateQuizHandler = async (req, res) => {
    try {
        const { topic, difficulty = 'Medium', count = 5, type = 'MIXED', lessonId } = req.body;
        if (!topic)
            return res.status(400).json({ error: 'topic is required' });
        const raw = await (0, ai_service_1.generateQuiz)({ topic, difficulty: difficulty, count, type: type });
        let questions;
        try {
            questions = JSON.parse(raw);
        }
        catch {
            return res.status(500).json({ error: 'Failed to parse quiz' });
        }
        let quiz = null;
        if (lessonId) {
            quiz = await db_1.default.quiz.create({
                data: {
                    lessonId,
                    title: `AI Quiz: ${topic}`,
                    difficulty,
                    timeLimit: Math.ceil(count * 2),
                    questions,
                },
            });
        }
        return res.status(200).json({ quizId: quiz?.id || null, questions, topic, difficulty });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.generateQuizHandler = generateQuizHandler;
const submitQuizAttempt = async (req, res) => {
    try {
        const { quizId, answers } = req.body;
        const studentId = req.user.id;
        if (!quizId || !answers)
            return res.status(400).json({ error: 'quizId and answers are required' });
        const quiz = await db_1.default.quiz.findUnique({ where: { id: quizId } });
        if (!quiz)
            return res.status(404).json({ error: 'Quiz not found' });
        const questions = quiz.questions;
        let score = 0;
        const results = questions.map((q, idx) => {
            const correct = answers[idx] === q.correctAnswer;
            if (correct)
                score++;
            return { questionId: q.id, correct, correctAnswer: q.correctAnswer, explanation: q.explanation };
        });
        const attempt = await db_1.default.quizAttempt.create({
            data: {
                quizId,
                studentId,
                score,
                maxScore: questions.length,
                answers,
            },
        });
        // Award XP
        const xpEarned = score * 10;
        await db_1.default.rewardWallet.updateMany({
            where: { userId: studentId },
            data: { xp: { increment: xpEarned } },
        });
        return res.status(200).json({ attemptId: attempt.id, score, maxScore: questions.length, results, xpEarned });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.submitQuizAttempt = submitQuizAttempt;
const getLeaderboard = async (req, res) => {
    try {
        const topStudents = await db_1.default.rewardWallet.findMany({
            orderBy: { xp: 'desc' },
            take: 20,
            include: {
                user: {
                    select: { id: true, name: true },
                    include: { profile: { select: { avatarUrl: true } } },
                },
            },
        });
        const leaderboard = topStudents.map((w, idx) => ({
            rank: idx + 1,
            userId: w.userId,
            name: w.user.name,
            avatarUrl: w.user.profile?.avatarUrl || null,
            xp: w.xp,
            coins: w.coins,
            streak: w.streakCount,
        }));
        return res.status(200).json({ leaderboard });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getLeaderboard = getLeaderboard;
