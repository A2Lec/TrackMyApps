import { Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import { logError } from '../utils/logger.js';

export interface ApiError extends Error {
  statusCode: number;
  errors?: unknown[];
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  // Express only treats 4-argument middlewares as error handlers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur interne du serveur';

  // Upload errors (size limit, unexpected field) are client errors, not 500s
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Fichier trop volumineux.';
    }
  }

  if (statusCode >= 500) {
    logError(`${req.method} ${req.originalUrl}`, err, { context: 'ErrorHandler' });
    // Unexpected errors may carry internal details (SQL, stack traces): never send them in production
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
      message = 'Erreur interne du serveur';
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export const createError = (message: string, statusCode: number): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  return error;
};

type AsyncRequestHandler<Req extends Request> = (req: Req, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler = <Req extends Request = Request>(fn: AsyncRequestHandler<Req>): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch(next);
  };
};
