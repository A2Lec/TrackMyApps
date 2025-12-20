import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/detailed', analyticsController.getDetailed);
router.get('/export', analyticsController.exportData);

export default router;
