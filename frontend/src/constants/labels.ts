import type { ApplicationStatus, JobType, EventType, DocumentType } from '@/types';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  VIEWED: 'Vue',
  INTERVIEW_SCHEDULED: 'Entretien',
  AWAITING_RESPONSE: 'En attente',
  REJECTED: 'Refusée',
  ACCEPTED: 'Acceptée',
  GHOSTED: 'Ghosted',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-100',
  SENT: 'bg-blue-200 text-blue-700 dark:bg-blue-600 dark:text-blue-100',
  VIEWED: 'bg-purple-200 text-purple-700 dark:bg-purple-600 dark:text-purple-100',
  INTERVIEW_SCHEDULED: 'bg-green-200 text-green-700 dark:bg-green-600 dark:text-green-100',
  AWAITING_RESPONSE: 'bg-amber-200 text-amber-700 dark:bg-amber-500 dark:text-amber-100',
  REJECTED: 'bg-red-200 text-red-700 dark:bg-red-500 dark:text-red-100',
  ACCEPTED: 'bg-emerald-200 text-emerald-700 dark:bg-emerald-500 dark:text-emerald-100',
  GHOSTED: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-500 dark:text-zinc-100',
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  STAGE: 'Stage',
  ALTERNANCE: 'Alternance',
  CDI: 'CDI',
  JOB_ETUDIANT: 'Job étudiant',
};

export const JOB_TYPE_COLORS: Record<JobType, string> = {
  STAGE: 'bg-indigo-200 text-indigo-700 dark:bg-indigo-600 dark:text-indigo-100',
  ALTERNANCE: 'bg-cyan-200 text-cyan-700 dark:bg-cyan-600 dark:text-cyan-100',
  CDI: 'bg-orange-200 text-orange-700 dark:bg-orange-500 dark:text-orange-100',
  JOB_ETUDIANT: 'bg-pink-200 text-pink-700 dark:bg-pink-600 dark:text-pink-100',
};

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

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CV: 'CV',
  COVER_LETTER: 'Lettre de motivation',
  LETTRE_MOTIVATION: 'Lettre de motivation',
  PORTFOLIO: 'Portfolio',
  OTHER: 'Autre',
};

export const STATUS_ORDER: ApplicationStatus[] = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'INTERVIEW_SCHEDULED',
  'AWAITING_RESPONSE',
  'REJECTED',
  'ACCEPTED',
  'GHOSTED',
];

export const JOB_TYPE_OPTIONS = [
  { value: 'STAGE' as const, label: 'Stage' },
  { value: 'ALTERNANCE' as const, label: 'Alternance' },
  { value: 'CDI' as const, label: 'CDI' },
  { value: 'JOB_ETUDIANT' as const, label: 'Job étudiant' },
];

export const STATUS_OPTIONS = [
  { value: 'DRAFT' as const, label: 'Brouillon' },
  { value: 'SENT' as const, label: 'Envoyée' },
];
