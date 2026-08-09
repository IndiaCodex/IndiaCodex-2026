import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  walletChallenge,
  walletLogin
} from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/wallet-challenge', walletChallenge);
router.post('/wallet-login', walletLogin);

export default router;
