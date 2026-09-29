import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { requireAuth, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(requireAuth);
router.use(requireRole(Role.ADMIN));

router.get('/overview', AnalyticsController.getOverview);
router.get('/categories', AnalyticsController.getCategories);
router.get('/departments', AnalyticsController.getDepartments);
router.get('/priorities', AnalyticsController.getPriorities);
router.get('/recurring', AnalyticsController.getRecurring);
router.get('/hotspots', AnalyticsController.getHotspots);

export default router;
