import { Router } from 'express';
import { generateQuizHandler, submitQuizAttempt, getLeaderboard } from '../controllers/quiz.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

router.post('/generate', generateQuizHandler);
router.post('/attempt', submitQuizAttempt);
router.get('/leaderboard', getLeaderboard);

export default router;
