import { describe, it, expect } from 'vitest';
import { validatePlanOutput, planOutputSchema } from '../services/planValidator.js';

const validPlan = {
  mesocycle: {
    weeks: 4,
    deloadWeekIndex: 4,
    schedule: [
      {
        weekIndex: 1,
        days: [
          {
            dayIndex: 1,
            focus: 'Upper Push',
            exercises: [
              {
                exerciseSlug: 'barbell-bench-press',
                sets: 4,
                repsTarget: '6-8',
                rpeTarget: 8,
                restSeconds: 180,
                progression: '+2.5kg per week',
                notes: 'Focus on chest activation',
              },
              {
                exerciseSlug: 'barbell-overhead-press',
                sets: 3,
                repsTarget: '8-10',
                rpeTarget: 8,
                restSeconds: 120,
              },
            ],
          },
        ],
      },
    ],
  },
  generalNotes: 'Progressive overload weekly',
};

const validExerciseSlugs = new Set([
  'barbell-bench-press',
  'barbell-overhead-press',
  'barbell-back-squat',
  'barbell-deadlift',
]);

describe('planOutputSchema', () => {
  it('accepts a valid plan output', () => {
    const result = planOutputSchema.safeParse(validPlan);
    expect(result.success).toBe(true);
  });

  it('rejects weeks > 6', () => {
    const invalid = { ...validPlan, mesocycle: { ...validPlan.mesocycle, weeks: 7 } };
    const result = planOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects weeks < 3', () => {
    const invalid = { ...validPlan, mesocycle: { ...validPlan.mesocycle, weeks: 2 } };
    const result = planOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects sets > 10', () => {
    const invalid = {
      ...validPlan,
      mesocycle: {
        ...validPlan.mesocycle,
        schedule: [
          {
            weekIndex: 1,
            days: [
              {
                dayIndex: 1,
                focus: 'Push',
                exercises: [
                  {
                    exerciseSlug: 'barbell-bench-press',
                    sets: 11,
                    repsTarget: '8-10',
                    rpeTarget: 8,
                    restSeconds: 120,
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    const result = planOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects rpeTarget < 5', () => {
    const invalid = {
      ...validPlan,
      mesocycle: {
        ...validPlan.mesocycle,
        schedule: [
          {
            weekIndex: 1,
            days: [
              {
                dayIndex: 1,
                focus: 'Push',
                exercises: [
                  {
                    exerciseSlug: 'barbell-bench-press',
                    sets: 4,
                    repsTarget: '8-10',
                    rpeTarget: 4,
                    restSeconds: 120,
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    const result = planOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('validatePlanOutput', () => {
  it('passes for a valid plan with known exercise slugs', () => {
    expect(() => validatePlanOutput(validPlan, validExerciseSlugs)).not.toThrow();
  });

  it('throws when exerciseSlug is missing from catalog', () => {
    const planWithUnknownExercise = {
      ...validPlan,
      mesocycle: {
        ...validPlan.mesocycle,
        schedule: [
          {
            weekIndex: 1,
            days: [
              {
                dayIndex: 1,
                focus: 'Push',
                exercises: [
                  {
                    exerciseSlug: 'unknown-exercise-xyz',
                    sets: 3,
                    repsTarget: '8-10',
                    rpeTarget: 8,
                    restSeconds: 120,
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    expect(() => validatePlanOutput(planWithUnknownExercise, validExerciseSlugs)).toThrow(/unknown-exercise-xyz/);
  });

  it('throws for structurally invalid plan (weeks > 6)', () => {
    const invalidPlan = { ...validPlan, mesocycle: { ...validPlan.mesocycle, weeks: 8 } };
    expect(() => validatePlanOutput(invalidPlan, validExerciseSlugs)).toThrow();
  });
});
