import { prisma } from '../config/prisma';
import { Status, Priority, Role } from '@prisma/client';

export class AnalyticsService {
  public static async getOverviewStats() {
    const [
      total,
      openCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      criticalCount,
      reopenedCount,
      pendingAiReview
    ] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: { in: [Status.SUBMITTED, Status.ASSIGNED] } } }),
      prisma.complaint.count({ where: { status: Status.IN_PROGRESS } }),
      prisma.complaint.count({ where: { status: Status.RESOLVED } }),
      prisma.complaint.count({ where: { status: Status.CLOSED } }),
      prisma.complaint.count({ where: { priority: Priority.CRITICAL } }),
      prisma.complaint.count({ where: { status: Status.REOPENED } }),
      prisma.complaint.count({ where: { status: Status.AI_REVIEW_REQUIRED } })
    ]);

    return {
      total,
      openCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      criticalCount,
      reopenedCount,
      pendingAiReview
    };
  }

  public static async getCategoryDistribution() {
    const group = await prisma.complaint.groupBy({
      by: ['category'],
      _count: { id: true }
    });

    return group.map(g => ({
      category: g.category,
      count: g._count.id
    }));
  }

  public static async getDepartmentWorkload() {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            complaints: true,
            users: true
          }
        },
        complaints: {
          where: { status: { in: [Status.ASSIGNED, Status.IN_PROGRESS] } }
        }
      }
    });

    return departments.map(d => ({
      id: d.id,
      name: d.name,
      code: d.code,
      totalComplaints: d._count.complaints,
      technicianCount: d._count.users,
      activeComplaints: d.complaints.length
    }));
  }

  public static async getPriorityBreakdown() {
    const group = await prisma.complaint.groupBy({
      by: ['priority'],
      _count: { id: true }
    });

    return group.map(g => ({
      priority: g.priority,
      count: g._count.id
    }));
  }

  /**
   * Detect Recurring Issues: Group by location and category
   */
  public static async getRecurringIssues() {
    const items = await prisma.complaint.groupBy({
      by: ['location', 'category'],
      _count: { id: true },
      having: {
        id: { _count: { gte: 2 } }
      }
    });

    return items.map(item => ({
      location: item.location,
      category: item.category,
      count: item._count.id,
      isFlagged: item._count.id >= 3
    }));
  }
}
