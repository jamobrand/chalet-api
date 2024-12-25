import 'dotenv/config';

import app from './app';
import { config } from './config/app.config';
import { logger } from './common/utils/logger';

const server = app.listen(Number(config.PORT), () => {
  logger.log('info', `Server is running on Port: ${config.PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received.');
  logger.info('Closing server.');
  server.close((err) => {
    logger.info('Server closed.');
    // eslint-disable-next-line no-process-exit
    process.exit(err ? 1 : 0);
  });
});
