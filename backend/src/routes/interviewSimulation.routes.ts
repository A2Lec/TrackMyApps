import { Router } from 'express';
import { interviewSimulationController } from '../controllers/interviewSimulation.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Debug logs
console.log('Interview Simulation Routes loaded');

router.use((req, res, next) => {
  console.log(`[InterviewSimulation] ${req.method} ${req.url}`);
  next();
});

router.use(authMiddleware);

router.post('/start', interviewSimulationController.startSession);
router.post('/:sessionId/message', interviewSimulationController.sendMessage);
router.get('/:sessionId', interviewSimulationController.getSession);

// Fallback for debugging
router.use((req, res) => {
  console.log(`[InterviewSimulation] Unmatched route: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false, 
    message: `Route simulation non trouvée: ${req.method} ${req.url}` 
  });
});

export default router;
