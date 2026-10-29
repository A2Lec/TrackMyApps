import express, { type RequestHandler } from 'express';
import cors from 'cors';
import * as helmetModule from 'helmet';
import type { HelmetOptions } from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { globalLimiter } from './middlewares/rateLimit.middleware.js';
import { logInfo } from './utils/logger.js';
import { corsOptions } from './config/cors.js';

// helmet only ships CommonJS-flavoured types: depending on the TypeScript setup (Vercel's Express
// preset type-checks differently from tsc), its default export is typed as the function or as the
// module object. Unwrap `.default` until we reach the function, which also holds at runtime.
type Helmet = (options?: Readonly<HelmetOptions>) => RequestHandler;
const unwrapDefault = (mod: unknown): Helmet =>
  typeof mod === 'function' ? (mod as Helmet) : unwrapDefault((mod as { default: unknown }).default);
const helmet = unwrapDefault(helmetModule);

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
