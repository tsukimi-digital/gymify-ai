import { z } from 'zod';
export declare const profileUpdateSchema: z.ZodObject<{
    goal: z.ZodEnum<["LOSE_WEIGHT", "BUILD_MUSCLE", "IMPROVE_ENDURANCE", "STAY_FIT"]>;
    sex: z.ZodEnum<["MALE", "FEMALE", "OTHER"]>;
    weightKg: z.ZodNumber;
    heightCm: z.ZodNumber;
    age: z.ZodNumber;
    unitPreference: z.ZodEnum<["METRIC", "IMPERIAL"]>;
    daysPerWeek: z.ZodNumber;
    sessionMinutes: z.ZodNumber;
    trainingYears: z.ZodNumber;
    fitnessSelfRating: z.ZodEnum<["BEGINNER", "INTERMEDIATE", "ADVANCED"]>;
    parqAcknowledged: z.ZodBoolean;
    medicalDisclaimer: z.ZodBoolean;
    notes: z.ZodOptional<z.ZodString>;
    equipment: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        maxWeightKg: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        maxWeightKg?: number | undefined;
    }, {
        type: string;
        maxWeightKg?: number | undefined;
    }>, "many">;
    injuries: z.ZodArray<z.ZodObject<{
        bodyArea: z.ZodString;
        side: z.ZodOptional<z.ZodEnum<["LEFT", "RIGHT", "BOTH", "N_A"]>>;
        status: z.ZodOptional<z.ZodEnum<["ACUTE", "RECOVERING", "CHRONIC", "RESOLVED"]>>;
        restriction: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        bodyArea: string;
        status?: "ACUTE" | "RECOVERING" | "CHRONIC" | "RESOLVED" | undefined;
        side?: "LEFT" | "RIGHT" | "BOTH" | "N_A" | undefined;
        restriction?: string | undefined;
    }, {
        bodyArea: string;
        status?: "ACUTE" | "RECOVERING" | "CHRONIC" | "RESOLVED" | undefined;
        side?: "LEFT" | "RIGHT" | "BOTH" | "N_A" | undefined;
        restriction?: string | undefined;
    }>, "many">;
    benchmarks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        exerciseSlug: z.ZodString;
        estimated1RM: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        exerciseSlug: string;
        estimated1RM: number;
    }, {
        exerciseSlug: string;
        estimated1RM: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    goal: "LOSE_WEIGHT" | "BUILD_MUSCLE" | "IMPROVE_ENDURANCE" | "STAY_FIT";
    sex: "MALE" | "FEMALE" | "OTHER";
    weightKg: number;
    heightCm: number;
    age: number;
    unitPreference: "METRIC" | "IMPERIAL";
    daysPerWeek: number;
    sessionMinutes: number;
    trainingYears: number;
    fitnessSelfRating: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    parqAcknowledged: boolean;
    medicalDisclaimer: boolean;
    equipment: {
        type: string;
        maxWeightKg?: number | undefined;
    }[];
    injuries: {
        bodyArea: string;
        status?: "ACUTE" | "RECOVERING" | "CHRONIC" | "RESOLVED" | undefined;
        side?: "LEFT" | "RIGHT" | "BOTH" | "N_A" | undefined;
        restriction?: string | undefined;
    }[];
    notes?: string | undefined;
    benchmarks?: {
        exerciseSlug: string;
        estimated1RM: number;
    }[] | undefined;
}, {
    goal: "LOSE_WEIGHT" | "BUILD_MUSCLE" | "IMPROVE_ENDURANCE" | "STAY_FIT";
    sex: "MALE" | "FEMALE" | "OTHER";
    weightKg: number;
    heightCm: number;
    age: number;
    unitPreference: "METRIC" | "IMPERIAL";
    daysPerWeek: number;
    sessionMinutes: number;
    trainingYears: number;
    fitnessSelfRating: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    parqAcknowledged: boolean;
    medicalDisclaimer: boolean;
    equipment: {
        type: string;
        maxWeightKg?: number | undefined;
    }[];
    injuries: {
        bodyArea: string;
        status?: "ACUTE" | "RECOVERING" | "CHRONIC" | "RESOLVED" | undefined;
        side?: "LEFT" | "RIGHT" | "BOTH" | "N_A" | undefined;
        restriction?: string | undefined;
    }[];
    notes?: string | undefined;
    benchmarks?: {
        exerciseSlug: string;
        estimated1RM: number;
    }[] | undefined;
}>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
