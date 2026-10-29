/**
 * Common TypeScript types used across the backend
 */

export type {
  ApplicationStatus,
  JobType,
  EventType,
  DocumentType,
  ReminderType,
} from '../../../shared/types.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
