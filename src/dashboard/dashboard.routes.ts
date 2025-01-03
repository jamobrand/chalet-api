import { Router } from 'express';
import { dashboardController } from './dashboard.module';

const dashboardRoutes = Router();

dashboardRoutes.get('/all-dashboard-stats', dashboardController.getDashboardStats);

export default dashboardRoutes;