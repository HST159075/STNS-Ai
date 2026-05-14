import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import webhookRoutes from './routes/webhookRoutes';
import { errorHandler } from './middleware/errorMiddleware';
import { withAuth } from './middleware/auth';
import helmet from 'helmet';
import { globalLimiter, authLimiter } from './middleware/rateLimiter';

import { auth } from './config/auth';
import { toNodeHandler } from 'better-auth/node';

import logger from './utils/logger';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Set security HTTP headers
app.use(helmet());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(ao => origin.startsWith(ao));
    
    if (isAllowed || origin.includes('localhost:3000') || origin.includes('127.0.0.1:3000')) {
      return callback(null, true);
    } else {
      logger.warn(`[CORS] Rejected origin: ${origin}`);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
}));

app.use(express.json());

// Auth Routes with strict rate limiting and Better Auth handler
app.use('/api/auth', authLimiter, (req, res) => {
  return toNodeHandler(auth)(req, res);
});

// Apply global rate limiter to all other API requests
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
