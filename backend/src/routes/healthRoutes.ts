import { Router } from 'express';
import { prisma } from '../config/prisma';
import { AIClientService } from '../services/aiClientService';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/', async (req, res) => {
  let dbStatus = 'ok';
  let dbError = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = 'down';
    dbError = err.message || String(err);
  }

  const aiStatus = await AIClientService.getHealth();

  return sendSuccess(res, {
    backend: 'ok',
    database: dbStatus,
    dbError,
    aiService: aiStatus.status,
    aiModelLoaded: aiStatus.model_loaded,
    timestamp: new Date().toISOString()
  });
});

export default router;
