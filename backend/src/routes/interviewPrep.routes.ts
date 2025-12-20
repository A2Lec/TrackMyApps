import { Router } from 'express';
import { interviewPrepController } from '../controllers/interviewPrep.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get('/', interviewPrepController.getAll);
router.get('/categories', interviewPrepController.getCategories);
router.get('/default-questions', interviewPrepController.getDefaultQuestions);
router.get('/:id', interviewPrepController.getById);
router.post('/', interviewPrepController.create);
router.put('/:id', interviewPrepController.update);
router.delete('/:id', interviewPrepController.delete);

export default router;
