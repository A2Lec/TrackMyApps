import { useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { AlertCircle, Bell, Calendar, Check, CheckCircle2, Clock, Download, Lightbulb, Mail, Plus, Search, Trash2, X } from 'lucide-react';
import { remindersService } from '@/services/reminders.service';
import { applicationsService } from '@/services/applications.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FollowUpTemplatesDialog } from '@/components/FollowUpTemplatesDialog';
import { RemindersCalendarView } from '@/components/RemindersCalendarView';
import { ReminderCard } from '@/components/reminders/ReminderCard';
import { ReminderFormDialog, type ReminderFormValues } from '@/components/reminders/ReminderFormDialog';
import { downloadIcsFile, generateIcsContent } from '@/lib/calendarExport';
import { groupRemindersByDueDate, reminderToCalendarEvent } from '@/lib/reminders';
import { cn, twoDigits } from '@/lib/utils';
import type { Application, Reminder, ReminderType } from '@/types';

type StatusFilter = 'all' | 'pending' | 'completed';

const TYPE_FILTERS: { value: ReminderType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous types' },
  { value: 'FOLLOW_UP', label: 'Relance' },
  { value: 'INTERVIEW', label: 'Entretien' },
];

// Applications still waiting for an answer 5 days after being sent, with no open reminder
const FOLLOW_UP_STATUSES = ['SENT', 'VIEWED', 'INTERVIEW_SCHEDULED'];
const FOLLOW_UP_AFTER_DAYS = 5;

function suggestFollowUps(applications: Application[], reminders: Reminder[]): Application[] {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - FOLLOW_UP_AFTER_DAYS);
  return applications.filter(
    (app) =>
      FOLLOW_UP_STATUSES.includes(app.status) &&
      new Date(app.applicationDate) <= threshold &&
      !reminders.some((r) => r.applicationId === app.id && !r.isCompleted)
  );
}

export function RemindersPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') === 'calendar' ? 'calendar' : 'list';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ReminderType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  // Open form (mounted only while open, so it starts fresh): `reminder` is null for a new one
  const [form, setForm] = useState<{ reminder: Reminder | null } | null>(null);

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersService.getAll(),
    refetchInterval: 30000,
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['applications', 'all-list'],
    queryFn: () => applicationsService.getAll({}, 1, 100),
  });
  const applications = useMemo(() => applicationsData?.data ?? [], [applicationsData]);

  const invalidateReminders = () => {
    queryClient.invalidateQueries({ queryKey: ['reminders'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
  };

  const createMutation = useMutation({
    mutationFn: remindersService.create,
    onSuccess: () => {
      invalidateReminders();
      remindersService.triggerEmailCheck();
      setForm(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof remindersService.update>[1] }) =>
      remindersService.update(id, data),
    onSuccess: () => {
      invalidateReminders();
      setForm(null);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => remindersService.update(id, { isCompleted: true }))),
    onSuccess: () => {
      invalidateReminders();
      setSelectedIds(new Set());
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => remindersService.delete(id))),
    onSuccess: () => {
      invalidateReminders();
      setSelectedIds(new Set());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: remindersService.delete,
    onSuccess: invalidateReminders,
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: (reminder: Reminder) => remindersService.update(reminder.id, { isCompleted: !reminder.isCompleted }),
    onSuccess: invalidateReminders,
  });

  const suggestedFollowUps = useMemo(() => suggestFollowUps(applications, reminders), [applications, reminders]);

  const filteredReminders = useMemo(() => {
    const query = search.toLowerCase();
    return reminders.filter(
      (reminder) =>
        (!query ||
          reminder.title.toLowerCase().includes(query) ||
          reminder.description?.toLowerCase().includes(query)) &&
        (typeFilter === 'all' || reminder.type === typeFilter) &&
        (statusFilter === 'all' || reminder.isCompleted === (statusFilter === 'completed'))
    );
  }, [reminders, search, typeFilter, statusFilter]);

  const sections = useMemo(() => groupRemindersByDueDate(filteredReminders), [filteredReminders]);
  const counts = useMemo(() => groupRemindersByDueDate(reminders), [reminders]);

  const openForm = (reminder: Reminder | null = null) => setForm({ reminder });

  const setViewMode = (mode: 'list' | 'calendar') => setSearchParams(mode === 'calendar' ? { view: 'calendar' } : {});

  const handleSubmit = (values: ReminderFormValues) => {
    if (form?.reminder) {
      // null (not undefined, which JSON drops) so choosing "none" actually detaches the reminder
      updateMutation.mutate({ id: form.reminder.id, data: { ...values, applicationId: values.applicationId ?? null } });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleQuickFollowUp = (app: Application) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    dueDate.setHours(9, 0, 0, 0);
    createMutation.mutate({
      title: `Relancer ${app.companyName}`,
      description: `Relance suite à candidature pour le poste de ${app.position}`,
      type: 'FOLLOW_UP',
      dueDate: dueDate.toISOString(),
      applicationId: app.id,
    });
  };

  const handleExportAllIcs = () => {
    if (reminders.length === 0) {
      toast.info('Aucun rappel à exporter');
      return;
    }
    downloadIcsFile('trackmyapps-rappels.ics', generateIcsContent(reminders.map(reminderToCalendarEvent)));
    toast.success(`${reminders.length} rappel(s) exporté(s) au format .ics`);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const allSelected = filteredReminders.length > 0 && selectedIds.size === filteredReminders.length;
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(filteredReminders.map((r) => r.id)));

  const renderCards = (list: Reminder[], isOverdue = false) =>
    list.map((reminder) => (
      <ReminderCard
        key={reminder.id}
        reminder={reminder}
        isOverdue={isOverdue}
        isSelected={selectedIds.has(reminder.id)}
        onToggleSelect={() => toggleSelection(reminder.id)}
        onToggleComplete={() => toggleCompleteMutation.mutate(reminder)}
        onEdit={() => openForm(reminder)}
        onDelete={() => deleteMutation.mutate(reminder.id)}
      />
    ));

  if (isLoading) {
    return <RemindersSkeleton />;
  }

  const hasFilters = search !== '' || typeFilter !== 'all' || statusFilter !== 'all';
  const overdueCount = counts.overdue.length;

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden animate-in fade-in-50 duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Rappels & Relances</h1>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                {overdueCount} en retard
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Gardez le contrôle sur vos délais, entretiens et actions clés</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border text-xs">
            {(
              [
                { mode: 'list', label: 'Vue Liste', icon: Bell },
                { mode: 'calendar', label: 'Vue Calendrier', icon: Calendar },
              ] as const
            ).map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5',
                  viewMode === mode ? 'bg-background text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAllIcs}
            className="h-9 px-3 text-xs font-semibold"
            title="Télécharger tous les rappels dans un fichier .ics pour Google Agenda, Apple ou Outlook"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exporter .ics
          </Button>

          <Button variant="outline" size="sm" onClick={() => setShowTemplatesDialog(true)} className="h-9 px-3 text-xs font-semibold">
            <Mail className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Modèles d'emails
          </Button>

          <Button onClick={() => openForm()} className="h-9 px-4 text-xs font-semibold">
            <Plus className="mr-1.5 h-4 w-4" />
            Nouveau rappel
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <RemindersCalendarView onNewReminder={() => openForm()} />
      ) : (
        <>
          {suggestedFollowUps.length > 0 && (
            <Card className="bg-warning-soft border-warning/60">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-warning-soft text-warning-strong flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                      {suggestedFollowUps.length} relance{suggestedFollowUps.length > 1 ? 's' : ''} suggérée
                      {suggestedFollowUps.length > 1 ? 's' : ''} cette semaine
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Des candidatures envoyées il y a plus de 5 jours n'ont pas encore reçu de réponse ni de rappel.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplatesDialog(true)}
                    className="h-8 text-xs font-medium border-warning/40 text-warning-strong"
                  >
                    Voir les modèles d'email
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleQuickFollowUp(suggestedFollowUps[0])}
                    className="h-8 text-xs font-semibold bg-warning hover:bg-warning text-white"
                  >
                    Planifier pour {suggestedFollowUps[0].companyName} (J+7)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full min-w-0">
            <StatTile label="Total rappels" value={reminders.length} dotClass="bg-status-sent" />
            <StatTile label="En retard" value={overdueCount} dotClass="bg-destructive" valueClass={overdueCount > 0 ? 'text-destructive' : undefined} />
            <StatTile label="Aujourd'hui" value={counts.today.length} dotClass="bg-warning" valueClass="text-warning-strong" />
            <StatTile label="Terminés" value={counts.completed.length} dotClass="bg-success" valueClass="text-success" />
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 animate-in fade-in-50 duration-150">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary text-primary font-mono text-xs">
                  {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
                </Badge>
                <span className="text-xs text-muted-foreground hidden sm:inline">sur cette vue</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => bulkUpdateMutation.mutate([...selectedIds])} className="h-8 text-xs">
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Marquer comme fait
                </Button>
                <Button variant="destructive" size="sm" onClick={() => bulkDeleteMutation.mutate([...selectedIds])} className="h-8 text-xs">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Supprimer
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedIds(new Set())}
                  aria-label="Désélectionner"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un rappel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs">
                {TYPE_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTypeFilter(value)}
                    className={cn(
                      'px-2.5 py-1 rounded-md transition-all font-medium',
                      typeFilter === value ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="h-9 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les états</SelectItem>
                  <SelectItem value="pending">À faire</SelectItem>
                  <SelectItem value="completed">Terminés</SelectItem>
                </SelectContent>
              </Select>

              {filteredReminders.length > 0 && (
                <Button variant="ghost" size="sm" onClick={toggleAll} className="h-9 text-xs text-muted-foreground hover:text-foreground">
                  {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <ReminderSection title="En retard" count={sections.overdue.length} icon={<AlertCircle className="h-4 w-4" />} className="text-destructive">
              {renderCards(sections.overdue, true)}
            </ReminderSection>
            <ReminderSection title="Aujourd'hui" count={sections.today.length} icon={<Clock className="h-4 w-4" />} className="text-warning-strong">
              {renderCards(sections.today)}
            </ReminderSection>
            <ReminderSection title="À venir" count={sections.upcoming.length} icon={<Calendar className="h-4 w-4" />} className="text-muted-foreground">
              {renderCards(sections.upcoming)}
            </ReminderSection>
            <ReminderSection
              title="Terminés"
              count={sections.completed.length}
              icon={<CheckCircle2 className="h-4 w-4 text-success" />}
              className="text-muted-foreground/70 pt-2"
            >
              {renderCards(sections.completed)}
            </ReminderSection>

            {filteredReminders.length === 0 && (
              <div className="text-center py-16 border rounded-lg border-dashed border-border/80">
                <Bell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="text-base font-semibold">Aucun rappel trouvé</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {hasFilters
                    ? 'Modifiez ou effacez vos filtres pour voir vos autres rappels.'
                    : 'Créez un rappel pour suivre vos relances et échéances en toute sérénité.'}
                </p>
                {!hasFilters && (
                  <Button onClick={() => openForm()} size="sm" className="mt-4 text-xs">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Créer un rappel
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <FollowUpTemplatesDialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog} />

      {form && (
        <ReminderFormDialog
          open
          onClose={() => setForm(null)}
          reminder={form.reminder}
          applications={applications}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

function StatTile({ label, value, dotClass, valueClass }: { label: string; value: number; dotClass: string; valueClass?: string }) {
  return (
    <div className="p-3.5 rounded-lg border border-border/70 bg-card/50 flex flex-col justify-between">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={cn('w-2 h-2 rounded-[2px]', dotClass)} />
      </div>
      <p className={cn('font-mono text-xl sm:text-2xl font-semibold tracking-tight mt-1', valueClass)}>{twoDigits(value)}</p>
    </div>
  );
}

function ReminderSection({
  title,
  count,
  icon,
  className,
  children,
}: {
  title: string;
  count: number;
  icon: ReactNode;
  className: string;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="space-y-2.5">
      <div className={cn('flex items-center gap-2 text-xs font-semibold uppercase tracking-wider', className)}>
        {icon}
        <span>
          {title} ({count})
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function RemindersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 max-w-xs" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
