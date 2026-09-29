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
   * Detect Problem Hotspots (Cluster 7)
   */
  public static async getProblemHotspots(days: number = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // 1. Building + Floor level hotspots
    const buildingFloorStats = await prisma.complaint.groupBy({
      by: ['building', 'floor'],
      where: {
        createdAt: { gte: sinceDate },
        building: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    // 2. Specific raw location string hotspots
    const locationStats = await prisma.complaint.groupBy({
      by: ['location'],
      where: {
        createdAt: { gte: sinceDate }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    return {
      byBuildingAndFloor: buildingFloorStats.map(stat => ({
        building: stat.building,
        floor: stat.floor || 'Unknown Floor',
        issueCount: stat._count.id
      })),
      byLocation: locationStats.map(stat => ({
        location: stat.location,
        issueCount: stat._count.id
      }))
    };
  }

  /**
   * Detect Recurring Issues (Cluster 8)
   * Groups by identical category + location within a timeframe to spot systemic problems.
   */
  public static async getRecurringIssues(days: number = 30) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const items = await prisma.complaint.groupBy({
      by: ['location', 'category'],
      where: {
        createdAt: { gte: sinceDate }
      },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } } // At least 2 issues
      },
      orderBy: { _count: { id: 'desc' } },
      take: 15
    });

    return items.map(item => {
      const count = item._count.id;
      let severity = 'NOTICE';
      if (count >= 5) severity = 'CRITICAL';
      else if (count >= 3) severity = 'WARNING';

      return {
        location: item.location,
        category: item.category,
        count: count,
        severity,
        isSystemicRisk: count >= 3
      };
    });
  }
}
