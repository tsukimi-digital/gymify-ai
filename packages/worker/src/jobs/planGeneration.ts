import { prisma } from '../db.js';
import { logger } from '../logger.js';
import { buildAnthropicMessages } from '../services/promptBuilder.js';
import { callClaude } from '../services/claude.js';
import { validatePlanOutput } from '../services/planValidator.js';

export async function handlePlanGeneration(jobId: string): Promise<void> {
  logger.info({ jobId }, 'Starting plan generation');

  // Phase 1: Analyzing Profile
  await prisma.planGenerationJob.update({
    where: { id: jobId },
    data: { phase: 'ANALYZING_PROFILE', progress: 10, status: 'RUNNING', startedAt: new Date() },
  });

  const job = await prisma.planGenerationJob.findUniqueOrThrow({ where: { id: jobId } });
  const userId = job.userId;

  const [profile, equipment, injuries, benchmarks, exercises] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    (prisma as any).equipmentAvailability.findMany({ where: { userId } }),
    (prisma as any).injury.findMany({ where: { userId } }),
    prisma.strengthBenchmark.findMany({
      where: { userId },
      include: { exercise: { select: { slug: true, name: true } } },
    }),
    prisma.exercise.findMany(),
  ]);

  if (!profile) {
    throw new Error('User profile not found — cannot generate plan');
  }

  const knownSlugs = new Set(exercises.map((e: { slug: string }) => e.slug));

  // Phase 2: Designing Schedule
  await prisma.planGenerationJob.update({
    where: { id: jobId },
    data: { phase: 'DESIGNING_SCHEDULE', progress: 30 },
  });

  const messages = buildAnthropicMessages({
    profile,
    equipment,
    injuries,
    benchmarks: benchmarks as any,
    exercises,
    reason: job.reason,
  });

  // Phase 3: Selecting Exercises
  await prisma.planGenerationJob.update({
    where: { id: jobId },
    data: { phase: 'SELECTING_EXERCISES', progress: 50 },
  });

  const { content, inputTokens, outputTokens } = await callClaude({
    system: messages.system as any,
    messages: messages.messages,
    jobId,
  });

  // Phase 4: Validating
  await prisma.planGenerationJob.update({
    where: { id: jobId },
    data: { phase: 'VALIDATING', progress: 80 },
  });

  let planData: ReturnType<typeof validatePlanOutput> | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const parsed = JSON.parse(content);
      planData = validatePlanOutput(parsed, knownSlugs);
      break;
    } catch (err: unknown) {
      lastError = err as Error;
      logger.warn({ attempt, jobId, error: String(err) }, 'Plan validation failed, retrying...');
    }
  }

  if (!planData) {
    throw lastError ?? new Error('Plan validation failed after retries');
  }

  // Phase 5: Save the plan
  const costUsd = (inputTokens * 0.000003 + outputTokens * 0.000015);

  await prisma.$transaction(async (tx: any) => {
    // Deactivate previous plan
    await tx.workoutPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Create new plan
    const plan = await tx.workoutPlan.create({
      data: {
        userId,
        content: planData as any,
        weeksTotal: planData!.mesocycle.weeks,
        deloadWeekIndex: planData!.mesocycle.deloadWeekIndex,
        isActive: true,
        generationJobId: jobId,
        modelId: 'claude-sonnet-4-5',
        promptVersion: '1.0',
      },
    });

    // Create plan days
    for (const week of planData!.mesocycle.schedule) {
      for (const day of week.days) {
        await tx.workoutPlanDay.create({
          data: {
            planId: plan.id,
            weekIndex: week.weekIndex,
            dayIndex: day.dayIndex,
            focus: day.focus,
            plannedJson: day as any,
          },
        });
      }
    }

    // Increment user plansGenerated
    await tx.user.update({
      where: { id: userId },
      data: { plansGenerated: { increment: 1 } },
    });

    // Mark job as done
    await tx.planGenerationJob.update({
      where: { id: jobId },
      data: {
        status: 'SUCCEEDED',
        phase: 'DONE',
        progress: 100,
        finishedAt: new Date(),
        inputTokens,
        outputTokens,
        costUsd,
      },
    });
  });

  logger.info({ jobId, userId }, 'Plan generation completed successfully');
}
