import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { exportUserData } from '../controllers/user.controller.js';

const router = Router();

// Export user data (GDPR Articles 15 and 20). Account deletion: DELETE /auth/account
router.get('/export', authMiddleware, exportUserData);

export default router;
