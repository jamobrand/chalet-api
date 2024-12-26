import { Job, Worker } from 'bullmq';
import sendEmailTwo from '../mailers/mailer-two';
import connection from '../config/redis';
import { logger } from '../common/utils/logger';

interface EmailJob {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
  // Add other email-related fields as needed
}

const worker = new Worker<EmailJob>(
  'emailQueue',
  async (job: Job<EmailJob>) => {
    logger.info('Processing email job', { jobId: job.id });

    try {
      const { to, from, subject, text, html } = job.data;
      await sendEmailTwo({ to, from, subject, text, html });

      logger.info('Email sent successfully', { jobId: job.id });
      return { success: true, timestamp: Date.now() };
    } catch (error) {
      logger.error('Error processing email job', {
        jobId: job.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 jobs simultaneously
    limiter: {
      max: 100, // Maximum 100 jobs
      duration: 1000 * 60, // Per minute
    },
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    lockDuration: 90000, // Lock job for 90 seconds
  },
);

worker.on('failed', (job, err) => {
  logger.error('Job failed', {
    jobId: job?.id,
    error: err.message,
    attemptsMade: job?.attemptsMade,
  });
});

worker.on('completed', (job) => {
  logger.info('Job completed', {
    jobId: job?.id,
    attemptsMade: job?.attemptsMade,
  });
});

worker.on('error', (err) => {
  logger.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await worker.close();
    logger.info('Worker closed gracefully');
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  } catch (error) {
    logger.error('Error during worker shutdown:', error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
});
