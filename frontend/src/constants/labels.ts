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

// Sillage: a status is a 9px colored square + a label in foreground, never colored text.
// These are the "chip" variant classes (the square comes from STATUS_DOT_COLORS, see StatusBadge).
const STATUS_CHIP = 'bg-card text-foreground border border-border';
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: STATUS_CHIP,
  SENT: STATUS_CHIP,
  VIEWED: STATUS_CHIP,
  INTERVIEW_SCHEDULED: STATUS_CHIP,
  // The only status that calls for an action
  AWAITING_RESPONSE: 'bg-warning-soft text-foreground border border-warning',
  REJECTED: STATUS_CHIP,
  ACCEPTED: STATUS_CHIP,
  GHOSTED: 'bg-card text-muted-foreground border border-dashed border-input',
};

export const STATUS_DOT_COLORS: Record<ApplicationStatus, string> = {
  DRAFT: 'bg-status-draft',
  SENT: 'bg-status-sent',
  VIEWED: 'bg-status-viewed',
  INTERVIEW_SCHEDULED: 'bg-status-interview',
  AWAITING_RESPONSE: 'bg-status-waiting',
  REJECTED: 'bg-status-rejected',
  ACCEPTED: 'bg-status-accepted',
  // Hollow square: tells Sans réponse apart from Brouillon without relying on hue
  GHOSTED: 'bg-transparent border-[1.5px] border-status-ghosted',
};

/** Raw status colors (CSS variables), for charts and inline styles */
export const STATUS_HEX_VARS: Record<ApplicationStatus, string> = {
  DRAFT: 'var(--status-draft)',
  SENT: 'var(--status-sent)',
  VIEWED: 'var(--status-viewed)',
  INTERVIEW_SCHEDULED: 'var(--status-interview)',
  AWAITING_RESPONSE: 'var(--status-waiting)',
  REJECTED: 'var(--status-rejected)',
  ACCEPTED: 'var(--status-accepted)',
  GHOSTED: 'var(--status-ghosted)',
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  STAGE: 'Stage',
  ALTERNANCE: 'Alternance',
  CDI: 'CDI',
  JOB_ETUDIANT: 'Job étudiant',
};

// Contracts have no color in Sillage: neutral mono uppercase tag
const MONO_TAG = 'bg-secondary text-secondary-foreground font-mono text-[11px] font-semibold uppercase tracking-wider';
export const JOB_TYPE_COLORS: Record<JobType, string> = {
  STAGE: MONO_TAG,
  ALTERNANCE: MONO_TAG,
  CDI: MONO_TAG,
  JOB_ETUDIANT: MONO_TAG,
};

/** Text of the contract tag */
export const JOB_TYPE_TAGS: Record<JobType, string> = {
  STAGE: 'STAGE',
  ALTERNANCE: 'ALTERNANCE',
  CDI: 'CDI',
  JOB_ETUDIANT: 'JOB ÉTUDIANT',
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

/** Journal: each event takes the square of the status it produces (null: no known status) */
export const EVENT_TYPE_STATUS: Record<EventType, ApplicationStatus | null> = {
  CREATED: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  RELANCE_SENT: 'AWAITING_RESPONSE',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  INTERVIEW_DONE: 'INTERVIEW_SCHEDULED',
  REJECTED: 'REJECTED',
  ACCEPTED: 'ACCEPTED',
  STATUS_CHANGED: null,
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CV: 'CV',
  COVER_LETTER: 'Lettre de motivation',
  LETTRE_MOTIVATION: 'Lettre de motivation',
  PORTFOLIO: 'Portfolio',
  OTHER: 'Autre',
};

// Documents have no color either: the CV (main document) is on primary-soft, the rest on secondary
export const DOCUMENT_TYPE_COLORS: Record<DocumentType, string> = {
  CV: 'bg-primary-soft text-primary',
  LETTRE_MOTIVATION: 'bg-secondary text-secondary-foreground',
  COVER_LETTER: 'bg-secondary text-secondary-foreground',
  PORTFOLIO: 'bg-secondary text-secondary-foreground',
  OTHER: 'bg-secondary text-secondary-foreground',
};

/** Mono code shown in the document square */
export const DOCUMENT_TYPE_CODES: Record<DocumentType, string> = {
  CV: 'CV',
  LETTRE_MOTIVATION: 'LM',
  COVER_LETTER: 'LM',
  PORTFOLIO: 'PF',
  OTHER: 'DOC',
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

// A reminder takes the color of the status with the same meaning; the rest is neutral
// and told apart by its icon (see REMINDER_TYPE_ICONS in components/StatusBadge).
const REMINDER_CHIP = 'bg-card text-foreground border border-border';
export const REMINDER_TYPE_COLORS: Record<ReminderType, string> = {
  FOLLOW_UP: 'bg-warning-soft text-foreground border border-warning',
  RELANCE: 'bg-warning-soft text-foreground border border-warning',
  INTERVIEW: REMINDER_CHIP,
  DEADLINE: REMINDER_CHIP,
  INTERVIEW_PREP: REMINDER_CHIP,
  THANK_YOU_EMAIL: REMINDER_CHIP,
  DECISION: REMINDER_CHIP,
  DOCUMENT: REMINDER_CHIP,
  CUSTOM: REMINDER_CHIP,
  OTHER: REMINDER_CHIP,
};

export const REMINDER_TYPE_DOT_COLORS: Record<ReminderType, string> = {
  FOLLOW_UP: 'bg-status-waiting',
  RELANCE: 'bg-status-waiting',
  INTERVIEW: 'bg-status-interview',
  INTERVIEW_PREP: 'bg-status-interview',
  DEADLINE: 'bg-destructive',
  THANK_YOU_EMAIL: 'bg-status-draft',
  DECISION: 'bg-status-draft',
  DOCUMENT: 'bg-status-draft',
  CUSTOM: 'bg-status-draft',
  OTHER: 'bg-status-draft',
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
