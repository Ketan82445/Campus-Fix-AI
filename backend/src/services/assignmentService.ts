import { prisma } from '../config/prisma';
import { Role, Status, AssignmentStatus } from '@prisma/client';
import { FeedbackService } from './feedbackService';

export class AssignmentService {
  /**
   * Smart Multi-Factor Technician Assignment (Cluster 5)
   * Assigns based on workload, SLA performance, and student ratings.
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

    // Calculate Suitability Score for each technician
    const scoredTechnicians = await Promise.all(technicians.map(async (tech) => {
      let score = 100;
      let logs = [];

      // 1. Workload Penalty (-15 per active task)
      const activeTasks = tech.assignedComplaints.length;
      const workloadPenalty = activeTasks * 15;
      score -= workloadPenalty;
      logs.push(`Base: 100, Workload(-${workloadPenalty})`);

      // 2. SLA Penalty (-20 per breached active task)
      const breachedTasks = tech.assignedComplaints.filter(c => c.slaBreached).length;
      const slaPenalty = breachedTasks * 20;
      score -= slaPenalty;
      if (slaPenalty > 0) logs.push(`SLA Breach(-${slaPenalty})`);

      // 3. Performance Rating Bonus (up to +20)
      const stats = await FeedbackService.getTechnicianPerformance(tech.id);
      let ratingBonus = 0;
      if (stats.totalReviews > 0) {
        // e.g., 5 stars -> (5-3)*10 = +20; 3 stars -> 0; 1 star -> -20
        ratingBonus = (stats.averageRating - 3) * 10; 
        score += ratingBonus;
        logs.push(`Rating Bonus(${ratingBonus > 0 ? '+' : ''}${ratingBonus})`);
      } else {
        // No reviews yet, give neutral bonus
        logs.push(`Rating Bonus(0)`);
      }

      // 4. Random tie-breaker (0-5)
      const tieBreaker = Math.floor(Math.random() * 5);
      score += tieBreaker;

      return {
        technician: tech,
        score,
        activeTasks,
        logSummary: logs.join(', ') + ` -> Final: ${score}`
      };
    }));

    // Sort descending by score
    scoredTechnicians.sort((a, b) => b.score - a.score);
    const chosen = scoredTechnicians[0];

    // Create assignment record
    const assignment = await prisma.assignment.create({
      data: {
        complaintId: complaintId,
        technicianId: chosen.technician.id,
        assignedById: assignedById || null,
        status: AssignmentStatus.ASSIGNED,
        notes: `Smart-Assigned (Score: ${chosen.score}). Details: ${chosen.logSummary}`
      }
    });

    // Update complaint record
    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        assignedTechnicianId: chosen.technician.id,
        status: Status.ASSIGNED
      }
    });

    // Log this smart assignment event
    await prisma.auditLog.create({
      data: {
        actorId: assignedById || 'SYSTEM',
        action: 'SMART_ASSIGNMENT_EXECUTED',
        entityType: 'COMPLAINT',
        entityId: complaintId,
        metadata: JSON.stringify({
          technicianId: chosen.technician.id,
          technicianName: chosen.technician.name,
          score: chosen.score,
          details: chosen.logSummary,
          poolSize: technicians.length
        })
      }
    });

    return chosen.technician;
  }
}
