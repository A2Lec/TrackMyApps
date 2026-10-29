import { rateLimit } from 'express-rate-limit';
import { logWarn } from '../utils/logger.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

function createLimiter(name: string, limit: number, message: string, skipSuccessfulRequests = false) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res, _next, options) => {
      logWarn(`${name} rate limit exceeded for IP: ${req.ip}`, { context: 'RateLimit' });
      res.status(options.statusCode).json({ success: false, message });
    },
  });
}

// Global limiter: 300 requests per 15 minutes per IP
export const globalLimiter = createLimiter('Global', 300, 'Trop de requêtes, veuillez réessayer plus tard.');

// Login/register: 20 failed attempts per 15 minutes per IP
export const authLimiter = createLimiter(
  'Auth',
  20,
  'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
  true
);

// Password reset: counts every request (the endpoint always answers 200,
// so skipSuccessfulRequests would never throttle it)
export const passwordResetLimiter = createLimiter(
  'Password reset',
  5,
  'Trop de demandes de réinitialisation, veuillez réessayer dans 15 minutes.'
);
