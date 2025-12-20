import { Response } from 'express';
import { validationResult } from 'express-validator';
import { reminderService } from '../services/reminders.service.js';
import { asyncHandler, createError } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const reminderController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { includeCompleted } = req.query;
    const reminders = await reminderService.getAll(req.userId!, includeCompleted === 'true');

    res.json({
      success: true,
      data: reminders,
    });
  }),

  getUpcoming: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { days } = req.query;
    const reminders = await reminderService.getUpcoming(req.userId!, days ? parseInt(days as string) : 7);

    res.json({
      success: true,
      data: reminders,
    });
  }),

  getCount: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await reminderService.getCount(req.userId!);

    res.json({
      success: true,
      data: result,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const reminder = await reminderService.getById(req.userId!, req.params.id);

    res.json({
      success: true,
      data: reminder,
    });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(errors.array()[0].msg, 400);
    }

    const reminder = await reminderService.create(req.userId!, req.body);

    res.status(201).json({
      success: true,
      data: reminder,
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const reminder = await reminderService.update(req.userId!, req.params.id, req.body);

    res.json({
      success: true,
      data: reminder,
    });
  }),

  markAsCompleted: asyncHandler(async (req: AuthRequest, res: Response) => {
    const reminder = await reminderService.markAsCompleted(req.userId!, req.params.id);

    res.json({
      success: true,
      data: reminder,
    });
  }),

  postpone: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { newDate } = req.body;

    if (!newDate) {
      throw createError('Nouvelle date requise', 400);
    }

    const reminder = await reminderService.postpone(req.userId!, req.params.id, new Date(newDate));

    res.json({
      success: true,
      data: reminder,
    });
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await reminderService.delete(req.userId!, req.params.id);

    res.json({
      success: true,
      data: result,
    });
  }),
};
