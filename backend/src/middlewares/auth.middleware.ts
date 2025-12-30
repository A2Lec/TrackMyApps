import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler.middleware.js';
import prisma from '../config/database.js';
import { logDebug, logWarn } from '../utils/logger.js';

export interface AuthRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  userId: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    // Check for token in Authorization header first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // Fallback to query parameter (for file viewing in browser)
    else if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
      logDebug('Token found in query params', { context: 'AuthMiddleware' });
    }

    if (!token) {
      logWarn('No token found in request', { context: 'AuthMiddleware' });
      throw createError('Token d\'authentification requis', 401);
    }

    const secret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, secret) as JwtPayload;
    logDebug(`Token decoded for user ${decoded.userId}`, { context: 'AuthMiddleware' });
    
    // Verify that the user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true } // Only select id for performance
    });

    if (!user) {
      throw createError('Utilisateur introuvable', 401);
    }

    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Token invalide', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createError('Token expiré', 401));
    } else {
      next(error);
    }
  }
};
