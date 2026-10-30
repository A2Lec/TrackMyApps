import { Router } from 'express';
import { interviewSimulationController } from '../controllers/interviewSimulation.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireEmailVerification } from '../middlewares/emailVerification.middleware.js';
import { aiLimiter } from '../middlewares/rateLimit.middleware.js';
import { blockDemoAccount } from '../middlewares/demo.middleware.js';
import { interviewMessageValidation, interviewStartValidation } from '../middlewares/validation.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(requireEmailVerification);

// Gemini calls use the user's own API key, which the shared demo account cannot have
router.post('/start', blockDemoAccount, aiLimiter, interviewStartValidation, interviewSimulationController.startSession);
router.get('/sessions', interviewSimulationController.getAllUserSessions);
router.get('/application/:applicationId', interviewSimulationController.getSessionsByApplication);
router.post('/:sessionId/complete', blockDemoAccount, aiLimiter, interviewSimulationController.completeSession);
router.post('/:sessionId/message', blockDemoAccount, aiLimiter, interviewMessageValidation, interviewSimulationController.sendMessage);
router.get('/:sessionId', interviewSimulationController.getSession);
router.delete('/:sessionId', interviewSimulationController.deleteSession);

export default router;
