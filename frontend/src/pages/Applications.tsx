import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsService } from '@/services/applications.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailVerifiedGuard, useEmailVerified } from '@/components/EmailVerifiedGuard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Building2,
  MapPin,
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate, statusLabels, statusColors, statusDotColors, jobTypeLabels, jobTypeColors, cn } from '@/lib/utils';
import type { Application, ApplicationStatus, JobType } from '@/types';
import { Link } from 'react-router-dom';
import { ApplicationForm } from '@/components/ApplicationForm';

const statusOrder: ApplicationStatus[] = [
  'DRAFT',
  'SENT',
  'VIEWED',
  'INTERVIEW_SCHEDULED',
  'AWAITING_RESPONSE',
  'REJECTED',
  'ACCEPTED',
  'GHOSTED',
];

export function ApplicationsPage() {
  const queryClient = useQueryClient();
  const isEmailVerified = useEmailVerified();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const submitRef = useRef<(() => void) | null>(null);

  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);

  const { data: kanbanData, isLoading: kanbanLoading, isError, error } = useQuery({
    queryKey: ['applications', 'kanban'],
    queryFn: applicationsService.getByStatus,
    enabled: view === 'kanban',
  });

  const {
    data: listData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: listLoading,
  } = useInfiniteQuery({
    queryKey: ['applications', 'list', search],
    queryFn: ({ pageParam = 1 }) => applicationsService.getAll(
      { search: search || undefined },
      pageParam,
      20
    ),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    initialPageParam: 1,
    enabled: view === 'list',
  });

  const isLoading = view === 'kanban' ? kanbanLoading : listLoading;

  const createMutation = useMutation({
    mutationFn: applicationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowCreateDialog(false);
      toast.success('Candidature créée avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + (error.response?.data?.message || error.message || 'Erreur inconnue'));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Statut mis à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, deleteCompany }: { id: string; deleteCompany: boolean }) =>
      applicationsService.delete(id, deleteCompany),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setApplicationToDelete(null);
      toast.success('Candidature supprimée');
    },
  });

  const handleDeleteClick = (application: Application) => {
    setApplicationToDelete(application);
  };

  const confirmDelete = (deleteCompany: boolean) => {
    if (applicationToDelete) {
      deleteMutation.mutate({ id: applicationToDelete.id, deleteCompany });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const applicationId = active.id as string;
    const newStatus = over.id as ApplicationStatus;

    // Find current status
    let currentStatus: ApplicationStatus | null = null;
    for (const [status, apps] of Object.entries(kanbanData || {})) {
      if (apps.some((app: Application) => app.id === applicationId)) {
        currentStatus = status as ApplicationStatus;
        break;
      }
    }

    if (currentStatus && currentStatus !== newStatus) {
      updateStatusMutation.mutate({ id: applicationId, status: newStatus });
    }
  };

  const getActiveApplication = (): Application | null => {
    if (!activeId || !kanbanData) return null;
    for (const apps of Object.values(kanbanData)) {
      const app = apps.find((a: Application) => a.id === activeId);
      if (app) return app;
    }
    return null;
  };

  if (isLoading) {
    return <ApplicationsSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="text-destructive text-xl font-semibold">Une erreur est survenue lors du chargement des candidatures</div>
        <p className="text-muted-foreground">{(error as Error).message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['applications'] })}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Candidatures</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gérez toutes vos candidatures en un coup d'œil
          </p>
        </div>
        <EmailVerifiedGuard>
          <Button onClick={() => setShowCreateDialog(true)} className="w-full md:w-auto" disabled={!isEmailVerified}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle candidature
          </Button>
        </EmailVerifiedGuard>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant={view === 'kanban' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && kanbanData && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statusOrder.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                applications={kanbanData[status] || []}
                search={search}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
          <DragOverlay>
            {activeId && getActiveApplication() && (
              <ApplicationCard
                application={getActiveApplication()!}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {view === 'list' && listData && (
        <>
          <p className="text-sm text-muted-foreground">
            {listData.pages[0]?.total ?? 0} candidatures
          </p>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 sm:p-4 font-medium">Entreprise</th>
                      <th className="text-left p-3 sm:p-4 font-medium">Poste</th>
                      <th className="text-left p-3 sm:p-4 font-medium hidden md:table-cell">Type</th>
                      <th className="text-left p-3 sm:p-4 font-medium">Statut</th>
                      <th className="text-left p-3 sm:p-4 font-medium hidden lg:table-cell">Date</th>
                      <th className="text-right p-3 sm:p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(listData.pages.flatMap(page => page.data)).map((app) => (
                        <tr key={app.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 sm:p-4">
                            <Link
                              to={`/applications/${app.id}`}
                              className="font-medium hover:text-primary"
                            >
                              {app.companyName}
                            </Link>
                          </td>
                          <td className="p-3 sm:p-4 text-muted-foreground">{app.position}</td>
                          <td className="p-3 sm:p-4 hidden md:table-cell">
                            <span className={cn('px-2 py-1 rounded-full text-xs', jobTypeColors[app.jobType as JobType])}>
                              {jobTypeLabels[app.jobType as JobType]}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4">
                            <span className={cn('px-2 py-1 rounded-full text-xs whitespace-nowrap', statusColors[app.status as ApplicationStatus])}>
                              {statusLabels[app.status as ApplicationStatus]}
                            </span>
                          </td>
                          <td className="p-3 sm:p-4 text-muted-foreground hidden lg:table-cell">
                            {formatDate(app.applicationDate)}
                          </td>
                          <td className="p-3 sm:p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/applications/${app.id}`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Voir détails
                                  </Link>
                                </DropdownMenuItem>
                                {app.jobUrl && (
                                  <DropdownMenuItem asChild>
                                    <a href={app.jobUrl} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Voir l'annonce
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteClick(app)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {hasNextPage && (
            <div className="flex justify-center p-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle candidature</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle candidature à votre suivi
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ApplicationForm
              onSubmit={(data) => createMutation.mutate(data)}
              isSubmitting={createMutation.isPending}
              submitRef={submitRef}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => submitRef.current?.()} disabled={createMutation.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!applicationToDelete} onOpenChange={() => setApplicationToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la candidature</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette candidature pour <strong>{applicationToDelete?.companyName}</strong> ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {applicationToDelete?.companyId ? (
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Cette candidature est liée à l'entreprise <strong>{applicationToDelete.companyName}</strong>.
                Souhaitez-vous également supprimer l'entreprise si elle n'a plus d'autres candidatures ?
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => confirmDelete(true)}
                  disabled={deleteMutation.isPending}
                >
                  Supprimer la candidature et l'entreprise
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => confirmDelete(false)}
                  disabled={deleteMutation.isPending}
                >
                  Supprimer uniquement la candidature
                </Button>
              </div>
            </div>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={() => setApplicationToDelete(null)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => confirmDelete(false)}
                disabled={deleteMutation.isPending}
              >
                Supprimer
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  search: string;
  onDelete: (application: Application) => void;
}

function KanbanColumn({ status, applications, search, onDelete }: KanbanColumnProps) {
  const { setNodeRef } = useSortable({
    id: status,
  });

  const filteredApps = applications.filter(
    (app) =>
      !search ||
      app.companyName.toLowerCase().includes(search.toLowerCase()) ||
      app.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-64 sm:w-72"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('w-2.5 h-2.5 rounded-full ring-2 ring-background', statusDotColors[status])} />
          <h3 className="font-medium">{statusLabels[status]}</h3>
          <span className="text-sm text-muted-foreground">({filteredApps.length})</span>
        </div>
      </div>
      <div className="bg-muted/30 rounded-lg p-2 min-h-[200px] kanban-column">
        <SortableContext
          items={filteredApps.map((app) => app.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {filteredApps.map((app) => (
              <SortableApplicationCard
                key={app.id}
                application={app}
                onDelete={() => onDelete(app)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

interface SortableApplicationCardProps {
  application: Application;
  onDelete: () => void;
}

function SortableApplicationCard({ application, onDelete }: SortableApplicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: application.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ApplicationCard application={application} isDragging={isDragging} onDelete={onDelete} />
    </div>
  );
}

interface ApplicationCardProps {
  application: Application;
  isDragging?: boolean;
  onDelete?: () => void;
}

function ApplicationCard({ application, isDragging, onDelete }: ApplicationCardProps) {
  return (
    <Card
      className={cn(
        'cursor-grab active:cursor-grabbing hover:border-primary transition-all',
        isDragging && 'opacity-50 rotate-3'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            <Link
              to={`/applications/${application.id}`}
              className="font-medium text-sm hover:text-primary block truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {application.position}
            </Link>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{application.companyName}</span>
            </div>
          </div>
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/applications/${application.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Voir détails
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded-full text-xs', jobTypeColors[application.jobType])}>
            {jobTypeLabels[application.jobType]}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{application.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(application.applicationDate)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="flex gap-4 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-72">
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
