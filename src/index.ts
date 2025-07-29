import 'dotenv/config';

import app from './app';
import { config } from './config/app.config';
import { logger } from './common/utils/logger';
import prismaClient from './config/prisma';

/**
 * Gracefully shutdown the application by closing database connections and other resources.
 * This function is called when the application receives a termination signal (SIGTERM or SIGINT).
 * It ensures that all ongoing requests are completed before shutting down.
 */

async function shutdownGracefully() {
  try {
    logger.info('Initiating graceful shutdown...');

    await prismaClient.$disconnect();
    logger.info('Database connections closed');

    return true;
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    return false;
  }
}

/**
 * Starts the server and listens on the specified port.
 * It also sets up signal handlers for graceful shutdown on termination signals.
 * The server will close gracefully, allowing ongoing requests to complete before shutting down.
 */
const server = app.listen(Number(config.PORT), () => {
  logger.log('info', `Server is running on Port: ${config.PORT}`);
});

/**
 *
 * @param signal - The signal that triggered the shutdown (e.g., SIGTERM, SIGINT).
 */
async function handleShutdown(signal: string) {
  logger.info(`${signal} signal received`);

  server.close(async () => {
    logger.info('HTTP server closed');
    const cleanShutdown = await shutdownGracefully();
    // eslint-disable-next-line no-process-exit
    process.exit(cleanShutdown ? 0 : 1);
  });

  setTimeout(() => {
    logger.error('Forcing shutdown due to timeout');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  handleShutdown('UNCAUGHT_EXCEPTION');
});
