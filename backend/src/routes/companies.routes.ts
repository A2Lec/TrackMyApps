import { Router } from 'express';
import { companyController } from '../controllers/companies.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireEmailVerification } from '../middlewares/emailVerification.middleware.js';
import { companyReviewValidation } from '../middlewares/validation.middleware.js';

const router = Router();

// All routes are protected
router.use(authMiddleware);
router.use(requireEmailVerification);

router.get('/', companyController.getAll);
router.get('/search', companyController.search);
router.get('/:id', companyController.getById);
router.get('/:id/reviews', companyController.getReviews);
router.post('/', companyController.create);
router.post('/:id/reviews', companyReviewValidation, companyController.addReview);
router.delete('/:id', companyController.delete);

export default router;
