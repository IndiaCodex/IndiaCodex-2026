import { Router } from 'express';
import { getRewardWallet, getAchievements, claimDailyReward } from '../controllers/gamification.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
router.use(authenticateJWT);
router.get('/wallet', getRewardWallet);
router.get('/achievements', getAchievements);
router.post('/daily-reward', claimDailyReward);

export default router;
