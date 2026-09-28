import { prisma } from '../config/prisma';
import { Role, Status, AssignmentStatus } from '@prisma/client';

export class AssignmentService {
  /**
   * Find available technician in department with lowest active workload
   */
  public static async autoAssignTechnician(departmentId: string, complaintId: string, assignedById?: string) {
    const technicians = await prisma.user.findMany({
      where: {
        role: Role.TECHNICIAN,
        departmentId: departmentId
      },
      include: {
        assignedComplaints: {
          where: {
            status: {
              in: [Status.ASSIGNED, Status.IN_PROGRESS]
            }
          }
        }
      }
    });

    if (technicians.length === 0) {
      return null;
    }

    // Sort technicians by count of active complaints ascending
    technicians.sort((a, b) => a.assignedComplaints.length - b.assignedComplaints.length);
    const chosenTechnician = technicians[0];

    // Create assignment record
    const assignment = await prisma.assignment.create({
      data: {
        complaintId: complaintId,
        technicianId: chosenTechnician.id,
        assignedById: assignedById || null,
        status: AssignmentStatus.ASSIGNED,
        notes: `Auto-assigned based on lowest workload (${chosenTechnician.assignedComplaints.length} active tasks)`
      }
    });

    // Update complaint record
    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        assignedTechnicianId: chosenTechnician.id,
        status: Status.ASSIGNED
      }
    });

    return chosenTechnician;
  }
}
