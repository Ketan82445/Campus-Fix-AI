import { Router } from 'express';
import { incidentController } from '../controllers/incidentController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

// Get active incidents (Admins, Technicians, Students can view)
router.get('/', incidentController.getActiveIncidents);
router.get('/:id', incidentController.getIncident);

// Admin / Technician specific routes
router.use(requireRole(Role.ADMIN, Role.TECHNICIAN));

router.post('/', incidentController.createIncident);
router.post('/:id/link', incidentController.linkComplaints);
router.post('/:id/resolve', incidentController.resolveIncident);

export default router;
