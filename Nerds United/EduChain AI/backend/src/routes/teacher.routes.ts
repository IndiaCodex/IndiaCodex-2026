import { Router } from 'express';
import { createCourse, publishCourse, addLesson, getTeacherAnalytics } from '../controllers/teacher.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();
router.use(authenticateJWT);
router.use(requireRole([UserRole.TEACHER, UserRole.INSTITUTION, UserRole.ADMIN]));
router.post('/courses', createCourse);
router.patch('/courses/publish', publishCourse);
router.post('/lessons', addLesson);
router.get('/analytics', getTeacherAnalytics);

export default router;
