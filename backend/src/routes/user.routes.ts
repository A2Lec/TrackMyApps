import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { blockDemoAccount } from '../middlewares/demo.middleware.js';
import { exportUserData, deleteUserAccount } from '../controllers/user.controller.js';

const router = Router();

// Export user data (GDPR Article 15)
router.get('/export', authMiddleware, exportUserData);

// Delete user account (GDPR Article 17)
router.delete('/account', authMiddleware, blockDemoAccount, deleteUserAccount);

export default router;
