import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { asyncHandler, createError } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { validateRequest, sendSuccess, parseIntOrDefault } from '../utils/response.utils.js';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    validateRequest(req);
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

    // Set HTTP-only cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true, // Toujours secure (requis pour SameSite=None)
      sameSite: 'none', // Toujours None pour supporter cross-origin/cross-port
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    return sendSuccess(res, result, 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    validateRequest(req);
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    // Set HTTP-only cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true, // Toujours secure (requis pour SameSite=None)
      sameSite: 'none', // Toujours None pour supporter cross-origin/cross-port
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    return sendSuccess(res, result);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    });
    return sendSuccess(res, { message: 'Déconnexion réussie' });
  }),

  getProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.getProfile(req.userId!);
    return sendSuccess(res, user);
  }),

  updateProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { firstName, lastName, school, graduationYear, field, fieldOfStudy } = req.body;

    const user = await authService.updateProfile(req.userId!, {
      firstName,
      lastName,
      school,
      graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
      field: field ?? fieldOfStudy,
    });

    return sendSuccess(res, user);
  }),

  updatePassword: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createError('Mot de passe actuel et nouveau mot de passe requis', 400);
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw createError(
        'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
        400
      );
    }

    const result = await authService.updatePassword(req.userId!, currentPassword, newPassword);
    return sendSuccess(res, result);
  }),

  updatePreferences: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { emailNotifications, relanceFrequency } = req.body;

    const user = await authService.updatePreferences(
      req.userId!,
      emailNotifications ?? true,
      relanceFrequency ?? 7
    );

    return sendSuccess(res, user);
  }),

  deleteAccount: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.deleteAccount(req.userId!);

    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    });

    return sendSuccess(res, result);
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw createError('Token requis', 400);
    }

    const result = await authService.verifyEmail(token);
    return sendSuccess(res, result);
  }),

  resendVerification: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.resendVerificationEmail(req.userId!);
    return sendSuccess(res, result);
  }),
};
