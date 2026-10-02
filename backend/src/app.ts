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
import workOrderRoutes from './routes/workOrderRoutes';

const app = express();

// Trust proxy for Render/Vercel deployments so rate limiter can read client IP properly
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  })
);

// Restricted CORS configuration
const allowedOrigins = [
  env.FRONTEND_URL,
  'https://campus-fix-ai-six.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS security policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request logging (combined format in production, dev in local)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
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
app.use(['/api/work-orders', '/work-orders'], workOrderRoutes);

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
