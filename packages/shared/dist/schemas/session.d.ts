import { z } from 'zod';
export declare const startSessionSchema: z.ZodObject<{
    planDayId: z.ZodString;
    scheduledDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    planDayId: string;
    scheduledDate: string;
}, {
    planDayId: string;
    scheduledDate: string;
}>;
export declare const appendSetSchema: z.ZodObject<{
    clientSetId: z.ZodString;
    exerciseId: z.ZodString;
    setIndex: z.ZodNumber;
    setType: z.ZodDefault<z.ZodEnum<["WARMUP", "WORKING", "DROP", "AMRAP", "BACKOFF"]>>;
    reps: z.ZodOptional<z.ZodNumber>;
    weightKg: z.ZodOptional<z.ZodNumber>;
    rpe: z.ZodOptional<z.ZodNumber>;
    restSeconds: z.ZodOptional<z.ZodNumber>;
    durationSec: z.ZodOptional<z.ZodNumber>;
    distanceM: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    clientSetId: string;
    exerciseId: string;
    setIndex: number;
    setType: "WARMUP" | "WORKING" | "DROP" | "AMRAP" | "BACKOFF";
    weightKg?: number | undefined;
    reps?: number | undefined;
    rpe?: number | undefined;
    restSeconds?: number | undefined;
    durationSec?: number | undefined;
    distanceM?: number | undefined;
}, {
    clientSetId: string;
    exerciseId: string;
    setIndex: number;
    weightKg?: number | undefined;
    setType?: "WARMUP" | "WORKING" | "DROP" | "AMRAP" | "BACKOFF" | undefined;
    reps?: number | undefined;
    rpe?: number | undefined;
    restSeconds?: number | undefined;
    durationSec?: number | undefined;
    distanceM?: number | undefined;
}>;
export declare const completeSessionSchema: z.ZodObject<{
    overallRpe: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    overallRpe?: number | undefined;
}, {
    notes?: string | undefined;
    overallRpe?: number | undefined;
}>;
export type StartSession = z.infer<typeof startSessionSchema>;
export type AppendSet = z.infer<typeof appendSetSchema>;
export type CompleteSession = z.infer<typeof completeSessionSchema>;
