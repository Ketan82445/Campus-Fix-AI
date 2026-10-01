import { Response, NextFunction } from 'express';
import { ComplaintService } from '../services/complaintService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import {
  createComplaintSchema,
  updateStatusSchema,
  reopenComplaintSchema,
  reviewAIPredictionSchema,
  uploadAttachmentSchema,
  checkSimilarSchema,
  markDuplicateSchema
} from '../validators/complaintValidator';
import { StorageService } from '../services/storageService';

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
        validated.priority,
        {
          building: validated.building,
          floor: validated.floor,
          room: validated.room,
          language: validated.language,
          attachments: validated.attachments as any
        }
      );
      return sendSuccess(res, complaint, 'Complaint logged successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getMany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, category, priority, departmentId, search, slaBreached } = req.query;
      const result = await ComplaintService.getComplaints(req.user!, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as any,
        category: category as any,
        priority: priority as any,
        departmentId: departmentId as string,
        search: search as string,
        slaBreached: slaBreached !== undefined ? slaBreached === 'true' : undefined
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
      const result = await ComplaintService.reviewAIPrediction(id, req.user!, validated as any);
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

  public static async uploadAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = uploadAttachmentSchema.parse(req.body);
      const approxBytes = Math.round((validated.fileData.length * 3) / 4);
      if (approxBytes > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds maximum allowed limit of 5MB' }
        });
      }
      // Stream base64 to Supabase Storage Bucket and get public URL
      const publicUrl = await StorageService.uploadBase64(
        validated.fileData,
        validated.fileName,
        validated.mimeType
      );

      return sendSuccess(
        res,
        {
          fileName: validated.fileName,
          fileUrl: publicUrl,
          fileSize: approxBytes,
          mimeType: validated.mimeType
        },
        'Attachment uploaded successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  public static async deleteAttachment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id, attachmentId } = req.params;
      const result = await ComplaintService.deleteAttachment(id, attachmentId, req.user!);
      return sendSuccess(res, result, 'Attachment deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async checkSimilar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validated = checkSimilarSchema.parse(req.body);
      const matches = await ComplaintService.checkSimilarComplaints({
        ...validated,
        userId: req.user!.id
      } as any);
      return sendSuccess(res, matches, 'Similar complaints checked successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async toggleUpvote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await ComplaintService.toggleUpvote(id, req.user!);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  public static async markDuplicate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { originalComplaintId, reason } = markDuplicateSchema.parse(req.body);
      const updated = await ComplaintService.markAsDuplicate(id, originalComplaintId, req.user!, reason);
      return sendSuccess(res, updated, 'Complaint linked as duplicate successfully');
    } catch (error) {
      next(error);
    }
  }
}

