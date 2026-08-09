"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitCardReview = exports.getFlashcardSets = exports.createFlashcardSet = void 0;
const ai_service_1 = require("../services/ai.service");
const db_1 = __importDefault(require("../config/db"));
// SuperMemo-2 spaced repetition algorithm
function calculateNextReview(easeFactor, interval, repetitions, quality) {
    let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEF = Math.max(1.3, newEF);
    let newInterval;
    let newRepetitions;
    if (quality < 3) {
        newRepetitions = 0;
        newInterval = 1;
    }
    else {
        newRepetitions = repetitions + 1;
        if (repetitions === 0)
            newInterval = 1;
        else if (repetitions === 1)
            newInterval = 6;
        else
            newInterval = Math.round(interval * newEF);
    }
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);
    return { easeFactor: newEF, interval: newInterval, repetitions: newRepetitions, nextReviewDate: nextDate };
}
const createFlashcardSet = async (req, res) => {
    try {
        const { title, content, courseId, lessonId } = req.body;
        if (!title || !content)
            return res.status(400).json({ error: 'title and content are required' });
        const raw = await (0, ai_service_1.generateFlashcards)(content);
        let cards;
        try {
            cards = JSON.parse(raw);
        }
        catch {
            cards = [];
        }
        const set = await db_1.default.flashcardSet.create({
            data: { userId: req.user.id, title, courseId: courseId || null, lessonId: lessonId || null, cards },
        });
        return res.status(201).json({ set });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.createFlashcardSet = createFlashcardSet;
const getFlashcardSets = async (req, res) => {
    try {
        const sets = await db_1.default.flashcardSet.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json({ sets });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getFlashcardSets = getFlashcardSets;
const submitCardReview = async (req, res) => {
    try {
        const { setId, cardIndex, quality } = req.body; // quality: 0-5 (SM-2)
        const studentId = req.user.id;
        if (quality === undefined || cardIndex === undefined) {
            return res.status(400).json({ error: 'setId, cardIndex and quality are required' });
        }
        let progress = await db_1.default.flashcardProgress.findFirst({
            where: { studentId, cardIndex },
        });
        const current = progress || { easeFactor: 2.5, interval: 0, repetitions: 0 };
        const next = calculateNextReview(current.easeFactor, current.interval, current.repetitions, quality);
        if (progress) {
            progress = await db_1.default.flashcardProgress.update({
                where: { id: progress.id },
                data: next,
            });
        }
        else {
            progress = await db_1.default.flashcardProgress.create({
                data: { studentId, cardIndex, ...next },
            });
        }
        return res.status(200).json({ progress, nextReviewDate: next.nextReviewDate });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.submitCardReview = submitCardReview;
