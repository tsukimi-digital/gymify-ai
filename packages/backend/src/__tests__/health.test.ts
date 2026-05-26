import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock db module
vi.mock('../db.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { createApp } from '../app.js';
import { prisma } from '../db.js';
import { errorHandler, AppError } from '../middleware/errorHandler.js';

const app = createApp();

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with db=up when database is accessible', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ '?column?': 1 }]);

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.db).toBe('up');
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns 200 with db=down when database is not accessible', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.db).toBe('down');
  });
});

describe('Error envelope', () => {
  it('errorHandler formats AppError correctly', () => {
    const err = new AppError('TEST_CODE', 'test message', 422);
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'TEST_CODE', message: 'test message', details: undefined },
    });
  });

  it('errorHandler formats unknown errors as INTERNAL_ERROR', () => {
    const err = new Error('random error');
    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });
});
