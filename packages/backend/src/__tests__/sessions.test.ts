import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock db module
vi.mock('../db.js', () => ({
  prisma: {
    workoutPlanDay: {
      findUnique: vi.fn(),
    },
    workoutSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    sessionExercise: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    setLog: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
    exercise: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { createApp } from '../app.js';
import { prisma } from '../db.js';
import { issueAccessToken } from '../services/jwt.js';

const app = createApp();

const userId = 'user-session-123';
const accessToken = issueAccessToken({ userId, isPremium: false, plansGenerated: 0 });

const planDayId = '550e8400-e29b-41d4-a716-446655440001';
const exerciseId = '550e8400-e29b-41d4-a716-446655440002';
const sessionId = 'session-1';

const mockPlanDay = {
  id: planDayId,
  planId: 'plan-1',
  weekIndex: 1,
  dayIndex: 1,
  focus: 'Upper Push',
  plannedJson: {
    dayIndex: 1,
    focus: 'Upper Push',
    exercises: [
      {
        exerciseSlug: 'barbell-bench-press',
        sets: 4,
        repsTarget: '6-8',
        rpeTarget: 8,
        restSeconds: 180,
      },
    ],
  },
  createdAt: new Date(),
};

const mockExercise = {
  id: exerciseId,
  slug: 'barbell-bench-press',
  name: 'Barbell Bench Press',
  muscleGroup: 'CHEST',
  equipmentType: 'BARBELL',
  movementPattern: 'PUSH_H',
  isCompound: true,
  difficulty: 'BEGINNER',
  instructions: '...',
  isCardio: false,
  videoUrl: null,
  imageUrl: null,
  createdAt: new Date(),
};

const mockSession = {
  id: sessionId,
  userId,
  planId: 'plan-1',
  planDayId,
  scheduledDate: new Date('2026-05-01'),
  status: 'IN_PROGRESS',
  startedAt: new Date(),
  completedAt: null,
  overallRpe: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  exercises: [
    {
      id: 'se-1',
      sessionId,
      exerciseId,
      plannedExerciseId: null,
      orderIndex: 0,
      notes: null,
      createdAt: new Date(),
      setLogs: [],
    },
  ],
};

const mockSetLog = {
  id: 'setlog-1',
  sessionExerciseId: 'se-1',
  clientSetId: 'client-set-1',
  setIndex: 1,
  setType: 'WORKING',
  reps: 8,
  weightKg: 80,
  rpe: null,
  restSeconds: null,
  durationSec: null,
  distanceM: null,
  avgHeartRate: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/sessions', () => {
  it('creates session with exercises from plan day', async () => {
    vi.mocked(prisma.workoutPlanDay.findUnique).mockResolvedValueOnce(mockPlanDay as any);
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
      return fn({
        workoutSession: { create: vi.fn().mockResolvedValue(mockSession) },
        exercise: { findFirst: vi.fn().mockResolvedValue(mockExercise) },
        sessionExercise: { create: vi.fn().mockResolvedValue(mockSession.exercises[0]) },
      });
    });
    // After transaction, route fetches the full session
    vi.mocked(prisma.workoutSession.findUnique).mockResolvedValueOnce(mockSession as any);

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ planDayId, scheduledDate: '2026-05-01' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('session');
  });
});

describe('POST /api/sessions/:id/sets', () => {
  it('appends a SetLog to a session', async () => {
    vi.mocked(prisma.sessionExercise.findUnique).mockResolvedValueOnce({
      id: 'se-1',
      sessionId,
      exerciseId,
      userId: undefined,
    } as any);
    vi.mocked(prisma.workoutSession.findUnique).mockResolvedValueOnce({ id: sessionId, userId } as any);
    vi.mocked(prisma.setLog.upsert).mockResolvedValueOnce(mockSetLog as any);

    const res = await request(app)
      .post(`/api/sessions/${sessionId}/sets`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientSetId: 'client-set-1',
        exerciseId,
        setIndex: 1,
        reps: 8,
        weightKg: 80,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('setLog');
  });

  it('is idempotent — same clientSetId returns existing set', async () => {
    vi.mocked(prisma.sessionExercise.findUnique).mockResolvedValueOnce({
      id: 'se-1',
      sessionId,
      exerciseId,
    } as any);
    vi.mocked(prisma.workoutSession.findUnique).mockResolvedValueOnce({ id: sessionId, userId } as any);
    vi.mocked(prisma.setLog.upsert).mockResolvedValueOnce(mockSetLog as any);

    const res = await request(app)
      .post(`/api/sessions/${sessionId}/sets`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        clientSetId: 'client-set-1', // same clientSetId
        exerciseId,
        setIndex: 1,
        reps: 8,
        weightKg: 80,
      });

    expect(res.status).toBe(200);
    // upsert ensures idempotency
    expect(prisma.setLog.upsert).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/sessions/:id/complete', () => {
  it('marks session as COMPLETED', async () => {
    vi.mocked(prisma.workoutSession.findUnique).mockResolvedValueOnce({ id: sessionId, userId } as any);
    vi.mocked(prisma.workoutSession.update).mockResolvedValueOnce({
      ...mockSession,
      status: 'COMPLETED',
      completedAt: new Date(),
    } as any);

    const res = await request(app)
      .post(`/api/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ overallRpe: 8, notes: 'Great session' });

    expect(res.status).toBe(200);
    expect(res.body.session.status).toBe('COMPLETED');
  });
});
