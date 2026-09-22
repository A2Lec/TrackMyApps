import { Response } from 'express';
import { applicationService } from '../services/applications.service.js';
import { asyncHandler } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { validateRequest, sendSuccess, parseBoolean, parseIntOrDefault } from '../utils/response.utils.js';
import type { ApplicationStatus, JobType } from '../types/index.js';

export const applicationController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, jobType, search, page, limit } = req.query;

    const result = await applicationService.getAll(
      req.userId!,
      {
        status: status as ApplicationStatus,
        jobType: jobType as JobType,
        search: search as string,
      },
      parseIntOrDefault(page as string, 1),
      parseIntOrDefault(limit as string, 20),
    );

    return sendSuccess(res, result);
  }),

  getByStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const grouped = await applicationService.getByStatus(req.userId!);
    return sendSuccess(res, grouped);
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const application = await applicationService.getById(req.userId!, req.params.id);
    return sendSuccess(res, application);
  }),

  getStats: asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await applicationService.getStats(req.userId!);
    return sendSuccess(res, stats);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    validateRequest(req);
    const application = await applicationService.create(req.userId!, req.body);
    return sendSuccess(res, application, 201);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const application = await applicationService.update(req.userId!, req.params.id, req.body);
    return sendSuccess(res, application);
  }),

  updateStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    validateRequest(req);
    const { status } = req.body;
    const application = await applicationService.updateStatus(req.userId!, req.params.id, status);
    return sendSuccess(res, application);
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const deleteCompany = parseBoolean(req.query.deleteCompany as string);
    const result = await applicationService.delete(req.userId!, req.params.id, deleteCompany);
    return sendSuccess(res, result);
  }),
};
