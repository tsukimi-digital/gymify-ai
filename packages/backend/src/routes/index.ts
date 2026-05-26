import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import profileRouter from './profile.js';
import plansRouter from './plans.js';
import paymentRouter from './payment.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/profile', profileRouter);
router.use('/plans', plansRouter);
router.use('/payment', paymentRouter);

export default router;
