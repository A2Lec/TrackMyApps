import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Bot, FileText, MessageSquare, Mic } from 'lucide-react';
import { applicationsService } from '@/services/applications.service';
import { remindersService } from '@/services/reminders.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InterviewSimulation } from '@/components/interview/InterviewSimulation';
import { ApplicationJournal } from '@/components/ApplicationJournal';
import { FollowUpTemplatesDialog } from '@/components/FollowUpTemplatesDialog';
import { DeleteApplicationDialog } from '@/components/applications/ApplicationDialogs';
import { ApplicationHeader } from '@/components/application-detail/ApplicationHeader';
import { ApplicationDetailsCard, type ApplicationDraft } from '@/components/application-detail/ApplicationDetailsCard';
import { LinkedDocumentsCard, type DocumentLinks } from '@/components/application-detail/LinkedDocumentsCard';
import { ApplicationRemindersCard } from '@/components/application-detail/ApplicationRemindersCard';
import { ReminderFormDialog, type ReminderFormValues } from '@/components/reminders/ReminderFormDialog';
import { useUpdateApplicationStatus } from '@/hooks/useUpdateApplicationStatus';
import { parseApplicationNotes, serializeApplicationNotes, type ExchangeDebrief } from '@/lib/journal';
import { getErrorMessage } from '@/lib/errors';
import type { Application } from '@/types';

type Tab = 'details' | 'journal' | 'interview';

const toDraft = (application: Application, generalNotes: string): ApplicationDraft => ({
  companyName: application.companyName,
  position: application.position,
  jobType: application.jobType,
  location: application.location,
  jobUrl: application.jobUrl,
  salary: application.salary,
  jobDescription: application.jobDescription,
  notes: generalNotes,
});

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('details');
  // Values being edited; null while viewing
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsService.getById(id!),
    enabled: !!id,
  });

  // `notes` holds the personal notes and the exchange journal (see lib/journal)
  const parsedNotes = useMemo(() => parseApplicationNotes(application?.notes), [application?.notes]);

  const invalidate = (...keys: string[][]) => keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof applicationsService.update>[1]) => applicationsService.update(id!, data),
    onSuccess: () => invalidate(['application', id!], ['applications'], ['dashboard']),
    onError: (err) => toast.error(getErrorMessage(err, 'Erreur lors de la mise à jour')),
  });

  const updateStatusMutation = useUpdateApplicationStatus(() => invalidate(['application', id!]));

  const deleteMutation = useMutation({
    mutationFn: () => applicationsService.delete(id!),
    onSuccess: () => {
      invalidate(['applications'], ['dashboard']);
      toast.success('Candidature supprimée');
      navigate('/applications');
    },
  });

  const completeReminderMutation = useMutation({
    mutationFn: remindersService.markAsCompleted,
    onSuccess: () => {
      invalidate(['application', id!], ['reminders']);
      toast.success('Rappel complété');
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: (values: ReminderFormValues) => remindersService.create({ ...values, applicationId: id! }),
    onSuccess: () => {
      invalidate(['application', id!], ['reminders'], ['upcomingReminders'], ['dashboard']);
      setShowReminderDialog(false);
      toast.success('Rappel créé pour cette offre');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Erreur lors de la création du rappel')),
  });

  const handleSave = () => {
    if (!draft) return;
    const notes = serializeApplicationNotes({ generalNotes: draft.notes, exchanges: parsedNotes.exchanges });
    updateMutation.mutate(
      { ...draft, notes },
      {
        onSuccess: () => {
          setDraft(null);
          toast.success('Candidature mise à jour avec succès');
        },
      }
    );
  };

  const handleSaveExchanges = async (exchanges: ExchangeDebrief[]) => {
    await updateMutation.mutateAsync({
      notes: serializeApplicationNotes({ generalNotes: parsedNotes.generalNotes, exchanges }),
    });
  };

  const handleChangeDocuments = (links: DocumentLinks) => {
    updateMutation.mutate(links, { onSuccess: () => toast.success('Documents synchronisés') });
  };

  if (isLoading) {
    return <ApplicationDetailSkeleton />;
  }

  if (!application) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-semibold">Candidature introuvable</h2>
        <p className="text-muted-foreground text-sm">Cette candidature a peut-être été supprimée ou n'existe plus.</p>
        <Button asChild>
          <Link to="/applications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux candidatures
          </Link>
        </Button>
      </div>
    );
  }

  const journal = (
    <ApplicationJournal
      application={application}
      exchanges={parsedNotes.exchanges}
      onSaveExchanges={handleSaveExchanges}
      isSaving={updateMutation.isPending}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/applications" className="hover:text-foreground transition-colors flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          Candidatures
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground truncate max-w-xs">{application.companyName}</span>
      </div>

      <ApplicationHeader
        application={application}
        isEditing={draft !== null}
        isSaving={updateMutation.isPending}
        onEdit={() => setDraft(toDraft(application, parsedNotes.generalNotes))}
        onCancelEdit={() => setDraft(null)}
        onSave={handleSave}
        onDelete={() => setShowDeleteDialog(true)}
        onStatusChange={(status) => updateStatusMutation.mutate({ id: application.id, status })}
        isChangingStatus={updateStatusMutation.isPending}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>
            <TabsList className="bg-muted/60 p-1 rounded-lg h-10 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
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

            <TabsContent value="details" className="space-y-6 mt-4">
              <ApplicationDetailsCard
                application={application}
                generalNotes={parsedNotes.generalNotes}
                exchangeCount={parsedNotes.exchanges.length}
                onShowJournal={() => setActiveTab('journal')}
                draft={draft}
                onDraftChange={setDraft}
              />
            </TabsContent>

            <TabsContent value="journal" className="mt-4">
              {journal}
            </TabsContent>

            <TabsContent value="interview" className="mt-4">
              <InterviewSimulation applicationId={application.id} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <LinkedDocumentsCard application={application} onChangeLinks={handleChangeDocuments} isSaving={updateMutation.isPending} />

          <ApplicationRemindersCard
            reminders={application.reminders ?? []}
            onAdd={() => setShowReminderDialog(true)}
            onComplete={(reminderId) => completeReminderMutation.mutate(reminderId)}
            onShowTemplates={() => setShowTemplatesDialog(true)}
          />

          <Card className="bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Mic className="h-4 w-4" />
                Entraînement IA
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Préparez vos entretiens avec notre simulateur IA adapté à l'offre et à votre profil.
              </p>
              <Button size="sm" className="w-full text-xs font-semibold" onClick={() => setActiveTab('interview')}>
                Lancer un entraînement
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteApplicationDialog
        application={showDeleteDialog ? application : null}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        isDeleting={deleteMutation.isPending}
      />

      {showReminderDialog && (
        <ReminderFormDialog
          open
          onClose={() => setShowReminderDialog(false)}
          reminder={null}
          applications={[application]}
          fixedApplication={application}
          defaults={{ title: `Relancer ${application.companyName}`, dueInDays: 7 }}
          presets={[
            { label: '⚡ Relance à J+7', title: `Relancer ${application.companyName} à J+7`, type: 'FOLLOW_UP', dueInDays: 7 },
            { label: '🎯 Entretien dans 3 jours', title: `Préparer entretien ${application.companyName}`, type: 'INTERVIEW', dueInDays: 3 },
          ]}
          onSubmit={(values) => createReminderMutation.mutate(values)}
          isSubmitting={createReminderMutation.isPending}
        />
      )}

      <FollowUpTemplatesDialog
        open={showTemplatesDialog}
        onOpenChange={setShowTemplatesDialog}
        companyName={application.companyName}
        position={application.position}
      />
    </div>
  );
}

function ApplicationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-36 w-full rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-44 w-full rounded-lg" />
          <Skeleton className="h-44 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
