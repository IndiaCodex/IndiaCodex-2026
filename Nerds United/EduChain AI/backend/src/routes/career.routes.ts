import { Router } from 'express';
import { analyzeCareer, getProgressReport } from '../controllers/career.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);
router.post('/analyze', analyzeCareer);
router.get('/progress', getProgressReport);

export default router;
