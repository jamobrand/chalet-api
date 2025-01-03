/* eslint-disable quotes */
import { getEnv } from '../common/utils/get-env';

const appConfig = () => ({
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  // APP_ORIGIN: getEnv('APP_ORIGIN', 'localhost'),
  APP_ORIGIN: getEnv('APP_ORIGIN', 'localhost').split(','), // Split the value into an array
  FRONTEND_URL: getEnv('FRONTEND_URL', 'localhost'),
  PORT: getEnv('PORT', '6170'),
  BASE_PATH: getEnv('BASE_PATH', '/api/v1'),
  DATABASE_URL: getEnv('DATABASE_URL'),
  REDIS_HOST: getEnv('REDIS_HOST', 'localhost'),
  REDIS_PORT: getEnv('REDIS_PORT', '8001'),
  MAILER_SENDER: getEnv('MAILER_SENDER'),
  RESEND_API_KEY: getEnv('RESEND_API_KEY'),
  JWT: {
    SECRET: getEnv("JWT_SECRET"),
    EXPIRES_IN: getEnv("JWT_SECRET_EXPIRE"),
    COOKIE_NAME: getEnv("COOKIE_NAME"),
  },
});

export const config = appConfig();
