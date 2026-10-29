/**
 * Common TypeScript types used across the backend
 */

export type {
  ApplicationStatus,
  JobType,
  EventType,
  DocumentType,
  ReminderType,
} from './domain.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
