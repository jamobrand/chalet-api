import express from 'express';
//import { config } from './config/app.config';

const app = express();
//const BASE_PATH = config.BASE_PATH;

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

export default app;