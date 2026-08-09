import { Router } from 'express';
import { JOB_LIST } from '../constants/jobs';

const router = Router();

router.get('/jobs', (_req, res) => {
  res.json(JOB_LIST);
});

export default router;
