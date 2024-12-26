import 'dotenv/config';

import app from './app';
import { config } from './config/app.config';
import { logger } from './common/utils/logger';
import prismaClient from './config/prisma';

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

const server = app.listen(Number(config.PORT), () => {
  logger.log('info', `Server is running on Port: ${config.PORT}`);
});

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
