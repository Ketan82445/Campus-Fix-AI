import { Router } from 'express';
import { WorkOrderController } from '../controllers/workOrderController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// All work order operations require authentication
router.use(requireAuth);

// Metric summaries for dashboards
router.get('/metrics', WorkOrderController.getMetrics);

// Query and single item details
router.get('/', WorkOrderController.getAll);
router.post('/smart-schedule', requireRole(Role.ADMIN, Role.TECHNICIAN), WorkOrderController.smartSchedule);
router.get('/:id', WorkOrderController.getById);
router.get('/:id/troubleshoot', requireRole(Role.ADMIN, Role.TECHNICIAN), WorkOrderController.getTroubleshootingSteps);

// Create formal work order (Admin or Technician)
router.post('/', requireRole(Role.ADMIN, Role.TECHNICIAN), WorkOrderController.create);

// Operational execution endpoints
router.patch('/:id/status', requireRole(Role.ADMIN, Role.TECHNICIAN), WorkOrderController.updateStatus);
router.patch('/:id/assign', requireRole(Role.ADMIN), WorkOrderController.assignTechnician);
router.post('/:id/parts', requireRole(Role.ADMIN, Role.TECHNICIAN), WorkOrderController.addPart);
router.patch('/:id/checklist', requireRole(Role.ADMIN, Role.TECHNICIAN), WorkOrderController.updateChecklist);
router.post('/:id/attachments', WorkOrderController.addAttachment);

// Verification and Closure
router.post('/:id/confirm', requireRole(Role.STUDENT, Role.ADMIN), WorkOrderController.confirmWork);
router.post('/:id/approve', requireRole(Role.ADMIN), WorkOrderController.approveWork);

export default router;
