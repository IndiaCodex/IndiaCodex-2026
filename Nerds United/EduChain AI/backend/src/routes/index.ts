import { Router } from 'express';
import authRouter from './auth.routes';
import studentRouter from './student.routes';
import coursesRouter from './courses.routes';
import aiRouter from './ai.routes';
import quizRouter from './quiz.routes';
import flashcardsRouter from './flashcards.routes';
import certRouter from './certificates.routes';
import gamificationRouter from './gamification.routes';
import communityRouter from './community.routes';
import careerRouter from './career.routes';
import adminRouter from './admin.routes';
import teacherRouter from './teacher.routes';
import employerRouter from './employer.routes';

const router = Router();

// API Version 1 Namespace
router.use('/auth', authRouter);
router.use('/student', studentRouter);
router.use('/courses', coursesRouter);
router.use('/ai', aiRouter);
router.use('/quiz', quizRouter);
router.use('/flashcards', flashcardsRouter);
router.use('/certificates', certRouter);
router.use('/gamification', gamificationRouter);
router.use('/community', communityRouter);
router.use('/career', careerRouter);
router.use('/admin', adminRouter);
router.use('/teacher', teacherRouter);
router.use('/employer', employerRouter);

export default router;
