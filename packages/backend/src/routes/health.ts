import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  let dbStatus: 'up' | 'down' = 'down';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'up';
  } catch {
    // DB not available
  }
  res.json({ ok: dbStatus === 'up', db: dbStatus, timestamp: new Date().toISOString() });
}));

export default router;
