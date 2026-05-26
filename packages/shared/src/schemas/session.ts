import { z } from 'zod';

export const startSessionSchema = z.object({
  planDayId: z.string().uuid(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const appendSetSchema = z.object({
  clientSetId: z.string(),
  exerciseId: z.string().uuid(),
  setIndex: z.number().int().min(1),
  setType: z.enum(['WARMUP', 'WORKING', 'DROP', 'AMRAP', 'BACKOFF']).default('WORKING'),
  reps: z.number().int().min(0).max(200).optional(),
  weightKg: z.number().min(0).max(600).optional(),
  rpe: z.number().min(1).max(10).optional(),
  restSeconds: z.number().int().min(0).max(7200).optional(),
  durationSec: z.number().int().min(0).optional(),
  distanceM: z.number().int().min(0).optional(),
});

export const completeSessionSchema = z.object({
  overallRpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
});

export type StartSession = z.infer<typeof startSessionSchema>;
export type AppendSet = z.infer<typeof appendSetSchema>;
export type CompleteSession = z.infer<typeof completeSessionSchema>;
