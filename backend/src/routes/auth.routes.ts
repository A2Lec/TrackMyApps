import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { registerValidation, loginValidation } from '../middlewares/validation.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Public routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/verify-email', authController.verifyEmail);

// Protected routes
router.post('/logout', authController.logout);
router.post('/resend-verification', authMiddleware, authController.resendVerification);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/password', authMiddleware, authController.updatePassword);
router.put('/preferences', authMiddleware, authController.updatePreferences);
router.delete('/account', authMiddleware, authController.deleteAccount);

export default router;
