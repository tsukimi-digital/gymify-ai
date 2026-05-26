import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock db module
vi.mock('../db.js', () => ({
  prisma: {
    user: {
      findUniqueOrThrow: vi.fn(),
    },
    planGenerationJob: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    workoutPlan: {
      findFirst: vi.fn(),
    },
  },
}));

import { createApp } from '../app.js';
import { prisma } from '../db.js';
import { issueAccessToken } from '../services/jwt.js';

const app = createApp();

const userId = 'user-plans-123';
const freeToken = issueAccessToken({ userId, isPremium: false, plansGenerated: 0 });
const premiumToken = issueAccessToken({ userId, isPremium: true, plansGenerated: 2 });
const overQuotaToken = issueAccessToken({ userId, isPremium: false, plansGenerated: 2 });

const mockJob = {
  id: 'job-1',
  userId,
  status: 'QUEUED',
  reason: null,
  previousPlanId: null,
  progress: 0,
  phase: null,
  errorCode: null,
  errorMessage: null,
  inputTokens: null,
  outputTokens: null,
  costUsd: null,
  startedAt: null,
  finishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/plans/generate', () => {
  it('creates job for free user with 0 plans generated', async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValueOnce({
      id: userId,
      isPremium: false,
      plansGenerated: 0,
    } as any);
    vi.mocked(prisma.planGenerationJob.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.planGenerationJob.create).mockResolvedValueOnce(mockJob as any);

    const res = await request(app)
      .post('/api/plans/generate')
      .set('Authorization', `Bearer ${freeToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jobId', 'job-1');
  });

  it('returns 402 for free user with 2 plans already generated', async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValueOnce({
      id: userId,
      isPremium: false,
      plansGenerated: 2,
    } as any);

    const res = await request(app)
      .post('/api/plans/generate')
      .set('Authorization', `Bearer ${overQuotaToken}`)
      .send({});

    expect(res.status).toBe(402);
    expect(res.body.error.code).toBe('QUOTA_EXCEEDED');
  });

  it('allows premium user with 2 plans generated', async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValueOnce({
      id: userId,
      isPremium: true,
      plansGenerated: 2,
    } as any);
    vi.mocked(prisma.planGenerationJob.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.planGenerationJob.create).mockResolvedValueOnce({ ...mockJob, id: 'job-premium' } as any);

    const res = await request(app)
      .post('/api/plans/generate')
      .set('Authorization', `Bearer ${premiumToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jobId', 'job-premium');
  });
});

describe('GET /api/plans/jobs/:id', () => {
  it('returns job data', async () => {
    vi.mocked(prisma.planGenerationJob.findUnique).mockResolvedValueOnce(mockJob as any);

    const res = await request(app)
      .get('/api/plans/jobs/job-1')
      .set('Authorization', `Bearer ${freeToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('job');
    expect(res.body.job.id).toBe('job-1');
  });

  it('returns 404 for unknown job', async () => {
    vi.mocked(prisma.planGenerationJob.findUnique).mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/plans/jobs/nonexistent')
      .set('Authorization', `Bearer ${freeToken}`);

    expect(res.status).toBe(404);
  });
});
