import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { SLAService } from '../services/slaService';
import { sendSuccess } from '../utils/response';
import { Priority } from '@prisma/client';
import { z } from 'zod';

const updateSLAConfigSchema = z.object({
  responseHours: z.number().int().min(1, 'Response hours must be at least 1'),
  resolutionHours: z.number().int().min(1, 'Resolution hours must be at least 1')
});

export class SLAController {
  public static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await SLAService.getSLAStats();
      return sendSuccess(res, stats, 'SLA stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async checkAndEscalate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await SLAService.checkAndEscalateBreachedSLAs();
      return sendSuccess(res, result, 'SLA breach check and escalations completed');
    } catch (error) {
      next(error);
    }
  }

  public static async getConfigs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const configs = await SLAService.getSLAConfigs();
      return sendSuccess(res, configs, 'SLA configurations retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async updateConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const priority = req.params.priority as Priority;
      const { responseHours, resolutionHours } = updateSLAConfigSchema.parse(req.body);

      const updated = await SLAService.updateSLAConfig(priority, responseHours, resolutionHours);
      return sendSuccess(res, updated, `SLA configuration for ${priority} updated`);
    } catch (error) {
      next(error);
    }
  }
}
