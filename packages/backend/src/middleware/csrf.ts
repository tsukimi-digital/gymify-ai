import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

export function csrfProtect(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const tokenFromCookie = req.cookies?.['gymify_csrf'];
  const tokenFromHeader = req.headers['x-csrf-token'];
  if (!tokenFromCookie || tokenFromCookie !== tokenFromHeader) {
    throw new AppError('CSRF_INVALID', 'Invalid CSRF token', 403);
  }
  next();
}
