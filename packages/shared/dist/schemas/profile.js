"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileUpdateSchema = void 0;
const zod_1 = require("zod");
exports.profileUpdateSchema = zod_1.z.object({
    goal: zod_1.z.enum(['LOSE_WEIGHT', 'BUILD_MUSCLE', 'IMPROVE_ENDURANCE', 'STAY_FIT']),
    sex: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']),
    weightKg: zod_1.z.number().min(20).max(500),
    heightCm: zod_1.z.number().min(50).max(300),
    age: zod_1.z.number().int().min(10).max(120),
    unitPreference: zod_1.z.enum(['METRIC', 'IMPERIAL']),
    daysPerWeek: zod_1.z.number().int().min(1).max(7),
    sessionMinutes: zod_1.z.number().int().min(15).max(180),
    trainingYears: zod_1.z.number().min(0).max(50),
    fitnessSelfRating: zod_1.z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    parqAcknowledged: zod_1.z.boolean(),
    medicalDisclaimer: zod_1.z.boolean(),
    notes: zod_1.z.string().max(500).optional(),
    equipment: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        maxWeightKg: zod_1.z.number().optional(),
    })),
    injuries: zod_1.z.array(zod_1.z.object({
        bodyArea: zod_1.z.string(),
        side: zod_1.z.enum(['LEFT', 'RIGHT', 'BOTH', 'N_A']).optional(),
        status: zod_1.z.enum(['ACUTE', 'RECOVERING', 'CHRONIC', 'RESOLVED']).optional(),
        restriction: zod_1.z.string().max(300).optional(),
    })),
    benchmarks: zod_1.z.array(zod_1.z.object({
        exerciseSlug: zod_1.z.string(),
        estimated1RM: zod_1.z.number().positive(),
    })).optional(),
});
