import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logWarn } from '../utils/logger.js';

// Global rate limiter: 100 requests per 15 minutes
// @ts-ignore
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
  },
  handler: (req: Request, res: Response, next: NextFunction, options: any) => {
    logWarn(`Rate limit exceeded for IP: ${req.ip}`, { context: 'RateLimit' });
    res.status(options.statusCode).json(options.message);
  },
});

// Auth rate limiter: 5 requests per 15 minutes (for login/register)
// @ts-ignore
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
  },
  handler: (req: Request, res: Response, next: NextFunction, options: any) => {
    logWarn(`Auth rate limit exceeded for IP: ${req.ip}`, { context: 'RateLimit' });
    res.status(options.statusCode).json(options.message);
  },
});
