import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';
import { createError } from './errorHandler.middleware.js';
import { demoService } from '../services/demo.service.js';

/**
 * Reject actions that would let one visitor lock others out of the shared demo
 * account (credentials, settings, account deletion) or store files on it.
 * Must run after authMiddleware.
 */
export const blockDemoAccount = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (await demoService.isDemoUser(req.userId!)) {
      throw createError(
        "Cette action est désactivée sur le compte de démonstration. Créez un compte gratuit pour l'utiliser.",
        403
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};
