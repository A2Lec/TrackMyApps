import { describe, it, expect } from 'vitest';
import { STATUS_ORDER } from '@/lib/utils';
import type { Application, ApplicationStatus, JobType, KanbanColumns } from '@/types';

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
    status: 'SENT',
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
    status: 'OFFER' as any, // edge test
    applicationDate: '2026-03-05T11:00:00.000Z',
    createdAt: '2026-03-05T11:00:00.000Z',
    updatedAt: '2026-03-05T11:00:00.000Z',
  },
];

const mockKanbanData: KanbanColumns = {
  DRAFT: [],
  SENT: [mockApps[0], mockApps[2]],
  VIEWED: [],
  INTERVIEW_SCHEDULED: [mockApps[1]],
  AWAITING_RESPONSE: [],
  REJECTED: [],
  ACCEPTED: [],
  GHOSTED: [],
};

// Pure logic functions mimicking Applications.tsx
function filterApplications(
  apps: Application[],
  search: string,
  jobTypeFilter: JobType | 'ALL',
  sortBy: 'date_desc' | 'date_asc' | 'company'
) {
  let list = apps.filter((app) => {
    const matchSearch =
      !search ||
      app.companyName.toLowerCase().includes(search.toLowerCase()) ||
      app.position.toLowerCase().includes(search.toLowerCase()) ||
      (app.location && app.location.toLowerCase().includes(search.toLowerCase()));

    const matchType = jobTypeFilter === 'ALL' || app.jobType === jobTypeFilter;

    return matchSearch && matchType;
  });

  if (sortBy === 'date_desc') {
    list.sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
  } else if (sortBy === 'date_asc') {
    list.sort((a, b) => new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime());
  } else if (sortBy === 'company') {
    list.sort((a, b) => a.companyName.localeCompare(b.companyName));
  }

  return list;
}

function resolveDropStatus(
  over: { id: string; data?: { current?: { status?: string; type?: string } } } | null,
  kanbanData: KanbanColumns
): ApplicationStatus | null {
  if (!over) return null;

  if (over.data?.current?.status) {
    return over.data.current.status as ApplicationStatus;
  }
  if (over.data?.current?.type === 'Column') {
    return over.id as ApplicationStatus;
  }
  if (STATUS_ORDER.includes(over.id as ApplicationStatus)) {
    return over.id as ApplicationStatus;
  }
  for (const [colStatus, apps] of Object.entries(kanbanData)) {
    if ((apps as Application[]).some((app: Application) => app.id === over.id)) {
      return colStatus as ApplicationStatus;
    }
  }

  return null;
}

function applyOptimisticStatusMove(
  kanban: KanbanColumns,
  applicationId: string,
  newStatus: ApplicationStatus
): KanbanColumns {
  const next: KanbanColumns = { ...kanban };
  let movedApp: Application | null = null;

  for (const col of Object.keys(next) as ApplicationStatus[]) {
    const list = next[col];
    if (Array.isArray(list)) {
      const idx = list.findIndex((a) => a.id === applicationId);
      if (idx !== -1) {
        movedApp = { ...list[idx], status: newStatus };
        next[col] = [...list.slice(0, idx), ...list.slice(idx + 1)];
        break;
      }
    }
  }

  if (movedApp) {
    next[newStatus] = [movedApp, ...(next[newStatus] || [])];
  }

  return next;
}

describe('Kanban Logic: Filtering', () => {
  it('should return all items when no search and jobTypeFilter is ALL', () => {
    const result = filterApplications(mockApps, '', 'ALL', 'date_desc');
    expect(result).toHaveLength(4);
  });

  it('should filter by company name case-insensitively', () => {
    const result = filterApplications(mockApps, 'google', 'ALL', 'date_desc');
    expect(result).toHaveLength(1);
    expect(result[0].companyName).toBe('Google');
  });

  it('should filter by position case-insensitively', () => {
    const result = filterApplications(mockApps, 'engineer', 'ALL', 'date_desc');
    expect(result).toHaveLength(2); // Google & BlaBlaCar
    expect(result.map((a) => a.companyName)).toEqual(expect.arrayContaining(['Google', 'BlaBlaCar']));
  });

  it('should filter by location case-insensitively', () => {
    const result = filterApplications(mockApps, 'paris', 'ALL', 'date_desc');
    expect(result).toHaveLength(2); // Google & BlaBlaCar
  });

  it('should filter by job type', () => {
    const resultStage = filterApplications(mockApps, '', 'STAGE', 'date_desc');
    expect(resultStage).toHaveLength(1);
    expect(resultStage[0].companyName).toBe('Amazon');

    const resultCdi = filterApplications(mockApps, '', 'CDI', 'date_desc');
    expect(resultCdi).toHaveLength(2);
  });

  it('should combine search text and job type filter', () => {
    const result = filterApplications(mockApps, 'Paris', 'CDI', 'date_desc');
    expect(result).toHaveLength(2);

    const noResult = filterApplications(mockApps, 'Amazon', 'CDI', 'date_desc');
    expect(noResult).toHaveLength(0);
  });
});

describe('Kanban Logic: Sorting', () => {
  it('should sort by date descending (newest first)', () => {
    const result = filterApplications(mockApps, '', 'ALL', 'date_desc');
    expect(result[0].companyName).toBe('Amazon'); // 10 Mars 2026
    expect(result[1].companyName).toBe('BlaBlaCar'); // 5 Mars 2026
    expect(result[2].companyName).toBe('Google'); // 1 Mars 2026
    expect(result[3].companyName).toBe('Doctolib'); // 15 Fevrier 2026
  });

  it('should sort by date ascending (oldest first)', () => {
    const result = filterApplications(mockApps, '', 'ALL', 'date_asc');
    expect(result[0].companyName).toBe('Doctolib'); // 15 Fevrier 2026
    expect(result[3].companyName).toBe('Amazon'); // 10 Mars 2026
  });

  it('should sort by company name alphabetically (A-Z)', () => {
    const result = filterApplications(mockApps, '', 'ALL', 'company');
    expect(result.map((a) => a.companyName)).toEqual(['Amazon', 'BlaBlaCar', 'Doctolib', 'Google']);
  });
});

describe('Kanban Logic: Drop Status Resolution', () => {
  it('should return status when over payload contains status directly', () => {
    const status = resolveDropStatus(
      { id: 'custom-id', data: { current: { status: 'INTERVIEW_SCHEDULED' } } },
      mockKanbanData
    );
    expect(status).toBe('INTERVIEW_SCHEDULED');
  });

  it('should return status when over.id is a valid ApplicationStatus column ID', () => {
    const status = resolveDropStatus({ id: 'REJECTED' }, mockKanbanData);
    expect(status).toBe('REJECTED');
  });

  it('should resolve column status when dropping onto an existing card ID', () => {
    // Dropping onto app-1 (which is in SENT)
    const status1 = resolveDropStatus({ id: 'app-1' }, mockKanbanData);
    expect(status1).toBe('SENT');

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
    expect(next.SENT).toHaveLength(1);
    expect(next.SENT[0].id).toBe('app-3');

    // Should be present in ACCEPTED with updated status
    expect(next.ACCEPTED).toHaveLength(1);
    expect(next.ACCEPTED[0].id).toBe('app-1');
    expect(next.ACCEPTED[0].status).toBe('ACCEPTED');

    // Other columns must remain untouched
    expect(next.INTERVIEW_SCHEDULED).toHaveLength(1);
    expect(next.DRAFT).toHaveLength(0);
  });

  it('should handle moving to an empty column seamlessly', () => {
    expect(mockKanbanData.GHOSTED).toHaveLength(0);

    const next = applyOptimisticStatusMove(mockKanbanData, 'app-2', 'GHOSTED');

    expect(next.INTERVIEW_SCHEDULED).toHaveLength(0);
    expect(next.GHOSTED).toHaveLength(1);
    expect(next.GHOSTED[0].id).toBe('app-2');
    expect(next.GHOSTED[0].status).toBe('GHOSTED');
  });

  it('should gracefully handle non-existent application ID without corrupting state', () => {
    const next = applyOptimisticStatusMove(mockKanbanData, 'non-existent', 'REJECTED');
    expect(next.REJECTED).toHaveLength(0);
    expect(next.SENT).toHaveLength(2);
  });
});
