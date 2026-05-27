"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeSessionSchema = exports.appendSetSchema = exports.startSessionSchema = void 0;
const zod_1 = require("zod");
exports.startSessionSchema = zod_1.z.object({
    planDayId: zod_1.z.string().uuid(),
    scheduledDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
exports.appendSetSchema = zod_1.z.object({
    clientSetId: zod_1.z.string(),
    exerciseId: zod_1.z.string().uuid(),
    setIndex: zod_1.z.number().int().min(1),
    setType: zod_1.z.enum(['WARMUP', 'WORKING', 'DROP', 'AMRAP', 'BACKOFF']).default('WORKING'),
    reps: zod_1.z.number().int().min(0).max(200).optional(),
    weightKg: zod_1.z.number().min(0).max(600).optional(),
    rpe: zod_1.z.number().min(1).max(10).optional(),
    restSeconds: zod_1.z.number().int().min(0).max(7200).optional(),
    durationSec: zod_1.z.number().int().min(0).optional(),
    distanceM: zod_1.z.number().int().min(0).optional(),
});
exports.completeSessionSchema = zod_1.z.object({
    overallRpe: zod_1.z.number().int().min(1).max(10).optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
