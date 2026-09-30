import { Router } from 'express';
import { InventoryController } from '../controllers/inventoryController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.use(requireRole('ADMIN', 'TECHNICIAN'));

router.get('/', InventoryController.getItems);
router.post('/', InventoryController.createItem);
router.post('/:id/add-stock', InventoryController.addStock);

export default router;
