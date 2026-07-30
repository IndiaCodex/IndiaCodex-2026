import { Router } from 'express';
import { getSystemStats, listUsers, updateUserRole } from '../controllers/admin.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();
router.use(authenticateJWT);
router.use(requireRole([UserRole.ADMIN]));
router.get('/stats', getSystemStats);
router.get('/users', listUsers);
router.patch('/users/role', updateUserRole);

export default router;
