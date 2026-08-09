import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateFlashcards } from '../services/ai.service';
import prisma from '../config/db';

// SuperMemo-2 spaced repetition algorithm
function calculateNextReview(easeFactor: number, interval: number, repetitions: number, quality: number) {
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;
    if (repetitions === 0) newInterval = 1;
    else if (repetitions === 1) newInterval = 6;
    else newInterval = Math.round(interval * newEF);
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return { easeFactor: newEF, interval: newInterval, repetitions: newRepetitions, nextReviewDate: nextDate };
}

export const createFlashcardSet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, courseId, lessonId } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content are required' });

    const raw = await generateFlashcards(content);
    let cards;
    try { cards = JSON.parse(raw); } catch { cards = []; }

    const set = await prisma.flashcardSet.create({
      data: { userId: req.user!.id, title, courseId: courseId || null, lessonId: lessonId || null, cards },
    });

    return res.status(201).json({ set });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getFlashcardSets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sets = await prisma.flashcardSet.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ sets });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const submitCardReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { setId, cardIndex, quality } = req.body; // quality: 0-5 (SM-2)
    const studentId = req.user!.id;

    if (quality === undefined || cardIndex === undefined) {
      return res.status(400).json({ error: 'setId, cardIndex and quality are required' });
    }

    let progress = await prisma.flashcardProgress.findFirst({
      where: { studentId, cardIndex },
    });

    const current = progress || { easeFactor: 2.5, interval: 0, repetitions: 0 };
    const next = calculateNextReview(current.easeFactor, current.interval, current.repetitions, quality);

    if (progress) {
      progress = await prisma.flashcardProgress.update({
        where: { id: progress.id },
        data: next,
      });
    } else {
      progress = await prisma.flashcardProgress.create({
        data: { studentId, cardIndex, ...next },
      });
    }

    return res.status(200).json({ progress, nextReviewDate: next.nextReviewDate });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
