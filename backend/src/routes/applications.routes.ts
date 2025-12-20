import { Router } from 'express';
import { applicationController } from '../controllers/applications.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { applicationValidation, updateStatusValidation } from '../middlewares/validation.middleware.js';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get('/', applicationController.getAll);
router.get('/kanban', applicationController.getByStatus);
router.get('/stats', applicationController.getStats);
router.get('/:id', applicationController.getById);
router.post('/', applicationValidation, applicationController.create);
router.put('/:id', applicationController.update);
router.patch('/:id/status', updateStatusValidation, applicationController.updateStatus);
router.delete('/:id', applicationController.delete);

export default router;
