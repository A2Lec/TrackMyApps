import type { ApplicationStatus, JobType, DocumentType, EventType } from '../types/index.js';

/**
 * Status labels in French
 */
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  VIEWED: 'Vue',
  INTERVIEW_SCHEDULED: 'Entretien prévu',
  AWAITING_RESPONSE: 'En attente',
  REJECTED: 'Refusée',
  ACCEPTED: 'Acceptée',
  GHOSTED: 'Ghosted',
};

/**
 * Job type labels in French
 */
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  STAGE: 'Stage',
  ALTERNANCE: 'Alternance',
  CDI: 'CDI',
  JOB_ETUDIANT: 'Job étudiant',
};

/**
 * Event type labels in French
 */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  CREATED: 'Créée',
  SENT: 'Envoyée',
  VIEWED: 'Consultée',
  RELANCE_SENT: 'Relance envoyée',
  INTERVIEW_SCHEDULED: 'Entretien planifié',
  INTERVIEW_DONE: 'Entretien terminé',
  REJECTED: 'Refusée',
  ACCEPTED: 'Acceptée',
  STATUS_CHANGED: 'Changement de statut',
};

/**
 * Document type labels in French
 */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CV: 'CV',
  LETTRE_MOTIVATION: 'Lettre de motivation',
  COVER_LETTER: 'Lettre de motivation',
  PORTFOLIO: 'Portfolio',
  OTHER: 'Autre',
};

/**
 * Valid application statuses
 */
export const VALID_STATUSES: ApplicationStatus[] = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'INTERVIEW_SCHEDULED',
  'AWAITING_RESPONSE',
  'REJECTED',
  'ACCEPTED',
  'GHOSTED',
];

/**
 * Valid job types
 */
export const VALID_JOB_TYPES: JobType[] = [
  'STAGE',
  'ALTERNANCE',
  'CDI',
  'JOB_ETUDIANT',
];

/**
 * Valid document types
 */
export const VALID_DOCUMENT_TYPES: DocumentType[] = [
  'CV',
  'LETTRE_MOTIVATION',
  'COVER_LETTER',
  'PORTFOLIO',
  'OTHER',
];

/**
 * Check if status is valid
 */
export function isValidStatus(status: string): status is ApplicationStatus {
  return VALID_STATUSES.includes(status as ApplicationStatus);
}

/**
 * Check if job type is valid
 */
export function isValidJobType(jobType: string): jobType is JobType {
  return VALID_JOB_TYPES.includes(jobType as JobType);
}

/**
 * Check if document type is valid
 */
export function isValidDocumentType(docType: string): docType is DocumentType {
  return VALID_DOCUMENT_TYPES.includes(docType as DocumentType);
}
