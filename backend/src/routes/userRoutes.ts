import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);
router.get('/', requireRole(Role.ADMIN), UserController.getUsers);
router.get('/technicians', UserController.getTechnicians);

export default router;
