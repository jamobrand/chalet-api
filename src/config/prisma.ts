import { PrismaClient } from '@prisma/client';
import { config } from './app.config';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClient =
  globalThis.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

if (config.NODE_ENV !== 'production') {
  globalThis.prisma = prismaClient;
}

export default prismaClient;
