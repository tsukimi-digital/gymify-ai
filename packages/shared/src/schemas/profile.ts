import { z } from 'zod';

export const profileUpdateSchema = z.object({
  goal: z.enum(['LOSE_WEIGHT', 'BUILD_MUSCLE', 'IMPROVE_ENDURANCE', 'STAY_FIT']),
  sex: z.enum(['MALE', 'FEMALE', 'OTHER']),
  weightKg: z.number().min(20).max(500),
  heightCm: z.number().min(50).max(300),
  age: z.number().int().min(10).max(120),
  unitPreference: z.enum(['METRIC', 'IMPERIAL']),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(15).max(180),
  trainingYears: z.number().min(0).max(50),
  fitnessSelfRating: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  parqAcknowledged: z.boolean(),
  medicalDisclaimer: z.boolean(),
  notes: z.string().max(500).optional(),
  equipment: z.array(z.object({
    type: z.string(),
    maxWeightKg: z.number().optional(),
  })),
  injuries: z.array(z.object({
    bodyArea: z.string(),
    side: z.enum(['LEFT', 'RIGHT', 'BOTH', 'N_A']).optional(),
    status: z.enum(['ACUTE', 'RECOVERING', 'CHRONIC', 'RESOLVED']).optional(),
    restriction: z.string().max(300).optional(),
  })),
  benchmarks: z.array(z.object({
    exerciseSlug: z.string(),
    estimated1RM: z.number().positive(),
  })).optional(),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
