import { describe, it, expect } from 'vitest';
import {
  cn,
  isSafeUrl,
  formatDate,
  formatDateTime,
} from '@/lib/utils';
import {
  ALL_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_DOT_COLORS,
  JOB_TYPE_LABELS,
  JOB_TYPE_COLORS,
  DOCUMENT_TYPE_LABELS,
  REMINDER_TYPE_LABELS,
  REMINDER_TYPE_COLORS,
  EVENT_TYPE_LABELS,
} from '@/constants/labels';
import type { ApplicationStatus, JobType, DocumentType, ReminderType, EventType } from '@/types';

describe('Utility: cn (Classnames & Tailwind Merge)', () => {
  it('should merge class strings correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle falsy and conditional values', () => {
    const isPrimary = false;
    expect(cn('btn', isPrimary && 'btn-primary', null, undefined, 'btn-large')).toBe('btn btn-large');
  });

  it('should resolve Tailwind class conflicts with priority to the latter', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    expect(cn('bg-white', 'bg-transparent')).toBe('bg-transparent');
  });
});

describe('Utility: formatDate', () => {
  it('should format ISO string to French short format by default', () => {
    const formatted = formatDate('2026-03-15T10:00:00.000Z');
    expect(formatted).toMatch(/15\/03\/2026/);
  });

  it('should format Date instance to French short format', () => {
    const date = new Date(2026, 0, 5); // 5 Jan 2026
    const formatted = formatDate(date);
    expect(formatted).toMatch(/05\/01\/2026/);
  });

  it('should format date to French long format when specified', () => {
    const formatted = formatDate('2026-03-15T10:00:00.000Z', 'long');
    expect(formatted.toLowerCase()).toContain('15');
    expect(formatted.toLowerCase()).toContain('mars');
    expect(formatted).toContain('2026');
  });

  it('should return empty string for invalid date strings', () => {
    expect(formatDate('invalid-date')).toBe('');
    expect(formatDate('')).toBe('');
  });
});

describe('Utility: formatDateTime', () => {
  it('should format ISO string to French date and time', () => {
    const formatted = formatDateTime('2026-03-15T14:30:00.000Z');
    expect(formatted).toMatch(/15\/03\/2026/);
    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });

  it('should return empty string for invalid input', () => {
    expect(formatDateTime('not-a-date')).toBe('');
  });
});

describe('Design System Tokens & Labels', () => {
  const allStatuses: ApplicationStatus[] = [
    'DRAFT',
    'SENT',
    'VIEWED',
    'INTERVIEW_SCHEDULED',
    'AWAITING_RESPONSE',
    'REJECTED',
    'ACCEPTED',
    'GHOSTED',
  ];

  const allJobTypes: JobType[] = ['STAGE', 'ALTERNANCE', 'CDI', 'JOB_ETUDIANT'];

  it('ALL_STATUSES should contain exactly all 8 application statuses in canonical order', () => {
    expect(ALL_STATUSES).toHaveLength(8);
    expect(ALL_STATUSES).toEqual(allStatuses);
  });

  it('every application status should have defined labels, colors, and dot colors', () => {
    allStatuses.forEach((status) => {
      expect(STATUS_LABELS[status]).toBeDefined();
      expect(typeof STATUS_LABELS[status]).toBe('string');
      expect(STATUS_LABELS[status].length).toBeGreaterThan(0);

      expect(STATUS_COLORS[status]).toBeDefined();
      expect(STATUS_COLORS[status]).toContain('bg-');
      expect(STATUS_COLORS[status]).toContain('text-');

      expect(STATUS_DOT_COLORS[status]).toBeDefined();
      expect(STATUS_DOT_COLORS[status]).toContain('bg-');
    });
  });

  it('every job type should have defined labels and color badges', () => {
    allJobTypes.forEach((type) => {
      expect(JOB_TYPE_LABELS[type]).toBeDefined();
      expect(JOB_TYPE_COLORS[type]).toBeDefined();
      expect(JOB_TYPE_COLORS[type]).toContain('bg-');
      expect(JOB_TYPE_COLORS[type]).toContain('text-');
    });
  });

  it('every document type should have a label', () => {
    const docTypes: DocumentType[] = ['CV', 'LETTRE_MOTIVATION', 'COVER_LETTER', 'PORTFOLIO', 'OTHER'];
    docTypes.forEach((type) => {
      expect(DOCUMENT_TYPE_LABELS[type]).toBeDefined();
    });
  });

  it('every reminder type should have valid labels and color badges', () => {
    const reminderTypes: ReminderType[] = [
      'FOLLOW_UP',
      'INTERVIEW',
      'DEADLINE',
      'RELANCE',
      'INTERVIEW_PREP',
      'THANK_YOU_EMAIL',
      'DECISION',
      'DOCUMENT',
      'CUSTOM',
      'OTHER',
    ];
    reminderTypes.forEach((type) => {
      expect(REMINDER_TYPE_LABELS[type]).toBeDefined();
      expect(REMINDER_TYPE_COLORS[type]).toBeDefined();
    });
  });

  it('every event type should have a valid label', () => {
    const eventTypes: EventType[] = [
      'CREATED',
      'SENT',
      'VIEWED',
      'RELANCE_SENT',
      'INTERVIEW_SCHEDULED',
      'INTERVIEW_DONE',
      'REJECTED',
      'ACCEPTED',
      'STATUS_CHANGED',
    ];
    eventTypes.forEach((type) => {
      expect(EVENT_TYPE_LABELS[type]).toBeDefined();
    });
  });
});

describe('isSafeUrl', () => {
  it('accepts http(s) links', () => {
    expect(isSafeUrl('https://careers.example.com/job/1')).toBe(true);
    expect(isSafeUrl('http://example.com')).toBe(true);
  });

  it('rejects script and data URLs, junk and empty values', () => {
    expect(isSafeUrl('javascript:alert(document.cookie)')).toBe(false);
    expect(isSafeUrl(' JavaScript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('not a url')).toBe(false);
    expect(isSafeUrl(null)).toBe(false);
    expect(isSafeUrl('')).toBe(false);
  });
});
