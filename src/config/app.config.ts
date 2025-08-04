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
  DPO_COMPANY_TOKEN: getEnv('DPO_COMPANY_TOKEN'),
  DPO_BASE_URL: getEnv('DPO_BASE_URL'),
  DPO_PAYMENT_URL: getEnv('DPO_PAYMENT_URL'),
  CHALET_USER_URL: getEnv('CHALET_USER_URL'),
  JWT: {
    SECRET: getEnv('JWT_SECRET'),
    EXPIRES_IN: getEnv('JWT_SECRET_EXPIRE'),
    COOKIE_NAME: getEnv('COOKIE_NAME'),
  },
  AWS_S3_BUCKET: getEnv('AWS_S3_BUCKET'),
  AWS_REGION: getEnv('AWS_REGION'),
  AWS_ACCESS_KEY_ID: getEnv('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: getEnv('AWS_SECRET_ACCESS_KEY'),
  CLOUDFRONT_DOMAIN: getEnv('CLOUDFRONT_DOMAIN'),
});

export const config = appConfig();
