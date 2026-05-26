import { Router, Request, Response } from 'express';
import { startSessionSchema, appendSetSchema, completeSessionSchema } from '@gymify/shared';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// POST /api/sessions — start a new session
router.post('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = startSessionSchema.parse(req.body);

  const planDay = await prisma.workoutPlanDay.findUnique({ where: { id: body.planDayId } });
  if (!planDay) {
    throw new AppError('PLAN_DAY_NOT_FOUND', 'Plan day not found', 404);
  }

  const session = await prisma.$transaction(async (tx: any) => {
    const sess = await tx.workoutSession.create({
      data: {
        userId,
        planId: planDay.planId,
        planDayId: planDay.id,
        scheduledDate: new Date(body.scheduledDate),
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    // Create SessionExercise rows from plan day snapshot
    const plannedJson = planDay.plannedJson as any;
    if (plannedJson?.exercises) {
      for (let i = 0; i < plannedJson.exercises.length; i++) {
        const ex = plannedJson.exercises[i];
        // Find exercise by slug
        const exercise = await tx.exercise.findFirst({
          where: { slug: ex.exerciseSlug },
          select: { id: true },
        });
        if (exercise) {
          await tx.sessionExercise.create({
            data: {
              sessionId: sess.id,
              exerciseId: exercise.id,
              orderIndex: i,
            },
          });
        }
      }
    }

    return sess;
  });

  // Return session with exercises
  const fullSession = await prisma.workoutSession.findUnique({
    where: { id: session.id },
    include: { exercises: { include: { setLogs: true } } },
  });

  res.json({ session: fullSession });
}));

// GET /api/sessions — paginated list
router.get('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const sessions = await prisma.workoutSession.findMany({
    where: { userId },
    orderBy: { scheduledDate: 'desc' },
    skip,
    take: limit,
    include: { exercises: { select: { id: true, exerciseId: true, orderIndex: true } } },
  });

  res.json({ sessions, page, limit });
}));

// GET /api/sessions/:id — full session
router.get('/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const session = await prisma.workoutSession.findUnique({
    where: { id },
    include: {
      exercises: {
        include: {
          setLogs: { orderBy: { setIndex: 'asc' } },
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  if (!session || session.userId !== userId) {
    throw new AppError('SESSION_NOT_FOUND', 'Session not found', 404);
  }

  res.json({ session });
}));

// POST /api/sessions/:id/sets — append SetLog (idempotent via clientSetId)
router.post('/:id/sets', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const body = appendSetSchema.parse(req.body);

  // Verify session ownership
  const session = await prisma.workoutSession.findUnique({ where: { id } });
  if (!session || session.userId !== userId) {
    throw new AppError('SESSION_NOT_FOUND', 'Session not found', 404);
  }

  // Find or verify sessionExercise
  const sessionExercise = await prisma.sessionExercise.findUnique({
    where: { id: body.exerciseId },
  });

  let seId = body.exerciseId;

  // If exerciseId doesn't match a sessionExercise directly, treat it as an exerciseId
  // and find the matching sessionExercise in this session
  if (!sessionExercise || sessionExercise.sessionId !== id) {
    // Find session exercise by exerciseId within this session
    const se = await (prisma as any).sessionExercise.findFirst({
      where: { sessionId: id, exerciseId: body.exerciseId },
    });
    if (!se) {
      throw new AppError('SESSION_EXERCISE_NOT_FOUND', 'Exercise not found in session', 404);
    }
    seId = se.id;
  }

  const setLog = await prisma.setLog.upsert({
    where: {
      sessionExerciseId_clientSetId: {
        sessionExerciseId: seId,
        clientSetId: body.clientSetId,
      },
    },
    create: {
      sessionExerciseId: seId,
      clientSetId: body.clientSetId,
      setIndex: body.setIndex,
      setType: body.setType,
      reps: body.reps,
      weightKg: body.weightKg,
      rpe: body.rpe,
      restSeconds: body.restSeconds,
      durationSec: body.durationSec,
      distanceM: body.distanceM,
    },
    update: {
      setIndex: body.setIndex,
      setType: body.setType,
      reps: body.reps,
      weightKg: body.weightKg,
      rpe: body.rpe,
      restSeconds: body.restSeconds,
      durationSec: body.durationSec,
      distanceM: body.distanceM,
    },
  });

  res.json({ setLog });
}));

// PATCH /api/sessions/:id/sets/:setId — edit SetLog
router.patch('/:id/sets/:setId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id, setId } = req.params;

  const session = await prisma.workoutSession.findUnique({ where: { id } });
  if (!session || session.userId !== userId) {
    throw new AppError('SESSION_NOT_FOUND', 'Session not found', 404);
  }

  const partial = appendSetSchema.partial().parse(req.body);

  const setLog = await prisma.setLog.update({
    where: { id: setId },
    data: {
      reps: partial.reps,
      weightKg: partial.weightKg,
      rpe: partial.rpe,
      restSeconds: partial.restSeconds,
      durationSec: partial.durationSec,
      distanceM: partial.distanceM,
    },
  });

  res.json({ setLog });
}));

// POST /api/sessions/:id/complete — complete a session
router.post('/:id/complete', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const session = await prisma.workoutSession.findUnique({ where: { id } });
  if (!session || session.userId !== userId) {
    throw new AppError('SESSION_NOT_FOUND', 'Session not found', 404);
  }

  const body = completeSessionSchema.parse(req.body);

  const updated = await prisma.workoutSession.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      overallRpe: body.overallRpe,
      notes: body.notes,
    },
  });

  res.json({ session: updated });
}));

// PATCH /api/sessions/:id/exercises/:seId/substitute — substitute exercise
router.patch('/:id/exercises/:seId/substitute', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id, seId } = req.params;
  const { exerciseId } = req.body;

  const session = await prisma.workoutSession.findUnique({ where: { id } });
  if (!session || session.userId !== userId) {
    throw new AppError('SESSION_NOT_FOUND', 'Session not found', 404);
  }

  const updated = await prisma.sessionExercise.update({
    where: { id: seId },
    data: { exerciseId },
  });

  res.json({ sessionExercise: updated });
}));

export default router;
