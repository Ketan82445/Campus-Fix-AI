import { Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export class AnalyticsController {
  public static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const overview = await AnalyticsService.getOverviewStats();
      return sendSuccess(res, overview);
    } catch (error) {
      next(error);
    }
  }

  public static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await AnalyticsService.getCategoryDistribution();
      return sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }

  public static async getDepartments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const departments = await AnalyticsService.getDepartmentWorkload();
      return sendSuccess(res, departments);
    } catch (error) {
      next(error);
    }
  }

  public static async getPriorities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const priorities = await AnalyticsService.getPriorityBreakdown();
      return sendSuccess(res, priorities);
    } catch (error) {
      next(error);
    }
  }

  public static async getRecurring(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const recurring = await AnalyticsService.getRecurringIssues();
      return sendSuccess(res, recurring);
    } catch (error) {
      next(error);
    }
  }
}
