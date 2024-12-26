import { getEnv } from '../common/utils/get-env';

const appConfig = () => ({
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  APP_ORIGIN: getEnv('APP_ORIGIN', 'localhost'),
  PORT: getEnv('PORT', '6170'),
  BASE_PATH: getEnv('BASE_PATH', '/api/v1'),
  DATABASE_URL: getEnv('DATABASE_URL'),
});

export const config = appConfig();
