import { z } from 'zod';
export declare const planGenerateSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export type PlanGenerate = z.infer<typeof planGenerateSchema>;
