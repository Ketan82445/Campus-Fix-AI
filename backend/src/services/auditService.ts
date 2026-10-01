import { prisma } from '../config/prisma';
import { Request } from 'express';
import { AuthenticatedRequest } from '../types';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  COMPLAINT_CREATED = 'COMPLAINT_CREATED',
  COMPLAINT_UPDATED = 'COMPLAINT_UPDATED',
  WORK_ORDER_CREATED = 'WORK_ORDER_CREATED',
  WORK_ORDER_STATUS_CHANGED = 'WORK_ORDER_STATUS_CHANGED',
  ASSET_CREATED = 'ASSET_CREATED',
  ASSET_UPDATED = 'ASSET_UPDATED',
  INVENTORY_UPDATED = 'INVENTORY_UPDATED',
  AI_REVIEWED = 'AI_REVIEWED'
}

export enum EntityType {
  USER = 'USER',
  COMPLAINT = 'COMPLAINT',
  WORK_ORDER = 'WORK_ORDER',
  ASSET = 'ASSET',
  INVENTORY = 'INVENTORY',
  DEPARTMENT = 'DEPARTMENT'
}

export class AuditService {
  /**
   * Securely log an action to the database.
   */
  public static async logAction(
    actorId: string | null,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: any
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId,
          action,
          entityType,
          entityId,
          metadata: metadata ? JSON.stringify(metadata) : null,
          ipAddress: null, // Could be passed in via metadata or explicitly if needed
          userAgent: null
        }
      });
    } catch (error) {
      // We do not throw here to prevent breaking the main transaction. 
      // In a strict enterprise system, audit failure might require transaction rollback,
      // but for standard logging, failing gracefully is safer for UX.
      console.error('CRITICAL: Failed to write to AuditLog:', error);
    }
  }
}
