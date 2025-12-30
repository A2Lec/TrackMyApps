/**
 * Common TypeScript types used across the backend
 */

export type ApplicationStatus = 
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'INTERVIEW_SCHEDULED'
  | 'AWAITING_RESPONSE'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'GHOSTED';

export type JobType = 
  | 'STAGE'
  | 'ALTERNANCE'
  | 'CDI'
  | 'JOB_ETUDIANT';

export type EventType = 
  | 'CREATED'
  | 'SENT'
  | 'VIEWED'
  | 'RELANCE_SENT'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_DONE'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'STATUS_CHANGED';

export type DocumentType = 
  | 'CV'
  | 'LETTRE_MOTIVATION'
  | 'COVER_LETTER'
  | 'PORTFOLIO'
  | 'OTHER';

export type ReminderType = 
  | 'RELANCE'
  | 'INTERVIEW'
  | 'DECISION'
  | 'DOCUMENT'
  | 'OTHER';

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
