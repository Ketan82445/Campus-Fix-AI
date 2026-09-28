import { Response, NextFunction } from 'express';
import { ComplaintService } from '../services/complaintService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import {
  createComplaintSchema,
  updateStatusSchema,
  reopenComplaintSchema,
  reviewAIPredictionSchema
} from '../validators/complaintValidator';

export class ComplaintController {
  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = createComplaintSchema.parse(req.body);
      const complaint = await ComplaintService.createComplaint(
        req.user!,
        validated.title,
        validated.description,
        validated.location,
        validated.category,
        validated.priority
      );
      return sendSuccess(res, complaint, 'Complaint logged successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getMany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, category, priority, departmentId, search } = req.query;
      const result = await ComplaintService.getComplaints(req.user!, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as any,
        category: category as any,
        priority: priority as any,
        departmentId: departmentId as string,
        search: search as string
      });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const complaint = await ComplaintService.getComplaintById(id, req.user!);
      return sendSuccess(res, complaint);
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, reason } = updateStatusSchema.parse(req.body);
      const updated = await ComplaintService.updateStatus(id, status, req.user!, reason);
      return sendSuccess(res, updated, `Status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  public static async reopen(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = reopenComplaintSchema.parse(req.body);
      const updated = await ComplaintService.updateStatus(id, 'REOPENED', req.user!, reason);
      return sendSuccess(res, updated, 'Complaint reopened successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async reviewAI(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = reviewAIPredictionSchema.parse(req.body);
      const result = await ComplaintService.reviewAIPrediction(id, req.user!, validated);
      return sendSuccess(res, result, 'AI prediction reviewed and complaint routed successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { comment, isInternal } = req.body;
      const newComment = await ComplaintService.addComment(id, req.user!, comment, isInternal);
      return sendSuccess(res, newComment, 'Comment added successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
