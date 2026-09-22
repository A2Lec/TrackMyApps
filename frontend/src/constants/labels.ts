import type { ApplicationStatus, JobType, EventType, DocumentType, ReminderType } from '@/types';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  VIEWED: 'Vue',
  INTERVIEW_SCHEDULED: 'Entretien',
  AWAITING_RESPONSE: 'En attente',
  REJECTED: 'Refusée',
  ACCEPTED: 'Acceptée',
  GHOSTED: 'Sans réponse',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700/80',
  SENT: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
  VIEWED: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/80',
  INTERVIEW_SCHEDULED: 'bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/80',
  AWAITING_RESPONSE: 'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  GHOSTED: 'bg-zinc-100 text-zinc-600 border border-zinc-200/80 dark:bg-zinc-800/70 dark:text-zinc-400 dark:border-zinc-700/80',
};

export const STATUS_DOT_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: 'bg-slate-400 dark:bg-slate-500',
  SENT: 'bg-blue-500',
  VIEWED: 'bg-indigo-500',
  INTERVIEW_SCHEDULED: 'bg-purple-500',
  AWAITING_RESPONSE: 'bg-amber-500',
  REJECTED: 'bg-rose-500',
  ACCEPTED: 'bg-emerald-500',
  GHOSTED: 'bg-zinc-400 dark:bg-zinc-500',
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  STAGE: 'Stage',
  ALTERNANCE: 'Alternance',
  CDI: 'CDI',
  JOB_ETUDIANT: 'Job étudiant',
};

export const JOB_TYPE_COLORS: Record<JobType, string> = {
  STAGE: 'bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/80',
  ALTERNANCE: 'bg-violet-50 text-violet-700 border border-violet-200/80 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/80',
  CDI: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  JOB_ETUDIANT: 'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
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

export const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  CV: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
  LETTRE_MOTIVATION: 'bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/80',
  COVER_LETTER: 'bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/80',
  PORTFOLIO: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  OTHER: 'bg-zinc-100 text-zinc-700 border border-zinc-200/80 dark:bg-zinc-800/70 dark:text-zinc-300 dark:border-zinc-700/80',
};

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  FOLLOW_UP: 'Relance',
  INTERVIEW: 'Entretien',
  DEADLINE: 'Date limite',
  RELANCE: 'Relance',
  INTERVIEW_PREP: 'Préparation entretien',
  THANK_YOU_EMAIL: 'Email de remerciement',
  DECISION: 'Décision',
  DOCUMENT: 'Document',
  CUSTOM: 'Personnalisé',
  OTHER: 'Autre',
};

export const REMINDER_TYPE_COLORS: Record<ReminderType, string> = {
  FOLLOW_UP: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
  RELANCE: 'bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80',
  INTERVIEW: 'bg-purple-50 text-purple-700 border border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/80',
  DEADLINE: 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80',
  INTERVIEW_PREP: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/80',
  THANK_YOU_EMAIL: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  DECISION: 'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
  DOCUMENT: 'bg-teal-50 text-teal-700 border border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800/80',
  CUSTOM: 'bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/80',
  OTHER: 'bg-zinc-100 text-zinc-700 border border-zinc-200/80 dark:bg-zinc-800/70 dark:text-zinc-300 dark:border-zinc-700/80',
};

export const KANBAN_STATUS_ORDER: ApplicationStatus[] = [
  'DRAFT',
  'SENT',
  'INTERVIEW_SCHEDULED',
  'ACCEPTED',
  'REJECTED',
];

export const ALL_STATUSES: ApplicationStatus[] = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'INTERVIEW_SCHEDULED',
  'AWAITING_RESPONSE',
  'REJECTED',
  'ACCEPTED',
  'GHOSTED',
];

export const STATUS_ORDER: ApplicationStatus[] = ALL_STATUSES;

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
