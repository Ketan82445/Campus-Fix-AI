import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import complaintRoutes from './routes/complaintRoutes';
import departmentRoutes from './routes/departmentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import userRoutes from './routes/userRoutes';
import slaRoutes from './routes/slaRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import incidentRoutes from './routes/incidentRoutes';
import assetRoutes from './routes/assetRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import chatRoutes from './routes/chatRoutes';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or localhost, or vercel apps
      if (
        !origin ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.vercel.app') ||
        origin === env.FRONTEND_URL
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP Request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later.'
    }
  }
});

app.use('/api', apiLimiter);

// API Route Mounts (supports both /api/* and root /*)
app.use(['/api/health', '/health'], healthRoutes);
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/complaints', '/complaints'], complaintRoutes);
app.use(['/api/departments', '/departments'], departmentRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);
app.use(['/api/analytics', '/analytics'], analyticsRoutes);
app.use(['/api/users', '/users'], userRoutes);
app.use(['/api/sla', '/sla'], slaRoutes);
app.use(['/api/feedback', '/feedback'], feedbackRoutes);
app.use(['/api/incidents', '/incidents'], incidentRoutes);
app.use(['/api/assets', '/assets'], assetRoutes);
app.use(['/api/inventory', '/inventory'], inventoryRoutes);
app.use(['/api/chat', '/chat'], chatRoutes);

// 404 Route Fallback
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    }
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
