import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import webhookRoutes from './routes/webhookRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import { withAuth } from './middleware/auth';
import helmet from 'helmet';
import { globalLimiter } from './middleware/rateLimiter';

import { auth } from './config/auth';
import { toNodeHandler } from 'better-auth/node';

import logger from './utils/logger';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Security headers — disable CSP so it doesn't block OAuth redirects
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Google OAuth redirects)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(ao => origin.startsWith(ao));

    if (isAllowed || origin.includes('localhost')) {
      return callback(null, true);
    } else {
      logger.warn(`[CORS] Rejected origin: ${origin}`);
      return callback(new Error('CORS policy violation'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
}));

app.use(express.json());

// ✅ Better Auth handler — middleware pattern avoids path-to-regexp wildcard issues
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) {
    return toNodeHandler(auth)(req, res);
  }
  next();
});

// Apply global rate limiter to API requests
app.use('/api/', globalLimiter);

app.use('/api/webhooks', webhookRoutes);

app.use(withAuth);

// Main Router
app.use('/api', routes);

// Health Check
app.get('/', (req, res) => {
  res.json({ message: 'NexusMarket API is running smoothly 🚀' });
});

// Error Handling
app.use(errorHandler);

export default app;
