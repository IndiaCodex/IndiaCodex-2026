import { Router } from 'express';
import { studyPlanner, generateNotesHandler, aiTutorChat, reviewCodeHandler } from '../controllers/ai.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);

router.post('/study-planner', studyPlanner);
router.post('/notes', generateNotesHandler);
router.post('/tutor/chat', aiTutorChat);
router.post('/code-review', reviewCodeHandler);

export default router;
