import type { CorsOptions } from 'cors';
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
