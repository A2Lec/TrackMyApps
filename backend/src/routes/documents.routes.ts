import { Router } from 'express';
import { documentController } from '../controllers/documents.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { documentValidation } from '../middlewares/validation.middleware.js';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get('/', documentController.getAll);
router.get('/:id', documentController.getById);
router.post('/', upload.single('file'), documentValidation, documentController.upload);
router.put('/:id', documentController.update);
router.patch('/:id/main', documentController.setAsMain);
router.delete('/:id', documentController.delete);

export default router;
