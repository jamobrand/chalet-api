import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { xssMiddleware } from './common/utils/xssMiddleware';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import compressFilter from './common/utils/compressFilter.util';
import { config } from './config/app.config';
import { HTTPSTATUS } from './config/http.config';
import { asyncHandler } from './common/utils/asyncHandler';
import { errorHandler } from './common/utils/errorHandler';
import httpStatus from 'http-status';
import { logger } from './common/utils/logger';
import prismaClient from './config/prisma';
import authRoutes from './auth/auth.routes';

const app = express();
const BASE_PATH = config.BASE_PATH;

// Helmet is used to secure this app by configuring the http-header
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

app.use(xssMiddleware());

app.use(cookieParser());

// Compression is used to reduce the size of the response body
app.use(compression({ filter: compressFilter }));

app.use(
  cors({
    // origin is given a array if we want to have multiple origins later
    origin: String(config.APP_ORIGIN).split('|'),
    credentials: true,
  }),
);

app.use((req, _res, next) => {
  logger.info(`Incoming ${req.method} request to ${req.originalUrl}`);
  next();
});

app.get(
  `${BASE_PATH}/api-check`,
  asyncHandler(async (_req, res) => {
    await prismaClient.$queryRaw`SELECT 1`;
    res.status(HTTPSTATUS.OK).json({
      message: 'Hello Welcome to GRVL CHALET API!!!',
    });
  }),
);

app.use(`${BASE_PATH}/auth`, authRoutes);

app.use((_req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    message: 'Route not found',
  });
});

app.use(errorHandler);

export default app;
