import {
  AlarmClock,
  Bookmark,
  CalendarClock,
  Circle,
  FileText,
  MailCheck,
  Mic,
  Scale,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_DOT_COLORS,
  JOB_TYPE_TAGS,
  DOCUMENT_TYPE_COLORS,
  DOCUMENT_TYPE_CODES,
  REMINDER_TYPE_COLORS,
  REMINDER_TYPE_LABELS,
} from '@/constants/labels';
import type { ApplicationStatus, DocumentType, JobType, ReminderType } from '@/types';

/** 9px status square (2px radius); hollow for GHOSTED */
export function StatusDot({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block h-[9px] w-[9px] shrink-0 rounded-[2px]', STATUS_DOT_COLORS[status], className)}
    />
  );
}

interface StatusBadgeProps {
  status: ApplicationStatus;
  /** inline: square + text (rows, cards). chip: bordered (filters, headers) */
  variant?: 'inline' | 'chip';
  className?: string;
}

/** The only way to show an application status: colored square + label in foreground */
export function StatusBadge({ status, variant = 'inline', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[7px] whitespace-nowrap',
        variant === 'chip'
          ? cn('rounded-sm py-1 pl-2 pr-2.5 text-[13px] font-medium', STATUS_COLORS[status])
          : cn('text-sm', status === 'GHOSTED' ? 'text-muted-foreground' : 'text-foreground'),
        className
      )}
    >
      <StatusDot status={status} />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Neutral mono uppercase tag for contract types */
export function ContractTag({ jobType, className }: { jobType: JobType; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-sm bg-secondary px-[7px] py-[3px] font-mono text-[11px] font-semibold uppercase leading-4 tracking-wider text-secondary-foreground',
        className
      )}
    >
      {JOB_TYPE_TAGS[jobType] ?? jobType}
    </span>
  );
}

/** 34px square with the document's mono code (CV on primary-soft, others on secondary) */
export function DocumentCode({ type, className }: { type: DocumentType; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold',
        DOCUMENT_TYPE_COLORS[type] ?? DOCUMENT_TYPE_COLORS.OTHER,
        className
      )}
    >
      {DOCUMENT_TYPE_CODES[type] ?? 'DOC'}
    </span>
  );
}

const REMINDER_TYPE_ICONS: Record<ReminderType, LucideIcon> = {
  FOLLOW_UP: Send,
  RELANCE: Send,
  INTERVIEW: CalendarClock,
  INTERVIEW_PREP: Mic,
  DEADLINE: AlarmClock,
  THANK_YOU_EMAIL: MailCheck,
  DECISION: Scale,
  DOCUMENT: FileText,
  CUSTOM: Bookmark,
  OTHER: Circle,
};

/** Reminder type: chip with the type's icon, colored like the status of the same meaning */
export function ReminderTypeBadge({ type, className }: { type: ReminderType; className?: string }) {
  const Icon = REMINDER_TYPE_ICONS[type] ?? Circle;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[11px] font-medium',
        REMINDER_TYPE_COLORS[type],
        className
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
      {REMINDER_TYPE_LABELS[type]}
    </span>
  );
}
