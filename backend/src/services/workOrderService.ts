import { prisma } from '../config/prisma';
import { AppError, UserPayload } from '../types';
import { AuditService } from './auditService';
import { Priority, Role, Status, WorkOrderStatus } from '@prisma/client';

export interface CreateWorkOrderInput {
  complaintId: string;
  technicianId?: string;
  supervisorId?: string;
  departmentId?: string;
  priority?: Priority;
  scheduledDate?: string | Date;
  estimatedHours?: number;
  notes?: string;
  checklist?: any;
}

export interface WorkOrderFilterQuery {
  status?: WorkOrderStatus;
  priority?: Priority;
  technicianId?: string;
  departmentId?: string;
  complaintId?: string;
  search?: string;
  page?: number | string;
  limit?: number | string;
}

export class WorkOrderService {
  /**
   * Helper to generate a production-grade Work Order Number
   * Format: WO-YYYYMM-XXXX (e.g. WO-202610-4821)
   */
  private static generateWorkOrderNumber(): string {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `WO-${yearMonth}-${randomSuffix}`;
  }

  /**
   * Create a new formal Work Order from a Complaint
   */
  public static async createWorkOrder(data: CreateWorkOrderInput, user: UserPayload) {
    const complaint = await prisma.complaint.findUnique({
      where: { id: data.complaintId },
      include: { workOrder: true }
    });

    if (!complaint) {
      throw new AppError('Associated complaint not found', 404, 'NOT_FOUND');
    }

    if (complaint.workOrder) {
      throw new AppError('A work order already exists for this complaint', 409, 'WORK_ORDER_EXISTS');
    }

    // Default checklist if not provided
    const defaultChecklist = [
      { id: '1', task: 'Inspect initial condition & safety check', completed: false },
      { id: '2', task: 'Diagnose root cause & determine required parts', completed: false },
      { id: '3', task: 'Perform repair or replacement work', completed: false },
      { id: '4', task: 'Test functionality & clean work area', completed: false },
      { id: '5', task: 'Document resolution and capture after-photos', completed: false }
    ];

    const initialStatus: WorkOrderStatus = data.technicianId
      ? WorkOrderStatus.ASSIGNED
      : WorkOrderStatus.CREATED;

    let workOrderNumber = this.generateWorkOrderNumber();
    // Safety check for unique number
    let existing = await prisma.workOrder.findUnique({ where: { workOrderNumber } });
    while (existing) {
      workOrderNumber = this.generateWorkOrderNumber();
      existing = await prisma.workOrder.findUnique({ where: { workOrderNumber } });
    }

    const workOrder = await prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.create({
        data: {
          workOrderNumber,
          complaintId: data.complaintId,
          technicianId: data.technicianId || null,
          supervisorId: data.supervisorId || (user.role === Role.ADMIN ? user.id : null),
          departmentId: data.departmentId || complaint.departmentId || null,
          priority: data.priority || complaint.priority,
          status: initialStatus,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
          estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : null,
          notes: data.notes || null,
          checklist: JSON.stringify(data.checklist || defaultChecklist)
        },
        include: {
          complaint: {
            select: { id: true, complaintNumber: true, title: true, location: true, category: true }
          },
          technician: {
            select: { id: true, name: true, email: true, phone: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          }
        }
      });

      // Synchronize Complaint status with Work Order creation
      if (data.technicianId) {
        await tx.complaint.update({
          where: { id: data.complaintId },
          data: {
            assignedTechnicianId: data.technicianId,
            status: Status.ASSIGNED
          }
        });
      }

      return wo;
    });

    await AuditService.logAction(
      user.id,
      'WORK_ORDER_CREATED',
      'WORK_ORDER',
      workOrder.id,
      { workOrderNumber: workOrder.workOrderNumber, complaintId: data.complaintId }
    );

    return workOrder;
  }

  /**
   * List Work Orders with filters, search, pagination, and RBAC scoping
   */
  public static async getWorkOrders(query: WorkOrderFilterQuery, user: UserPayload) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.complaintId) where.complaintId = query.complaintId;

    // RBAC Scoping
    if (user.role === Role.STUDENT) {
      where.complaint = { createdById: user.id };
    } else if (user.role === Role.TECHNICIAN) {
      if (query.technicianId) {
        where.technicianId = query.technicianId;
      } else {
        // Technician sees their assigned jobs, or unassigned jobs in their department
        where.OR = [
          { technicianId: user.id },
          ...(user.departmentId
            ? [{ departmentId: user.departmentId, status: WorkOrderStatus.CREATED }]
            : [])
        ];
      }
    } else if (query.technicianId) {
      where.technicianId = query.technicianId;
    }

    if (query.search) {
      where.OR = [
        { workOrderNumber: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
        { complaint: { title: { contains: query.search, mode: 'insensitive' } } },
        { complaint: { complaintNumber: { contains: query.search, mode: 'insensitive' } } }
      ];
    }

    const [total, workOrders] = await Promise.all([
      prisma.workOrder.count({ where }),
      prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          complaint: {
            select: {
              id: true,
              complaintNumber: true,
              title: true,
              category: true,
              location: true,
              building: true,
              floor: true,
              room: true,
              createdById: true,
              createdAt: true
            }
          },
          technician: {
            select: { id: true, name: true, email: true, phone: true }
          },
          department: {
            select: { id: true, name: true, code: true }
          },
          parts: {
            include: {
              inventory: { select: { id: true, name: true, sku: true, quantity: true } }
            }
          },
          attachments: {
            select: { id: true, fileName: true, fileUrl: true, mimeType: true, category: true }
          }
        }
      })
    ]);

    return {
      workOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single Work Order by ID with complete details
   */
  public static async getWorkOrderById(id: string, user: UserPayload) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        complaint: {
          include: {
            createdBy: { select: { id: true, name: true, email: true, phone: true } },
            department: { select: { id: true, name: true } },
            attachments: true
          }
        },
        technician: {
          select: { id: true, name: true, email: true, phone: true }
        },
        supervisor: {
          select: { id: true, name: true, email: true }
        },
        department: true,
        parts: {
          include: {
            inventory: true
          }
        },
        attachments: true
      }
    });

    if (!workOrder) {
      throw new AppError('Work Order not found', 404, 'NOT_FOUND');
    }

    // Role verification for students
    if (user.role === Role.STUDENT && workOrder.complaint.createdById !== user.id) {
      throw new AppError('Access denied to this work order', 403, 'FORBIDDEN');
    }

    return workOrder;
  }

  /**
   * Update Work Order Status and enforce operational lifecycle rules
   */
  public static async updateStatus(
    id: string,
    status: WorkOrderStatus,
    user: UserPayload,
    payload?: {
      resolutionNotes?: string;
      actualHours?: number;
      notes?: string;
    }
  ) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { complaint: true }
    });

    if (!workOrder) {
      throw new AppError('Work Order not found', 404, 'NOT_FOUND');
    }

    // Permissions check
    if (user.role === Role.TECHNICIAN) {
      if (workOrder.technicianId && workOrder.technicianId !== user.id) {
        throw new AppError('You are not assigned to this work order', 403, 'FORBIDDEN');
      }

      // Technicians can only move within operational execution states
      const allowedTechStatuses: WorkOrderStatus[] = [
        WorkOrderStatus.ACKNOWLEDGED,
        WorkOrderStatus.IN_PROGRESS,
        WorkOrderStatus.WAITING_FOR_PARTS,
        WorkOrderStatus.WAITING_FOR_APPROVAL,
        WorkOrderStatus.RESOLVED
      ];

      if (!allowedTechStatuses.includes(status)) {
        throw new AppError(`Technicians cannot transition status to ${status}`, 403, 'FORBIDDEN');
      }
    }

    const updateData: any = {
      status,
      ...(payload?.notes && { notes: payload.notes })
    };

    // Auto-populate timestamps according to state transitions
    if (status === WorkOrderStatus.IN_PROGRESS && !workOrder.startedDate) {
      updateData.startedDate = new Date();
    }

    if (status === WorkOrderStatus.RESOLVED) {
      updateData.completedDate = new Date();
      if (payload?.resolutionNotes) updateData.resolutionNotes = payload.resolutionNotes;
      if (payload?.actualHours) updateData.actualHours = Number(payload.actualHours);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id },
        data: updateData
      });

      // Synchronize associated Complaint status
      if (status === WorkOrderStatus.IN_PROGRESS) {
        await tx.complaint.update({
          where: { id: workOrder.complaintId },
          data: { status: Status.IN_PROGRESS }
        });
      } else if (status === WorkOrderStatus.RESOLVED) {
        await tx.complaint.update({
          where: { id: workOrder.complaintId },
          data: {
            status: Status.RESOLVED,
            resolvedAt: new Date()
          }
        });
      } else if (status === WorkOrderStatus.CLOSED) {
        await tx.complaint.update({
          where: { id: workOrder.complaintId },
          data: {
            status: Status.CLOSED,
            closedAt: new Date()
          }
        });
      }

      return wo;
    });

    await AuditService.logAction(
      user.id,
      'WORK_ORDER_STATUS_CHANGED',
      'WORK_ORDER',
      id,
      { oldStatus: workOrder.status, newStatus: status, payload }
    );

    return updated;
  }

  /**
   * Assign or Reassign Technician & Schedule Work
   */
  public static async assignTechnician(
    id: string,
    data: { technicianId: string; scheduledDate?: string | Date; estimatedHours?: number },
    user: UserPayload
  ) {
    if (user.role !== Role.ADMIN) {
      throw new AppError('Only administrators can assign technicians', 403, 'FORBIDDEN');
    }

    const technician = await prisma.user.findFirst({
      where: { id: data.technicianId, role: Role.TECHNICIAN }
    });

    if (!technician) {
      throw new AppError('Designated technician not found or invalid role', 404, 'NOT_FOUND');
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id }
    });

    if (!workOrder) {
      throw new AppError('Work Order not found', 404, 'NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.update({
        where: { id },
        data: {
          technicianId: data.technicianId,
          status: data.scheduledDate ? WorkOrderStatus.SCHEDULED : WorkOrderStatus.ASSIGNED,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : workOrder.scheduledDate,
          estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : workOrder.estimatedHours
        },
        include: {
          technician: { select: { id: true, name: true, email: true, phone: true } }
        }
      });

      await tx.complaint.update({
        where: { id: workOrder.complaintId },
        data: {
          assignedTechnicianId: data.technicianId,
          status: Status.ASSIGNED
        }
      });

      return wo;
    });

    await AuditService.logAction(
      user.id,
      'WORK_ORDER_ASSIGNED',
      'WORK_ORDER',
      id,
      { technicianId: data.technicianId, technicianName: technician.name }
    );

    return updated;
  }

  /**
   * Record parts used from inventory in a safe transaction (with stock verification)
   */
  public static async addPart(
    id: string,
    data: { inventoryId: string; quantityUsed: number },
    user: UserPayload
  ) {
    const qty = Number(data.quantityUsed);
    if (!qty || qty <= 0) {
      throw new AppError('Quantity used must be greater than 0', 400);
    }

    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) throw new AppError('Work Order not found', 404, 'NOT_FOUND');

    const inventory = await prisma.inventoryItem.findUnique({
      where: { id: data.inventoryId }
    });

    if (!inventory) throw new AppError('Inventory item not found', 404, 'NOT_FOUND');

    if (inventory.quantity < qty) {
      throw new AppError(
        `Insufficient stock for "${inventory.name}". Available: ${inventory.quantity}, Requested: ${qty}`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct stock from Inventory
      const updatedInventory = await tx.inventoryItem.update({
        where: { id: data.inventoryId },
        data: { quantity: { decrement: qty } }
      });

      // 2. Add or increment WorkOrderPart record
      const existingPart = await tx.workOrderPart.findFirst({
        where: { workOrderId: id, inventoryId: data.inventoryId }
      });

      let partRecord;
      if (existingPart) {
        partRecord = await tx.workOrderPart.update({
          where: { id: existingPart.id },
          data: { quantityUsed: { increment: qty } }
        });
      } else {
        partRecord = await tx.workOrderPart.create({
          data: {
            workOrderId: id,
            inventoryId: data.inventoryId,
            quantityUsed: qty
          }
        });
      }

      return { partRecord, remainingStock: updatedInventory.quantity };
    });

    await AuditService.logAction(
      user.id,
      'INVENTORY_UPDATED',
      'WORK_ORDER',
      id,
      { inventoryId: data.inventoryId, itemName: inventory.name, quantityUsed: qty }
    );

    return result;
  }

  /**
   * Update Checklist tasks
   */
  public static async updateChecklist(id: string, checklist: any, user: UserPayload) {
    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) throw new AppError('Work Order not found', 404, 'NOT_FOUND');

    const updated = await prisma.workOrder.update({
      where: { id },
      data: { checklist: typeof checklist === 'string' ? checklist : JSON.stringify(checklist) }
    });

    return updated;
  }

  /**
   * Student confirms work completion (Student Verification)
   */
  public static async confirmWork(id: string, confirmed: boolean, user: UserPayload) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { complaint: true }
    });

    if (!workOrder) throw new AppError('Work Order not found', 404, 'NOT_FOUND');

    if (user.role === Role.STUDENT && workOrder.complaint.createdById !== user.id) {
      throw new AppError('Only the complaint author can confirm this work order', 403, 'FORBIDDEN');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        studentConfirmed: confirmed,
        ...(confirmed && workOrder.status === WorkOrderStatus.RESOLVED
          ? { status: WorkOrderStatus.VERIFIED }
          : {})
      }
    });

    await AuditService.logAction(
      user.id,
      'WORK_ORDER_CONFIRMED',
      'WORK_ORDER',
      id,
      { studentConfirmed: confirmed }
    );

    return updated;
  }

  /**
   * Supervisor approval of completed Work Order
   */
  public static async approveWork(id: string, approved: boolean, user: UserPayload) {
    if (user.role !== Role.ADMIN) {
      throw new AppError('Only supervisors/admins can approve work orders', 403, 'FORBIDDEN');
    }

    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) throw new AppError('Work Order not found', 404, 'NOT_FOUND');

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        supervisorApproved: approved,
        supervisorId: user.id,
        ...(approved && workOrder.status === WorkOrderStatus.VERIFIED
          ? { status: WorkOrderStatus.CLOSED }
          : {})
      }
    });

    await AuditService.logAction(
      user.id,
      'WORK_ORDER_APPROVED',
      'WORK_ORDER',
      id,
      { supervisorApproved: approved, supervisorId: user.id }
    );

    return updated;
  }

  /**
   * Attach files (e.g. Before / After photos, invoices)
   */
  public static async addAttachment(
    id: string,
    fileData: { fileName: string; fileUrl: string; fileSize: number; mimeType: string; category?: string },
    user: UserPayload
  ) {
    const workOrder = await prisma.workOrder.findUnique({ where: { id } });
    if (!workOrder) throw new AppError('Work Order not found', 404, 'NOT_FOUND');

    const attachment = await prisma.fileAttachment.create({
      data: {
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        category: fileData.category || 'WORK_ORDER_EVIDENCE',
        uploaderId: user.id,
        workOrderId: id
      }
    });

    return attachment;
  }

  /**
   * Technician & Operational productivity metrics
   */
  public static async getMetrics(user: UserPayload) {
    const where: any = {};
    if (user.role === Role.TECHNICIAN) {
      where.technicianId = user.id;
    }

    const [total, inProgress, waitingParts, resolved, closed] = await Promise.all([
      prisma.workOrder.count({ where }),
      prisma.workOrder.count({ where: { ...where, status: WorkOrderStatus.IN_PROGRESS } }),
      prisma.workOrder.count({ where: { ...where, status: WorkOrderStatus.WAITING_FOR_PARTS } }),
      prisma.workOrder.count({ where: { ...where, status: WorkOrderStatus.RESOLVED } }),
      prisma.workOrder.count({ where: { ...where, status: WorkOrderStatus.CLOSED } })
    ]);

    return {
      total,
      active: inProgress + waitingParts,
      inProgress,
      waitingParts,
      resolved,
      closed
    };
  }
}
