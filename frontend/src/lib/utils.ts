import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to French format
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  if (format === 'long') {
    return d.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }
  return d.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

/**
 * Format date and time to French format
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Key figures are shown on two digits (03, 05) in Sillage */
export function twoDigits(value: number): string {
  return value >= 0 && value < 10 ? `0${value}` : String(value);
}

/**
 * Re-export standardized domain labels and theme tokens
 */
export {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_DOT_COLORS,
  STATUS_HEX_VARS,
  JOB_TYPE_LABELS,
  JOB_TYPE_COLORS,
  JOB_TYPE_TAGS,
  EVENT_TYPE_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_COLORS,
  DOCUMENT_TYPE_CODES,
  REMINDER_TYPE_LABELS,
  REMINDER_TYPE_COLORS,
  REMINDER_TYPE_DOT_COLORS,
  STATUS_ORDER,
  KANBAN_STATUS_ORDER,
  ALL_STATUSES,
  JOB_TYPE_OPTIONS,
  STATUS_OPTIONS,
  // CamelCase aliases for backwards compatibility
  STATUS_LABELS as statusLabels,
  STATUS_COLORS as statusColors,
  STATUS_DOT_COLORS as statusDotColors,
  JOB_TYPE_LABELS as jobTypeLabels,
  JOB_TYPE_COLORS as jobTypeColors,
  DOCUMENT_TYPE_LABELS as documentTypeLabels,
  DOCUMENT_TYPE_COLORS as documentTypeColors,
  REMINDER_TYPE_LABELS as reminderTypeLabels,
  REMINDER_TYPE_COLORS as reminderTypeColors,
  EVENT_TYPE_LABELS as eventTypeLabels,
} from '@/constants/labels';
