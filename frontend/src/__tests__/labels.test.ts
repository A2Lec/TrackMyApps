import { describe, it, expect } from 'vitest';
import { STATUS_LABELS, JOB_TYPE_LABELS, EVENT_TYPE_LABELS, DOCUMENT_TYPE_LABELS } from '@/constants/labels';

describe('Labels', () => {
  it('should have labels for all application statuses', () => {
    const statuses = ['DRAFT', 'SENT', 'VIEWED', 'INTERVIEW_SCHEDULED', 'AWAITING_RESPONSE', 'REJECTED', 'ACCEPTED', 'GHOSTED'];
    statuses.forEach(status => {
      expect(STATUS_LABELS[status as keyof typeof STATUS_LABELS]).toBeDefined();
      expect(typeof STATUS_LABELS[status as keyof typeof STATUS_LABELS]).toBe('string');
    });
  });

  it('should have labels for all job types', () => {
    const types = ['STAGE', 'ALTERNANCE', 'CDI', 'JOB_ETUDIANT'];
    types.forEach(type => {
      expect(JOB_TYPE_LABELS[type as keyof typeof JOB_TYPE_LABELS]).toBeDefined();
    });
  });

  it('should have labels for all event types', () => {
    const types = ['CREATED', 'SENT', 'VIEWED', 'RELANCE_SENT', 'INTERVIEW_SCHEDULED', 'INTERVIEW_DONE', 'REJECTED', 'ACCEPTED', 'STATUS_CHANGED'];
    types.forEach(type => {
      expect(EVENT_TYPE_LABELS[type as keyof typeof EVENT_TYPE_LABELS]).toBeDefined();
    });
  });

  it('should have labels for all document types', () => {
    const types = ['CV', 'LETTRE_MOTIVATION', 'COVER_LETTER', 'PORTFOLIO', 'OTHER'];
    types.forEach(type => {
      expect(DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS]).toBeDefined();
    });
  });
});
