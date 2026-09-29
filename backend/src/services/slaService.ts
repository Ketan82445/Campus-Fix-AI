import { PrismaClient, Priority, Status, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NotificationService } from './notificationService';
import { AuditService } from './auditService';

export interface SLAConfigData {
  priority: Priority;
  responseHours: number;
  resolutionHours: number;
}

const DEFAULT_SLA: Record<Priority, { responseHours: number; resolutionHours: number }> = {
  [Priority.CRITICAL]: { responseHours: 4, resolutionHours: 12 },
  [Priority.HIGH]: { responseHours: 8, resolutionHours: 24 },
  [Priority.MEDIUM]: { responseHours: 24, resolutionHours: 48 },
  [Priority.LOW]: { responseHours: 48, resolutionHours: 72 }
};

export class SLAService {
  /**
   * Calculate Response and Resolution deadlines based on Priority
   */
  public static async calculateDeadlines(
    priority: Priority,
    fromDate: Date = new Date()
  ): Promise<{ responseDeadline: Date; resolutionDeadline: Date }> {
    let responseHours = DEFAULT_SLA[priority]?.responseHours || 24;
    let resolutionHours = DEFAULT_SLA[priority]?.resolutionHours || 48;

    try {
      const config = await prisma.sLAConfig.findUnique({
        where: { priority }
      });
      if (config) {
        responseHours = config.responseHours;
        resolutionHours = config.resolutionHours;
      }
    } catch {
      // Fall back to defaults
    }

    const responseDeadline = new Date(fromDate.getTime() + responseHours * 60 * 60 * 1000);
    const resolutionDeadline = new Date(fromDate.getTime() + resolutionHours * 60 * 60 * 1000);

    return { responseDeadline, resolutionDeadline };
  }

  /**
   * Record when technician first responds to complaint
   */
  public static async recordResponse(complaintId: string): Promise<void> {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { respondedAt: true, responseDeadline: true }
    });

    if (complaint && !complaint.respondedAt) {
      const now = new Date();
      await prisma.complaint.update({
        where: { id: complaintId },
        data: { respondedAt: now }
      });
    }
  }

  /**
   * Record resolution and evaluate if SLA was breached
   */
  public static async recordResolution(complaintId: string, resolvedAt: Date = new Date()): Promise<boolean> {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      select: { resolutionDeadline: true, slaBreached: true }
    });

    if (!complaint) return false;

    let isBreached = complaint.slaBreached;
    if (complaint.resolutionDeadline && resolvedAt > complaint.resolutionDeadline) {
      isBreached = true;
    }

    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        resolvedAt,
        slaBreached: isBreached
      }
    });

    return isBreached;
  }

  /**
   * Scan active complaints for SLA breaches, mark flags, and trigger escalations
   */
  public static async checkAndEscalateBreachedSLAs(): Promise<{
    checkedCount: number;
    breachedCount: number;
    escalatedCount: number;
  }> {
    const now = new Date();

    // Query open, unresolved complaints
    const openComplaints = await prisma.complaint.findMany({
      where: {
        status: {
          notIn: [Status.RESOLVED, Status.CLOSED, Status.REJECTED]
        }
      },
      include: {
        department: true,
        assignedTechnician: true
      }
    });

    let breachedCount = 0;
    let escalatedCount = 0;

    for (const comp of openComplaints) {
      const isResolutionOverdue = comp.resolutionDeadline && now > comp.resolutionDeadline;
      const isResponseOverdue = comp.responseDeadline && !comp.respondedAt && now > comp.responseDeadline;

      if (isResolutionOverdue || isResponseOverdue) {
        breachedCount++;

        // Determine next escalation level
        let newLevel = comp.escalationLevel;
        let shouldEscalate = false;

        if (comp.escalationLevel === 0) {
          newLevel = 1; // Level 1 Warning
          shouldEscalate = true;
        } else if (comp.escalationLevel === 1) {
          // If overdue by more than 12 additional hours, bump to Level 2 (Critical Admin Escalation)
          const deadline = comp.resolutionDeadline || comp.responseDeadline;
          if (deadline && now.getTime() - deadline.getTime() > 12 * 60 * 60 * 1000) {
            newLevel = 2;
            shouldEscalate = true;
          }
        }

        if (shouldEscalate || !comp.slaBreached) {
          escalatedCount++;

          await prisma.complaint.update({
            where: { id: comp.id },
            data: {
              slaBreached: true,
              escalationLevel: newLevel,
              escalatedAt: now
            }
          });

          // 1. Notify Assigned Technician
          if (comp.assignedTechnicianId) {
            await NotificationService.createNotification(
              comp.assignedTechnicianId,
              `🚨 SLA Breached: #${comp.complaintNumber}`,
              `Complaint #${comp.complaintNumber} ("${comp.title}") has breached its SLA deadline. Immediate action is required.`,
              'SLA_BREACH',
              comp.id
            );
          }

          // 2. Notify Admins on Level 2 Escalation
          if (newLevel >= 2) {
            const admins = await prisma.user.findMany({
              where: { role: Role.ADMIN },
              select: { id: true }
            });

            for (const admin of admins) {
              await NotificationService.createNotification(
                admin.id,
                `⚠️ High Escalation: #${comp.complaintNumber}`,
                `Complaint #${comp.complaintNumber} (${comp.priority} priority in ${comp.department?.name || 'General'}) is severely overdue for resolution.`,
                'SLA_ESCALATION',
                comp.id
              );
            }
          }

          // 3. Log Audit Trail
          await AuditService.logAction(
            comp.id, // entityId
            'COMPLAINT',
            'SLA_BREACH_ESCALATED',
            JSON.stringify({
              complaintNumber: comp.complaintNumber,
              priority: comp.priority,
              escalationLevel: newLevel,
              isResolutionOverdue,
              isResponseOverdue
            })
          );
        }
      }
    }

    return {
      checkedCount: openComplaints.length,
      breachedCount,
      escalatedCount
    };
  }

  /**
   * Get SLA Analytics Metrics for Admin & Technician Dashboards
   */
  public static async getSLAStats(): Promise<{
    totalOpenWithSLA: number;
    breachedTotal: number;
    atRiskCount: number;
    complianceRate: number;
    byPriority: Array<{
      priority: Priority;
      total: number;
      breached: number;
      atRisk: number;
      complianceRate: number;
    }>;
  }> {
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const [allWithSLA, openWithSLA, breachedOpen, resolvedComplaints] = await Promise.all([
      prisma.complaint.findMany({
        where: { resolutionDeadline: { not: null } },
        select: { id: true, priority: true, status: true, slaBreached: true, resolutionDeadline: true, resolvedAt: true }
      }),
      prisma.complaint.count({
        where: {
          status: { notIn: [Status.RESOLVED, Status.CLOSED, Status.REJECTED] },
          resolutionDeadline: { not: null }
        }
      }),
      prisma.complaint.count({
        where: {
          status: { notIn: [Status.RESOLVED, Status.CLOSED, Status.REJECTED] },
          slaBreached: true
        }
      }),
      prisma.complaint.findMany({
        where: {
          status: { in: [Status.RESOLVED, Status.CLOSED] },
          resolutionDeadline: { not: null }
        },
        select: { slaBreached: true, priority: true }
      })
    ]);

    // Complaints within 4 hours of resolution deadline
    const atRiskCount = allWithSLA.filter(
      (c) =>
        ![Status.RESOLVED, Status.CLOSED, Status.REJECTED].includes(c.status as any) &&
        c.resolutionDeadline &&
        c.resolutionDeadline > now &&
        c.resolutionDeadline <= fourHoursFromNow
    ).length;

    // Resolved compliance rate
    const compliantResolved = resolvedComplaints.filter((c) => !c.slaBreached).length;
    const complianceRate =
      resolvedComplaints.length > 0 ? Math.round((compliantResolved / resolvedComplaints.length) * 100) : 100;

    // Breakdown by Priority
    const priorities = [Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW];
    const byPriority = priorities.map((priority) => {
      const priorityItems = allWithSLA.filter((c) => c.priority === priority);
      const priorityBreached = priorityItems.filter((c) => c.slaBreached).length;
      const priorityAtRisk = priorityItems.filter(
        (c) =>
          ![Status.RESOLVED, Status.CLOSED, Status.REJECTED].includes(c.status as any) &&
          c.resolutionDeadline &&
          c.resolutionDeadline > now &&
          c.resolutionDeadline <= fourHoursFromNow
      ).length;

      const priorityResolved = resolvedComplaints.filter((c) => c.priority === priority);
      const priorityCompliant = priorityResolved.filter((c) => !c.slaBreached).length;
      const prioRate =
        priorityResolved.length > 0 ? Math.round((priorityCompliant / priorityResolved.length) * 100) : 100;

      return {
        priority,
        total: priorityItems.length,
        breached: priorityBreached,
        atRisk: priorityAtRisk,
        complianceRate: prioRate
      };
    });

    return {
      totalOpenWithSLA: openWithSLA,
      breachedTotal: breachedOpen,
      atRiskCount,
      complianceRate,
      byPriority
    };
  }

  /**
   * Get all SLA Configurations
   */
  public static async getSLAConfigs() {
    return prisma.sLAConfig.findMany({
      orderBy: { priority: 'asc' }
    });
  }

  /**
   * Update SLA Target Hours (Admin)
   */
  public static async updateSLAConfig(priority: Priority, responseHours: number, resolutionHours: number) {
    return prisma.sLAConfig.upsert({
      where: { priority },
      update: { responseHours, resolutionHours },
      create: { priority, responseHours, resolutionHours }
    });
  }
}
