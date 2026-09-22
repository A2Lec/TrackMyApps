import type { Application, ApplicationStatus, JobType, KanbanColumns } from '@/types';
import { KANBAN_STATUS_ORDER, ALL_STATUSES } from '@/constants/labels';

/**
 * Maps any granular application status to one of the 5 canonical Kanban columns.
 * - DRAFT -> DRAFT
 * - SENT, VIEWED -> SENT
 * - INTERVIEW_SCHEDULED, AWAITING_RESPONSE -> INTERVIEW_SCHEDULED
 * - ACCEPTED -> ACCEPTED
 * - REJECTED, GHOSTED -> REJECTED
 */
export function mapStatusToKanbanColumn(status: ApplicationStatus): ApplicationStatus {
  switch (status) {
    case 'VIEWED':
      return 'SENT';
    case 'AWAITING_RESPONSE':
      return 'INTERVIEW_SCHEDULED';
    case 'GHOSTED':
      return 'REJECTED';
    case 'DRAFT':
    case 'SENT':
    case 'INTERVIEW_SCHEDULED':
    case 'ACCEPTED':
    case 'REJECTED':
      return status;
    default:
      return status;
  }
}

/**
 * Groups raw kanban columns data (which may have up to 8 statuses) into the
 * 5 canonical columns for the streamlined board.
 */
export function groupApplicationsForKanban(
  kanbanData: Partial<Record<ApplicationStatus, Application[]>> | undefined
): Record<ApplicationStatus, Application[]> {
  const grouped: Record<ApplicationStatus, Application[]> = {
    DRAFT: [],
    SENT: [],
    VIEWED: [],
    INTERVIEW_SCHEDULED: [],
    AWAITING_RESPONSE: [],
    ACCEPTED: [],
    REJECTED: [],
    GHOSTED: [],
  };

  if (!kanbanData) return grouped;

  for (const apps of Object.values(kanbanData)) {
    if (!Array.isArray(apps)) continue;
    for (const app of apps) {
      const canonicalCol = mapStatusToKanbanColumn(app.status);
      grouped[canonicalCol].push(app);
    }
  }

  return grouped;
}

/**
 * Filters and sorts applications based on search query, contract type, and sort order.
 */
export function filterAndSortApplications(
  apps: Application[],
  search: string,
  jobTypeFilter: JobType | 'ALL',
  sortBy: 'date_desc' | 'date_asc' | 'company'
): Application[] {
  const query = search.trim().toLowerCase();

  const filtered = apps.filter((app) => {
    const matchSearch =
      !query ||
      app.companyName.toLowerCase().includes(query) ||
      app.position.toLowerCase().includes(query) ||
      (Boolean(app.location) && app.location.toLowerCase().includes(query));

    const matchType = jobTypeFilter === 'ALL' || app.jobType === jobTypeFilter;

    return matchSearch && matchType;
  });

  if (sortBy === 'date_desc') {
    filtered.sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
  } else if (sortBy === 'date_asc') {
    filtered.sort((a, b) => new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime());
  } else if (sortBy === 'company') {
    filtered.sort((a, b) => a.companyName.localeCompare(b.companyName));
  }

  return filtered;
}

/**
 * Resolves the destination ApplicationStatus when an item is dropped onto a target in the Kanban.
 */
export function resolveDropStatus(
  over: { id: string; data?: { current?: { status?: string; type?: string } } } | null,
  kanbanData?: Partial<Record<ApplicationStatus, Application[]>>
): ApplicationStatus | null {
  if (!over) return null;

  let rawStatus: ApplicationStatus | null = null;

  if (over.data?.current?.status) {
    rawStatus = over.data.current.status as ApplicationStatus;
  } else if (over.data?.current?.type === 'Column') {
    rawStatus = over.id as ApplicationStatus;
  } else if (KANBAN_STATUS_ORDER.includes(over.id as ApplicationStatus)) {
    rawStatus = over.id as ApplicationStatus;
  } else if (ALL_STATUSES.includes(over.id as ApplicationStatus)) {
    rawStatus = over.id as ApplicationStatus;
  } else if (kanbanData) {
    for (const [colStatus, apps] of Object.entries(kanbanData)) {
      if (Array.isArray(apps) && apps.some((app: Application) => app.id === over.id)) {
        rawStatus = colStatus as ApplicationStatus;
        break;
      }
    }
  }

  if (!rawStatus) return null;
  return mapStatusToKanbanColumn(rawStatus);
}

/**
 * Optimistically updates the Kanban columns cache when a card moves.
 */
export function applyOptimisticStatusMove(
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
