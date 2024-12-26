// src/worker.ts
import 'dotenv/config';
import './jobs/emailProcessor';
import { logger } from './common/utils/logger';
import connection from './config/redis';

// Graceful shutdown function
async function shutdownGracefully() {
  try {
    logger.info('Worker: Initiating graceful shutdown...');
    await connection.quit();
    logger.info('Worker: Redis connections closed');
    return true;
  } catch (error) {
    logger.error('Worker: Error during shutdown:', error);
    return false;
  }
}

// Handle shutdown signals
async function handleShutdown(signal: string) {
  logger.info(`Worker: ${signal} signal received`);

  const cleanShutdown = await shutdownGracefully();
  // eslint-disable-next-line no-process-exit
  process.exit(cleanShutdown ? 0 : 1);
}

// Setup signal handlers
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Error handling
process.on('unhandledRejection', (reason) => {
  logger.error('Worker: Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Worker: Uncaught Exception:', error);
  handleShutdown('UNCAUGHT_EXCEPTION');
});

logger.info('Email worker started');
