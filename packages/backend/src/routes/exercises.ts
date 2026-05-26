import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { muscle, equipment, search, isCardio, limit: limitStr, cursor } = req.query;

  const limit = Math.min(parseInt(String(limitStr ?? '50'), 10) || 50, 200);

  const where: Record<string, unknown> = {};

  if (muscle) {
    where.muscleGroup = String(muscle);
  }
  if (equipment) {
    where.equipmentType = String(equipment);
  }
  if (isCardio !== undefined) {
    where.isCardio = isCardio === 'true';
  }
  if (search) {
    where.name = { contains: String(search), mode: 'insensitive' };
  }
  if (cursor) {
    where.id = { gt: String(cursor) };
  }

  const exercises = await prisma.exercise.findMany({
    where,
    take: limit + 1,
    orderBy: { id: 'asc' },
  });

  const hasMore = exercises.length > limit;
  const page = hasMore ? exercises.slice(0, limit) : exercises;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  res.json({ exercises: page, nextCursor });
}));

router.get('/:slug', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const exercise = await prisma.exercise.findUnique({ where: { slug } });

  if (!exercise) {
    throw new AppError('NOT_FOUND', `Exercise "${slug}" not found`, 404);
  }

  res.json({ exercise });
}));

export default router;
