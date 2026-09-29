import { prisma } from '../config/prisma';
import { Status, Role } from '@prisma/client';

export class FeedbackService {
  /**
   * Submit feedback for a resolved/closed complaint.
   */
  static async submitFeedback(complaintId: string, studentId: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // 1. Verify complaint exists and belongs to student
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { feedback: true }
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    if (complaint.createdById !== studentId) {
      throw new Error('You do not have permission to review this complaint');
    }

    if (complaint.status !== Status.RESOLVED && complaint.status !== Status.CLOSED) {
      throw new Error('Feedback can only be submitted for RESOLVED or CLOSED complaints');
    }

    if (complaint.feedback) {
      throw new Error('Feedback has already been submitted for this complaint');
    }

    // 2. Create the feedback record
    const feedback = await prisma.complaintFeedback.create({
      data: {
        complaintId,
        studentId,
        rating,
        comment
      }
    });

    // 3. Log the action
    await prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'FEEDBACK_SUBMITTED',
        entityType: 'COMPLAINT',
        entityId: complaintId,
        metadata: JSON.stringify({ rating, hasComment: !!comment })
      }
    });

    return feedback;
  }

  /**
   * Get feedback for a specific complaint.
   */
  static async getFeedbackByComplaint(complaintId: string) {
    return prisma.complaintFeedback.findUnique({
      where: { complaintId },
      include: {
        student: {
          select: { id: true, name: true }
        }
      }
    });
  }

  /**
   * Get technician's average rating based on all resolved complaints assigned to them.
   */
  static async getTechnicianPerformance(technicianId: string) {
    const assignedComplaints = await prisma.complaint.findMany({
      where: {
        assignedTechnicianId: technicianId,
        feedback: { isNot: null }
      },
      include: {
        feedback: true
      }
    });

    if (assignedComplaints.length === 0) {
      return { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    let totalRating = 0;
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    assignedComplaints.forEach(c => {
      if (c.feedback) {
        totalRating += c.feedback.rating;
        ratingDistribution[c.feedback.rating] += 1;
      }
    });

    return {
      averageRating: parseFloat((totalRating / assignedComplaints.length).toFixed(1)),
      totalReviews: assignedComplaints.length,
      ratingDistribution
    };
  }
}
