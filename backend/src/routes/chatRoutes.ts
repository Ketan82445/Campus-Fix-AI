import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.post('/', ChatController.handleChat);

export default router;
