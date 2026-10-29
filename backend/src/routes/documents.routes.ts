import { Router } from 'express';
import { documentController } from '../controllers/documents.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireEmailVerification } from '../middlewares/emailVerification.middleware.js';
import { blockDemoAccount } from '../middlewares/demo.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { documentValidation } from '../middlewares/validation.middleware.js';

const router = Router();

// All routes are protected
router.use(authMiddleware);
router.use(requireEmailVerification);

router.get('/', documentController.getAll);
router.get('/view/:id', documentController.view);
router.get('/download/:id', documentController.download);
router.get('/:id', documentController.getById);
router.post('/', blockDemoAccount, upload.single('file'), documentValidation, documentController.upload);
router.put('/:id', blockDemoAccount, documentController.update);
router.patch('/:id/main', blockDemoAccount, documentController.setAsMain);
router.delete('/:id', blockDemoAccount, documentController.delete);

export default router;
