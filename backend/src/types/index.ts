/**
 * Common TypeScript types used across the backend
 */

import type { ApplicationStatus, JobType, EventType, DocumentType, ReminderType } from '../../../shared/types.js';
export type { ApplicationStatus, JobType, EventType, DocumentType, ReminderType };

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
