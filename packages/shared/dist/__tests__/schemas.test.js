"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_js_1 = require("../index.js");
(0, vitest_1.describe)('identifyRequestSchema', () => {
    (0, vitest_1.it)('accepts valid request', () => {
        const result = index_js_1.identifyRequestSchema.safeParse({
            email: 'user@example.com',
            fingerprintToken: '550e8400-e29b-41d4-a716-446655440000',
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rejects invalid email', () => {
        const result = index_js_1.identifyRequestSchema.safeParse({
            email: 'not-an-email',
            fingerprintToken: '550e8400-e29b-41d4-a716-446655440000',
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects non-uuid fingerprintToken', () => {
        const result = index_js_1.identifyRequestSchema.safeParse({
            email: 'user@example.com',
            fingerprintToken: 'not-a-uuid',
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('accepts optional extraMeta', () => {
        const result = index_js_1.identifyRequestSchema.safeParse({
            email: 'user@example.com',
            fingerprintToken: '550e8400-e29b-41d4-a716-446655440000',
            extraMeta: { browser: 'chrome', os: 'macos' },
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
});
(0, vitest_1.describe)('profileUpdateSchema', () => {
    const validProfile = {
        goal: 'BUILD_MUSCLE',
        sex: 'MALE',
        weightKg: 80,
        heightCm: 175,
        age: 25,
        unitPreference: 'METRIC',
        daysPerWeek: 4,
        sessionMinutes: 60,
        trainingYears: 2,
        fitnessSelfRating: 'INTERMEDIATE',
        parqAcknowledged: true,
        medicalDisclaimer: true,
        equipment: [{ type: 'BARBELL' }, { type: 'BENCH_FLAT' }],
        injuries: [],
    };
    (0, vitest_1.it)('accepts valid profile', () => {
        const result = index_js_1.profileUpdateSchema.safeParse(validProfile);
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rejects invalid goal', () => {
        const result = index_js_1.profileUpdateSchema.safeParse({ ...validProfile, goal: 'INVALID_GOAL' });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects age below minimum', () => {
        const result = index_js_1.profileUpdateSchema.safeParse({ ...validProfile, age: 5 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects weightKg above maximum', () => {
        const result = index_js_1.profileUpdateSchema.safeParse({ ...validProfile, weightKg: 600 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects notes longer than 500 chars', () => {
        const result = index_js_1.profileUpdateSchema.safeParse({ ...validProfile, notes: 'a'.repeat(501) });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('accepts benchmarks', () => {
        const result = index_js_1.profileUpdateSchema.safeParse({
            ...validProfile,
            benchmarks: [{ exerciseSlug: 'barbell-bench-press', estimated1RM: 100 }],
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rejects daysPerWeek above 7', () => {
        const result = index_js_1.profileUpdateSchema.safeParse({ ...validProfile, daysPerWeek: 8 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects sessionMinutes below minimum', () => {
        const result = index_js_1.profileUpdateSchema.safeParse({ ...validProfile, sessionMinutes: 10 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
});
(0, vitest_1.describe)('planGenerateSchema', () => {
    (0, vitest_1.it)('accepts empty object', () => {
        const result = index_js_1.planGenerateSchema.safeParse({});
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('accepts optional reason', () => {
        const result = index_js_1.planGenerateSchema.safeParse({ reason: 'new mesocycle' });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rejects reason longer than 300 chars', () => {
        const result = index_js_1.planGenerateSchema.safeParse({ reason: 'a'.repeat(301) });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
});
(0, vitest_1.describe)('startSessionSchema', () => {
    (0, vitest_1.it)('accepts valid session start', () => {
        const result = index_js_1.startSessionSchema.safeParse({
            planDayId: '550e8400-e29b-41d4-a716-446655440000',
            scheduledDate: '2026-05-01',
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rejects invalid uuid planDayId', () => {
        const result = index_js_1.startSessionSchema.safeParse({
            planDayId: 'not-a-uuid',
            scheduledDate: '2026-05-01',
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects invalid date format', () => {
        const result = index_js_1.startSessionSchema.safeParse({
            planDayId: '550e8400-e29b-41d4-a716-446655440000',
            scheduledDate: '01-05-2026',
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
});
(0, vitest_1.describe)('appendSetSchema', () => {
    const validSet = {
        clientSetId: 'client-set-1',
        exerciseId: '550e8400-e29b-41d4-a716-446655440000',
        setIndex: 1,
        reps: 8,
        weightKg: 80,
    };
    (0, vitest_1.it)('accepts valid set', () => {
        const result = index_js_1.appendSetSchema.safeParse(validSet);
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('defaults setType to WORKING', () => {
        const result = index_js_1.appendSetSchema.safeParse(validSet);
        (0, vitest_1.expect)(result.success).toBe(true);
        if (result.success) {
            (0, vitest_1.expect)(result.data.setType).toBe('WORKING');
        }
    });
    (0, vitest_1.it)('rejects setIndex of 0', () => {
        const result = index_js_1.appendSetSchema.safeParse({ ...validSet, setIndex: 0 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects weightKg above 600', () => {
        const result = index_js_1.appendSetSchema.safeParse({ ...validSet, weightKg: 601 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects rpe above 10', () => {
        const result = index_js_1.appendSetSchema.safeParse({ ...validSet, rpe: 11 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
});
(0, vitest_1.describe)('completeSessionSchema', () => {
    (0, vitest_1.it)('accepts empty object', () => {
        const result = index_js_1.completeSessionSchema.safeParse({});
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('accepts overallRpe and notes', () => {
        const result = index_js_1.completeSessionSchema.safeParse({ overallRpe: 8, notes: 'great session' });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rejects overallRpe below 1', () => {
        const result = index_js_1.completeSessionSchema.safeParse({ overallRpe: 0 });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects notes longer than 1000 chars', () => {
        const result = index_js_1.completeSessionSchema.safeParse({ notes: 'a'.repeat(1001) });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
});
(0, vitest_1.describe)('paymentSubmitSchema', () => {
    (0, vitest_1.it)('accepts valid payment data', () => {
        const result = index_js_1.paymentSubmitSchema.safeParse({
            cardNumber: '4111111111111111',
            expiry: '12/28',
            cardHolder: 'John Doe',
            cvv: '123',
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
    (0, vitest_1.it)('rejects card number with wrong length', () => {
        const result = index_js_1.paymentSubmitSchema.safeParse({
            cardNumber: '41111111111111',
            expiry: '12/28',
            cardHolder: 'John Doe',
            cvv: '123',
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects invalid expiry format', () => {
        const result = index_js_1.paymentSubmitSchema.safeParse({
            cardNumber: '4111111111111111',
            expiry: '13/28',
            cardHolder: 'John Doe',
            cvv: '123',
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('rejects CVV with wrong format', () => {
        const result = index_js_1.paymentSubmitSchema.safeParse({
            cardNumber: '4111111111111111',
            expiry: '12/28',
            cardHolder: 'John Doe',
            cvv: '12',
        });
        (0, vitest_1.expect)(result.success).toBe(false);
    });
    (0, vitest_1.it)('accepts 4-digit CVV', () => {
        const result = index_js_1.paymentSubmitSchema.safeParse({
            cardNumber: '4111111111111111',
            expiry: '12/28',
            cardHolder: 'John Doe',
            cvv: '1234',
        });
        (0, vitest_1.expect)(result.success).toBe(true);
    });
});
