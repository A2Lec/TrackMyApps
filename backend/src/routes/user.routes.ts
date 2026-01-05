import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { exportUserData, deleteUserAccount } from '../controllers/user.controller.js';

const router = Router();

// Export user data (GDPR Article 15)
router.get('/export', authenticateToken, exportUserData);

// Delete user account (GDPR Article 17)
router.delete('/account', authenticateToken, deleteUserAccount);

export default router;
