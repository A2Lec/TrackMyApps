import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from '../middlewares/validation.middleware.js';
import { blockDemoAccount } from '../middlewares/demo.middleware.js';
import { authLimiter, passwordResetLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Public routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidation, authController.resetPassword);

// Protected routes
router.post('/logout', authController.logout);
router.post('/resend-verification', authMiddleware, authController.resendVerification);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, blockDemoAccount, authController.updateProfile);
router.put('/password', authMiddleware, blockDemoAccount, authController.updatePassword);
router.put('/preferences', authMiddleware, blockDemoAccount, authController.updatePreferences);
router.delete('/account', authMiddleware, blockDemoAccount, authController.deleteAccount);

export default router;
