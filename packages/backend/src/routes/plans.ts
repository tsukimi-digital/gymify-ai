import { Router, Request, Response } from 'express';
import { planGenerateSchema } from '@gymify/shared';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { checkQuota } from '../services/quota.js';
import { initSSE, sendSSEEvent, sendSSEPing } from '../services/sse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// POST /api/plans/generate
router.post('/generate', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = planGenerateSchema.parse(req.body);

  await checkQuota(userId);

  const job = await prisma.planGenerationJob.create({
    data: {
      userId,
      status: 'QUEUED',
      reason: body.reason,
    },
  });

  res.json({ jobId: job.id });
}));

// GET /api/plans/jobs/:jobId
router.get('/jobs/:jobId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { jobId } = req.params;

  const job = await prisma.planGenerationJob.findUnique({ where: { id: jobId } });
  if (!job || job.userId !== userId) {
    throw new AppError('JOB_NOT_FOUND', 'Job not found', 404);
  }

  res.json({ job });
}));

// GET /api/plans/jobs/:jobId/stream — SSE
router.get('/jobs/:jobId/stream', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { jobId } = req.params;

  const job = await prisma.planGenerationJob.findUnique({ where: { id: jobId } });
  if (!job || job.userId !== userId) {
    res.status(404).json({ error: { code: 'JOB_NOT_FOUND', message: 'Job not found' } });
    return;
  }

  initSSE(res);

  const TERMINAL_STATUSES = ['SUCCEEDED', 'FAILED', 'CANCELLED'];
  const intervalId = setInterval(async () => {
    try {
      const current = await prisma.planGenerationJob.findUnique({ where: { id: jobId } });
      if (!current) {
        clearInterval(intervalId);
        res.end();
        return;
      }

      sendSSEEvent(res, {
        phase: current.phase,
        progress: current.progress,
        status: current.status,
      });

      if (TERMINAL_STATUSES.includes(current.status)) {
        clearInterval(intervalId);
        res.end();
      }
    } catch {
      clearInterval(intervalId);
      res.end();
    }
  }, 500);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
  });

  // Initial ping
  sendSSEPing(res);
});

// GET /api/plans/active
router.get('/active', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const plan = await prisma.workoutPlan.findFirst({
    where: { userId, isActive: true },
    include: { days: true },
  });

  if (!plan) {
    throw new AppError('PLAN_NOT_FOUND', 'No active plan found', 404);
  }

  res.json({ plan });
}));

export default router;
