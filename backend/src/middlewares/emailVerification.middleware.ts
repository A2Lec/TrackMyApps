import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';
import { createError } from './errorHandler.middleware.js';
import prisma from '../config/database.js';

/**
 * Middleware to check if user has verified their email
 * Only allows read operations (GET) for unverified users
 */
export const requireEmailVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Allow GET requests (read-only) even if email not verified
    if (req.method === 'GET') {
      return next();
    }

    // For POST, PUT, DELETE, PATCH - require email verification
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { emailVerified: true },
    });

    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    if (!user.emailVerified) {
      throw createError(
        'Veuillez vérifier votre adresse email pour effectuer cette action. Consultez votre boîte de réception.',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
