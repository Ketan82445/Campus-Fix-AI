import { Router } from 'express';
import { ComplaintController } from '../controllers/complaintController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.post('/analyze', requireRole(Role.STUDENT, Role.ADMIN), ComplaintController.analyze);
router.post('/analyze-image', requireRole(Role.STUDENT, Role.ADMIN), ComplaintController.analyzeImage);
router.post('/', requireRole(Role.STUDENT, Role.ADMIN), ComplaintController.create);
router.post('/upload', ComplaintController.uploadAttachment);
router.post('/check-similar', ComplaintController.checkSimilar);
router.get('/', ComplaintController.getMany);
router.get('/:id', ComplaintController.getById);
router.post('/:id/upvote', ComplaintController.toggleUpvote);
router.post('/:id/follow', requireRole(Role.STUDENT, Role.ADMIN), ComplaintController.follow);
router.post('/:id/mark-duplicate', requireRole(Role.TECHNICIAN, Role.ADMIN), ComplaintController.markDuplicate);
router.post('/:id/status', ComplaintController.updateStatus);
router.post('/:id/reopen', requireRole(Role.STUDENT, Role.ADMIN), ComplaintController.reopen);
router.post('/:id/review-ai', requireRole(Role.ADMIN), ComplaintController.reviewAI);
router.post('/:id/comments', ComplaintController.addComment);
router.delete('/:id/attachments/:attachmentId', ComplaintController.deleteAttachment);

export default router;
