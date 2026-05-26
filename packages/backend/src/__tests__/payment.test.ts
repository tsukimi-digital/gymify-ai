import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock db module
vi.mock('../db.js', () => ({
  prisma: {
    paymentRecord: {
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
  },
}));

import { createApp } from '../app.js';
import { prisma } from '../db.js';
import { issueAccessToken } from '../services/jwt.js';

const app = createApp();

const userId = 'user-payment-123';
const accessToken = issueAccessToken({ userId, isPremium: false, plansGenerated: 0 });

const validPayment = {
  cardNumber: '4111111111111111', // valid Luhn
  expiry: '12/28',
  cardHolder: 'John Doe',
  cvv: '123',
};

const mockUpdatedUser = {
  id: userId,
  email: 'test@example.com',
  isPremium: true,
  plansGenerated: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/payment/submit', () => {
  it('accepts valid card (4111111111111111) and sets isPremium=true', async () => {
    vi.mocked(prisma.paymentRecord.create).mockResolvedValueOnce({} as any);
    vi.mocked(prisma.user.update).mockResolvedValueOnce(mockUpdatedUser as any);

    const res = await request(app)
      .post('/api/payment/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(validPayment);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('accessToken');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { isPremium: true },
    });
  });

  it('rejects invalid Luhn card number with 400', async () => {
    const res = await request(app)
      .post('/api/payment/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...validPayment, cardNumber: '1234567890123456' }); // fails Luhn

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CARD');
  });

  it('rejects expired card with 400', async () => {
    const res = await request(app)
      .post('/api/payment/submit')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...validPayment, expiry: '01/20' }); // expired

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CARD_EXPIRED');
  });
});
