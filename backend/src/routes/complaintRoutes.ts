import { Router } from 'express';
import { ComplaintController } from '../controllers/complaintController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.post('/', requireRole(Role.STUDENT, Role.ADMIN), ComplaintController.create);
router.get('/', ComplaintController.getMany);
router.get('/:id', ComplaintController.getById);
router.post('/:id/status', ComplaintController.updateStatus);
router.post('/:id/reopen', requireRole(Role.STUDENT, Role.ADMIN), ComplaintController.reopen);
router.post('/:id/review-ai', requireRole(Role.ADMIN), ComplaintController.reviewAI);
router.post('/:id/comments', ComplaintController.addComment);

export default router;
