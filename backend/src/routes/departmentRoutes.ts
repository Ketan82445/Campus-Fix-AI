import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);
router.get('/', DepartmentController.getAll);
router.post('/', requireRole(Role.ADMIN), DepartmentController.create);

export default router;
