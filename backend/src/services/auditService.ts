import { prisma } from '../config/prisma';

export class AuditService {
  public static async logAction(
    actorId: string | undefined | null,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: any
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: actorId || null,
          action,
          entityType,
          entityId: entityId || null,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
}
