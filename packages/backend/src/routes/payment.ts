import { Router, Request, Response } from 'express';
import { paymentSubmitSchema } from '@gymify/shared';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { luhnCheck } from '../services/luhn.js';
import { issueAccessToken } from '../services/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/submit', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = paymentSubmitSchema.parse(req.body);

  // Luhn check
  if (!luhnCheck(body.cardNumber)) {
    throw new AppError('INVALID_CARD', 'Invalid card number', 400);
  }

  // Expiry check
  const [monthStr, yearStr] = body.expiry.split('/');
  const expiryYear = 2000 + parseInt(yearStr, 10);
  const expiryMonth = parseInt(monthStr, 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
    throw new AppError('CARD_EXPIRED', 'Card has expired', 400);
  }

  const cardLastFour = body.cardNumber.slice(-4);

  // Store payment record (last four digits only, no full card number)
  await prisma.paymentRecord.create({
    data: {
      userId,
      cardLastFour,
      cardExpiry: body.expiry,
      cardHolder: body.cardHolder,
    },
  });

  // Update user to premium
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true },
  });

  // Issue new access token with updated isPremium
  const accessToken = issueAccessToken({
    userId: updatedUser.id,
    isPremium: updatedUser.isPremium,
    plansGenerated: updatedUser.plansGenerated,
  });

  res.json({ success: true, accessToken });
}));

export default router;
