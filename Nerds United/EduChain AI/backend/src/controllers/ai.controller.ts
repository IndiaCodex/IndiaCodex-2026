import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateStudyPlan, generateNotes, chatWithTutor, reviewCode } from '../services/ai.service';
import prisma from '../config/db';

export const studyPlanner = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subject, examDate, currentLevel, syllabus } = req.body;
    if (!subject || !examDate || !currentLevel) {
      return res.status(400).json({ error: 'subject, examDate and currentLevel are required' });
    }
    const plan = await generateStudyPlan({ subject, examDate, currentLevel, syllabus });
    let parsed;
    try { parsed = JSON.parse(plan); } catch { parsed = { raw: plan }; }
    return res.status(200).json({ plan: parsed });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const generateNotesHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content, type = 'TEXT', title } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const notes = await generateNotes(content, type as any);

    // Save flashcard set automatically
    await prisma.flashcardSet.create({
      data: {
        userId: req.user!.id,
        title: title || `Notes - ${new Date().toLocaleDateString()}`,
        cards: [],
      },
    });

    return res.status(200).json({ notes, type });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const aiTutorChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, history = [], subject } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const response = await chatWithTutor({ message, history, subject });
    return res.status(200).json({ response, role: 'model' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const reviewCodeHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, language = 'javascript' } = req.body;
    if (!code) return res.status(400).json({ error: 'code is required' });

    const review = await reviewCode(code, language);
    return res.status(200).json({ review, language });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
