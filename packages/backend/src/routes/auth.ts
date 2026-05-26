import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { identifyRequestSchema } from '@gymify/shared';
import { resolveOrCreateUser } from '../services/identity.js';
import { issueAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../services/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const identifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts' } },
});

router.post('/identify', identifyLimiter, asyncHandler(async (req: Request, res: Response) => {
  const body = identifyRequestSchema.parse(req.body);
  const user = await resolveOrCreateUser({
    email: body.email,
    fingerprintToken: body.fingerprintToken,
    ipAddress: req.ip ?? 'unknown',
    userAgent: req.headers['user-agent'] ?? 'unknown',
    extraMeta: body.extraMeta,
  });

  const csrfToken = crypto.randomBytes(32).toString('hex');
  const accessToken = issueAccessToken({ userId: user.id, isPremium: user.isPremium, plansGenerated: user.plansGenerated });
  const refreshToken = await issueRefreshToken(user.id, req.headers['user-agent']);

  res.cookie('gymify_refresh', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('gymify_csrf', csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({
    userId: user.id,
    isPremium: user.isPremium,
    plansGenerated: user.plansGenerated,
    accessToken,
    csrfToken,
  });
}));

router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const oldToken = req.cookies?.gymify_refresh;
  if (!oldToken) throw new AppError('UNAUTHORIZED', 'No refresh token', 401);

  const { userId, refreshToken: newRefresh } = await rotateRefreshToken(oldToken, req.headers['user-agent']);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const accessToken = issueAccessToken({ userId: user.id, isPremium: user.isPremium, plansGenerated: user.plansGenerated });

  res.cookie('gymify_refresh', newRefresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('gymify_csrf', csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ accessToken, csrfToken });
}));

router.post('/logout', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.gymify_refresh;
  if (token) await revokeRefreshToken(token);
  res.clearCookie('gymify_refresh');
  res.clearCookie('gymify_csrf');
  res.json({ ok: true });
}));

export default router;
