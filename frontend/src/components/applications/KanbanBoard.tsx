import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Application, ApplicationStatus, JobType, KanbanColumns } from '@/types';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/StatusBadge';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { KANBAN_STATUS_ORDER, cn, statusLabels, twoDigits } from '@/lib/utils';
import {
  filterAndSortApplications,
  groupApplicationsForKanban,
  mapStatusToKanbanColumn,
  resolveDropStatus,
  type ApplicationSort,
} from '@/lib/kanban';
import { ApplicationCard, SortableApplicationCard } from './ApplicationCard';

interface KanbanFilters {
  search: string;
  jobTypeFilter: JobType | 'ALL';
  sortBy: ApplicationSort;
}

interface KanbanBoardProps extends KanbanFilters {
  kanbanData: KanbanColumns;
  onCardClick: (application: Application) => void;
  onDelete: (application: Application) => void;
  onAdd: (status: ApplicationStatus) => void;
  /** A card was dropped in another column */
  onMove: (applicationId: string, status: ApplicationStatus) => void;
}

// Pointer position first (best for columns), then the closest corners
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : closestCorners(args);
};

/**
 * Drag-and-drop board: five columns on desktop, one column with tabs on mobile
 */
export function KanbanBoard({ kanbanData, onCardClick, onDelete, onAdd, onMove, ...filters }: KanbanBoardProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mobileColumn, setMobileColumn] = useState<ApplicationStatus>('SENT');
  const [activeId, setActiveId] = useState<string | null>(null);

  // A 6px move starts a drag, so plain clicks still open the card
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = useMemo(() => groupApplicationsForKanban(kanbanData), [kanbanData]);

  const activeApplication = useMemo(
    () => (activeId ? Object.values(kanbanData).flat().find((app) => app.id === activeId) ?? null : null),
    [activeId, kanbanData]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const newStatus = resolveDropStatus(over, kanbanData);
    if (!newStatus) return;

    const applicationId = String(active.id);
    const currentStatus =
      (active.data.current?.status as ApplicationStatus | undefined) ??
      (Object.keys(kanbanData) as ApplicationStatus[]).find((status) =>
        kanbanData[status].some((app) => app.id === applicationId)
      );

    if (currentStatus && mapStatusToKanbanColumn(currentStatus) !== newStatus) {
      onMove(applicationId, newStatus);
    }
  };

  const columnProps = (status: ApplicationStatus) => ({
    status,
    applications: columns[status] || [],
    ...filters,
    onCardClick,
    onDelete,
    onAddClick: () => onAdd(status),
  });

  return (
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {isDesktop ? (
        <div className="flex gap-3.5 overflow-x-auto xl:overflow-x-visible pb-4 items-stretch min-h-[calc(100vh-280px)]">
          {KANBAN_STATUS_ORDER.map((status) => (
            <KanbanColumn key={status} {...columnProps(status)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto pb-2 flex gap-1.5 scrollbar-none">
            {KANBAN_STATUS_ORDER.map((status) => (
              <button
                key={status}
                onClick={() => setMobileColumn(status)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                  mobileColumn === status
                    ? 'bg-foreground text-background font-semibold'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}
              >
                <StatusDot status={status} />
                <span>{statusLabels[status]}</span>
                <span className="font-mono opacity-80">{twoDigits((columns[status] || []).length)}</span>
              </button>
            ))}
          </div>

          <KanbanColumn {...columnProps(mobileColumn)} isMobileView />
        </div>
      )}

      <DragOverlay dropAnimation={null}>
        {activeApplication && (
          <div className="w-72 sm:w-80 pointer-events-none">
            <ApplicationCard application={activeApplication} isOverlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

interface KanbanColumnProps extends KanbanFilters {
  status: ApplicationStatus;
  applications: Application[];
  onCardClick: (application: Application) => void;
  onDelete: (application: Application) => void;
  onAddClick: () => void;
  isMobileView?: boolean;
}

function KanbanColumn({
  status,
  applications,
  search,
  jobTypeFilter,
  sortBy,
  onCardClick,
  onDelete,
  onAddClick,
  isMobileView,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'Column', status } });

  const filteredApps = useMemo(
    () => filterAndSortApplications(applications, search, jobTypeFilter, sortBy),
    [applications, search, jobTypeFilter, sortBy]
  );

  return (
    <div className={cn('flex-shrink-0 flex flex-col', isMobileView ? 'w-full' : 'w-72 xl:w-auto xl:flex-1 min-w-[210px]')}>
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <StatusDot status={status} className="h-2.5 w-2.5" />
          <h3 className="font-semibold text-sm text-foreground tracking-tight">{statusLabels[status]}</h3>
          <span className="font-mono text-xs font-medium text-muted-foreground">{twoDigits(filteredApps.length)}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onAddClick}
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
          title={`Ajouter une candidature en "${statusLabels[status]}"`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'bg-muted/35 dark:bg-muted/20 rounded-lg p-2 min-h-[450px] flex-1 border border-border/50 flex flex-col gap-2 transition-all duration-150',
          isOver && 'ring-2 ring-primary/50 bg-primary/10 border-primary/40'
        )}
      >
        <SortableContext items={filteredApps.map((app) => app.id)} strategy={verticalListSortingStrategy}>
          {filteredApps.length > 0 ? (
            filteredApps.map((app) => (
              <SortableApplicationCard
                key={app.id}
                application={app}
                onClick={() => onCardClick(app)}
                onDelete={() => onDelete(app)}
              />
            ))
          ) : (
            <div
              onClick={onAddClick}
              className={cn(
                'flex-1 flex flex-col items-center justify-center p-6 border border-dashed rounded-lg text-center cursor-pointer transition-colors group',
                isOver ? 'border-primary/60 bg-primary/10' : 'border-border/80 hover:bg-muted/40'
              )}
            >
              <Plus className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary transition-colors mb-1" />
              <p className="text-xs text-muted-foreground/80 group-hover:text-foreground font-medium">Ajouter une candidature</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
