import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams as useRouterParams, Link } from 'react-router-dom';
import { applicationsService } from '@/services/applications.service';
import { documentsService } from '@/services/documents.service';
import { remindersService } from '@/services/reminders.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Bot,
  Bell,
  CheckCircle2,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
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
import type { Application, ApplicationStatus, JobType } from '@/types';
import { InterviewSimulation } from '@/components/InterviewSimulation';
import { ApplicationJournal } from '@/components/ApplicationJournal';
import { FollowUpTemplatesDialog } from '@/components/FollowUpTemplatesDialog';
import {
  parseApplicationNotes,
  serializeApplicationNotes,
  type ExchangeDebrief,
} from '@/lib/journal';
import { toast } from 'sonner';

export function ApplicationDetailPage() {
  const { id } = useRouterParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);

  const [formData, setFormData] = useState<Partial<Application>>({});
  const [selectedCvId, setSelectedCvId] = useState<string | undefined>();
  const [selectedLmId, setSelectedLmId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'details' | 'journal' | 'timeline' | 'interview'>('details');

  const [reminderForm, setReminderForm] = useState({
    title: '',
    dueDate: '',
    type: 'RELANCE',
    description: '',
  });

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

  const parsedNotes = useMemo(() => {
    return parseApplicationNotes(application?.notes);
  }, [application?.notes]);

  useEffect(() => {
    if (application) {
      const parsed = parseApplicationNotes(application.notes);
      setFormData({
        companyName: application.companyName,
        position: application.position,
        jobType: application.jobType,
        status: application.status,
        location: application.location,
        jobUrl: application.jobUrl,
        salary: application.salary,
        notes: parsed.generalNotes,
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
      toast.success('Candidature mise à jour avec succès');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: ApplicationStatus) => applicationsService.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Statut mis à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => applicationsService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Candidature supprimée');
      navigate('/applications');
    },
  });

  const linkDocumentsMutation = useMutation({
    mutationFn: (data: { cvUsedId?: string | null; lmUsedId?: string | null }) =>
      applicationsService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setShowDocumentsDialog(false);
      toast.success('Documents synchronisés');
    },
  });

  const completeReminderMutation = useMutation({
    mutationFn: (reminderId: string) => remindersService.markAsCompleted(reminderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Rappel complété');
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: (data: { title: string; dueDate: string; type: string; description?: string }) =>
      remindersService.create({
        ...data,
        applicationId: id!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowReminderDialog(false);
      toast.success('Rappel créé pour cette offre');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du rappel');
    },
  });

  const handleOpenCreateReminder = (
    daysOffset: number = 7,
    defaultTitle?: string,
    defaultType: string = 'RELANCE'
  ) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysOffset);
    setReminderForm({
      title: defaultTitle || `Relancer ${application?.companyName || ''}`,
      dueDate: targetDate.toISOString().split('T')[0],
      type: defaultType,
      description: '',
    });
    setShowReminderDialog(true);
  };

  const handleSave = () => {
    const currentParsed = parseApplicationNotes(application?.notes);
    const serialized = serializeApplicationNotes({
      generalNotes: formData.notes || '',
      exchanges: currentParsed.exchanges,
    });
    updateMutation.mutate({
      ...formData,
      notes: serialized,
    });
  };

  const handleSaveExchanges = async (newExchanges: ExchangeDebrief[]) => {
    const currentParsed = parseApplicationNotes(application?.notes);
    const serialized = serializeApplicationNotes({
      generalNotes: currentParsed.generalNotes,
      exchanges: newExchanges,
    });
    await updateMutation.mutateAsync({
      notes: serialized,
    });
  };

  const handleLinkDocuments = () => {
    linkDocumentsMutation.mutate({
      cvUsedId: selectedCvId === 'none' ? null : selectedCvId,
      lmUsedId: selectedLmId === 'none' ? null : selectedLmId,
    });
  };

  const handleUnlinkDocument = (type: 'cv' | 'lm') => {
    if (type === 'cv') {
      linkDocumentsMutation.mutate({ cvUsedId: null });
    } else {
      linkDocumentsMutation.mutate({ lmUsedId: null });
    }
  };

  if (isLoading) {
    return <ApplicationDetailSkeleton />;
  }

  if (!application) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold">Candidature introuvable</h2>
        <p className="text-muted-foreground text-sm">
          Cette candidature a peut-être été supprimée ou n'existe plus.
        </p>
        <Button asChild>
          <Link to="/applications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux candidatures
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/applications" className="hover:text-foreground transition-colors flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          Candidatures
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground truncate max-w-xs">{application.companyName}</span>
      </div>

      {/* Main Header Cockpit */}
      <Card className="border-border/80 bg-card/90 backdrop-blur-md shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            {/* Title & Info */}
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary/10 to-blue-500/10 border border-primary/20 flex items-center justify-center font-bold text-lg text-primary shadow-xs flex-shrink-0">
                {application.companyName.slice(0, 2).toUpperCase()}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {application.position}
                  </h1>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', jobTypeColors[application.jobType])}>
                    {jobTypeLabels[application.jobType]}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap pt-0.5">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    {application.companyName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {application.location || 'Localisation non précisée'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Postulé le {formatDate(application.applicationDate, 'long')}
                  </span>
                  {application.salary && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-foreground/90">
                        <DollarSign className="h-3.5 w-3.5" />
                        {application.salary}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start flex-wrap">
              {application.jobUrl && (
                <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                  <a href={application.jobUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Annonce
                  </a>
                </Button>
              )}

              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-8 text-xs"
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="h-8 text-xs shadow-xs"
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Enregistrer
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 text-xs"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Modifier
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label="Supprimer la candidature"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Segmented Status Selector Bar */}
          <div className="pt-2 border-t border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Statut d'avancement
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {STATUS_ORDER.map((status) => {
                const isActive = application.status === status;
                return (
                  <button
                    key={status}
                    onClick={() => updateStatusMutation.mutate(status)}
                    disabled={updateStatusMutation.isPending}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0',
                      isActive
                        ? cn(statusColors[status], 'ring-2 ring-primary/40 font-bold shadow-xs scale-102')
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full', statusDotColors[status])} />
                    <span>{statusLabels[status]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Asymmetric Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Left Workspace (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
            <TabsList className="bg-muted/60 p-1 rounded-xl h-10 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
              <TabsTrigger value="details" className="text-xs font-semibold gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Détails & Offre</span>
              </TabsTrigger>
              <TabsTrigger value="journal" className="text-xs font-semibold gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span>Journal des échanges ({parsedNotes.exchanges.length})</span>
              </TabsTrigger>
              <TabsTrigger value="interview" className="text-xs font-semibold gap-1.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
                <span>Simulation IA</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Details */}
            <TabsContent value="details" className="space-y-6 mt-4">
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Informations du poste
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Entreprise</Label>
                          <Input
                            value={formData.companyName || ''}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Poste</Label>
                          <Input
                            value={formData.position || ''}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label>Type de contrat</Label>
                          <Select
                            value={formData.jobType}
                            onValueChange={(val) => setFormData({ ...formData, jobType: val as JobType })}
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
                        <div className="space-y-1.5">
                          <Label>Localisation</Label>
                          <Input
                            value={formData.location || ''}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Salaire</Label>
                          <Input
                            value={formData.salary || ''}
                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                            placeholder="ex: 1200€/mois"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>Lien de l'offre</Label>
                        <Input
                          value={formData.jobUrl || ''}
                          onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Notes personnelles & mémo</Label>
                        <Textarea
                          value={formData.notes || ''}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Points importants, contacts recruteur, questions..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Texte de l'offre</Label>
                        <Textarea
                          value={formData.jobDescription || ''}
                          onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                          placeholder="Collez ici l'annonce de l'offre..."
                          rows={6}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Notes Section */}
                      <div className="p-4 rounded-xl bg-muted/40 border border-border/70">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                            Notes personnelles & mémo
                          </span>
                          {parsedNotes.exchanges.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab('journal')}
                              className="h-6 text-[11px] text-primary px-1.5 hover:underline"
                            >
                              Voir le journal des échanges ({parsedNotes.exchanges.length}) →
                            </Button>
                          )}
                        </div>
                        {parsedNotes.generalNotes ? (
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {parsedNotes.generalNotes}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Aucune note pour le moment. Cliquez sur "Modifier" pour en ajouter.
                          </p>
                        )}
                      </div>

                      {/* Job description */}
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                          Description de l'offre
                        </span>
                        {application.jobDescription ? (
                          <div className="p-4 rounded-xl bg-card border border-border/80 max-h-96 overflow-y-auto">
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                              {application.jobDescription}
                            </p>
                          </div>
                        ) : (
                          <div className="p-6 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                            Aucune description collée pour cette offre.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Journal des échanges & débriefings */}
            <TabsContent value="journal" className="mt-4">
              <ApplicationJournal
                application={application}
                exchanges={parsedNotes.exchanges}
                onSaveExchanges={handleSaveExchanges}
                isSaving={updateMutation.isPending}
              />
            </TabsContent>

            {/* Backward compatibility alias for timeline */}
            <TabsContent value="timeline" className="mt-4">
              <ApplicationJournal
                application={application}
                exchanges={parsedNotes.exchanges}
                onSaveExchanges={handleSaveExchanges}
                isSaving={updateMutation.isPending}
              />
            </TabsContent>

            {/* Tab 3: AI Simulation */}
            <TabsContent value="interview" className="mt-4">
              <InterviewSimulation applicationId={application.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Side Panel Widgets (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Documents Widget */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Documents liés
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDocumentsDialog(true)}
                className="h-7 text-xs px-2 text-primary"
              >
                <Plus className="h-3 w-3 mr-1" />
                Gérer
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.cvUsed || application.lmUsed ? (
                <div className="space-y-2">
                  {application.cvUsed && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                          CV
                        </div>
                        <a
                          href={documentsService.getViewUrl(application.cvUsed.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-foreground truncate hover:text-primary hover:underline"
                        >
                          {application.cvUsed.name}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleUnlinkDocument('cv')}
                        title="Détacher ce CV"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {application.lmUsed && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                          LM
                        </div>
                        <a
                          href={documentsService.getViewUrl(application.lmUsed.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-foreground truncate hover:text-primary hover:underline"
                        >
                          {application.lmUsed.name}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleUnlinkDocument('lm')}
                        title="Détacher cette lettre"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => setShowDocumentsDialog(true)}
                  className="p-5 border border-dashed border-border rounded-xl text-center cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <p className="text-xs text-muted-foreground font-medium">
                    Aucun document attaché.
                  </p>
                  <span className="text-xs text-primary font-semibold mt-1 inline-block">
                    + Attacher un CV ou une lettre
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminders Widget */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Rappels & Actions
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenCreateReminder(7, `Relancer ${application.companyName}`)}
                  className="h-7 text-xs px-2 text-primary font-semibold hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ajouter
                </Button>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-2 text-muted-foreground">
                  <Link to="/reminders">Voir tout</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {application.reminders && application.reminders.length > 0 ? (
                <>
                  {application.reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className={cn('font-semibold truncate', rem.isCompleted && 'line-through text-muted-foreground')}>
                          {rem.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(rem.dueDate)}
                        </p>
                      </div>

                      {!rem.isCompleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => completeReminderMutation.mutate(rem.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-emerald-600"
                          title="Marquer comme fait"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCreateReminder(7, `Relancer ${application.companyName}`)}
                      className="text-xs h-7 flex-1"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Nouveau rappel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplatesDialog(true)}
                      className="text-xs h-7 text-primary hover:bg-primary/10 px-2"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Modèles d'emails
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-xl space-y-2.5">
                  <p>Aucun rappel actif pour cette candidature.</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleOpenCreateReminder(7, `Relancer ${application.companyName}`)}
                      className="h-7 text-xs font-semibold shadow-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter un rappel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplatesDialog(true)}
                      className="h-7 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1 text-primary" />
                      Modèles d'emails
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Prep Banner Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-blue-500/5 to-purple-500/10 border-primary/20 shadow-xs">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Sparkles className="h-4 w-4" />
                Entraînement IA
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Préparez vos entretiens avec notre simulateur IA adapté à l'offre et à votre profil.
              </p>
              <Button
                size="sm"
                className="w-full text-xs font-semibold shadow-xs"
                onClick={() => setActiveTab('interview')}
              >
                Lancer un entraînement
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la candidature</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement la candidature pour{' '}
              <strong>{application.companyName}</strong> ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Documents Dialog */}
      <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Documents associés</DialogTitle>
            <DialogDescription>
              Sélectionnez le CV et la lettre de motivation utilisés pour cette candidature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Curriculum Vitae (CV)</Label>
              <Select value={selectedCvId || 'none'} onValueChange={setSelectedCvId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choisir un CV" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {allCvs.map((cv) => (
                    <SelectItem key={cv.id} value={cv.id} className="text-xs">
                      {cv.name} {cv.version && `(v${cv.version})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Lettre de motivation</Label>
              <Select value={selectedLmId || 'none'} onValueChange={setSelectedLmId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choisir une lettre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {allLms.map((lm) => (
                    <SelectItem key={lm.id} value={lm.id} className="text-xs">
                      {lm.name} {lm.version && `(v${lm.version})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDocumentsDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleLinkDocuments} disabled={linkDocumentsMutation.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Reminder for this Application Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Nouveau rappel pour {application.companyName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Planifiez une relance ou une tâche associée à cette opportunité.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!reminderForm.title.trim()) {
                toast.error('Veuillez spécifier un titre');
                return;
              }
              if (!reminderForm.dueDate) {
                toast.error('Veuillez sélectionner une date');
                return;
              }
              createReminderMutation.mutate({
                title: reminderForm.title.trim(),
                dueDate: new Date(reminderForm.dueDate).toISOString(),
                type: reminderForm.type,
                description: reminderForm.description.trim() || undefined,
              });
            }}
            className="space-y-4 py-2"
          >
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase font-semibold">
                Raccourcis express
              </Label>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    setReminderForm({
                      ...reminderForm,
                      title: `Relancer ${application.companyName} à J+7`,
                      dueDate: d.toISOString().split('T')[0],
                      type: 'RELANCE',
                    });
                  }}
                  className="h-7 text-[11px] px-2"
                >
                  ⚡ Relance à J+7
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 3);
                    setReminderForm({
                      ...reminderForm,
                      title: `Préparer entretien ${application.companyName}`,
                      dueDate: d.toISOString().split('T')[0],
                      type: 'ENTRETIEN',
                    });
                  }}
                  className="h-7 text-[11px] px-2"
                >
                  🎯 Entretien dans 3 jours
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Titre du rappel *</Label>
              <Input
                value={reminderForm.title}
                onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                placeholder="ex: Relancer le recruteur suite à l'envoi"
                className="text-xs h-8"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date d'échéance *</Label>
                <Input
                  type="date"
                  value={reminderForm.dueDate}
                  onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Catégorie</Label>
                <Select
                  value={reminderForm.type}
                  onValueChange={(val) => setReminderForm({ ...reminderForm, type: val })}
                >
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RELANCE" className="text-xs">Relance</SelectItem>
                    <SelectItem value="ENTRETIEN" className="text-xs">Entretien</SelectItem>
                    <SelectItem value="CANDIDATURE" className="text-xs">Candidature</SelectItem>
                    <SelectItem value="AUTRE" className="text-xs">Autre démarche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Note ou consigne (optionnel)</Label>
              <Textarea
                value={reminderForm.description}
                onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                placeholder="Détail du message ou document à joindre..."
                rows={2}
                className="text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReminderDialog(false)}
                className="h-8 text-xs"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createReminderMutation.isPending}
                className="h-8 text-xs font-semibold"
              >
                Créer le rappel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Follow-up Email Templates Dialog */}
      <FollowUpTemplatesDialog
        open={showTemplatesDialog}
        onOpenChange={setShowTemplatesDialog}
        companyName={application.companyName}
        position={application.position}
      />
    </div>
  );
}

// Skeleton Component
function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
