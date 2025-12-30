import { Response } from 'express';
import { validationResult } from 'express-validator';
import { createError } from '../middlewares/errorHandler.middleware.js';
import type { ApiResponse } from '../types/index.js';

/**
 * Validate request and throw error if validation fails
 */
export function validateRequest(req: any): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(errors.array()[0].msg, 400);
  }
}

/**
 * Send success response with data
 */
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send success response with message only
 */
export function sendSuccessMessage(res: Response, message: string, statusCode: number = 200): Response {
  const response: ApiResponse = {
    success: true,
    message,
  };
  return res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(res: Response, message: string, statusCode: number = 500): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
  };
  return res.status(statusCode).json(response);
}

/**
 * Parse integer from string with default value
 */
export function parseIntOrDefault(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse boolean from string or query param
 */
export function parseBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}

/**
 * Format date to ISO string or return undefined
 */
export function formatDateOrUndefined(date: Date | string | undefined): string | undefined {
  if (!date) return undefined;
  return new Date(date).toISOString();
}

/**
 * Sanitize search query
 */
export function sanitizeSearch(search: string | undefined): string | undefined {
  if (!search) return undefined;
  return search.trim();
}
