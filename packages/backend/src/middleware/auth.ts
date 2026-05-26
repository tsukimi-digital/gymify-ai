import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt.js';
import { AppError } from './errorHandler.js';
import type { JwtPayload } from '@gymify/shared';

declare global {
  namespace Express {
    interface Request { user?: JwtPayload }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('UNAUTHORIZED', 'Missing token', 401);
  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
  }
}
