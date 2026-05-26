import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: ['email', 'req.body.cardNumber', 'req.body.cvv', 'req.body.email'],
});
