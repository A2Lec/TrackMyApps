import { Response } from 'express';
import { interviewSimulationService } from '../services/interviewSimulation.service.js';
import { asyncHandler } from '../middlewares/errorHandler.middleware.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const interviewSimulationController = {
  startSession: asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      applicationId,
      interviewerType,
      difficulty,
      cvId,
      lmId,
      isFreePractice,
      targetRole,
      contractType,
      jobDescription,
    } = req.body;

    const result = await interviewSimulationService.startSession({
      userId: req.userId!,
      applicationId,
      interviewerType,
      difficulty,
      cvId,
      lmId,
      isFreePractice,
      targetRole,
      contractType,
      jobDescription,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  }),

  sendMessage: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sessionId } = req.params;
    const { message } = req.body;

    const result = await interviewSimulationService.sendMessage(
      req.userId!,
      sessionId,
      message
    );

    res.json({
      success: true,
      data: result,
    });
  }),

  completeSession: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sessionId } = req.params;
    const result = await interviewSimulationService.completeSession(
      req.userId!,
      sessionId
    );

    res.json({
      success: true,
      data: result,
    });
  }),

  getSession: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sessionId } = req.params;
    const session = await interviewSimulationService.getSession(
      req.userId!,
      sessionId
    );

    res.json({
      success: true,
      data: session,
    });
  }),

  getAllUserSessions: asyncHandler(async (req: AuthRequest, res: Response) => {
    const sessions = await interviewSimulationService.getAllUserSessions(
      req.userId!
    );

    res.json({
      success: true,
      data: sessions,
    });
  }),

  getSessionsByApplication: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { applicationId } = req.params;
    const sessions = await interviewSimulationService.getSessionsByApplication(
      req.userId!,
      applicationId
    );

    res.json({
      success: true,
      data: sessions,
    });
  }),

  deleteSession: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sessionId } = req.params;
    const result = await interviewSimulationService.deleteSession(
      req.userId!,
      sessionId
    );

    res.json({
      success: true,
      data: result,
    });
  }),
};
