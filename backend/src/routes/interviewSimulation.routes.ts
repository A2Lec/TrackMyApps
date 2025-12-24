import { Router } from 'express';
import { interviewSimulationController } from '../controllers/interviewSimulation.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/start', interviewSimulationController.startSession);
router.post('/:sessionId/message', interviewSimulationController.sendMessage);
router.get('/:sessionId', interviewSimulationController.getSession);

export default router;
