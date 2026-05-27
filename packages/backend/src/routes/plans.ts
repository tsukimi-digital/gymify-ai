import { Router, Request, Response } from 'express';
import { planGenerateSchema } from '@gymify/shared';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { checkQuota } from '../services/quota.js';
import { initSSE, sendSSEEvent, sendSSEPing } from '../services/sse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { handlePlanGeneration } from '../services/planGeneration.js';

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

  // Fire-and-forget: process the job in the background
  handlePlanGeneration(job.id).catch(async (err: unknown) => {
    await prisma.planGenerationJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', errorMessage: String(err), finishedAt: new Date() },
    }).catch(() => {});
  });
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

// GET /api/plans — paginated history
router.get('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const limit = Math.min(parseInt(String(req.query.limit ?? '10'), 10) || 10, 50);
  const cursor = req.query.cursor as string | undefined;

  const plans = await prisma.workoutPlan.findMany({
    where: { userId, ...(cursor ? { id: { lt: cursor } } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    select: { id: true, isActive: true, weeksTotal: true, deloadWeekIndex: true, createdAt: true, modelId: true },
  });

  const hasMore = plans.length > limit;
  const page = hasMore ? plans.slice(0, limit) : plans;
  res.json({ plans: page, nextCursor: hasMore ? page[page.length - 1].id : null });
}));

// GET /api/plans/:id — specific plan
router.get('/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const plan = await prisma.workoutPlan.findUnique({ where: { id }, include: { days: true } });
  if (!plan || plan.userId !== userId) {
    throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 404);
  }

  res.json({ plan });
}));

// POST /api/plans/:id/regenerate
router.post('/:id/regenerate', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const body = planGenerateSchema.parse(req.body);

  const plan = await prisma.workoutPlan.findUnique({ where: { id } });
  if (!plan || plan.userId !== userId) {
    throw new AppError('PLAN_NOT_FOUND', 'Plan not found', 404);
  }

  await checkQuota(userId);

  const job = await prisma.planGenerationJob.create({
    data: { userId, status: 'QUEUED', reason: body.reason, previousPlanId: id },
  });

  res.json({ jobId: job.id });
}));

export default router;
