import { Response } from 'express';
import { validationResult } from 'express-validator';
import { interviewPrepService } from '../services/interviewPrep.service.js';
import { asyncHandler, createError } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const interviewPrepController = {
  getAll: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { category } = req.query;
    const questions = await interviewPrepService.getAll(req.userId!, category as string);

    res.json({
      success: true,
      data: questions,
    });
  }),

  getById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const question = await interviewPrepService.getById(req.userId!, req.params.id);

    res.json({
      success: true,
      data: question,
    });
  }),

  getCategories: asyncHandler(async (req: AuthRequest, res: Response) => {
    const categories = await interviewPrepService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  }),

  getDefaultQuestions: asyncHandler(async (req: AuthRequest, res: Response) => {
    const questions = await interviewPrepService.getDefaultQuestions();

    res.json({
      success: true,
      data: questions,
    });
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { question, answer, category } = req.body;

    if (!question || !category) {
      throw createError('Question et catégorie requises', 400);
    }

    const result = await interviewPrepService.create(req.userId!, {
      question,
      answer,
      category,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { question, answer, category } = req.body;

    const result = await interviewPrepService.update(req.userId!, req.params.id, {
      question,
      answer,
      category,
    });

    res.json({
      success: true,
      data: result,
    });
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await interviewPrepService.delete(req.userId!, req.params.id);

    res.json({
      success: true,
      data: result,
    });
  }),
};
