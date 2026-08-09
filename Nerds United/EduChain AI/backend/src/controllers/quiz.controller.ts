import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateQuiz } from '../services/ai.service';
import prisma from '../config/db';

export const generateQuizHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topic, difficulty = 'Medium', count = 5, type = 'MIXED', lessonId } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic is required' });

    const raw = await generateQuiz({ topic, difficulty: difficulty as any, count, type: type as any });
    let questions;
    try { questions = JSON.parse(raw); } catch { return res.status(500).json({ error: 'Failed to parse quiz' }); }

    let quiz = null;
    if (lessonId) {
      quiz = await prisma.quiz.create({
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const submitQuizAttempt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { quizId, answers } = req.body;
    const studentId = req.user!.id;

    if (!quizId || !answers) return res.status(400).json({ error: 'quizId and answers are required' });

    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = quiz.questions as any[];
    let score = 0;
    const results = questions.map((q: any, idx: number) => {
      const correct = answers[idx] === q.correctAnswer;
      if (correct) score++;
      return { questionId: q.id, correct, correctAnswer: q.correctAnswer, explanation: q.explanation };
    });

    const attempt = await prisma.quizAttempt.create({
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
    await prisma.rewardWallet.updateMany({
      where: { userId: studentId },
      data: { xp: { increment: xpEarned } },
    });

    return res.status(200).json({ attemptId: attempt.id, score, maxScore: questions.length, results, xpEarned });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getLeaderboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const topStudents = await prisma.rewardWallet.findMany({
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
      name: (w.user as any).name,
      avatarUrl: (w.user as any).profile?.avatarUrl || null,
      xp: w.xp,
      coins: w.coins,
      streak: w.streakCount,
    }));

    return res.status(200).json({ leaderboard });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
