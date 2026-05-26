import { z } from 'zod';

export const planGenerateSchema = z.object({
  reason: z.string().max(300).optional(),
});

export type PlanGenerate = z.infer<typeof planGenerateSchema>;
