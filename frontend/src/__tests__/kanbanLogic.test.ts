import { describe, it, expect } from 'vitest';
import { KANBAN_STATUS_ORDER } from '@/constants/labels';
import {
  mapStatusToKanbanColumn,
  groupApplicationsForKanban,
  filterAndSortApplications,
  resolveDropStatus,
  applyOptimisticStatusMove,
} from '@/lib/kanban';
import type { Application, KanbanColumns } from '@/types';

// Mock applications fixtures
const mockApps: Application[] = [
  {
    id: 'app-1',
    userId: 'user-1',
    companyName: 'Google',
    position: 'Frontend Engineer',
    jobType: 'CDI',
    location: 'Paris',
    status: 'SENT',
    applicationDate: '2026-03-01T10:00:00.000Z',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'app-2',
    userId: 'user-1',
    companyName: 'Amazon',
    position: 'Fullstack Intern',
    jobType: 'STAGE',
    location: 'Clichy',
    status: 'INTERVIEW_SCHEDULED',
    applicationDate: '2026-03-10T14:00:00.000Z',
    createdAt: '2026-03-10T14:00:00.000Z',
    updatedAt: '2026-03-10T14:00:00.000Z',
  },
  {
    id: 'app-3',
    userId: 'user-1',
    companyName: 'Doctolib',
    position: 'Backend Developer',
    jobType: 'ALTERNANCE',
    location: 'Nantes',
    status: 'VIEWED', // should map to SENT column
    applicationDate: '2026-02-15T09:00:00.000Z',
    createdAt: '2026-02-15T09:00:00.000Z',
    updatedAt: '2026-02-15T09:00:00.000Z',
  },
  {
    id: 'app-4',
    userId: 'user-1',
    companyName: 'BlaBlaCar',
    position: 'DevOps Engineer',
    jobType: 'CDI',
    location: 'Paris',
    status: 'GHOSTED', // should map to REJECTED column
    applicationDate: '2026-03-05T11:00:00.000Z',
    createdAt: '2026-03-05T11:00:00.000Z',
    updatedAt: '2026-03-05T11:00:00.000Z',
  },
  {
    id: 'app-5',
    userId: 'user-1',
    companyName: 'Spotify',
    position: 'Platform Engineer',
    jobType: 'CDI',
    location: 'Remote',
    status: 'AWAITING_RESPONSE', // should map to INTERVIEW_SCHEDULED
    applicationDate: '2026-03-12T09:00:00.000Z',
    createdAt: '2026-03-12T09:00:00.000Z',
    updatedAt: '2026-03-12T09:00:00.000Z',
  },
];

const mockKanbanData: KanbanColumns = {
  DRAFT: [],
  SENT: [mockApps[0]],
  VIEWED: [mockApps[2]],
  INTERVIEW_SCHEDULED: [mockApps[1]],
  AWAITING_RESPONSE: [mockApps[4]],
  REJECTED: [],
  ACCEPTED: [],
  GHOSTED: [mockApps[3]],
};

describe('Sprint 1 - TICK-102: 5 Canonical Kanban Columns & Status Mapping', () => {
  it('KANBAN_STATUS_ORDER must contain exactly the 5 streamlined columns', () => {
    expect(KANBAN_STATUS_ORDER).toEqual([
      'DRAFT',
      'SENT',
      'INTERVIEW_SCHEDULED',
      'ACCEPTED',
      'REJECTED',
    ]);
  });

  it('maps granular legacy statuses to canonical 5 columns', () => {
    expect(mapStatusToKanbanColumn('DRAFT')).toBe('DRAFT');
    expect(mapStatusToKanbanColumn('SENT')).toBe('SENT');
    expect(mapStatusToKanbanColumn('VIEWED')).toBe('SENT');
    expect(mapStatusToKanbanColumn('INTERVIEW_SCHEDULED')).toBe('INTERVIEW_SCHEDULED');
    expect(mapStatusToKanbanColumn('AWAITING_RESPONSE')).toBe('INTERVIEW_SCHEDULED');
    expect(mapStatusToKanbanColumn('ACCEPTED')).toBe('ACCEPTED');
    expect(mapStatusToKanbanColumn('REJECTED')).toBe('REJECTED');
    expect(mapStatusToKanbanColumn('GHOSTED')).toBe('REJECTED');
  });

  it('groupApplicationsForKanban combines sub-statuses into 5 canonical columns', () => {
    const grouped = groupApplicationsForKanban(mockKanbanData);

    // SENT column should contain app-1 (SENT) and app-3 (VIEWED)
    expect(grouped.SENT).toHaveLength(2);
    expect(grouped.SENT.map((a) => a.id)).toEqual(['app-1', 'app-3']);

    // INTERVIEW_SCHEDULED should contain app-2 (INTERVIEW_SCHEDULED) and app-5 (AWAITING_RESPONSE)
    expect(grouped.INTERVIEW_SCHEDULED).toHaveLength(2);
    expect(grouped.INTERVIEW_SCHEDULED.map((a) => a.id)).toEqual(['app-2', 'app-5']);

    // REJECTED should contain app-4 (GHOSTED)
    expect(grouped.REJECTED).toHaveLength(1);
    expect(grouped.REJECTED[0].id).toBe('app-4');

    // DRAFT and ACCEPTED should be empty
    expect(grouped.DRAFT).toHaveLength(0);
    expect(grouped.ACCEPTED).toHaveLength(0);
  });
});

describe('Kanban Logic: Filtering', () => {
  it('should return all items when no search and jobTypeFilter is ALL', () => {
    const result = filterAndSortApplications(mockApps, '', 'ALL', 'date_desc');
    expect(result).toHaveLength(5);
  });

  it('should filter by company name case-insensitively', () => {
    const result = filterAndSortApplications(mockApps, 'google', 'ALL', 'date_desc');
    expect(result).toHaveLength(1);
    expect(result[0].companyName).toBe('Google');
  });

  it('should filter by position case-insensitively', () => {
    const result = filterAndSortApplications(mockApps, 'engineer', 'ALL', 'date_desc');
    expect(result).toHaveLength(3); // Google, BlaBlaCar, Spotify
    expect(result.map((a) => a.companyName)).toEqual(expect.arrayContaining(['Google', 'BlaBlaCar', 'Spotify']));
  });

  it('should filter by location case-insensitively', () => {
    const result = filterAndSortApplications(mockApps, 'paris', 'ALL', 'date_desc');
    expect(result).toHaveLength(2); // Google & BlaBlaCar
  });

  it('should filter by job type', () => {
    const resultStage = filterAndSortApplications(mockApps, '', 'STAGE', 'date_desc');
    expect(resultStage).toHaveLength(1);
    expect(resultStage[0].companyName).toBe('Amazon');

    const resultCdi = filterAndSortApplications(mockApps, '', 'CDI', 'date_desc');
    expect(resultCdi).toHaveLength(3);
  });

  it('should combine search text and job type filter', () => {
    const result = filterAndSortApplications(mockApps, 'Paris', 'CDI', 'date_desc');
    expect(result).toHaveLength(2);

    const noResult = filterAndSortApplications(mockApps, 'Amazon', 'CDI', 'date_desc');
    expect(noResult).toHaveLength(0);
  });
});

describe('Kanban Logic: Sorting', () => {
  it('should sort by date descending (newest first)', () => {
    const result = filterAndSortApplications(mockApps, '', 'ALL', 'date_desc');
    expect(result[0].companyName).toBe('Spotify'); // 12 Mars 2026
    expect(result[1].companyName).toBe('Amazon'); // 10 Mars 2026
    expect(result[2].companyName).toBe('BlaBlaCar'); // 5 Mars 2026
    expect(result[3].companyName).toBe('Google'); // 1 Mars 2026
    expect(result[4].companyName).toBe('Doctolib'); // 15 Fevrier 2026
  });

  it('should sort by date ascending (oldest first)', () => {
    const result = filterAndSortApplications(mockApps, '', 'ALL', 'date_asc');
    expect(result[0].companyName).toBe('Doctolib'); // 15 Fevrier 2026
    expect(result[4].companyName).toBe('Spotify'); // 12 Mars 2026
  });

  it('should sort by company name alphabetically (A-Z)', () => {
    const result = filterAndSortApplications(mockApps, '', 'ALL', 'company');
    expect(result.map((a) => a.companyName)).toEqual(['Amazon', 'BlaBlaCar', 'Doctolib', 'Google', 'Spotify']);
  });
});

describe('Kanban Logic: Drop Status Resolution (5 Columns)', () => {
  it('should return canonical status when over payload contains status directly', () => {
    const status = resolveDropStatus(
      { id: 'custom-id', data: { current: { status: 'INTERVIEW_SCHEDULED' } } },
      mockKanbanData
    );
    expect(status).toBe('INTERVIEW_SCHEDULED');
  });

  it('should map granular drop status to canonical column status', () => {
    const statusViewed = resolveDropStatus(
      { id: 'custom-id', data: { current: { status: 'VIEWED' } } },
      mockKanbanData
    );
    expect(statusViewed).toBe('SENT');

    const statusGhosted = resolveDropStatus(
      { id: 'custom-id', data: { current: { status: 'GHOSTED' } } },
      mockKanbanData
    );
    expect(statusGhosted).toBe('REJECTED');
  });

  it('should return status when over.id is a valid ApplicationStatus column ID', () => {
    const status = resolveDropStatus({ id: 'REJECTED' }, mockKanbanData);
    expect(status).toBe('REJECTED');
  });

  it('should resolve canonical column status when dropping onto an existing card ID', () => {
    // Dropping onto app-1 (which is in SENT)
    const status1 = resolveDropStatus({ id: 'app-1' }, mockKanbanData);
    expect(status1).toBe('SENT');

    // Dropping onto app-3 (which is in VIEWED, mapped to SENT)
    const status3 = resolveDropStatus({ id: 'app-3' }, mockKanbanData);
    expect(status3).toBe('SENT');

    // Dropping onto app-4 (which is in GHOSTED, mapped to REJECTED)
    const status4 = resolveDropStatus({ id: 'app-4' }, mockKanbanData);
    expect(status4).toBe('REJECTED');

    // Dropping onto app-2 (which is in INTERVIEW_SCHEDULED)
    const status2 = resolveDropStatus({ id: 'app-2' }, mockKanbanData);
    expect(status2).toBe('INTERVIEW_SCHEDULED');
  });

  it('should return null when dropping outside or on unknown target', () => {
    expect(resolveDropStatus(null, mockKanbanData)).toBeNull();
    expect(resolveDropStatus({ id: 'unknown-id' }, mockKanbanData)).toBeNull();
  });
});

describe('Kanban Logic: Optimistic Cache Transition', () => {
  it('should move an application from source column to destination column immediately', () => {
    const next = applyOptimisticStatusMove(mockKanbanData, 'app-1', 'ACCEPTED');

    // Should be removed from SENT
    expect(next.SENT.some((a) => a.id === 'app-1')).toBe(false);
    expect(next.SENT).toHaveLength(0);

    // Should be present in ACCEPTED with updated status
    expect(next.ACCEPTED).toHaveLength(1);
    expect(next.ACCEPTED[0].id).toBe('app-1');
    expect(next.ACCEPTED[0].status).toBe('ACCEPTED');

    // Other columns must remain untouched
    expect(next.INTERVIEW_SCHEDULED).toHaveLength(1);
    expect(next.DRAFT).toHaveLength(0);
  });

  it('should handle moving to an empty column seamlessly', () => {
    expect(mockKanbanData.REJECTED).toHaveLength(0);

    const next = applyOptimisticStatusMove(mockKanbanData, 'app-2', 'REJECTED');

    expect(next.INTERVIEW_SCHEDULED).toHaveLength(0);
    expect(next.REJECTED).toHaveLength(1);
    expect(next.REJECTED[0].id).toBe('app-2');
    expect(next.REJECTED[0].status).toBe('REJECTED');
  });

  it('should gracefully handle non-existent application ID without corrupting state', () => {
    const next = applyOptimisticStatusMove(mockKanbanData, 'non-existent', 'REJECTED');
    expect(next.REJECTED).toHaveLength(0);
    expect(next.SENT).toHaveLength(1);
  });
});
