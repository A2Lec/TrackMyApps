import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { globalLimiter } from './middlewares/rateLimit.middleware.js';
import { logInfo } from './utils/logger.js';
import { corsOptions } from './config/cors.js';

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// CORS: only the origins listed in FRONTEND_URL (see config/cors.ts)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));

// Compression
app.use(compression());

// Cookie parser
app.use(cookieParser());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (skip preflight OPTIONS to avoid double-counting cross-origin requests)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  globalLimiter(req, res, next);
});

// Request logging
app.use((req, res, next) => {
  logInfo(`${req.method} ${req.url}`, { context: 'Request' });
  next();
});

// Health check at root
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'TrackMyApps API is running' });
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

// Error handling
app.use(errorHandler);

export default app;
