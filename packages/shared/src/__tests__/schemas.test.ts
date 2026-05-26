import { describe, it, expect } from 'vitest';
import {
  identifyRequestSchema,
  profileUpdateSchema,
  planGenerateSchema,
  startSessionSchema,
  appendSetSchema,
  completeSessionSchema,
  paymentSubmitSchema,
} from '../index.js';

describe('identifyRequestSchema', () => {
  it('accepts valid request', () => {
    const result = identifyRequestSchema.safeParse({
      email: 'user@example.com',
      fingerprintToken: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = identifyRequestSchema.safeParse({
      email: 'not-an-email',
      fingerprintToken: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-uuid fingerprintToken', () => {
    const result = identifyRequestSchema.safeParse({
      email: 'user@example.com',
      fingerprintToken: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional extraMeta', () => {
    const result = identifyRequestSchema.safeParse({
      email: 'user@example.com',
      fingerprintToken: '550e8400-e29b-41d4-a716-446655440000',
      extraMeta: { browser: 'chrome', os: 'macos' },
    });
    expect(result.success).toBe(true);
  });
});

describe('profileUpdateSchema', () => {
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

  it('accepts valid profile', () => {
    const result = profileUpdateSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('rejects invalid goal', () => {
    const result = profileUpdateSchema.safeParse({ ...validProfile, goal: 'INVALID_GOAL' });
    expect(result.success).toBe(false);
  });

  it('rejects age below minimum', () => {
    const result = profileUpdateSchema.safeParse({ ...validProfile, age: 5 });
    expect(result.success).toBe(false);
  });

  it('rejects weightKg above maximum', () => {
    const result = profileUpdateSchema.safeParse({ ...validProfile, weightKg: 600 });
    expect(result.success).toBe(false);
  });

  it('rejects notes longer than 500 chars', () => {
    const result = profileUpdateSchema.safeParse({ ...validProfile, notes: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('accepts benchmarks', () => {
    const result = profileUpdateSchema.safeParse({
      ...validProfile,
      benchmarks: [{ exerciseSlug: 'barbell-bench-press', estimated1RM: 100 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects daysPerWeek above 7', () => {
    const result = profileUpdateSchema.safeParse({ ...validProfile, daysPerWeek: 8 });
    expect(result.success).toBe(false);
  });

  it('rejects sessionMinutes below minimum', () => {
    const result = profileUpdateSchema.safeParse({ ...validProfile, sessionMinutes: 10 });
    expect(result.success).toBe(false);
  });
});

describe('planGenerateSchema', () => {
  it('accepts empty object', () => {
    const result = planGenerateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts optional reason', () => {
    const result = planGenerateSchema.safeParse({ reason: 'new mesocycle' });
    expect(result.success).toBe(true);
  });

  it('rejects reason longer than 300 chars', () => {
    const result = planGenerateSchema.safeParse({ reason: 'a'.repeat(301) });
    expect(result.success).toBe(false);
  });
});

describe('startSessionSchema', () => {
  it('accepts valid session start', () => {
    const result = startSessionSchema.safeParse({
      planDayId: '550e8400-e29b-41d4-a716-446655440000',
      scheduledDate: '2026-05-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid uuid planDayId', () => {
    const result = startSessionSchema.safeParse({
      planDayId: 'not-a-uuid',
      scheduledDate: '2026-05-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = startSessionSchema.safeParse({
      planDayId: '550e8400-e29b-41d4-a716-446655440000',
      scheduledDate: '01-05-2026',
    });
    expect(result.success).toBe(false);
  });
});

describe('appendSetSchema', () => {
  const validSet = {
    clientSetId: 'client-set-1',
    exerciseId: '550e8400-e29b-41d4-a716-446655440000',
    setIndex: 1,
    reps: 8,
    weightKg: 80,
  };

  it('accepts valid set', () => {
    const result = appendSetSchema.safeParse(validSet);
    expect(result.success).toBe(true);
  });

  it('defaults setType to WORKING', () => {
    const result = appendSetSchema.safeParse(validSet);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.setType).toBe('WORKING');
    }
  });

  it('rejects setIndex of 0', () => {
    const result = appendSetSchema.safeParse({ ...validSet, setIndex: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects weightKg above 600', () => {
    const result = appendSetSchema.safeParse({ ...validSet, weightKg: 601 });
    expect(result.success).toBe(false);
  });

  it('rejects rpe above 10', () => {
    const result = appendSetSchema.safeParse({ ...validSet, rpe: 11 });
    expect(result.success).toBe(false);
  });
});

describe('completeSessionSchema', () => {
  it('accepts empty object', () => {
    const result = completeSessionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts overallRpe and notes', () => {
    const result = completeSessionSchema.safeParse({ overallRpe: 8, notes: 'great session' });
    expect(result.success).toBe(true);
  });

  it('rejects overallRpe below 1', () => {
    const result = completeSessionSchema.safeParse({ overallRpe: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects notes longer than 1000 chars', () => {
    const result = completeSessionSchema.safeParse({ notes: 'a'.repeat(1001) });
    expect(result.success).toBe(false);
  });
});

describe('paymentSubmitSchema', () => {
  it('accepts valid payment data', () => {
    const result = paymentSubmitSchema.safeParse({
      cardNumber: '4111111111111111',
      expiry: '12/28',
      cardHolder: 'John Doe',
      cvv: '123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects card number with wrong length', () => {
    const result = paymentSubmitSchema.safeParse({
      cardNumber: '41111111111111',
      expiry: '12/28',
      cardHolder: 'John Doe',
      cvv: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid expiry format', () => {
    const result = paymentSubmitSchema.safeParse({
      cardNumber: '4111111111111111',
      expiry: '13/28',
      cardHolder: 'John Doe',
      cvv: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects CVV with wrong format', () => {
    const result = paymentSubmitSchema.safeParse({
      cardNumber: '4111111111111111',
      expiry: '12/28',
      cardHolder: 'John Doe',
      cvv: '12',
    });
    expect(result.success).toBe(false);
  });

  it('accepts 4-digit CVV', () => {
    const result = paymentSubmitSchema.safeParse({
      cardNumber: '4111111111111111',
      expiry: '12/28',
      cardHolder: 'John Doe',
      cvv: '1234',
    });
    expect(result.success).toBe(true);
  });
});
