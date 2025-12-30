import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams as useRouterParams, Link } from 'react-router-dom';
import { applicationsService } from '@/services/applications.service';
import { documentsService } from '@/services/documents.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  DollarSign,
  Edit,
  Trash2,
  Save,
  Plus,
  FileText,
  X,
} from 'lucide-react';
import { formatDate, formatDateTime, statusLabels, statusColors, jobTypeLabels, jobTypeColors, cn } from '@/lib/utils';
import type { Application, ApplicationStatus, JobType, EventType } from '@/types';
import { InterviewSimulation } from '@/components/InterviewSimulation';

const eventTypeLabels: Record<EventType, string> = {
  CREATED: 'Créée',
  SENT: 'Envoyée',
  VIEWED: 'Consultée',
  RELANCE_SENT: 'Relance envoyée',
  INTERVIEW_SCHEDULED: 'Entretien planifié',
  INTERVIEW_DONE: 'Entretien terminé',
  REJECTED: 'Refusée',
  ACCEPTED: 'Acceptée',
  STATUS_CHANGED: 'Changement de statut',
};

export function ApplicationDetailPage() {
  const { id } = useRouterParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Application>>({});
  const [selectedCvId, setSelectedCvId] = useState<string | undefined>();
  const [selectedLmId, setSelectedLmId] = useState<string | undefined>();

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsService.getById(id!),
    enabled: !!id,
  });

  const { data: allCvs = [] } = useQuery({
    queryKey: ['documents', 'CV'],
    queryFn: () => documentsService.getAll('CV'),
  });

  const { data: allLms = [] } = useQuery({
    queryKey: ['documents', 'LETTRE_MOTIVATION'],
    queryFn: () => documentsService.getAll('LETTRE_MOTIVATION'),
  });

  useEffect(() => {
    if (application) {
      setFormData({
        companyName: application.companyName,
        position: application.position,
        jobType: application.jobType,
        status: application.status,
        location: application.location,
        jobUrl: application.jobUrl,
        salary: application.salary,
        notes: application.notes,
        jobDescription: application.jobDescription,
      });
      setSelectedCvId(application.cvUsedId);
      setSelectedLmId(application.lmUsedId);
    }
  }, [application]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Application>) => applicationsService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsEditing(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) => applicationsService.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => applicationsService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/applications');
    },
  });

  const linkDocumentsMutation = useMutation({
    mutationFn: (data: { cvUsedId?: string; lmUsedId?: string }) => 
      applicationsService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setShowDocumentsDialog(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleLinkDocuments = () => {
    linkDocumentsMutation.mutate({
      cvUsedId: selectedCvId,
      lmUsedId: selectedLmId,
    });
  };

  const handleUnlinkDocument = (type: 'cv' | 'lm') => {
    if (type === 'cv') {
      linkDocumentsMutation.mutate({ cvUsedId: null as any });
    } else {
      linkDocumentsMutation.mutate({ lmUsedId: null as any });
    }
  };

  if (isLoading) {
    return <ApplicationDetailSkeleton />;
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">Candidature non trouvée</h2>
        <Button asChild className="mt-4">
          <Link to="/applications">Retour aux candidatures</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/applications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{application.position}</h1>
            <Badge variant="outline" className={cn(jobTypeColors[application.jobType])}>
              {jobTypeLabels[application.jobType]}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Building2 className="h-4 w-4" />
            <span>{application.companyName}</span>
            <span>•</span>
            <MapPin className="h-4 w-4" />
            <span>{application.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} size="sm" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Annuler</span>
                <span className="sm:hidden">✕</span>
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm" className="text-xs sm:text-sm">
                <Save className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Enregistrer</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)} size="sm" className="text-xs sm:text-sm">
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} size="sm" className="text-xs sm:text-sm">
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Supprimer</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Status Card */}
        <Card className="col-span-1 lg:col-span-2 order-1">
          <CardHeader>
            <CardTitle>Statut actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(['DRAFT', 'SENT', 'VIEWED', 'INTERVIEW_SCHEDULED', 'AWAITING_RESPONSE', 'REJECTED', 'ACCEPTED', 'GHOSTED'] as ApplicationStatus[]).map(
                (status) => (
                  <Button
                    key={status}
                    variant={application.status === status ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'text-xs sm:text-sm',
                      application.status === status && statusColors[status]
                    )}
                    onClick={() => updateStatusMutation.mutate(status)}
                    disabled={updateStatusMutation.isPending}
                  >
                    {statusLabels[status]}
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="col-span-1 lg:col-span-2 order-2">
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Entreprise</Label>
                      <Input
                        value={formData.companyName || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, companyName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Poste</Label>
                      <Input
                        value={formData.position || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={formData.jobType}
                        onValueChange={(v) =>
                          setFormData({ ...formData, jobType: v as JobType })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STAGE">Stage</SelectItem>
                          <SelectItem value="ALTERNANCE">Alternance</SelectItem>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="JOB_ETUDIANT">Job étudiant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Localisation</Label>
                      <Input
                        value={formData.location || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Salaire</Label>
                      <Input
                        value={formData.salary || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, salary: e.target.value })
                        }
                        placeholder="Ex: 1200€/mois"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>URL de l'annonce</Label>
                      <Input
                        value={formData.jobUrl || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, jobUrl: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      placeholder="Notes personnelles..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description de l'offre</Label>
                    <Textarea
                      value={formData.jobDescription || ''}
                      onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                      rows={6}
                      placeholder="Collez ici le texte de l'annonce..."
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date de candidature</p>
                        <p className="font-medium">{formatDate(application.applicationDate)}</p>
                      </div>
                    </div>
                    {application.salary && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Rémunération</p>
                          <p className="font-medium">{application.salary}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {application.jobUrl && (
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Lien de l'annonce</p>
                        <a
                          href={application.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Voir l'annonce
                        </a>
                      </div>
                    </div>
                  )}
                  {application.notes && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {application.notes}
                      </p>
                    </div>
                  )}
                  {application.jobDescription && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Description de l'offre</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {application.jobDescription}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

        {/* Timeline */}
        <Card className="col-span-1 order-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Historique</CardTitle>
          </CardHeader>
            <CardContent>
              {application.events && application.events.length > 0 ? (
                <div className="relative space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                  {application.events.map((event) => (
                    <div key={event.id} className="relative pl-6">
                      <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">{eventTypeLabels[event.eventType || event.type as EventType] || event.eventType}</p>
                        {(event.notes || event.description) && (
                          <p className="text-sm text-muted-foreground">{event.notes || event.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun événement
                </p>
              )}
            </CardContent>
          </Card>

        {/* Documents */}
        <Card className="col-span-1 order-4">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Documents liés</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDocumentsDialog(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {application.cvUsed || application.lmUsed ? (
                <div className="space-y-2">
                  {application.cvUsed && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={documentsService.getViewUrl(application.cvUsed.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex-1 truncate hover:underline cursor-pointer"
                      >
                        {application.cvUsed.name}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleUnlinkDocument('cv')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {application.lmUsed && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={documentsService.getViewUrl(application.lmUsed.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex-1 truncate hover:underline cursor-pointer"
                      >
                        {application.lmUsed.name}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleUnlinkDocument('lm')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun document lié
                </p>
              )}
            </CardContent>
          </Card>

        {/* Interview Simulation - Last on mobile */}
        <div className="col-span-1 lg:col-span-2 order-5">
          <InterviewSimulation applicationId={application.id} />
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la candidature</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette candidature ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Documents Dialog */}
      <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lier des documents</DialogTitle>
            <DialogDescription>
              Sélectionnez les documents à lier à cette candidature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CV</Label>
              <Select value={selectedCvId} onValueChange={setSelectedCvId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un CV" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {allCvs.map((cv) => (
                    <SelectItem key={cv.id} value={cv.id}>
                      {cv.name} {cv.version && `(${cv.version})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lettre de motivation</Label>
              <Select value={selectedLmId} onValueChange={setSelectedLmId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une lettre de motivation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {allLms.map((lm) => (
                    <SelectItem key={lm.id} value={lm.id}>
                      {lm.name} {lm.version && `(${lm.version})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentsDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleLinkDocuments}
              disabled={linkDocumentsMutation.isPending}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
