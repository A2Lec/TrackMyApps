/**
 * Domain enums, shared with the frontend (imported there through the
 * `@domain` alias). Types only: the frontend reads this file at build time,
 * nothing here may exist at runtime.
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
  | 'INTERVIEW_PREP'
  | 'THANK_YOU_EMAIL'
  | 'FOLLOW_UP'
  | 'DEADLINE'
  | 'INTERVIEW'
  | 'DECISION'
  | 'DOCUMENT'
  | 'CUSTOM'
  | 'OTHER';
