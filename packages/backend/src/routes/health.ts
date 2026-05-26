import { Router } from 'express';
import { isDatabaseAvailable } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const dbUp = await isDatabaseAvailable();
  res.json({ ok: dbUp, db: dbUp ? 'up' : 'down', timestamp: new Date().toISOString() });
}));

export default router;
