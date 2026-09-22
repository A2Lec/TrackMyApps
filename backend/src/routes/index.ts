import { Router } from 'express';
import authRoutes from './auth.routes.js';
import applicationRoutes from './applications.routes.js';
import documentRoutes from './documents.routes.js';
import reminderRoutes from './reminders.routes.js';
import companyRoutes from './companies.routes.js';
import analyticsRoutes from './analytics.routes.js';
import interviewPrepRoutes from './interviewPrep.routes.js';
import interviewSimulationRoutes from './interviewSimulation.routes.js';
import cronRoutes from './cron.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/documents', documentRoutes);
router.use('/reminders', reminderRoutes);
router.use('/companies', companyRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/interview-prep', interviewPrepRoutes);
router.use('/interview-simulation', interviewSimulationRoutes);
router.use('/cron', cronRoutes);
router.use('/user', userRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
