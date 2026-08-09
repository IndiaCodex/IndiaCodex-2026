import { Router } from 'express';
import { DecisionEngine } from '../services/DecisionEngine';

const router = Router();

// ── Manual tick ─────────────────────────────────────────────────
router.post('/tick', async (_req, res) => {
  console.log('[POST /tick] Tick started');
  try {
    const result = await DecisionEngine.runTick();
    console.log('[POST /tick] Tick finished');
    res.json(result);
  } catch (error: any) {
    console.error('[POST /tick] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ── Auto-tick controls ───────────────────────────────────────────
router.post('/tick/auto/start', (req, res) => {
  const intervalSeconds = Number(req.body?.intervalSeconds) || 30;
  DecisionEngine.startAutoTick(intervalSeconds);
  res.json({ message: `Auto-tick started every ${intervalSeconds}s`, ...DecisionEngine.getAutoTickStatus() });
});

router.post('/tick/auto/stop', (_req, res) => {
  DecisionEngine.stopAutoTick();
  res.json({ message: 'Auto-tick stopped', ...DecisionEngine.getAutoTickStatus() });
});

router.get('/tick/auto/status', (_req, res) => {
  res.json(DecisionEngine.getAutoTickStatus());
});

export default router;
