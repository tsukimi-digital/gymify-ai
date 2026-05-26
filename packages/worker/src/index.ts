import { prisma } from './db.js';
import { logger } from './logger.js';
import { handlePlanGeneration } from './jobs/planGeneration.js';

async function pollJobs() {
  logger.info('Worker started, polling for jobs...');

  while (true) {
    try {
      const job = await prisma.planGenerationJob.findFirst({
        where: { status: 'QUEUED' },
        orderBy: { createdAt: 'asc' },
      });

      if (job) {
        logger.info({ jobId: job.id }, 'Picked up job');
        await prisma.planGenerationJob.update({
          where: { id: job.id },
          data: { status: 'RUNNING', startedAt: new Date() },
        });

        await handlePlanGeneration(job.id).catch(async (err: unknown) => {
          logger.error({ jobId: job.id, err }, 'Job failed');
          await prisma.planGenerationJob.update({
            where: { id: job.id },
            data: {
              status: 'FAILED',
              errorMessage: String(err),
              finishedAt: new Date(),
            },
          }).catch(() => { /* best effort */ });
        });
      }
    } catch (err) {
      logger.error(err, 'Error in polling loop');
    }

    await new Promise(r => setTimeout(r, 2000));
  }
}

pollJobs();
