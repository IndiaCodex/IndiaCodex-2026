import { Router } from 'express';
import { agentStore } from '../services/AgentStore';

const router = Router();

router.get('/stats', (_req, res) => {
  const stats = agentStore.getGlobalStats();
  res.json(stats);
});

export default router;
