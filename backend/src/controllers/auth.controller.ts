import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authService } from '../services/auth.service.js';
import { asyncHandler, createError } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400);
    }

    const { email, password, firstName, lastName, school, graduationYear, field } = req.body;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      school,
      graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
      field,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400);
    }

    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      data: result,
    });
  }),

  getProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.getProfile(req.userId!);

    res.json({
      success: true,
      data: user,
    });
  }),

  updateProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { firstName, lastName, school, graduationYear, field } = req.body;

    const user = await authService.updateProfile(req.userId!, {
      firstName,
      lastName,
      school,
      graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
      field,
    });

    res.json({
      success: true,
      data: user,
    });
  }),

  updatePassword: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createError('Mot de passe actuel et nouveau mot de passe requis', 400);
    }

    if (newPassword.length < 6) {
      throw createError('Le nouveau mot de passe doit contenir au moins 6 caractères', 400);
    }

    const result = await authService.updatePassword(req.userId!, currentPassword, newPassword);

    res.json({
      success: true,
      data: result,
    });
  }),

  updatePreferences: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { emailNotifications, relanceFrequency } = req.body;

    const user = await authService.updatePreferences(
      req.userId!,
      emailNotifications ?? true,
      relanceFrequency ?? 7
    );

    res.json({
      success: true,
      data: user,
    });
  }),
};
