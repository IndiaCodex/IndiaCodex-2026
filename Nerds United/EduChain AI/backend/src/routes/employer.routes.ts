import { Router } from 'express';
import { searchCandidates, getCandidateProfile } from '../controllers/employer.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();
router.use(authenticateJWT);
router.use(requireRole([UserRole.EMPLOYER, UserRole.ADMIN]));
router.get('/candidates', searchCandidates);
router.get('/candidates/:userId', getCandidateProfile);

export default router;
