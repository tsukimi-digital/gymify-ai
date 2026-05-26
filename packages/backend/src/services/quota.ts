import { prisma } from '../db.js';
import { QuotaExceededError } from '../middleware/errorHandler.js';

export async function checkQuota(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.isPremium && user.plansGenerated >= 2) {
    throw new QuotaExceededError();
  }
  // hourly cap: max 5/h
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentJobs = await prisma.planGenerationJob.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
      status: { in: ['QUEUED', 'RUNNING', 'SUCCEEDED'] },
    },
  });
  if (recentJobs >= 5) {
    throw new QuotaExceededError();
  }
}
