import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock db module
vi.mock('../db.js', () => ({
  prisma: {
    workoutSession: {
      findMany: vi.fn(),
    },
    setLog: {
      findMany: vi.fn(),
    },
  },
}));

import { createApp } from '../app.js';
import { prisma } from '../db.js';
import { issueAccessToken } from '../services/jwt.js';

const app = createApp();

const userId = 'user-stats-123';
const accessToken = issueAccessToken({ userId, isPremium: false, plansGenerated: 0 });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/stats/progress', () => {
  it('returns streak=0 when no completed sessions', async () => {
    vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.setLog.findMany).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/stats/progress')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.streak).toBe(0);
    expect(res.body).toHaveProperty('e1rm');
    expect(res.body).toHaveProperty('weeklyVolume');
  });

  it('returns streak=3 for 3 consecutive completed sessions ending today', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([
      { id: 's1', userId, scheduledDate: today, status: 'COMPLETED' },
      { id: 's2', userId, scheduledDate: yesterday, status: 'COMPLETED' },
      { id: 's3', userId, scheduledDate: twoDaysAgo, status: 'COMPLETED' },
    ] as any);
    vi.mocked(prisma.setLog.findMany).mockResolvedValue([]);

    const res = await request(app)
      .get('/api/stats/progress')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.streak).toBe(3);
  });

  it('calculates e1RM correctly using Epley formula', async () => {
    vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([
      { id: 's1', userId, scheduledDate: new Date(), status: 'COMPLETED' },
    ] as any);

    // 100kg x 5 reps → e1RM = 100 * (1 + 5/30) = 100 * 1.1667 ≈ 116.67
    vi.mocked(prisma.setLog.findMany).mockResolvedValue([
      {
        id: 'sl1',
        sessionExerciseId: 'se1',
        setIndex: 1,
        setType: 'WORKING',
        reps: 5,
        weightKg: 100,
        rpe: null,
        sessionExercise: {
          session: {
            scheduledDate: new Date(),
          },
          exercise: {
            slug: 'barbell-bench-press',
            muscleGroup: 'CHEST',
          },
        },
      },
    ] as any);

    const res = await request(app)
      .get('/api/stats/progress')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const benchPressTrend = res.body.e1rm['barbell-bench-press'];
    expect(benchPressTrend).toBeDefined();
    expect(benchPressTrend.length).toBeGreaterThan(0);
    // e1RM ≈ 116.67
    expect(benchPressTrend[0].value).toBeCloseTo(116.67, 1);
  });
});
