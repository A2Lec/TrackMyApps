import { Router } from 'express';
import { interviewSimulationController } from '../controllers/interviewSimulation.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/start', interviewSimulationController.startSession);
router.get('/sessions', interviewSimulationController.getAllUserSessions);
router.get('/application/:applicationId', interviewSimulationController.getSessionsByApplication);
router.post('/:sessionId/complete', interviewSimulationController.completeSession);
router.post('/:sessionId/message', interviewSimulationController.sendMessage);
router.get('/:sessionId', interviewSimulationController.getSession);
router.delete('/:sessionId', interviewSimulationController.deleteSession);

export default router;
