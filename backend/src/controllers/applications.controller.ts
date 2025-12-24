import { Response } from 'express';
import { validationResult } from 'express-validator';
import { applicationService } from '../services/applications.service.js';
import { asyncHandler, createError } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const applicationController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, jobType, search } = req.query;

    const applications = await applicationService.getAll(req.userId!, {
      status: status as any,
      jobType: jobType as any,
      search: search as string,
    });

    res.json({
      success: true,
      data: applications,
    });
  }),

  getByStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const grouped = await applicationService.getByStatus(req.userId!);

    res.json({
      success: true,
      data: grouped,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const application = await applicationService.getById(req.userId!, req.params.id);

    res.json({
      success: true,
      data: application,
    });
  }),

  getStats: asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await applicationService.getStats(req.userId!);

    res.json({
      success: true,
      data: stats,
    });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400);
    }

    const application = await applicationService.create(req.userId!, req.body);

    res.status(201).json({
      success: true,
      data: application,
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const application = await applicationService.update(req.userId!, req.params.id, req.body);

    res.json({
      success: true,
      data: application,
    });
  }),

  updateStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400);
    }

    const { status } = req.body;
    const application = await applicationService.updateStatus(req.userId!, req.params.id, status);

    res.json({
      success: true,
      data: application,
    });
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const deleteCompany = req.query.deleteCompany === 'true';
    const result = await applicationService.delete(req.userId!, req.params.id, deleteCompany);

    res.json({
      success: true,
      data: result,
    });
  }),
};
