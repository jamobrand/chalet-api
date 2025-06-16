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

// Helmet configuration - allow larger content for file uploads
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\''],
        connectSrc: ['\'self\'', 'https:', 'data:', 'blob:'],
      },
    },
  }),
);

const corsOrigins = config.APP_ORIGIN.length > 0 ? config.APP_ORIGIN : ['http://localhost'];
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'X-File-Name',
      'X-File-Size',
      'X-File-Type',
    ],
    optionsSuccessStatus: 200,
    maxAge: 86400, // 24 hours
  }),
);

// Handle preflight requests
app.options('*', cors());

// Compression middleware (before body parsing)
app.use(
  compression({
    filter: compressFilter,
    threshold: 1024, // Only compress if response is larger than 1KB
  }),
);

// Increased limits for large file uploads
// Set different limits for different routes
app.use(
  '/api/v1/images',
  express.raw({
    type: 'multipart/form-data',
    limit: '250mb',
  }),
);

// Higher limits for JSON and URL encoded data
app.use(
  express.json({
    limit: '250mb',
  }),
);

app.use(
  express.urlencoded({
    limit: '250mb',
    extended: true,
    parameterLimit: 50000,
  }),
);

// XSS protection
app.use(xssMiddleware());

// Cookie parser
app.use(cookieParser());

// Request logging
app.use((req, _res, next) => {
  logger.info(`Incoming ${req.method} request to ${req.originalUrl}`, {
    contentLength: req.get('content-length'),
    contentType: req.get('content-type'),
  });
  next();
});

// Health check endpoint
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
