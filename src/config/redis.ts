import Redis from 'ioredis';
import { logger } from '../common/utils/logger';

const REDIS_CONFIG = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err: Error) {
    logger.error('Redis connection error:', err);
    return true;
  },
};

// Create a Redis client
const redis = new Redis(REDIS_CONFIG);

redis.on('error', (error) => {
  logger.error('Redis client error:', error);
});

redis.on('connect', () => {
  logger.info('Redis client connected');
});

// If you need to handle reconnection errors
redis.on('reconnecting', (timeToReconnect: number) => {
  logger.info(`Reconnecting to Redis in ${timeToReconnect}ms`);
});

const connection = redis;

// Export the Redis client
export default connection;
