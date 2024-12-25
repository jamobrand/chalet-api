import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { xssMiddleware } from './common/utils/xssMiddleware';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import compressFilter from './common/utils/compressFilter.util';
import { config } from './config/app.config';
import httpStatus from 'http-status';

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

app.get(`${BASE_PATH}/health`, (_req, res) => {
  res.status(httpStatus.OK).json({
    message: 'Hello Subscribers!!!',
  });
});

export default app;
