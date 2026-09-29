import { Router } from 'express';
import { SLAController } from '../controllers/slaController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);

router.get('/stats', requireRole(Role.ADMIN, Role.TECHNICIAN), SLAController.getStats);
router.post('/check-escalations', requireRole(Role.ADMIN), SLAController.checkAndEscalate);
router.get('/configs', requireRole(Role.ADMIN), SLAController.getConfigs);
router.put('/configs/:priority', requireRole(Role.ADMIN), SLAController.updateConfig);

export default router;
