import { asyncHandler } from '../common/utils/asyncHandler';
import { DashboardService } from './dashboard.service';
import { Request, Response } from 'express';
import httpStatus from 'http-status';

export class DashboardController {
    private dashboardService: DashboardService;
    
      constructor(dashboardService: DashboardService) {
        this.dashboardService = dashboardService;
      }

      public getDashboardStats = asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
        const dashboardStats = await this.dashboardService.getDashboardStats();
    
        return res.status(httpStatus.OK).json({
          message: 'Retrieved dashboard stats successfully',
          ...dashboardStats
        });
      });
}