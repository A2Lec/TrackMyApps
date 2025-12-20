import { Router } from 'express';
import { reminderController } from '../controllers/reminders.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { reminderValidation } from '../middlewares/validation.middleware.js';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get('/', reminderController.getAll);
router.get('/upcoming', reminderController.getUpcoming);
router.get('/count', reminderController.getCount);
router.get('/:id', reminderController.getById);
router.post('/', reminderValidation, reminderController.create);
router.put('/:id', reminderController.update);
router.patch('/:id/complete', reminderController.markAsCompleted);
router.patch('/:id/postpone', reminderController.postpone);
router.delete('/:id', reminderController.delete);

export default router;
