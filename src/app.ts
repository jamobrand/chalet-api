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
import ownerRoutes from './owner/owner.routes';
import chaletRoutes from './chalet/chalet.routes';
import reservationRoutes from './reservation/reservation.routes';
import customerRoutes from './customers/customer.routes';
import transactionRoutes from './transactions/transaction.routes';
import addonRoutes from './addons/addon.routes';
import ruleRoutes from './rules/rule.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import imageUploadRoutes from './s3-image-uploader/image-upload.routes';

const app = express();
const BASE_PATH = config.BASE_PATH;

// Helmet is used to secure this app by configuring the http-header
app.use(helmet());

// parse json request body
app.use(express.json({ limit: '25mb' }));

// parse urlencoded request body
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.use(xssMiddleware());

app.use(cookieParser());

// Compression is used to reduce the size of the response body
app.use(compression({ filter: compressFilter }));

const corsOrigins = config.APP_ORIGIN.length > 0 ? config.APP_ORIGIN : ['http://localhost'];
app.use(
  cors({
    origin: corsOrigins, // Accepts the array of URLs
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
app.use(`${BASE_PATH}/owners`, ownerRoutes);
app.use(`${BASE_PATH}/chalets`, chaletRoutes);
app.use(`${BASE_PATH}/images`, imageUploadRoutes);
app.use(`${BASE_PATH}/reservations`, reservationRoutes);
app.use(`${BASE_PATH}/customers`, customerRoutes);
app.use(`${BASE_PATH}/transactions`, transactionRoutes);
app.use(`${BASE_PATH}/addons`, addonRoutes);
app.use(`${BASE_PATH}/rules`, ruleRoutes);
app.use(`${BASE_PATH}/dashboard`, dashboardRoutes);

app.use((_req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    message: 'Route not found',
  });
});

app.use(errorHandler);

export default app;
