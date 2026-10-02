import { Response, NextFunction } from 'express';
import { WorkOrderService } from '../services/workOrderService';
import { sendSuccess } from '../utils/response';
import { StorageService } from '../services/storageService';
import { Sanitizer } from '../utils/sanitizer';
import { AuthenticatedRequest, AppError } from '../types';

import { ChatService } from '../services/chatService';

export class WorkOrderController {
  public static async getTroubleshootingSteps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const workOrder = await WorkOrderService.getWorkOrderById(req.params.id, req.user!);
      if (!workOrder) throw new AppError('Work Order not found', 404);
      const steps = await ChatService.generateTroubleshootingSteps(workOrder.notes || workOrder.complaint?.description || 'No description', workOrder.complaint?.category || 'OTHER');
      return sendSuccess(res, { steps }, 'Generated steps');
    } catch (error) {
      next(error);
    }
  }

  public static async smartSchedule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { priority, category } = req.body;
      let estimatedHours = 2; // Default
      
      if (priority === 'CRITICAL') estimatedHours = 4;
      else if (priority === 'HIGH') estimatedHours = 3;
      else if (priority === 'LOW') estimatedHours = 1;

      if (category === 'IT_NETWORK' || category === 'ELECTRICAL') estimatedHours += 1;
      
      const suggestedTime = new Date();
      suggestedTime.setHours(suggestedTime.getHours() + 1); // Suggest starting in 1 hour
      
      return sendSuccess(res, { 
        estimatedHours,
        scheduledAt: suggestedTime.toISOString()
      }, 'Suggested schedule generated');
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const data = { ...req.body };
      if (data.description && !data.notes) {
        data.notes = data.description;
      }
      if (data.notes) data.notes = Sanitizer.sanitizeText(data.notes);
      const workOrder = await WorkOrderService.createWorkOrder(data, req.user);
      return sendSuccess(res, workOrder, 'Work order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const result = await WorkOrderService.getWorkOrders(req.query as any, req.user);
      return sendSuccess(res, result, 'Work orders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const workOrder = await WorkOrderService.getWorkOrderById(req.params.id, req.user);
      return sendSuccess(res, workOrder, 'Work order retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const { status, notes, resolutionNotes, actualHours } = req.body;
      const updated = await WorkOrderService.updateStatus(
        req.params.id,
        status,
        req.user,
        { notes, resolutionNotes, actualHours }
      );
      return sendSuccess(res, updated, 'Work order status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async assignTechnician(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const updated = await WorkOrderService.assignTechnician(req.params.id, req.body, req.user);
      return sendSuccess(res, updated, 'Technician assigned successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async addPart(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const result = await WorkOrderService.addPart(req.params.id, req.body, req.user);
      return sendSuccess(res, result, 'Part recorded and stock deducted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateChecklist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const updated = await WorkOrderService.updateChecklist(req.params.id, req.body.checklist, req.user);
      return sendSuccess(res, updated, 'Checklist updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async confirmWork(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const { confirmed } = req.body;
      const updated = await WorkOrderService.confirmWork(req.params.id, confirmed !== false, req.user);
      return sendSuccess(res, updated, 'Work order verification submitted');
    } catch (error) {
      next(error);
    }
  }

  public static async approveWork(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const { approved } = req.body;
      const updated = await WorkOrderService.approveWork(req.params.id, approved !== false, req.user);
      return sendSuccess(res, updated, 'Work order approval registered');
    } catch (error) {
      next(error);
    }
  }

  public static async addAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      
      const { fileName, fileData, mimeType, category } = req.body;
      if (!fileName || !fileData || !mimeType) {
        throw new AppError('Missing required fields: fileName, fileData, mimeType', 400);
      }

      const approxBytes = Math.round((fileData.length * 3) / 4);
      if (approxBytes > 5 * 1024 * 1024) {
        throw new AppError('File size exceeds maximum allowed limit of 5MB', 400);
      }

      // Upload base64 to Supabase
      const publicUrl = await StorageService.uploadBase64(fileData, fileName, mimeType);

      const attachment = await WorkOrderService.addAttachment(req.params.id, {
        fileName,
        fileUrl: publicUrl,
        fileSize: approxBytes,
        mimeType,
        category
      }, req.user);
      
      return sendSuccess(res, attachment, 'Attachment added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Unauthorized', 401);
      const metrics = await WorkOrderService.getMetrics(req.user);
      return sendSuccess(res, metrics, 'Work order metrics fetched');
    } catch (error) {
      next(error);
    }
  }
}
