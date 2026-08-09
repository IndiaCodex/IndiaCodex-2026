import { Router } from 'express';
import { listCourses, getCourse, enrollCourse, updateProgress, submitReview } from '../controllers/courses.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.get('/', listCourses);
router.get('/:id', getCourse);
router.use(authenticateJWT);
router.post('/enroll', enrollCourse);
router.patch('/progress', updateProgress);
router.post('/review', submitReview);

export default router;
