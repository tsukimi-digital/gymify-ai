import { Router, Request, Response } from 'express';
import { profileUpdateSchema } from '@gymify/shared';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError('PROFILE_NOT_FOUND', 'Profile not found', 404);
  }

  const [equipment, injuries, benchmarks] = await Promise.all([
    (prisma as any).equipmentAvailability.findMany({ where: { userId } }),
    (prisma as any).injury.findMany({ where: { userId } }),
    prisma.strengthBenchmark.findMany({
      where: { userId },
      include: { exercise: { select: { slug: true } } },
    }),
  ]);

  res.json({ profile, equipment, injuries, benchmarks });
}));

router.put('/', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = profileUpdateSchema.parse(req.body);

  const result = await prisma.$transaction(async (tx: any) => {
    const profile = await tx.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        goal: body.goal,
        sex: body.sex,
        weightKg: body.weightKg,
        heightCm: body.heightCm,
        age: body.age,
        unitPreference: body.unitPreference,
        daysPerWeek: body.daysPerWeek,
        sessionMinutes: body.sessionMinutes,
        trainingYears: body.trainingYears,
        fitnessSelfRating: body.fitnessSelfRating,
        parqAcknowledged: body.parqAcknowledged,
        medicalDisclaimer: body.medicalDisclaimer,
        notes: body.notes,
      },
      update: {
        goal: body.goal,
        sex: body.sex,
        weightKg: body.weightKg,
        heightCm: body.heightCm,
        age: body.age,
        unitPreference: body.unitPreference,
        daysPerWeek: body.daysPerWeek,
        sessionMinutes: body.sessionMinutes,
        trainingYears: body.trainingYears,
        fitnessSelfRating: body.fitnessSelfRating,
        parqAcknowledged: body.parqAcknowledged,
        medicalDisclaimer: body.medicalDisclaimer,
        notes: body.notes,
      },
    });

    // Replace equipment
    await tx.equipmentAvailability.deleteMany({ where: { userId } });
    await tx.equipmentAvailability.createMany({
      data: body.equipment.map(e => ({
        userId,
        type: e.type,
        maxWeightKg: e.maxWeightKg,
      })),
    });

    // Replace injuries
    await tx.injury.deleteMany({ where: { userId } });
    await tx.injury.createMany({
      data: body.injuries.map(i => ({
        userId,
        bodyArea: i.bodyArea,
        side: i.side,
        status: i.status,
        restriction: i.restriction,
      })),
    });

    // Upsert benchmarks if provided
    if (body.benchmarks && body.benchmarks.length > 0) {
      // Get exercise IDs by slug
      const exercises = await tx.exercise.findMany({
        where: { slug: { in: body.benchmarks.map(b => b.exerciseSlug) } },
        select: { id: true, slug: true },
      });
      const exerciseMap = new Map(exercises.map((e: { id: string; slug: string }) => [e.slug, e.id]));

      await tx.strengthBenchmark.deleteMany({ where: { userId } });
      for (const b of body.benchmarks) {
        const exerciseId = exerciseMap.get(b.exerciseSlug);
        if (exerciseId) {
          await tx.strengthBenchmark.upsert({
            where: { id: `${userId}-${b.exerciseSlug}` },
            create: { userId, exerciseId, estimated1RM: b.estimated1RM },
            update: { estimated1RM: b.estimated1RM },
          });
        }
      }
    }

    return profile;
  });

  res.json({ profile: result });
}));

export default router;
