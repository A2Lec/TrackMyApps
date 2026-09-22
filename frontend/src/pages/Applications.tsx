import { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsService } from '@/services/applications.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  CollisionDetection,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
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
  ExternalLink,
  DollarSign,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  formatDate,
  statusLabels,
  statusColors,
  statusDotColors,
  jobTypeLabels,
  jobTypeColors,
  STATUS_ORDER,
  cn,
} from '@/lib/utils';
import type { Application, ApplicationStatus, JobType, KanbanColumns } from '@/types';
import { Link, useNavigate } from 'react-router-dom';
import { ApplicationForm } from '@/components/ApplicationForm';

export function ApplicationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEmailVerified = useEmailVerified();
  
  // View & Filter states
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<JobType | 'ALL'>('ALL');
  const [mobileActiveColumn, setMobileActiveColumn] = useState<ApplicationStatus>('SENT');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'company'>('date_desc');

  // Modal / Drawer states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<'DRAFT' | 'SENT'>('SENT');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const submitRef = useRef<(() => void) | null>(null);

  // Queries
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
    queryFn: ({ pageParam = 1 }) =>
      applicationsService.getAll(
        { search: search || undefined },
        pageParam,
        25
      ),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
      return undefined;
    },
    initialPageParam: 1,
    enabled: view === 'list',
  });

  const isLoading = view === 'kanban' ? kanbanLoading : listLoading;

  // Mutations
  const createMutation = useMutation({
    mutationFn: applicationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowCreateDialog(false);
      toast.success('Candidature créée avec succès');
    },
    onError: (err: any) => {
      toast.error('Erreur: ' + (err.response?.data?.message || err.message || 'Erreur inconnue'));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationsService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['applications', 'kanban'] });

      const previousKanban = queryClient.getQueryData<KanbanColumns>(['applications', 'kanban']);

      if (previousKanban) {
        const nextKanban: KanbanColumns = { ...previousKanban };
        let movedApp: Application | null = null;

        // Remove application from its current status column
        for (const col of Object.keys(nextKanban) as ApplicationStatus[]) {
          const list = nextKanban[col];
          if (Array.isArray(list)) {
            const idx = list.findIndex((a) => a.id === id);
            if (idx !== -1) {
              movedApp = { ...list[idx], status };
              nextKanban[col] = [...list.slice(0, idx), ...list.slice(idx + 1)];
              break;
            }
          }
        }

        // Add application to the target status column
        if (movedApp) {
          nextKanban[status] = [movedApp, ...(nextKanban[status] || [])];
          queryClient.setQueryData(['applications', 'kanban'], nextKanban);
        }
      }

      return { previousKanban };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousKanban) {
        queryClient.setQueryData(['applications', 'kanban'], context.previousKanban);
      }
      const message = err.response?.data?.message || err.message || 'Erreur lors du changement de statut';
      toast.error(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onSuccess: (updated) => {
      if (selectedApplication?.id === updated?.id) {
        setSelectedApplication((prev) => (prev ? { ...prev, status: updated.status } : null));
      }
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
      if (selectedApplication && applicationToDelete && selectedApplication.id === applicationToDelete.id) {
        setSelectedApplication(null);
      }
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

  const openCreateForStatus = (status: ApplicationStatus = 'SENT') => {
    setCreateInitialStatus(status === 'DRAFT' ? 'DRAFT' : 'SENT');
    setShowCreateDialog(true);
  };

  // DnD Sensors: 6px distance constraint allows smooth drag while keeping normal clicks reliable
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection: checks pointer position first (best for kanban columns), then closestCorners
  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCorners(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const applicationId = active.id as string;

    // Detect target status from over data or over.id
    let newStatus: ApplicationStatus | null = null;

    if (over.data?.current?.status) {
      newStatus = over.data.current.status as ApplicationStatus;
    } else if (over.data?.current?.type === 'Column') {
      newStatus = over.id as ApplicationStatus;
    } else if (STATUS_ORDER.includes(over.id as ApplicationStatus)) {
      newStatus = over.id as ApplicationStatus;
    } else if (kanbanData) {
      for (const [colStatus, apps] of Object.entries(kanbanData)) {
        if (apps.some((app: Application) => app.id === over.id)) {
          newStatus = colStatus as ApplicationStatus;
          break;
        }
      }
    }

    if (!newStatus) return;

    // Determine current status of active item
    let currentStatus: ApplicationStatus | null = null;
    if (active.data?.current?.status) {
      currentStatus = active.data.current.status as ApplicationStatus;
    } else if (kanbanData) {
      for (const [status, apps] of Object.entries(kanbanData)) {
        if (apps.some((app: Application) => app.id === applicationId)) {
          currentStatus = status as ApplicationStatus;
          break;
        }
      }
    }

    if (currentStatus && currentStatus !== newStatus) {
      if (!isEmailVerified) {
        toast.error('Veuillez vérifier votre adresse email pour modifier vos candidatures');
        return;
      }
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

  // Filter and sort applications for List view
  const allListItems = useMemo(() => {
    if (!listData) return [];
    let items = listData.pages.flatMap((page) => page.data);

    if (jobTypeFilter !== 'ALL') {
      items = items.filter((app) => app.jobType === jobTypeFilter);
    }

    if (sortBy === 'date_desc') {
      items.sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
    } else if (sortBy === 'date_asc') {
      items.sort((a, b) => new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime());
    } else if (sortBy === 'company') {
      items.sort((a, b) => a.companyName.localeCompare(b.companyName));
    }

    return items;
  }, [listData, jobTypeFilter, sortBy]);

  // Total application counts for summary
  const totalCount = useMemo(() => {
    if (view === 'kanban' && kanbanData) {
      return Object.values(kanbanData).reduce((acc, list) => acc + list.length, 0);
    }
    return listData?.pages[0]?.total ?? 0;
  }, [view, kanbanData, listData]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Candidatures</h1>
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
              {totalCount}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Visualisez et pilotez l'avancement de toutes vos opportunités
          </p>
        </div>

        <EmailVerifiedGuard>
          <Button
            onClick={() => openCreateForStatus('SENT')}
            className="w-full sm:w-auto shadow-sm shadow-primary/20"
            disabled={!isEmailVerified}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle candidature
          </Button>
        </EmailVerifiedGuard>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col gap-3.5 bg-card/60 backdrop-blur-xs p-3 sm:p-4 rounded-xl border border-border/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher entreprise, poste, ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-lg text-sm bg-background"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right actions: sort + view toggle */}
          <div className="flex items-center gap-2 justify-between md:justify-end flex-wrap">
            {/* Sort */}
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-9 w-40 text-xs rounded-lg bg-background">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Plus récentes</SelectItem>
                <SelectItem value="date_asc">Plus anciennes</SelectItem>
                <SelectItem value="company">Entreprise (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            {/* View Switcher */}
            <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60">
              <Button
                variant={view === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-7 px-2.5 text-xs font-medium rounded-md transition-all',
                  view === 'kanban' ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setView('kanban')}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                Kanban
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-7 px-2.5 text-xs font-medium rounded-md transition-all',
                  view === 'list' ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setView('list')}
              >
                <List className="h-3.5 w-3.5 mr-1.5" />
                Liste
              </Button>
            </div>
          </div>
        </div>

        {/* Job Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-muted-foreground flex items-center gap-1 mr-1 flex-shrink-0 font-medium">
            <SlidersHorizontal className="h-3 w-3" />
            Contrat :
          </span>
          <button
            onClick={() => setJobTypeFilter('ALL')}
            className={cn(
              'px-2.5 py-1 rounded-full font-medium transition-all flex-shrink-0',
              jobTypeFilter === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            Tous
          </button>
          {(['STAGE', 'ALTERNANCE', 'CDI', 'JOB_ETUDIANT'] as JobType[]).map((type) => (
            <button
              key={type}
              onClick={() => setJobTypeFilter(jobTypeFilter === type ? 'ALL' : type)}
              className={cn(
                'px-2.5 py-1 rounded-full font-medium transition-all flex-shrink-0',
                jobTypeFilter === type
                  ? cn(jobTypeColors[type], 'ring-2 ring-primary/30 font-semibold')
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {jobTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && kanbanData && (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Mobile column tabs */}
          <div className="md:hidden overflow-x-auto pb-2 flex gap-1.5 scrollbar-none">
            {STATUS_ORDER.map((status) => {
              const count = (kanbanData[status] || []).length;
              const isActive = mobileActiveColumn === status;
              return (
                <button
                  key={status}
                  onClick={() => setMobileActiveColumn(status)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', statusDotColors[status])} />
                  <span>{statusLabels[status]}</span>
                  <span className="opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Desktop full columns & Mobile single selected column */}
          <div className="hidden md:flex gap-4 overflow-x-auto pb-4 items-stretch min-h-[calc(100vh-280px)]">
            {STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                applications={kanbanData[status] || []}
                search={search}
                jobTypeFilter={jobTypeFilter}
                sortBy={sortBy}
                onCardClick={(app) => setSelectedApplication(app)}
                onDelete={handleDeleteClick}
                onAddClick={() => openCreateForStatus(status)}
              />
            ))}
          </div>

          {/* Mobile Column View */}
          <div className="md:hidden">
            <KanbanColumn
              status={mobileActiveColumn}
              applications={kanbanData[mobileActiveColumn] || []}
              search={search}
              jobTypeFilter={jobTypeFilter}
              sortBy={sortBy}
              onCardClick={(app) => setSelectedApplication(app)}
              onDelete={handleDeleteClick}
              onAddClick={() => openCreateForStatus(mobileActiveColumn)}
              isMobileView
            />
          </div>

          <DragOverlay dropAnimation={null}>
            {activeId && getActiveApplication() && (
              <ApplicationCard
                application={getActiveApplication()!}
                isOverlay
              />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View */}
      {view === 'list' && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{allListItems.length} candidature(s) affichée(s)</span>
          </div>

          <Card className="overflow-hidden border-border/80 shadow-xs">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-sm text-left">
                  <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="p-3.5 font-semibold">Entreprise</th>
                      <th className="p-3.5 font-semibold">Poste</th>
                      <th className="p-3.5 font-semibold">Contrat</th>
                      <th className="p-3.5 font-semibold">Statut</th>
                      <th className="p-3.5 font-semibold">Date</th>
                      <th className="p-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {allListItems.length > 0 ? (
                      allListItems.map((app) => (
                        <tr
                          key={app.id}
                          onClick={() => setSelectedApplication(app)}
                          className="hover:bg-muted/40 transition-colors cursor-pointer group"
                        >
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary flex-shrink-0">
                                {app.companyName.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {app.companyName}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-muted-foreground font-medium">
                            {app.position}
                          </td>
                          <td className="p-3.5">
                            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', jobTypeColors[app.jobType])}>
                              {jobTypeLabels[app.jobType]}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', statusColors[app.status])}>
                              {statusLabels[app.status]}
                            </span>
                          </td>
                          <td className="p-3.5 text-muted-foreground text-xs">
                            {formatDate(app.applicationDate)}
                          </td>
                          <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => setSelectedApplication(app)}>
                                  <ChevronRight className="mr-2 h-4 w-4" />
                                  Aperçu rapide
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/applications/${app.id}`}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Fiche complète
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
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteClick(app)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          Aucune candidature ne correspond à vos filtres.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Chargement...' : 'Charger plus de candidatures'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Quick View Drawer (Sheet) */}
      <Sheet open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <SheetContent side="right" className="flex flex-col h-full p-6">
          {selectedApplication && (
            <div className="flex flex-col h-full space-y-6">
              <SheetHeader className="text-left space-y-2 pb-4 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary flex-shrink-0">
                    {selectedApplication.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="text-xl font-bold truncate">
                      {selectedApplication.position}
                    </SheetTitle>
                    <SheetDescription className="text-sm font-medium text-foreground/80 truncate">
                      {selectedApplication.companyName}
                    </SheetDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', statusColors[selectedApplication.status])}>
                    {statusLabels[selectedApplication.status]}
                  </span>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', jobTypeColors[selectedApplication.jobType])}>
                    {jobTypeLabels[selectedApplication.jobType]}
                  </span>
                </div>
              </SheetHeader>

              {/* Status Fast Switcher */}
              <div className="space-y-2 bg-muted/40 p-3 rounded-xl border border-border/70">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Changer le statut
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUS_ORDER.map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatusMutation.mutate({ id: selectedApplication.id, status: st })}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left',
                        selectedApplication.status === st
                          ? cn(statusColors[st], 'ring-1 ring-primary/40 font-semibold')
                          : 'hover:bg-muted text-muted-foreground'
                      )}
                    >
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', statusDotColors[st])} />
                      <span className="truncate">{statusLabels[st]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-border/70 bg-card/50">
                    <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Date candidature
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatDate(selectedApplication.applicationDate, 'long')}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-border/70 bg-card/50">
                    <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> Localisation
                    </span>
                    <span className="font-semibold text-foreground truncate block">
                      {selectedApplication.location || 'Non précisée'}
                    </span>
                  </div>

                  {selectedApplication.salary && (
                    <div className="p-3 rounded-lg border border-border/70 bg-card/50 col-span-2">
                      <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> Rémunération
                      </span>
                      <span className="font-semibold text-foreground">
                        {selectedApplication.salary}
                      </span>
                    </div>
                  )}
                </div>

                {/* Job Link */}
                {selectedApplication.jobUrl && (
                  <div className="p-3 rounded-lg border border-border/70 bg-card/50">
                    <span className="text-xs text-muted-foreground block mb-1">Annonce en ligne</span>
                    <a
                      href={selectedApplication.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1 truncate"
                    >
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      {selectedApplication.jobUrl}
                    </a>
                  </div>
                )}

                {/* Notes Preview */}
                {selectedApplication.notes && (
                  <div className="p-3 rounded-lg border border-border/70 bg-card/50">
                    <span className="text-xs font-semibold text-muted-foreground block mb-1">Notes personnelles</span>
                    <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {selectedApplication.notes}
                    </p>
                  </div>
                )}

                {/* Linked Documents */}
                {(selectedApplication.cvUsed || selectedApplication.lmUsed) && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground block">Documents utilisés</span>
                    {selectedApplication.cvUsed && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium truncate">{selectedApplication.cvUsed.name}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">CV</Badge>
                      </div>
                    )}
                    {selectedApplication.lmUsed && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                        <FileText className="h-3.5 w-3.5 text-purple-600" />
                        <span className="font-medium truncate">{selectedApplication.lmUsed.name}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">LM</Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Drawer Actions */}
              <div className="pt-4 border-t border-border/70 flex items-center justify-between gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(selectedApplication)}
                  className="text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Supprimer
                </Button>

                <Button
                  size="sm"
                  onClick={() => {
                    navigate(`/applications/${selectedApplication.id}`);
                  }}
                  className="text-xs font-medium"
                >
                  Fiche complète 360°
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle candidature</DialogTitle>
            <DialogDescription>
              Ajoutez une candidature à suivre dans votre tableau de bord
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <ApplicationForm
              defaultValues={{ status: createInitialStatus }}
              onSubmit={(data) => createMutation.mutate(data)}
              isSubmitting={createMutation.isPending}
              submitRef={submitRef}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => submitRef.current?.()} disabled={createMutation.isPending}>
              Créer la candidature
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
            <div className="py-3">
              <p className="text-sm text-muted-foreground mb-4">
                Cette candidature est rattachée à l'entreprise <strong>{applicationToDelete.companyName}</strong>.
                Souhaitez-vous également supprimer l'entreprise de votre carnet si elle n'a plus d'autre candidature ?
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

// Kanban Column Component
interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: Application[];
  search: string;
  jobTypeFilter: JobType | 'ALL';
  sortBy: 'date_desc' | 'date_asc' | 'company';
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
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'Column',
      status,
    },
  });

  const filteredApps = useMemo(() => {
    let list = applications.filter((app) => {
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
  }, [applications, search, jobTypeFilter, sortBy]);

  return (
    <div
      className={cn(
        'flex-shrink-0 flex flex-col',
        isMobileView ? 'w-full' : 'w-72 sm:w-80'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className={cn('w-2.5 h-2.5 rounded-full ring-2 ring-background', statusDotColors[status])} />
          <h3 className="font-semibold text-sm text-foreground tracking-tight">{statusLabels[status]}</h3>
          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {filteredApps.length}
          </span>
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

      {/* Cards drop container */}
      <div
        ref={setNodeRef}
        className={cn(
          'bg-muted/35 dark:bg-muted/20 rounded-xl p-2 min-h-[450px] flex-1 border border-border/50 flex flex-col gap-2 transition-all duration-150',
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
                isOver
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-border/80 hover:bg-muted/40'
              )}
            >
              <Plus className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary transition-colors mb-1" />
              <p className="text-xs text-muted-foreground/80 group-hover:text-foreground font-medium">
                Ajouter une candidature
              </p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// Sortable Card Wrapper
interface SortableApplicationCardProps {
  application: Application;
  onClick: () => void;
  onDelete: () => void;
}

function SortableApplicationCard({ application, onClick, onDelete }: SortableApplicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: application.id,
    data: {
      type: 'Card',
      status: application.status,
      application,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ApplicationCard
        application={application}
        isGhost={isDragging}
        onClick={onClick}
        onDelete={onDelete}
      />
    </div>
  );
}

// Application Card Component
interface ApplicationCardProps {
  application: Application;
  isGhost?: boolean;
  isOverlay?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

function ApplicationCard({ application, isGhost, isOverlay, onClick, onDelete }: ApplicationCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-grab active:cursor-grabbing bg-card/95 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 border-border/80 rounded-xl group relative overflow-hidden select-none',
        isGhost && 'opacity-25 border-dashed border-primary/50 scale-[0.98]',
        isOverlay && 'shadow-2xl rotate-1 scale-102 ring-2 ring-primary/50 border-primary bg-card z-50 cursor-grabbing'
      )}
    >
      <CardContent className="p-3.5 space-y-2.5">
        {/* Top: Position & Dropdown */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors truncate">
              {application.position}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/80" />
              <span className="font-medium text-foreground/90 truncate">{application.companyName}</span>
            </div>
          </div>

          {onDelete && (
            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={onClick}>
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Aperçu rapide
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/applications/${application.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Fiche complète
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
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
            </div>
          )}
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', jobTypeColors[application.jobType])}>
            {jobTypeLabels[application.jobType]}
          </span>
          {application.location && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[120px]">{application.location}</span>
            </div>
          )}
        </div>

        {/* Bottom Footer: Date & Salary */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(application.applicationDate)}</span>
          </div>

          {application.salary && (
            <span className="font-medium text-foreground/80 truncate max-w-[110px]">
              {application.salary}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton Component for loading state
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

      <div className="h-14 w-full bg-card rounded-xl border border-border/80 p-3 flex gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-80 space-y-3">
            <div className="flex justify-between items-center px-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="bg-muted/40 rounded-xl p-2 min-h-[300px] space-y-2">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
