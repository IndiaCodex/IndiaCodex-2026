import { Router, Request, Response } from 'express';
import { agentStore } from '../services/AgentStore';

const router = Router();

router.get('/events', (req: Request, res: Response) => {
  try {
    const events = agentStore.getAllEvents();
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
