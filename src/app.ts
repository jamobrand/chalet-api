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
import dpoRoutes from './dpo-payment/dpo.routes';
import bookingRoutes from './booking/booking.routes';

const app = express();
const BASE_PATH = config.BASE_PATH;

// Helmet configuration - allow larger content for file uploads
// This is important for security, as it helps to set various HTTP headers
// to protect the application from well-known vulnerabilities.
// The content security policy is set to allow connections to the same origin,
// as well as to HTTPS and data URIs. This is useful for applications that
// need to load resources from the same origin or from secure sources.
// Adjust the content security policy based on your application's requirements.
// For example, if your application needs to load resources from a CDN or other origins,
// you should add those origins to the directives.
// Be cautious with the directives to avoid introducing security vulnerabilities.
// For production, you should review and tighten the content security policy
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

// CORS configuration
// Allow requests from specified origins or localhost if not set
// This is important for cross-origin requests, especially in development
// Ensure that the origins are set correctly in your environment variables
// or configuration file to avoid security issues.
// If APP_ORIGIN is not set, it defaults to ['http://localhost'].
// Adjust the origins based on your application's requirements.
// For production, you should specify the exact origins that are allowed to access your API.
// This helps prevent unauthorized access and potential security vulnerabilities.
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
// This middleware compresses the response bodies for requests that
// have a size larger than the specified threshold.
// It helps to reduce the size of the response, improving performance
// and reducing bandwidth usage.
// The `compressFilter` function is used to determine whether to compress the response.
// It checks the request headers and response status to decide if compression is appropriate.
// The threshold is set to 1024 bytes (1KB), meaning responses larger than this size will be compressed.
// Adjust the threshold based on your application's needs.
// Be cautious with compression in production environments, as it can lead to performance issues
// if not configured correctly or if the responses are already small.
// For example, if your application serves mostly small responses, you might want to increase the threshold
app.use(
  compression({
    filter: compressFilter,
    threshold: 1024, // Only compress if response is larger than 1KB
  }),
);

app.use(`${BASE_PATH}/images`, imageUploadRoutes);

// Higher limits for JSON and URL encoded data
// This is useful for large file uploads or complex data structures
// Adjust these limits based on your application's needs
// Be cautious with large limits in production environments
// as they can lead to performance issues or security vulnerabilities.
// For production, consider using smaller limits and validating input sizes.
// For example, you might want to set these limits to 1mb or 5mb
// depending on your use case.
// Here we set them to 250mb for development purposes, but you should adjust as needed
// and consider security implications.
// Note: These limits should be set according to your application's requirements and security policies.
app.use(
  express.json({
    limit: '250mb',
  }),
);

// Not advisable to use large limits in production, but useful for development
// and testing with large payloads
app.use(
  express.urlencoded({
    limit: '250mb',
    extended: true,
    parameterLimit: 50000,
  }),
);

// XSS protection
// This middleware helps to prevent cross-site scripting (XSS) attacks
// by sanitizing user input and removing potentially harmful scripts.
// It is important to use this middleware to ensure that user input is safe
// and does not contain malicious scripts that could compromise the security of your application.
// The `xssMiddleware` function is a custom middleware that sanitizes the request body and query parameters.
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
// This endpoint is used to check the health of the API
// It performs a simple database query to ensure that the database connection is working
// If the query is successful, it returns a 200 OK status with a welcome message.
// If the query fails, it will throw an error that will be caught by the error handler
// This is useful for monitoring the health of the API and ensuring that it is operational.
// You can use this endpoint in your monitoring tools to check the health of the API.
// The endpoint is accessible at /api/api-check and returns a JSON response with a welcome message
// Adjust the endpoint path based on your application's requirements.
app.get(
  `${BASE_PATH}/api-check`,
  asyncHandler(async (_req, res) => {
    await prismaClient.$queryRaw`SELECT 1`;
    res.status(HTTPSTATUS.OK).json({
      message: 'Hello Welcome to GRVL CHALET Booking API!!!',
    });
  }),
);

// Register routes
// These routes handle various functionalities of the application
// Each route is defined in its own module and imported here for better organization
// The routes are prefixed with the BASE_PATH defined in the configuration
// This allows for better separation of concerns and makes it easier to manage the routes.
// The routes are organized into different modules based on their functionality
// For example, the auth routes handle authentication-related functionalities,
// the owner routes handle owner-related functionalities, and so on.
// This modular approach helps to keep the codebase organized and maintainable.
// Each route module exports a router that is used to define the endpoints for that module.
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/owners`, ownerRoutes);
app.use(`${BASE_PATH}/chalets`, chaletRoutes);
app.use(`${BASE_PATH}/reservations`, reservationRoutes);
app.use(`${BASE_PATH}/customers`, customerRoutes);
app.use(`${BASE_PATH}/transactions`, transactionRoutes);
app.use(`${BASE_PATH}/addons`, addonRoutes);
app.use(`${BASE_PATH}/rules`, ruleRoutes);
app.use(`${BASE_PATH}/dashboard`, dashboardRoutes);
app.use(`${BASE_PATH}/dpo`, dpoRoutes);
app.use(`${BASE_PATH}/booking`, bookingRoutes);

app.use((_req, res) => {
  res.status(httpStatus.NOT_FOUND).json({
    message: 'Route not found',
  });
});

app.use(errorHandler);

export default app;
