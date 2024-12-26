import { Queue, QueueEvents } from 'bullmq';
import connection from '../config/redis';
import { logger } from '../common/utils/logger';

// Constants for queue configuration
const QUEUE_NAME = 'emailQueue';
const MAX_ATTEMPTS = 3;
const INITIAL_DELAY = 1000; // 1 second
//const MAX_DELAY = 1000 * 60 * 60; // 1 hour
const REMOVE_ON_COMPLETE_AGE = 24 * 3600; // 24 hours in seconds
const REMOVE_ON_FAIL_AGE = 7 * 24 * 3600; // 7 days in seconds

// Create the email queue with production-ready settings
const emailQueue = new Queue(QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: MAX_ATTEMPTS,
    removeOnComplete: {
      age: REMOVE_ON_COMPLETE_AGE, // Keep successful jobs for 24 hours
      count: 1000, // Keep last 1000 successful jobs
    },
    removeOnFail: {
      age: REMOVE_ON_FAIL_AGE, // Keep failed jobs for 7 days
    },
    backoff: {
      type: 'exponential',
      delay: INITIAL_DELAY,
    },
    timestamp: Date.now(),
  },
});

// Set up queue events monitoring
const queueEvents = new QueueEvents(QUEUE_NAME, { connection });

// Event handling for monitoring and logging
queueEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.info(`Job ${jobId} completed successfully`, returnvalue);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed`, failedReason);
});

queueEvents.on('error', (error) => {
  logger.error('Queue error:', error);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  try {
    await emailQueue.close();
    await queueEvents.close();
    logger.info('Queue connections closed gracefully');
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
});

export { emailQueue };
