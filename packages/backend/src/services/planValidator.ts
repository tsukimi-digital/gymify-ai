import { z } from 'zod';

const exerciseSchema = z.object({
  exerciseSlug: z.string(),
  sets: z.number().int().min(1).max(10),
  repsTarget: z.string(),
  rpeTarget: z.number().min(5).max(10),
  restSeconds: z.number().int().min(30).max(600),
  progression: z.string().optional(),
  notes: z.string().optional(),
});

const daySchema = z.object({
  dayIndex: z.number().int(),
  focus: z.string(),
  exercises: z.array(exerciseSchema),
});

const weekSchema = z.object({
  weekIndex: z.number().int(),
  days: z.array(daySchema),
});

export const planOutputSchema = z.object({
  mesocycle: z.object({
    weeks: z.number().int().min(3).max(6),
    deloadWeekIndex: z.number().int().optional(),
    schedule: z.array(weekSchema),
  }),
  generalNotes: z.string().optional(),
});

export type PlanOutput = z.infer<typeof planOutputSchema>;

export function validatePlanOutput(data: unknown, knownSlugs: Set<string>): PlanOutput {
  // Structural validation
  const parsed = planOutputSchema.parse(data);

  // Business rules: check all exercise slugs exist in catalog
  const unknownSlugs: string[] = [];
  for (const week of parsed.mesocycle.schedule) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        if (!knownSlugs.has(exercise.exerciseSlug)) {
          unknownSlugs.push(exercise.exerciseSlug);
        }
      }
    }
  }

  if (unknownSlugs.length > 0) {
    throw new Error(`Unknown exercise slugs in plan: ${unknownSlugs.join(', ')}`);
  }

  return parsed;
}
