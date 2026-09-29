import { prisma } from '../config/prisma';
import { Category, Status, IncidentSeverity, Role } from '@prisma/client';
import { AppError } from '../types';
import { NotificationService } from './notificationService';

export class IncidentService {
  /**
   * Create a new major Incident and link related complaints
   */
  static async createIncident(
    data: {
      title: string;
      description: string;
      category: Category;
      severity: IncidentSeverity;
      location?: string;
      complaintIds?: string[];
    },
    adminId: string
  ) {
    // 1. Create the incident
    const incident = await prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        severity: data.severity,
        location: data.location,
        status: Status.IN_PROGRESS,
        complaints: {
          connect: data.complaintIds?.map(id => ({ id })) || []
        }
      },
      include: {
        complaints: true
      }
    });

    // 2. Log creation
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'INCIDENT_CREATED',
        entityType: 'INCIDENT',
        entityId: incident.id,
        metadata: JSON.stringify({ 
          linkedComplaintsCount: data.complaintIds?.length || 0 
        })
      }
    });

    // 3. Notify technicians of major incidents
    if (data.severity === IncidentSeverity.CRITICAL || data.severity === IncidentSeverity.MAJOR) {
      const technicians = await prisma.user.findMany({ where: { role: Role.TECHNICIAN } });
      for (const tech of technicians) {
        await NotificationService.createNotification(
          tech.id,
          `${data.severity} INCIDENT ALERT`,
          `${data.title} - ${data.location || 'Campus Wide'}`,
          'INCIDENT_CREATED',
          incident.id
        );
      }
    }

    return incident;
  }

  /**
   * Get all active incidents
   */
  static async getActiveIncidents() {
    return prisma.incident.findMany({
      where: {
        status: { notIn: [Status.RESOLVED, Status.CLOSED] }
      },
      include: {
        _count: { select: { complaints: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get incident details with linked complaints
   */
  static async getIncidentById(incidentId: string) {
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        complaints: {
          select: {
            id: true,
            complaintNumber: true,
            title: true,
            status: true,
            createdAt: true,
            createdById: true
          }
        }
      }
    });

    if (!incident) {
      throw new AppError('Incident not found', 404, 'NOT_FOUND');
    }

    return incident;
  }

  /**
   * Link additional complaints to an incident
   */
  static async linkComplaints(incidentId: string, complaintIds: string[], actorId: string) {
    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        complaints: {
          connect: complaintIds.map(id => ({ id }))
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'INCIDENT_COMPLAINTS_LINKED',
        entityType: 'INCIDENT',
        entityId: incidentId,
        metadata: JSON.stringify({ addedComplaintIds: complaintIds })
      }
    });

    return this.getIncidentById(incidentId);
  }

  /**
   * Resolve an incident and optionally cascade resolve all linked complaints
   */
  static async resolveIncident(incidentId: string, cascadeResolve: boolean, actorId: string) {
    const incident = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: Status.RESOLVED,
        resolvedAt: new Date()
      },
      include: { complaints: true }
    });

    if (cascadeResolve && incident.complaints.length > 0) {
      const complaintIds = incident.complaints.map(c => c.id);
      
      await prisma.complaint.updateMany({
        where: { id: { in: complaintIds }, status: { notIn: [Status.RESOLVED, Status.CLOSED] } },
        data: {
          status: Status.RESOLVED,
          resolvedAt: new Date()
        }
      });

      // Log status history for cascaded resolutions
      const historyData = complaintIds.map(id => ({
        complaintId: id,
        changedById: actorId,
        oldStatus: null, // We'd ideally track this, but simplified for bulk
        newStatus: Status.RESOLVED,
        reason: `Cascaded resolution from Parent Incident: ${incident.title}`
      }));

      await prisma.statusHistory.createMany({ data: historyData });
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'INCIDENT_RESOLVED',
        entityType: 'INCIDENT',
        entityId: incidentId,
        metadata: JSON.stringify({ cascaded: cascadeResolve })
      }
    });

    return incident;
  }
}
