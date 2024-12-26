import { Router } from 'express';
import { authController } from './auth.module';

const authRoutes = Router();

authRoutes.post('/signup', authController.register);

export default authRoutes;
