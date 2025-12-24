import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsService } from '@/services/applications.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
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
import { formatDate, statusLabels, statusColors, jobTypeLabels, jobTypeColors, cn } from '@/lib/utils';
import type { Application, ApplicationStatus, JobType } from '@/types';
import { Link } from 'react-router-dom';

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
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newApplication, setNewApplication] = useState({
    companyName: '',
    position: '',
    jobType: 'STAGE' as JobType,
    location: '',
    jobUrl: '',
    salary: '',
    notes: '',
    jobDescription: '',
    status: 'SENT' as ApplicationStatus,
  });

  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);

  const { data: kanbanData, isLoading, isError, error } = useQuery({
    queryKey: ['applications', 'kanban'],
    queryFn: applicationsService.getByStatus,
  });

  const createMutation = useMutation({
    mutationFn: applicationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setShowCreateDialog(false);
      setNewApplication({
        companyName: '',
        position: '',
        jobType: 'STAGE',
        location: '',
        jobUrl: '',
        salary: '',
        notes: '',
        jobDescription: '',
        status: 'SENT',
      });
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      alert('Erreur: ' + (error.response?.data?.message || error.message || 'Erreur inconnue'));
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      applicationsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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

  const handleCreate = () => {
    if (!newApplication.companyName || !newApplication.position || !newApplication.location) {
      return;
    }
    createMutation.mutate(newApplication);
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
        <Button onClick={() => setShowCreateDialog(true)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle candidature
        </Button>
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
      {view === 'list' && kanbanData && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Entreprise</th>
                    <th className="text-left p-4 font-medium">Poste</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Type</th>
                    <th className="text-left p-4 font-medium">Statut</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Date</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(kanbanData)
                    .flat()
                    .filter(
                      (app) =>
                        !search ||
                        app.companyName.toLowerCase().includes(search.toLowerCase()) ||
                        app.position.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((app) => (
                      <tr key={app.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <Link
                            to={`/applications/${app.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {app.companyName}
                          </Link>
                        </td>
                        <td className="p-4 text-muted-foreground">{app.position}</td>
                        <td className="p-4 hidden md:table-cell">
                          <span className={cn('px-2 py-1 rounded-full text-xs', jobTypeColors[app.jobType])}>
                            {jobTypeLabels[app.jobType]}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={cn('px-2 py-1 rounded-full text-xs', statusColors[app.status])}>
                            {statusLabels[app.status]}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground hidden lg:table-cell">
                          {formatDate(app.applicationDate)}
                        </td>
                      <td className="p-4 text-right">
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
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nouvelle candidature</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle candidature à votre suivi
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 py-4 overflow-y-auto overflow-x-hidden flex-1 pr-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Entreprise *</Label>
              <Input
                id="companyName"
                placeholder="Google, Doctolib..."
                value={newApplication.companyName}
                onChange={(e) =>
                  setNewApplication({ ...newApplication, companyName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Poste *</Label>
              <Input
                id="position"
                placeholder="Développeur Full-Stack..."
                value={newApplication.position}
                onChange={(e) =>
                  setNewApplication({ ...newApplication, position: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newApplication.jobType}
                  onValueChange={(value) =>
                    setNewApplication({ ...newApplication, jobType: value as JobType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" className="z-50">
                    <SelectItem value="STAGE">Stage</SelectItem>
                    <SelectItem value="ALTERNANCE">Alternance</SelectItem>
                    <SelectItem value="CDI">CDI</SelectItem>
                    <SelectItem value="JOB_ETUDIANT">Job étudiant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={newApplication.status}
                  onValueChange={(value) =>
                    setNewApplication({ ...newApplication, status: value as ApplicationStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" className="z-50">
                    <SelectItem value="DRAFT">Brouillon</SelectItem>
                    <SelectItem value="SENT">Envoyée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localisation *</Label>
              <Input
                id="location"
                placeholder="Paris, Lyon, Remote..."
                value={newApplication.location}
                onChange={(e) =>
                  setNewApplication({ ...newApplication, location: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobUrl">URL de l'annonce</Label>
              <Input
                id="jobUrl"
                placeholder="https://..."
                value={newApplication.jobUrl}
                onChange={(e) =>
                  setNewApplication({ ...newApplication, jobUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salaire / Rémunération</Label>
              <Input
                id="salary"
                placeholder="1200€/mois, 38k€/an..."
                value={newApplication.salary}
                onChange={(e) =>
                  setNewApplication({ ...newApplication, salary: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Notes personnelles..."
                value={newApplication.notes}
                onChange={(e) =>
                  setNewApplication({ ...newApplication, notes: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobDescription">Description de l'offre</Label>
              <Textarea
                id="jobDescription"
                placeholder="Collez ici le texte de l'annonce..."
                value={newApplication.jobDescription}
                onChange={(e) =>
                  setNewApplication({ ...newApplication, jobDescription: e.target.value })
                }
                className="min-h-32"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
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
      className="flex-shrink-0 w-72"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('w-3 h-3 rounded-full', statusColors[status].split(' ')[0])} />
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
          <div className="flex-1 min-w-0">
            <Link
              to={`/applications/${application.id}`}
              className="font-medium text-sm hover:text-primary block truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {application.position}
            </Link>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Building2 className="h-3 w-3" />
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
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{application.location}</span>
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
