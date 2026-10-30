import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireEmailVerification } from '../middlewares/emailVerification.middleware.js';
import { blockDemoAccount } from '../middlewares/demo.middleware.js';
import { aiLimiter } from '../middlewares/rateLimit.middleware.js';
import { geminiKeyValidation } from '../middlewares/validation.middleware.js';
import { deleteGeminiKey, exportUserData, saveGeminiKey } from '../controllers/user.controller.js';

const router = Router();

// Export user data (GDPR Articles 15 and 20). Account deletion: DELETE /auth/account
router.get('/export', authMiddleware, exportUserData);

// Personal Gemini API key (write-only: it is never sent back to the client)
router.put('/gemini-key', authMiddleware, requireEmailVerification, blockDemoAccount, aiLimiter, geminiKeyValidation, saveGeminiKey);
router.delete('/gemini-key', authMiddleware, blockDemoAccount, deleteGeminiKey);

export default router;
