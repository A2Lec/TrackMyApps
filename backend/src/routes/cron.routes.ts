import { Router } from 'express';
import { cronController } from '../controllers/cron.controller.js';

const router = Router();

router.get('/reminders', cronController.processReminders);

export default router;
