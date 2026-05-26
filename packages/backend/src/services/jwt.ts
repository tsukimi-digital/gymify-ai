import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../env.js';
import { prisma } from '../db.js';
import type { JwtPayload } from '@gymify/shared';

export function issueAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export async function issueRefreshToken(userId: string, userAgent?: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.authToken.create({ data: { userId, tokenHash, expiresAt, userAgent } });
  return token;
}

export async function rotateRefreshToken(oldToken: string, userAgent?: string): Promise<{ refreshToken: string; userId: string }> {
  const oldHash = crypto.createHash('sha256').update(oldToken).digest('hex');
  const authToken = await prisma.authToken.findFirst({ where: { tokenHash: oldHash, revokedAt: null } });
  if (!authToken || authToken.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }
  await prisma.authToken.update({ where: { id: authToken.id }, data: { revokedAt: new Date() } });
  const newToken = await issueRefreshToken(authToken.userId, userAgent);
  return { refreshToken: newToken, userId: authToken.userId };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await prisma.authToken.updateMany({ where: { tokenHash }, data: { revokedAt: new Date() } });
}
