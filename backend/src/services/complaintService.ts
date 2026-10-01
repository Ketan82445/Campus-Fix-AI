import { prisma } from '../config/prisma';
import { Category, Priority, Status, Role, AssignmentStatus } from '@prisma/client';
import { AppError, UserPayload } from '../types';
import { AIClientService } from './aiClientService';
import { RoutingService } from './routingService';
import { AssignmentService } from './assignmentService';
import { NotificationService } from './notificationService';
import { StorageService } from './storageService';
import { AuditService } from './auditService';
import { ComplaintSimilarityService, CheckSimilarInput } from './complaintSimilarityService';
import { SLAService } from './slaService';

const AI_CONFIDENCE_THRESHOLD = 0.75; // AI auto-routing threshold

export class ComplaintService {
  /**
   * Create complaint with complete transactional workflow
   */
  public static async createComplaint(
    creator: UserPayload,
    title: string,
    description: string,
    location: string,
    manualCategory?: Category,
    manualPriority?: Priority,
    extra?: {
      building?: string;
      floor?: string;
      room?: string;
      language?: string;
      attachments?: Array<{
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
      }>;
    }
  ) {
    // 1. Generate unique complaint number (CMP-YYYY-XXXX)
    const count = await prisma.complaint.count();
    const year = new Date().getFullYear();
    const complaintNumber = `CMP-${year}-${String(count + 1).padStart(4, '0')}`;

    // 2. Call AI Service asynchronously/inline
    const aiResult = await AIClientService.predictComplaint(title, description, location);
    
    // Determine category & priority: manual override or AI prediction
    const category = manualCategory || (aiResult.success ? aiResult.category : Category.OTHER);
    const priority = manualPriority || (aiResult.success ? aiResult.priority : Priority.MEDIUM);

    // 3. Resolve target department
    const targetDept = await RoutingService.resolveDepartment(category, aiResult.department);

    // Determine initial status based on AI confidence
    let initialStatus: Status = Status.SUBMITTED;
    let requireManualReview = false;

    if (!aiResult.success || (aiResult.confidence < AI_CONFIDENCE_THRESHOLD && !manualCategory)) {
      initialStatus = Status.AI_REVIEW_REQUIRED;
      requireManualReview = true;
    } else {
      initialStatus = Status.SUBMITTED;
    }

    // 4. Calculate SLA Deadlines based on Priority
    const { responseDeadline, resolutionDeadline } = await SLAService.calculateDeadlines(priority, new Date());

    // 5. Execute DB Transaction
    const complaint = await prisma.$transaction(async (tx) => {
      const createdComplaint = await tx.complaint.create({
        data: {
          complaintNumber,
          title,
          description,
          location,
          building: extra?.building || null,
          floor: extra?.floor || null,
          room: extra?.room || null,
          language: extra?.language || 'en',
          category,
          priority,
          status: initialStatus,
          aiConfidence: aiResult.confidence,
          responseDeadline,
          resolutionDeadline,
          createdById: creator.id,
          departmentId: targetDept ? targetDept.id : null,
          attachments:
            extra?.attachments && extra.attachments.length > 0
              ? {
                  create: extra.attachments.map((att) => ({
                    fileName: att.fileName,
                    fileUrl: att.fileUrl,
                    fileSize: att.fileSize,
                    mimeType: att.mimeType
                  }))
                }
              : undefined
        }
      });

      // Status history record
      await tx.statusHistory.create({
        data: {
          complaintId: createdComplaint.id,
          changedById: creator.id,
          oldStatus: null,
          newStatus: initialStatus,
          reason: requireManualReview 
            ? 'Submitted: Flagged for Admin review due to low AI confidence' 
            : 'Submitted: AI processed and categorised'
        }
      });

      // AI prediction record
      await tx.aIPrediction.create({
        data: {
          complaintId: createdComplaint.id,
          predictedCategory: aiResult.category,
          predictedPriority: aiResult.priority,
          predictedDepartment: aiResult.department,
          confidence: aiResult.confidence,
          modelVersion: aiResult.modelVersion,
          predictionIndicators: JSON.stringify(aiResult.indicators),
          status: aiResult.success ? (requireManualReview ? 'LOW_CONFIDENCE' : 'SUCCESS') : 'FAILED'
        }
      });

      return createdComplaint;
    });

    // 5. Auto-assignment if high confidence & department exists
    if (!requireManualReview && targetDept) {
      const assignedTech = await AssignmentService.autoAssignTechnician(targetDept.id, complaint.id);
      if (assignedTech) {
        await NotificationService.createNotification(
          assignedTech.id,
          'New Complaint Assigned',
          `You have been assigned complaint ${complaintNumber}: ${title}`,
          'COMPLAINT_ASSIGNED',
          complaint.id
        );
      }
    }

    // 6. Notify creator and Admins if review required
    await NotificationService.createNotification(
      creator.id,
      'Complaint Submitted Successfully',
      `Your complaint ${complaintNumber} has been logged and is being processed.`,
      'COMPLAINT_CREATED',
      complaint.id
    );

    if (requireManualReview) {
      // Notify admins
      const admins = await prisma.user.findMany({ where: { role: Role.ADMIN } });
      for (const admin of admins) {
        await NotificationService.createNotification(
          admin.id,
          'AI Review Required',
          `Complaint ${complaintNumber} requires manual classification review.`,
          'AI_REVIEW',
          complaint.id
        );
      }
    }

    // 7. Audit log
    await AuditService.logAction(creator.id, 'COMPLAINT_CREATED', 'COMPLAINT', complaint.id, {
      complaintNumber,
      category,
      priority,
      aiConfidence: aiResult.confidence,
      requireManualReview
    });

    return this.getComplaintById(complaint.id, creator);
  }

  /**
   * Get Paginated Complaints with Search & Filters
   */
  public static async getComplaints(
    user: UserPayload,
    params: {
      page?: number;
      limit?: number;
      status?: Status;
      category?: Category;
      priority?: Priority;
      departmentId?: string;
      search?: string;
      slaBreached?: boolean | string;
    }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based restrictions
    if (user.role === Role.STUDENT) {
      where.createdById = user.id;
    } else if (user.role === Role.TECHNICIAN) {
      where.OR = [
        { assignedTechnicianId: user.id },
        { departmentId: user.departmentId || undefined }
      ];
    }

    // Filters
    if (params.status) where.status = params.status;
    if (params.category) where.category = params.category;
    if (params.priority) where.priority = params.priority;
    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.slaBreached !== undefined) {
      where.slaBreached = params.slaBreached === true || params.slaBreached === 'true';
    }

    if (params.search) {
      where.AND = [
        {
          OR: [
            { title: { contains: params.search, mode: 'insensitive' } },
            { description: { contains: params.search, mode: 'insensitive' } },
            { complaintNumber: { contains: params.search, mode: 'insensitive' } },
            { location: { contains: params.search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true, code: true } },
          assignedTechnician: { select: { id: true, name: true, email: true, phone: true } },
          duplicateOf: { select: { id: true, complaintNumber: true, title: true } },
          _count: {
            select: {
              upvotes: true,
              comments: true,
              attachments: true
            }
          }
        }
      }),
      prisma.complaint.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get Detailed Complaint with History, Predictions & Comments
   */
  public static async getComplaintById(id: string, user: UserPayload) {
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true, phone: true } },
        department: true,
        assignedTechnician: { select: { id: true, name: true, email: true, phone: true } },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { changedBy: { select: { id: true, name: true, role: true } } }
        },
        aiPredictions: { orderBy: { createdAt: 'desc' }, take: 1 },
        assignments: {
          orderBy: { assignedAt: 'desc' },
          include: { technician: { select: { id: true, name: true, email: true } } }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, role: true } } }
        },
        attachments: true,
        duplicateOf: {
          select: { id: true, complaintNumber: true, title: true, status: true }
        },
        duplicates: {
          select: { id: true, complaintNumber: true, title: true, status: true, createdAt: true }
        },
        upvotes: {
          where: { userId: user.id },
          select: { id: true }
        },
        feedback: true,
        _count: {
          select: { upvotes: true }
        }
      }
    });

    if (!complaint) {
      throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }

    // Access check: allow creator, assignees, admins, or students who upvoted
    if (user.role === Role.STUDENT && complaint.createdById !== user.id) {
      const hasUpvoted = complaint.upvotes.length > 0;
      if (!hasUpvoted) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
      }
    }

    return {
      ...complaint,
      hasUpvoted: complaint.upvotes.length > 0,
      upvoteCount: complaint._count.upvotes
    };
  }

  /**
   * Status Transition Logic & Validation
   */
  public static async updateStatus(
    complaintId: string,
    newStatus: Status,
    user: UserPayload,
    reason?: string
  ) {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }

    // Authorization checks
    if (user.role === Role.STUDENT && newStatus !== Status.CLOSED && newStatus !== Status.REOPENED) {
      throw new AppError('Students can only confirm resolution or reopen complaints', 403, 'FORBIDDEN');
    }

    if (user.role === Role.TECHNICIAN && complaint.assignedTechnicianId !== user.id) {
      throw new AppError('Technicians can only update complaints assigned to them', 403, 'FORBIDDEN');
    }

    const validTransitions: Record<Status, Status[]> = {
      [Status.SUBMITTED]: [Status.AI_ANALYZING, Status.ASSIGNED, Status.AI_REVIEW_REQUIRED, Status.REJECTED],
      [Status.AI_ANALYZING]: [Status.ASSIGNED, Status.AI_REVIEW_REQUIRED, Status.REJECTED],
      [Status.AI_REVIEW_REQUIRED]: [Status.ASSIGNED, Status.REJECTED],
      [Status.ASSIGNED]: [Status.IN_PROGRESS, Status.REJECTED],
      [Status.IN_PROGRESS]: [Status.RESOLVED, Status.REJECTED],
      [Status.RESOLVED]: [Status.CLOSED, Status.REOPENED],
      [Status.REOPENED]: [Status.IN_PROGRESS, Status.ASSIGNED, Status.RESOLVED],
      [Status.CLOSED]: [Status.REOPENED],
      [Status.REJECTED]: [Status.REOPENED]
    };

    if (!validTransitions[complaint.status]?.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${complaint.status} to ${newStatus}`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const updatedData: any = { status: newStatus };
    const now = new Date();

    if (newStatus === Status.RESOLVED) {
      updatedData.resolvedAt = now;
      // Evaluate if resolution exceeded SLA deadline
      if (complaint.resolutionDeadline && now > complaint.resolutionDeadline) {
        updatedData.slaBreached = true;
      }
    }

    if ((newStatus === Status.IN_PROGRESS || newStatus === Status.ASSIGNED) && !complaint.respondedAt) {
      updatedData.respondedAt = now;
      if (complaint.responseDeadline && now > complaint.responseDeadline) {
        updatedData.slaBreached = true;
      }
    }

    if (newStatus === Status.CLOSED) updatedData.closedAt = now;

    const updatedComplaint = await prisma.$transaction(async (tx) => {
      const comp = await tx.complaint.update({
        where: { id: complaintId },
        data: updatedData
      });

      await tx.statusHistory.create({
        data: {
          complaintId,
          changedById: user.id,
          oldStatus: complaint.status,
          newStatus,
          reason: reason || `Status updated to ${newStatus}`
        }
      });

      return comp;
    });

    // Send notifications
    if (newStatus === Status.RESOLVED) {
      await NotificationService.createNotification(
        complaint.createdById,
        'Complaint Resolved',
        `Your complaint ${complaint.complaintNumber} has been marked as RESOLVED. Please verify and confirm.`,
        'RESOLVED',
        complaintId
      );
    } else if (newStatus === Status.REOPENED) {
      if (complaint.assignedTechnicianId) {
        await NotificationService.createNotification(
          complaint.assignedTechnicianId,
          'Complaint Reopened',
          `Complaint ${complaint.complaintNumber} has been reopened by the student.`,
          'REOPENED',
          complaintId
        );
      }
    }

    await AuditService.logAction(user.id, 'STATUS_CHANGED', 'COMPLAINT', complaintId, {
      oldStatus: complaint.status,
      newStatus,
      reason
    });

    return this.getComplaintById(complaintId, user);
  }

  /**
   * Admin Review of AI Prediction (Override category, priority, department, assignment)
   */
  public static async reviewAIPrediction(
    complaintId: string,
    adminUser: UserPayload,
    data: {
      category: Category;
      priority: Priority;
      departmentId: string;
      assignedTechnicianId?: string;
      reviewReason?: string;
    }
  ) {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) {
      throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }

    let targetTechId = data.assignedTechnicianId;

    // Auto-assign technician if not specified
    if (!targetTechId) {
      const tech = await AssignmentService.autoAssignTechnician(data.departmentId, complaintId, adminUser.id);
      targetTechId = tech?.id;
    } else {
      await prisma.assignment.create({
        data: {
          complaintId,
          technicianId: targetTechId,
          assignedById: adminUser.id,
          notes: data.reviewReason || 'Manually assigned by Admin during AI review'
        }
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const c = await tx.complaint.update({
        where: { id: complaintId },
        data: {
          category: data.category,
          priority: data.priority,
          departmentId: data.departmentId,
          assignedTechnicianId: targetTechId,
          status: Status.ASSIGNED
        }
      });

      await tx.statusHistory.create({
        data: {
          complaintId,
          changedById: adminUser.id,
          oldStatus: complaint.status,
          newStatus: Status.ASSIGNED,
          reason: data.reviewReason || 'Admin reviewed low-confidence AI prediction and assigned department'
        }
      });

      return c;
    });

    if (targetTechId) {
      await NotificationService.createNotification(
        targetTechId,
        'New Complaint Assigned',
        `You have been assigned complaint ${complaint.complaintNumber}`,
        'COMPLAINT_ASSIGNED',
        complaintId
      );
    }

    await AuditService.logAction(adminUser.id, 'AI_REVIEWED', 'COMPLAINT', complaintId, {
      category: data.category,
      priority: data.priority,
      departmentId: data.departmentId,
      assignedTechnicianId: targetTechId
    });

    return this.getComplaintById(complaintId, adminUser);
  }

  /**
   * Add comment to complaint
   */
  public static async addComment(
    complaintId: string,
    author: UserPayload,
    comment: string,
    isInternal: boolean = false
  ) {
    const complaint = await prisma.complaint.findUnique({ 
      where: { id: complaintId },
      include: { upvotes: { where: { userId: author.id } } }
    });
    if (!complaint) throw new AppError('Complaint not found', 404, 'NOT_FOUND');

    if (author.role === Role.STUDENT && complaint.createdById !== author.id && complaint.upvotes.length === 0) {
      throw new AppError('Access denied: You can only comment on your own complaints or complaints you have upvoted', 403, 'FORBIDDEN');
    }
    
    if (author.role === Role.TECHNICIAN && complaint.assignedTechnicianId !== author.id && complaint.departmentId !== author.departmentId) {
      throw new AppError('Access denied: Technicians can only comment on complaints in their department or assigned to them', 403, 'FORBIDDEN');
    }

    const newComment = await prisma.complaintComment.create({
      data: {
        complaintId,
        authorId: author.id,
        comment,
        isInternal: author.role === Role.STUDENT ? false : isInternal
      },
      include: {
        author: { select: { id: true, name: true, role: true } }
      }
    });

    return newComment;
  }

  /**
   * Delete an attachment from a complaint (only creator or admin)
   */
  public static async deleteAttachment(complaintId: string, attachmentId: string, user: UserPayload) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { attachments: true }
    });
    if (!complaint) throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    if (user.role === Role.STUDENT && complaint.createdById !== user.id) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    const attachment = complaint.attachments.find((a) => a.id === attachmentId);
    if (!attachment) throw new AppError('Attachment not found', 404, 'NOT_FOUND');

    await prisma.fileAttachment.delete({ where: { id: attachmentId } });
    
    // Attempt to delete from physical storage
    await StorageService.deleteFile(attachment.fileUrl).catch(console.error);

    return { success: true, message: 'Attachment deleted successfully' };
  }

  /**
   * Toggle student upvote ("I'm Affected Too") for a complaint
   */
  public static async toggleUpvote(complaintId: string, user: UserPayload) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true, title: true, createdById: true, complaintNumber: true }
    });
    if (!complaint) throw new AppError('Complaint not found', 404, 'NOT_FOUND');

    const existing = await prisma.complaintUpvote.findUnique({
      where: {
        complaintId_userId: {
          complaintId,
          userId: user.id
        }
      }
    });

    let upvoted = false;
    if (existing) {
      await prisma.complaintUpvote.delete({
        where: { id: existing.id }
      });
      upvoted = false;
    } else {
      await prisma.complaintUpvote.create({
        data: {
          complaintId,
          userId: user.id
        }
      });
      upvoted = true;

      // Notify the complaint creator if not self
      if (complaint.createdById !== user.id) {
        await NotificationService.createNotification(
          complaint.createdById,
          'Community Issue Confirmed',
          `${user.name || 'Another student'} also confirmed they are affected by #${complaint.complaintNumber} ("${complaint.title}").`,
          'COMMUNITY_UPVOTE',
          complaint.id
        );
      }
    }

    const upvoteCount = await prisma.complaintUpvote.count({
      where: { complaintId }
    });

    return {
      upvoted,
      upvoteCount,
      message: upvoted
        ? 'You have been marked as affected by this issue. You will receive updates.'
        : 'Your confirmation has been removed.'
    };
  }

  /**
   * Mark a complaint as a duplicate of an existing primary complaint
   */
  public static async markAsDuplicate(
    complaintId: string,
    originalComplaintId: string,
    user: UserPayload,
    reason?: string
  ) {
    if (complaintId === originalComplaintId) {
      throw new AppError('A complaint cannot be marked as a duplicate of itself', 400, 'BAD_REQUEST');
    }

    const [duplicateComplaint, originalComplaint] = await Promise.all([
      prisma.complaint.findUnique({ where: { id: complaintId } }),
      prisma.complaint.findUnique({ where: { id: originalComplaintId } })
    ]);

    if (!duplicateComplaint) throw new AppError('Complaint to mark as duplicate not found', 404, 'NOT_FOUND');
    if (!originalComplaint) throw new AppError('Original reference complaint not found', 404, 'NOT_FOUND');

    // Only technician or admin can link duplicates
    if (user.role === Role.STUDENT) {
      throw new AppError('Students cannot link tickets as duplicates', 403, 'FORBIDDEN');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.complaint.update({
        where: { id: complaintId },
        data: {
          duplicateOfId: originalComplaintId,
          status: Status.CLOSED,
          closedAt: new Date()
        }
      });

      await tx.statusHistory.create({
        data: {
          complaintId,
          changedById: user.id,
          oldStatus: duplicateComplaint.status,
          newStatus: Status.CLOSED,
          reason: `Linked as duplicate of ${originalComplaint.complaintNumber}. Reason: ${reason || 'Identical issue.'}`
        }
      });

      await tx.complaintComment.create({
        data: {
          complaintId,
          authorId: user.id,
          comment: `Marked as duplicate of #${originalComplaint.complaintNumber} ("${originalComplaint.title}"). Track updates on the original ticket.`,
          isInternal: false
        }
      });

      return comp;
    });

    // Notify the student who created the duplicate ticket
    await NotificationService.createNotification(
      duplicateComplaint.createdById,
      'Complaint Marked as Duplicate',
      `Your complaint #${duplicateComplaint.complaintNumber} was linked as duplicate to #${originalComplaint.complaintNumber}. Resolution will be tracked on the original ticket.`,
      'DUPLICATE_LINKED',
      originalComplaint.id
    );

    // Also auto-add student as an upvoter to the original complaint if not already
    const existingUpvote = await prisma.complaintUpvote.findUnique({
      where: {
        complaintId_userId: {
          complaintId: originalComplaintId,
          userId: duplicateComplaint.createdById
        }
      }
    });

    if (!existingUpvote) {
      await prisma.complaintUpvote.create({
        data: {
          complaintId: originalComplaintId,
          userId: duplicateComplaint.createdById
        }
      });
    }

    return updated;
  }

  /**
   * Real-time duplicate & similar complaint detection search
   */
  public static async checkSimilarComplaints(input: CheckSimilarInput) {
    const similarityService = new ComplaintSimilarityService(prisma);
    return similarityService.findSimilarComplaints(input);
  }
}
