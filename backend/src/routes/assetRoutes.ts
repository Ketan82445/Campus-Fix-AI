import { Router } from 'express';
import { AssetController } from '../controllers/assetController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Need to be logged in to access assets
router.use(requireAuth);

router.get('/qr/:qrCode', AssetController.getAssetByQrCode);
router.get('/', AssetController.getAssets);
router.get('/:id', AssetController.getAssetById);

// Only ADMIN and TECHNICIAN can manage assets and maintenance
router.use(requireRole('ADMIN', 'TECHNICIAN'));

router.post('/', AssetController.createAsset);
router.post('/:id/maintenance', AssetController.createMaintenance);
router.post('/maintenance/:maintenanceId/complete', AssetController.completeMaintenance);

export default router;
