"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewCodeHandler = exports.aiTutorChat = exports.generateNotesHandler = exports.studyPlanner = void 0;
const ai_service_1 = require("../services/ai.service");
const db_1 = __importDefault(require("../config/db"));
const studyPlanner = async (req, res) => {
    try {
        const { subject, examDate, currentLevel, syllabus } = req.body;
        if (!subject || !examDate || !currentLevel) {
            return res.status(400).json({ error: 'subject, examDate and currentLevel are required' });
        }
        const plan = await (0, ai_service_1.generateStudyPlan)({ subject, examDate, currentLevel, syllabus });
        let parsed;
        try {
            parsed = JSON.parse(plan);
        }
        catch {
            parsed = { raw: plan };
        }
        return res.status(200).json({ plan: parsed });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.studyPlanner = studyPlanner;
const generateNotesHandler = async (req, res) => {
    try {
        const { content, type = 'TEXT', title } = req.body;
        if (!content)
            return res.status(400).json({ error: 'content is required' });
        const notes = await (0, ai_service_1.generateNotes)(content, type);
        // Save flashcard set automatically
        await db_1.default.flashcardSet.create({
            data: {
                userId: req.user.id,
                title: title || `Notes - ${new Date().toLocaleDateString()}`,
                cards: [],
            },
        });
        return res.status(200).json({ notes, type });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.generateNotesHandler = generateNotesHandler;
const aiTutorChat = async (req, res) => {
    try {
        const { message, history = [], subject } = req.body;
        if (!message)
            return res.status(400).json({ error: 'message is required' });
        const response = await (0, ai_service_1.chatWithTutor)({ message, history, subject });
        return res.status(200).json({ response, role: 'model' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.aiTutorChat = aiTutorChat;
const reviewCodeHandler = async (req, res) => {
    try {
        const { code, language = 'javascript' } = req.body;
        if (!code)
            return res.status(400).json({ error: 'code is required' });
        const review = await (0, ai_service_1.reviewCode)(code, language);
        return res.status(200).json({ review, language });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.reviewCodeHandler = reviewCodeHandler;
