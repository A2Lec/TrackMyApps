import { Request, Response } from 'express';
import { companyService } from '../services/companies.service.js';
import { asyncHandler } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { validateRequest, sendSuccess, sendSuccessMessage, parseBoolean } from '../utils/response.utils.js';

export const companyController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search } = req.query;
    const companies = await companyService.getAll(req.userId!, search as string);
    return sendSuccess(res, companies);
  }),

  search: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { q } = req.query;
    if (!q) {
      return sendSuccess(res, []);
    }
    const companies = await companyService.search(req.userId!, q as string);
    return sendSuccess(res, companies);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const company = await companyService.getById(req.params.id);
    return sendSuccess(res, company);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const company = await companyService.create({
      ...req.body,
      userId: req.userId!,
    });
    return sendSuccess(res, company, 201);
  }),

  addReview: asyncHandler(async (req: AuthRequest, res: Response) => {
    validateRequest(req);
    const review = await companyService.addReview(req.userId!, {
      companyId: req.params.id,
      ...req.body,
    });
    return sendSuccess(res, review, 201);
  }),

  getReviews: asyncHandler(async (req: Request, res: Response) => {
    const reviews = await companyService.getReviews(req.params.id);
    return sendSuccess(res, reviews);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const deleteApplications = parseBoolean(req.query.deleteApplications as string);
    await companyService.delete(req.params.id, deleteApplications);
    return sendSuccessMessage(res, 'Entreprise supprimée avec succès');
  }),
};
