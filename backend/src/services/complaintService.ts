import { prisma } from '../config/prisma';
import { Category, Priority, Status, Role, AssignmentStatus } from '@prisma/client';
import { AppError, UserPayload } from '../types';
import { AIClientService } from './aiClientService';
import { RoutingService } from './routingService';
import { AssignmentService } from './assignmentService';
import { NotificationService } from './notificationService';
import { AuditService } from './auditService';

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
    manualPriority?: Priority
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

    // 4. Execute DB Transaction
    const complaint = await prisma.$transaction(async (tx) => {
      const createdComplaint = await tx.complaint.create({
        data: {
          complaintNumber,
          title,
          description,
          location,
          category,
          priority,
          status: initialStatus,
          aiConfidence: aiResult.confidence,
          createdById: creator.id,
          departmentId: targetDept ? targetDept.id : null
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
          assignedTechnician: { select: { id: true, name: true, email: true, phone: true } }
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
        }
      }
    });

    if (!complaint) {
      throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    }

    // Access check
    if (user.role === Role.STUDENT && complaint.createdById !== user.id) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }

    return complaint;
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
    if (newStatus === Status.RESOLVED) updatedData.resolvedAt = new Date();
    if (newStatus === Status.CLOSED) updatedData.closedAt = new Date();

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
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new AppError('Complaint not found', 404, 'NOT_FOUND');

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
}
