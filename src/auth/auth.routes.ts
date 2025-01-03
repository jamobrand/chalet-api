import { Router } from 'express';
import { authController } from './auth.module';
import { isAuth } from '../common/lib/isAuth';

const authRoutes = Router();

authRoutes.post('/signup', authController.register);
authRoutes.post('/login', authController.login);
authRoutes.post('/verify/email', authController.verifyEmail);
authRoutes.get('/me', isAuth, authController.getUserDetails);


export default authRoutes;
