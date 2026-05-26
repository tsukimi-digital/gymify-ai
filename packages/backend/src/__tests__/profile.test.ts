import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock db module
vi.mock('../db.js', () => ({
  prisma: {
    userProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    equipmentAvailability: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    injury: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    exercise: {
      findMany: vi.fn(),
    },
    strengthBenchmark: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { createApp } from '../app.js';
import { prisma } from '../db.js';
import { issueAccessToken } from '../services/jwt.js';

const app = createApp();

const userId = 'user-profile-123';
const accessToken = issueAccessToken({ userId, isPremium: false, plansGenerated: 0 });

const validProfilePayload = {
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

const mockProfile = {
  id: 'profile-1',
  userId,
  ...validProfilePayload,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEquipment = [
  { id: 'eq-1', userId, type: 'BARBELL', maxWeightKg: null, createdAt: new Date() },
];

const mockInjuries: never[] = [];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PUT /api/profile', () => {
  it('saves profile data and returns 200', async () => {
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
      return fn({
        userProfile: { upsert: vi.fn().mockResolvedValue(mockProfile) },
        equipmentAvailability: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          createMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        injury: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          createMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        exercise: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        strengthBenchmark: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          upsert: vi.fn().mockResolvedValue({}),
        },
      });
    });

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validProfilePayload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('profile');
  });

  it('rejects invalid profile data with 400', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...validProfilePayload, goal: 'INVALID_GOAL' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('replaces equipment (not appending)', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 2 });
    const createMany = vi.fn().mockResolvedValue({ count: 1 });

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
      return fn({
        userProfile: { upsert: vi.fn().mockResolvedValue(mockProfile) },
        equipmentAvailability: { deleteMany, createMany },
        injury: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          createMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        exercise: {
          findMany: vi.fn().mockResolvedValue([]),
        },
        strengthBenchmark: {
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
          upsert: vi.fn().mockResolvedValue({}),
        },
      });
    });

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...validProfilePayload, equipment: [{ type: 'KETTLEBELL' }] });

    expect(res.status).toBe(200);
    // Equipment was deleted and recreated (replace semantics)
    expect(deleteMany).toHaveBeenCalledWith({ where: { userId } });
    expect(createMany).toHaveBeenCalledWith({
      data: [{ userId, type: 'KETTLEBELL', maxWeightKg: undefined }],
    });
  });
});

describe('GET /api/profile', () => {
  it('returns previously saved profile data', async () => {
    vi.mocked(prisma.userProfile.findUnique).mockResolvedValueOnce(mockProfile as any);
    vi.mocked((prisma as any).equipmentAvailability.findMany).mockResolvedValueOnce(mockEquipment);
    vi.mocked((prisma as any).injury.findMany).mockResolvedValueOnce(mockInjuries);
    vi.mocked(prisma.strengthBenchmark.findMany).mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('profile');
    expect(res.body.profile.goal).toBe('BUILD_MUSCLE');
  });

  it('returns 404 when profile not found', async () => {
    vi.mocked(prisma.userProfile.findUnique).mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});
