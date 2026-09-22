import { describe, it, expect } from 'vitest';
import {
  cn,
  formatDate,
  formatDateTime,
  STATUS_ORDER,
  statusLabels,
  statusColors,
  statusDotColors,
  jobTypeLabels,
  jobTypeColors,
  documentTypeLabels,
  documentTypeColors,
  reminderTypeLabels,
  reminderTypeColors,
  eventTypeLabels,
} from '@/lib/utils';
import type { ApplicationStatus, JobType, DocumentType, ReminderType, EventType } from '@/types';

describe('Utility: cn (Classnames & Tailwind Merge)', () => {
  it('should merge class strings correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('should handle falsy and conditional values', () => {
    expect(cn('btn', false && 'btn-primary', null, undefined, 'btn-large')).toBe('btn btn-large');
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

  it('STATUS_ORDER should contain exactly all 8 application statuses in canonical order', () => {
    expect(STATUS_ORDER).toHaveLength(8);
    expect(STATUS_ORDER).toEqual(allStatuses);
  });

  it('every application status should have defined labels, colors, and dot colors', () => {
    allStatuses.forEach((status) => {
      expect(statusLabels[status]).toBeDefined();
      expect(typeof statusLabels[status]).toBe('string');
      expect(statusLabels[status].length).toBeGreaterThan(0);

      expect(statusColors[status]).toBeDefined();
      expect(statusColors[status]).toContain('bg-');
      expect(statusColors[status]).toContain('text-');

      expect(statusDotColors[status]).toBeDefined();
      expect(statusDotColors[status]).toContain('bg-');
    });
  });

  it('every job type should have defined labels and color badges', () => {
    allJobTypes.forEach((type) => {
      expect(jobTypeLabels[type]).toBeDefined();
      expect(jobTypeColors[type]).toBeDefined();
      expect(jobTypeColors[type]).toContain('bg-');
      expect(jobTypeColors[type]).toContain('text-');
    });
  });

  it('every document type should have valid labels and color badges', () => {
    const docTypes: DocumentType[] = ['CV', 'LETTRE_MOTIVATION', 'COVER_LETTER', 'PORTFOLIO', 'OTHER'];
    docTypes.forEach((type) => {
      expect(documentTypeLabels[type]).toBeDefined();
      expect(documentTypeColors[type]).toBeDefined();
      expect(documentTypeColors[type]).toContain('bg-');
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
      expect(reminderTypeLabels[type]).toBeDefined();
      expect(reminderTypeColors[type]).toBeDefined();
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
      expect(eventTypeLabels[type]).toBeDefined();
    });
  });
});
