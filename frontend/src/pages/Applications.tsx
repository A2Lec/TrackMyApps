import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, List, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { applicationsService } from '@/services/applications.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailVerifiedGuard } from '@/components/EmailVerifiedGuard';
import { useEmailVerified } from '@/hooks/useEmailVerified';
import { KanbanBoard } from '@/components/applications/KanbanBoard';
import { ApplicationsTable } from '@/components/applications/ApplicationsTable';
import { ApplicationQuickView } from '@/components/applications/ApplicationQuickView';
import { CreateApplicationDialog, DeleteApplicationDialog } from '@/components/applications/ApplicationDialogs';
import { useUpdateApplicationStatus } from '@/hooks/useUpdateApplicationStatus';
import { JOB_TYPE_TAGS } from '@/constants/labels';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import type { ApplicationSort } from '@/lib/kanban';
import type { Application, ApplicationStatus, JobType } from '@/types';

const JOB_TYPES: JobType[] = ['STAGE', 'ALTERNANCE', 'CDI', 'JOB_ETUDIANT'];
const PAGE_SIZE = 25;

const compareApplications: Record<ApplicationSort, (a: Application, b: Application) => number> = {
  date_desc: (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime(),
  date_asc: (a, b) => new Date(a.applicationDate).getTime() - new Date(b.applicationDate).getTime(),
  company: (a, b) => a.companyName.localeCompare(b.companyName),
};

export function ApplicationsPage() {
  const queryClient = useQueryClient();
  const isEmailVerified = useEmailVerified();

  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<JobType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<ApplicationSort>('date_desc');

  const [createStatus, setCreateStatus] = useState<'DRAFT' | 'SENT' | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);

  const kanbanQuery = useQuery({
    queryKey: ['applications', 'kanban'],
    queryFn: applicationsService.getByStatus,
    enabled: view === 'kanban',
  });

  const listQuery = useInfiniteQuery({
    queryKey: ['applications', 'list', search, jobTypeFilter],
    queryFn: ({ pageParam }) =>
      applicationsService.getAll(
        { search: search || undefined, jobType: jobTypeFilter !== 'ALL' ? jobTypeFilter : undefined },
        pageParam,
        PAGE_SIZE
      ),
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: view === 'list',
  });

  const invalidateApplications = () => {
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  };

  const createMutation = useMutation({
    mutationFn: applicationsService.create,
    onSuccess: () => {
      invalidateApplications();
      setCreateStatus(null);
      toast.success('Candidature créée avec succès');
    },
    onError: (err) => {
      toast.error('Erreur : ' + getErrorMessage(err, 'Erreur inconnue'));
    },
  });

  const updateStatusMutation = useUpdateApplicationStatus((updated) => {
    setSelectedApplication((current) => (current?.id === updated.id ? { ...current, status: updated.status } : current));
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => applicationsService.delete(id, false),
    onSuccess: (_result, id) => {
      invalidateApplications();
      setApplicationToDelete(null);
      setSelectedApplication((current) => (current?.id === id ? null : current));
      toast.success('Candidature supprimée');
    },
  });

  const moveApplication = (id: string, status: ApplicationStatus) => {
    if (!isEmailVerified) {
      toast.error('Veuillez vérifier votre adresse email pour modifier vos candidatures');
      return;
    }
    updateStatusMutation.mutate({ id, status });
  };

  // The API filters by search and contract; sorting is done here on the loaded pages
  const listItems = useMemo(
    () => (listQuery.data?.pages.flatMap((page) => page.data) ?? []).sort(compareApplications[sortBy]),
    [listQuery.data, sortBy]
  );

  const totalCount =
    view === 'kanban'
      ? Object.values(kanbanQuery.data ?? {}).reduce((acc, list) => acc + list.length, 0)
      : (listQuery.data?.pages[0]?.total ?? 0);

  const isLoading = view === 'kanban' ? kanbanQuery.isLoading : listQuery.isLoading;

  if (isLoading) {
    return <ApplicationsSkeleton />;
  }

  if (kanbanQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="text-destructive text-xl font-semibold">Une erreur est survenue lors du chargement des candidatures</div>
        <p className="text-muted-foreground">{kanbanQuery.error.message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['applications'] })}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Candidatures</h1>
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
              {totalCount}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Visualisez et pilotez l'avancement de toutes vos opportunités</p>
        </div>

        <EmailVerifiedGuard>
          <Button onClick={() => setCreateStatus('SENT')} className="w-full sm:w-auto" disabled={!isEmailVerified}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle candidature
          </Button>
        </EmailVerifiedGuard>
      </div>

      {/* Filters & toolbar */}
      <div className="flex flex-col gap-3.5 bg-card/60 backdrop-blur-xs p-3 sm:p-4 rounded-lg border border-border/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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

          <div className="flex items-center gap-2 justify-between md:justify-end flex-wrap">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as ApplicationSort)}>
              <SelectTrigger className="h-9 w-40 text-xs rounded-lg bg-background">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Plus récentes</SelectItem>
                <SelectItem value="date_asc">Plus anciennes</SelectItem>
                <SelectItem value="company">Entreprise (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60">
              {(
                [
                  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
                  { id: 'list', label: 'Liste', icon: List },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={view === id ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs font-medium rounded-md transition-all',
                    view === id ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setView(id)}
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

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
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            Tous
          </button>
          {JOB_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setJobTypeFilter(jobTypeFilter === type ? 'ALL' : type)}
              className={cn(
                'px-2.5 py-1 rounded-md border font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors flex-shrink-0',
                jobTypeFilter === type
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {JOB_TYPE_TAGS[type]}
              {jobTypeFilter === type && <span aria-hidden="true"> ×</span>}
            </button>
          ))}
        </div>
      </div>

      {view === 'kanban' && kanbanQuery.data && (
        <KanbanBoard
          kanbanData={kanbanQuery.data}
          search={search}
          jobTypeFilter={jobTypeFilter}
          sortBy={sortBy}
          onCardClick={setSelectedApplication}
          onDelete={setApplicationToDelete}
          onAdd={(status) => setCreateStatus(status === 'DRAFT' ? 'DRAFT' : 'SENT')}
          onMove={moveApplication}
        />
      )}

      {view === 'list' && (
        <>
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>{listItems.length} candidature(s) affichée(s)</span>
          </div>

          <ApplicationsTable applications={listItems} onOpen={setSelectedApplication} onDelete={setApplicationToDelete} />

          {listQuery.hasNextPage && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => listQuery.fetchNextPage()} disabled={listQuery.isFetchingNextPage}>
                {listQuery.isFetchingNextPage ? 'Chargement...' : 'Charger plus de candidatures'}
              </Button>
            </div>
          )}
        </>
      )}

      <ApplicationQuickView
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onStatusChange={(status) =>
          selectedApplication && updateStatusMutation.mutate({ id: selectedApplication.id, status })
        }
        onDelete={() => setApplicationToDelete(selectedApplication)}
      />

      <CreateApplicationDialog
        open={createStatus !== null}
        onOpenChange={(open) => !open && setCreateStatus(null)}
        initialStatus={createStatus ?? 'SENT'}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />

      <DeleteApplicationDialog
        application={applicationToDelete}
        onCancel={() => setApplicationToDelete(null)}
        onConfirm={() => applicationToDelete && deleteMutation.mutate(applicationToDelete.id)}
        isDeleting={deleteMutation.isPending}
      />
    </div>
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

      <div className="h-14 w-full bg-card rounded-lg border border-border/80 p-3 flex gap-3">
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
            <div className="bg-muted/40 rounded-lg p-2 min-h-[300px] space-y-2">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
