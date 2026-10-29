import type { CorsOptions } from 'cors';
import type { RequestHandler } from 'express';
import { logWarn } from '../utils/logger.js';

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const normalizeOrigin = (url: string) =>
  url.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '').toLowerCase();

/**
 * Frontend origins from FRONTEND_URL (comma-separated). The first entry is the
 * public URL used in emails.
 */
export const getFrontendUrls = (): string[] =>
  (process.env.FRONTEND_URL || '').split(',').map(normalizeOrigin).filter(Boolean);

export const getAllowedOrigins = (): string[] => {
  const origins = getFrontendUrls();
  if (process.env.NODE_ENV !== 'production') origins.push(...DEV_ORIGINS);
  return origins;
};

// Auth relies on SameSite=None cookies, so only the listed origins may make credentialed calls
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Same-origin requests, curl and server-to-server calls send no Origin header
    if (!origin) {
      callback(null, true);
      return;
    }

    if (getAllowedOrigins().includes(normalizeOrigin(origin))) {
      callback(null, true);
    } else {
      logWarn(`CORS blocked origin: ${origin}`, { context: 'CORS' });
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  optionsSuccessStatus: 200,
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF guard. CORS only stops a foreign page from reading responses: a plain HTML form
 * can still POST cross-site, and the SameSite=None auth cookie goes with it. Browsers
 * send an Origin header on every cross-origin write, so refuse writes from unlisted ones.
 */
export const rejectForeignOrigins: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (SAFE_METHODS.has(req.method) || !origin || getAllowedOrigins().includes(normalizeOrigin(origin))) {
    next();
    return;
  }
  logWarn(`Blocked ${req.method} ${req.originalUrl} from origin: ${origin}`, { context: 'CSRF' });
  res.status(403).json({ success: false, message: 'Origine non autorisée' });
};
