import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Epley formula: e1RM = weight * (1 + reps/30)
function epley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// GET /api/stats/progress
router.get('/progress', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  // Get completed sessions for streak
  const sessions = await prisma.workoutSession.findMany({
    where: { userId, status: 'COMPLETED' },
    orderBy: { scheduledDate: 'desc' },
    select: { scheduledDate: true, status: true },
  });

  // Calculate streak: consecutive completed days ending today
  let streak = 0;
  const completedDays = new Set(
    sessions.map((s: { scheduledDate: Date }) => formatDate(new Date(s.scheduledDate)))
  );
  const checkDate = new Date(now);
  while (completedDays.has(formatDate(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Get set logs for e1RM and volume calculations
  const setLogs = await prisma.setLog.findMany({
    where: {
      setType: 'WORKING',
      reps: { gt: 0 },
      weightKg: { gt: 0 },
      sessionExercise: {
        session: {
          userId,
          status: 'COMPLETED',
          scheduledDate: { gte: thirtyDaysAgo },
        },
      },
    },
    include: {
      sessionExercise: {
        include: {
          session: { select: { scheduledDate: true } },
          exercise: { select: { slug: true, muscleGroup: true } },
        },
      },
    },
  });

  // Calculate e1RM grouped by exerciseSlug and week
  const e1rmMap: Record<string, Record<string, number>> = {};
  const volumeMap: Record<string, Record<string, number>> = {};

  for (const log of setLogs) {
    if (!log.reps || !log.weightKg) continue;

    const slug = log.sessionExercise.exercise.slug;
    const muscleGroup = log.sessionExercise.exercise.muscleGroup;
    const date = formatDate(new Date(log.sessionExercise.session.scheduledDate));
    const weekStart = getWeekStart(new Date(log.sessionExercise.session.scheduledDate));
    const e1rm = epley(log.weightKg, log.reps);

    // Track best e1RM per exercise per date
    if (!e1rmMap[slug]) e1rmMap[slug] = {};
    if (!e1rmMap[slug][date] || e1rmMap[slug][date] < e1rm) {
      e1rmMap[slug][date] = e1rm;
    }

    // Track weekly volume per muscle group
    if (!volumeMap[muscleGroup]) volumeMap[muscleGroup] = {};
    if (!volumeMap[muscleGroup][weekStart]) volumeMap[muscleGroup][weekStart] = 0;
    volumeMap[muscleGroup][weekStart] += log.weightKg * log.reps;
  }

  // Format e1RM output
  const e1rm: Record<string, Array<{ date: string; value: number }>> = {};
  for (const [slug, dates] of Object.entries(e1rmMap)) {
    e1rm[slug] = Object.entries(dates)
      .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Format weekly volume output
  const weeklyVolume: Record<string, Array<{ weekStart: string; totalKg: number }>> = {};
  for (const [muscleGroup, weeks] of Object.entries(volumeMap)) {
    weeklyVolume[muscleGroup] = Object.entries(weeks)
      .map(([weekStart, totalKg]) => ({ weekStart, totalKg: Math.round(totalKg) }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }

  res.json({ e1rm, weeklyVolume, streak });
}));

export default router;
