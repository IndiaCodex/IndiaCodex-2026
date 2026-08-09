import { Router } from 'express';
import { getDashboard, startStudySession, endStudySession } from '../controllers/student.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Secure all student routes with JWT verification
router.use(authenticateJWT);

router.get('/dashboard', getDashboard);
router.post('/study-session/start', startStudySession);
router.post('/study-session/end', endStudySession);

export default router;
