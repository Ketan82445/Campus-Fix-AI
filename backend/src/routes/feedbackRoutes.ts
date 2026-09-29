import { Router } from 'express';
import { feedbackController } from '../controllers/feedbackController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Routes for specific complaint's feedback

// Submit feedback (Student only)
router.post(
  '/:complaintId',
  requireAuth,
  requireRole(Role.STUDENT),
  feedbackController.submitFeedback
);

// Get feedback for a complaint (Open to anyone who can view the complaint)
router.get(
  '/:complaintId',
  requireAuth,
  feedbackController.getFeedback
);

// Get technician average rating (Technician and Admin)
router.get(
  '/technician/:technicianId',
  requireAuth,
  requireRole(Role.ADMIN, Role.TECHNICIAN),
  feedbackController.getTechnicianPerformance
);

export default router;
