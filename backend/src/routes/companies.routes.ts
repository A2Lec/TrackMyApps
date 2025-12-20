import { Router } from 'express';
import { companyController } from '../controllers/companies.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { companyReviewValidation } from '../middlewares/validation.middleware.js';

const router = Router();

// Public routes
router.get('/', companyController.getAll);
router.get('/search', companyController.search);
router.get('/:id', companyController.getById);
router.get('/:id/reviews', companyController.getReviews);

// Protected routes
router.post('/', authMiddleware, companyController.create);
router.post('/:id/reviews', authMiddleware, companyReviewValidation, companyController.addReview);

export default router;
