import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';

// Mock db module
vi.mock('../db.js', () => ({
  prisma: {
    deviceFingerprint: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    authToken: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { createApp } from '../app.js';
import { prisma } from '../db.js';

const app = createApp();

const validFingerprint1 = '550e8400-e29b-41d4-a716-446655440001';
const validFingerprint2 = '550e8400-e29b-41d4-a716-446655440002';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  isPremium: false,
  plansGenerated: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/identify', () => {
  it('creates a new user and returns accessToken', async () => {
    vi.mocked(prisma.deviceFingerprint.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => {
      return fn({
        user: { create: vi.fn().mockResolvedValue(mockUser) },
        deviceFingerprint: { create: vi.fn().mockResolvedValue({}) },
      });
    });
    vi.mocked(prisma.authToken.create).mockResolvedValueOnce({} as any);

    const res = await request(app)
      .post('/api/auth/identify')
      .send({ email: 'test@example.com', fingerprintToken: validFingerprint1 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('userId', mockUser.id);
    expect(res.body).toHaveProperty('isPremium', false);
  });

  it('returns same userId for same fingerprint (existing fingerprint)', async () => {
    vi.mocked(prisma.deviceFingerprint.findUnique).mockResolvedValueOnce({
      id: 'fp-1',
      userId: mockUser.id,
      token: validFingerprint1,
      ipAddress: '127.0.0.1',
      userAgent: 'test',
      extraMeta: null,
      lastSeenAt: new Date(),
      createdAt: new Date(),
      user: mockUser,
    } as any);
    vi.mocked(prisma.deviceFingerprint.update).mockResolvedValueOnce({} as any);
    vi.mocked(prisma.authToken.create).mockResolvedValueOnce({} as any);

    const res = await request(app)
      .post('/api/auth/identify')
      .send({ email: 'test@example.com', fingerprintToken: validFingerprint1 });

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(mockUser.id);
  });

  it('returns same userId for same email but new fingerprint', async () => {
    vi.mocked(prisma.deviceFingerprint.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
    vi.mocked(prisma.deviceFingerprint.create).mockResolvedValueOnce({} as any);
    vi.mocked(prisma.authToken.create).mockResolvedValueOnce({} as any);

    const res = await request(app)
      .post('/api/auth/identify')
      .send({ email: 'test@example.com', fingerprintToken: validFingerprint2 });

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(mockUser.id);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns new accessToken for valid refresh cookie', async () => {
    const fakeToken = crypto.randomBytes(40).toString('hex');
    const fakeTokenHash = crypto.createHash('sha256').update(fakeToken).digest('hex');

    vi.mocked(prisma.authToken.findFirst).mockResolvedValueOnce({
      id: 'token-1',
      userId: mockUser.id,
      tokenHash: fakeTokenHash,
      expiresAt: new Date(Date.now() + 3600000),
      revokedAt: null,
      userAgent: null,
      createdAt: new Date(),
    } as any);
    vi.mocked(prisma.authToken.update).mockResolvedValueOnce({} as any);
    vi.mocked(prisma.authToken.create).mockResolvedValueOnce({} as any);
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValueOnce(mockUser);

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `gymify_refresh=${fakeToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('csrfToken');
  });

  it('returns 401 when no refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears cookies and returns ok', async () => {
    // Need a valid access token to pass requireAuth
    const { issueAccessToken } = await import('../services/jwt.js');
    const accessToken = issueAccessToken({ userId: mockUser.id, isPremium: false, plansGenerated: 0 });
    const fakeRefresh = 'some-refresh-token';

    vi.mocked(prisma.authToken.updateMany).mockResolvedValueOnce({ count: 1 });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', `gymify_refresh=${fakeRefresh}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    // Check cookies are cleared
    const setCookies = res.headers['set-cookie'] as string[];
    expect(setCookies).toBeDefined();
    const hasClearedRefresh = setCookies.some((c: string) => c.includes('gymify_refresh=;'));
    const hasClearedCsrf = setCookies.some((c: string) => c.includes('gymify_csrf=;'));
    expect(hasClearedRefresh).toBe(true);
    expect(hasClearedCsrf).toBe(true);
  });
});
