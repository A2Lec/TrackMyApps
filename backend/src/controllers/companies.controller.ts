import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { companyService } from '../services/companies.service.js';
import { asyncHandler, createError } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const companyController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { search } = req.query;
    const companies = await companyService.getAll(req.userId!, search as string);

    res.json({
      success: true,
      data: companies,
    });
  }),

  search: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { q } = req.query;

    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const companies = await companyService.search(req.userId!, q as string);

    res.json({
      success: true,
      data: companies,
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const company = await companyService.getById(req.params.id);

    res.json({
      success: true,
      data: company,
    });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const company = await companyService.create({
      ...req.body,
      userId: req.userId!,
    });

    res.status(201).json({
      success: true,
      data: company,
    });
  }),

  addReview: asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400);
    }

    const review = await companyService.addReview(req.userId!, {
      companyId: req.params.id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  }),

  getReviews: asyncHandler(async (req: Request, res: Response) => {
    const reviews = await companyService.getReviews(req.params.id);

    res.json({
      success: true,
      data: reviews,
    });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const deleteApplications = req.query.deleteApplications === 'true';
    await companyService.delete(req.params.id, deleteApplications);

    res.json({
      success: true,
      message: 'Entreprise supprimée avec succès',
    });
  }),
};
