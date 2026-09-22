import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersService } from '@/services/reminders.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Bell,
  Clock,
  CheckCircle2,
  Circle,
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  AlertCircle,
  X,
  Mail,
  Check,
} from 'lucide-react';
import { formatDateTime, cn, reminderTypeLabels, reminderTypeColors } from '@/lib/utils';
import type { Reminder, ReminderType } from '@/types';

export function RemindersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ReminderType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'FOLLOW_UP' as ReminderType,
    dueDate: '',
    dueTime: '09:00',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersService.getAll(),
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: remindersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      remindersService.triggerEmailCheck().catch(console.error);
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Reminder> }) =>
      remindersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      closeDialog();
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: Partial<Reminder> }) => {
      await Promise.all(ids.map((id) => remindersService.update(id, data)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      setSelectedIds(new Set());
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => remindersService.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
      setSelectedIds(new Set());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: remindersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      remindersService.update(id, { isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
    },
  });

  const closeDialog = () => {
    setShowCreateDialog(false);
    setEditingReminder(null);
    setFormData({
      title: '',
      description: '',
      type: 'FOLLOW_UP',
      dueDate: '',
      dueTime: '09:00',
    });
  };

  const openCreateDialog = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingReminder(null);
    setFormData({
      title: '',
      description: '',
      type: 'FOLLOW_UP',
      dueDate: today,
      dueTime: '09:00',
    });
    setShowCreateDialog(true);
  };

  const openEditDialog = (reminder: Reminder) => {
    const date = new Date(reminder.dueDate);
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      type: reminder.type as ReminderType,
      dueDate: date.toISOString().split('T')[0],
      dueTime: date.toTimeString().slice(0, 5),
    });
    setShowCreateDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.dueDate) return;

    const dueDate = new Date(`${formData.dueDate}T${formData.dueTime}`);
    const data = {
      title: formData.title,
      description: formData.description || undefined,
      type: formData.type,
      dueDate: dueDate.toISOString(),
    };

    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredReminders = useMemo(() => {
    return reminders?.filter((reminder) => {
      const matchesSearch =
        !search ||
        reminder.title.toLowerCase().includes(search.toLowerCase()) ||
        reminder.description?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || reminder.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && reminder.isCompleted) ||
        (statusFilter === 'pending' && !reminder.isCompleted);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [reminders, search, typeFilter, statusFilter]);

  // Date categorization
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const overdueReminders = useMemo(() => {
    return (
      filteredReminders?.filter(
        (r) => !r.isCompleted && new Date(r.dueDate) < startOfToday
      ) || []
    );
  }, [filteredReminders, startOfToday]);

  const todayReminders = useMemo(() => {
    return (
      filteredReminders?.filter((r) => {
        if (r.isCompleted) return false;
        const d = new Date(r.dueDate);
        return d >= startOfToday && d <= endOfToday;
      }) || []
    );
  }, [filteredReminders, startOfToday, endOfToday]);

  const upcomingReminders = useMemo(() => {
    return (
      filteredReminders?.filter((r) => {
        if (r.isCompleted) return false;
        return new Date(r.dueDate) > endOfToday;
      }) || []
    );
  }, [filteredReminders, endOfToday]);

  const completedReminders = useMemo(() => {
    return filteredReminders?.filter((r) => r.isCompleted) || [];
  }, [filteredReminders]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === (filteredReminders?.length ?? 0)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReminders?.map((r) => r.id) ?? []));
    }
  };

  if (isLoading) {
    return <RemindersSkeleton />;
  }

  const totalCount = reminders?.length || 0;
  const overdueCount = reminders?.filter((r) => !r.isCompleted && new Date(r.dueDate) < startOfToday).length || 0;
  const todayCount = reminders?.filter((r) => {
    if (r.isCompleted) return false;
    const d = new Date(r.dueDate);
    return d >= startOfToday && d <= endOfToday;
  }).length || 0;
  const completedCount = reminders?.filter((r) => r.isCompleted).length || 0;

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Rappels & Relances</h1>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                {overdueCount} en retard
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gardez le contrôle sur vos délais, entretiens et actions clés
          </p>
        </div>

        <Button onClick={openCreateDialog} className="h-9 px-4 text-xs font-semibold shadow-xs">
          <Plus className="mr-1.5 h-4 w-4" />
          Nouveau rappel
        </Button>
      </div>

      {/* Sober KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full min-w-0">
        <div className="p-3.5 rounded-lg border border-border/70 bg-card/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total rappels</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold tracking-tight mt-1">{totalCount}</p>
        </div>

        <div className="p-3.5 rounded-lg border border-border/70 bg-card/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>En retard</span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <p className={cn('text-xl sm:text-2xl font-bold tracking-tight mt-1', overdueCount > 0 && 'text-red-600 dark:text-red-400')}>
            {overdueCount}
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-border/70 bg-card/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Aujourd'hui</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-amber-600 dark:text-amber-400">
            {todayCount}
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-border/70 bg-card/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Terminés</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
            {completedCount}
          </p>
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary text-primary font-mono text-xs">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">sur cette vue</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                bulkUpdateMutation.mutate({
                  ids: Array.from(selectedIds),
                  data: { isCompleted: true },
                })
              }
              className="h-8 text-xs"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Marquer comme fait
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              className="h-8 text-xs"
            >
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

      {/* Search & Filters */}
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

        {/* Filter chips & Status selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Pills */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                typeFilter === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Tous types
            </button>
            <button
              onClick={() => setTypeFilter('FOLLOW_UP')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                typeFilter === 'FOLLOW_UP'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Relance
            </button>
            <button
              onClick={() => setTypeFilter('INTERVIEW')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                typeFilter === 'INTERVIEW'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Entretien
            </button>
          </div>

          {/* Status dropdown */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as 'all' | 'pending' | 'completed')}
          >
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les états</SelectItem>
              <SelectItem value="pending">À faire</SelectItem>
              <SelectItem value="completed">Terminés</SelectItem>
            </SelectContent>
          </Select>

          {/* Select all toggle */}
          {filteredReminders && filteredReminders.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              {selectedIds.size === filteredReminders.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Button>
          )}
        </div>
      </div>

      {/* Task Sections */}
      <div className="space-y-6">
        {/* Overdue Section */}
        {overdueReminders.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>En retard ({overdueReminders.length})</span>
            </div>
            <div className="space-y-2">
              {overdueReminders.map((reminder) => (
                <ReminderItemCard
                  key={reminder.id}
                  reminder={reminder}
                  isOverdue
                  isSelected={selectedIds.has(reminder.id)}
                  onToggleSelect={() => toggleSelection(reminder.id)}
                  onToggleComplete={() =>
                    toggleCompleteMutation.mutate({
                      id: reminder.id,
                      isCompleted: !reminder.isCompleted,
                    })
                  }
                  onEdit={() => openEditDialog(reminder)}
                  onDelete={() => deleteMutation.mutate(reminder.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Today Section */}
        {todayReminders.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              <span>Aujourd'hui ({todayReminders.length})</span>
            </div>
            <div className="space-y-2">
              {todayReminders.map((reminder) => (
                <ReminderItemCard
                  key={reminder.id}
                  reminder={reminder}
                  isSelected={selectedIds.has(reminder.id)}
                  onToggleSelect={() => toggleSelection(reminder.id)}
                  onToggleComplete={() =>
                    toggleCompleteMutation.mutate({
                      id: reminder.id,
                      isCompleted: !reminder.isCompleted,
                    })
                  }
                  onEdit={() => openEditDialog(reminder)}
                  onDelete={() => deleteMutation.mutate(reminder.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Section */}
        {upcomingReminders.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>À venir ({upcomingReminders.length})</span>
            </div>
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => (
                <ReminderItemCard
                  key={reminder.id}
                  reminder={reminder}
                  isSelected={selectedIds.has(reminder.id)}
                  onToggleSelect={() => toggleSelection(reminder.id)}
                  onToggleComplete={() =>
                    toggleCompleteMutation.mutate({
                      id: reminder.id,
                      isCompleted: !reminder.isCompleted,
                    })
                  }
                  onEdit={() => openEditDialog(reminder)}
                  onDelete={() => deleteMutation.mutate(reminder.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Section */}
        {completedReminders.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Terminés ({completedReminders.length})</span>
            </div>
            <div className="space-y-2">
              {completedReminders.map((reminder) => (
                <ReminderItemCard
                  key={reminder.id}
                  reminder={reminder}
                  isSelected={selectedIds.has(reminder.id)}
                  onToggleSelect={() => toggleSelection(reminder.id)}
                  onToggleComplete={() =>
                    toggleCompleteMutation.mutate({
                      id: reminder.id,
                      isCompleted: !reminder.isCompleted,
                    })
                  }
                  onEdit={() => openEditDialog(reminder)}
                  onDelete={() => deleteMutation.mutate(reminder.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredReminders?.length === 0 && (
          <div className="text-center py-16 border rounded-lg border-dashed border-border/80">
            <Bell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold">Aucun rappel trouvé</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Modifiez ou effacez vos filtres pour voir vos autres rappels.'
                : 'Créez un rappel pour suivre vos relances et échéances en toute sérénité.'}
            </p>
            {(!search && typeFilter === 'all' && statusFilter === 'all') && (
              <Button onClick={openCreateDialog} size="sm" className="mt-4 text-xs">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Créer un rappel
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialog for Create & Edit */}
      <Dialog open={showCreateDialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingReminder ? 'Modifier le rappel' : 'Nouveau rappel'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingReminder
                ? 'Mettez à jour les détails de ce rappel.'
                : 'Planifiez une action clé pour garder le fil de vos opportunités.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-medium">Titre *</Label>
              <Input
                id="title"
                placeholder="Ex : Relancer le recruteur après l'entretien..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reminder-type" className="text-xs font-medium">Catégorie</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as ReminderType })}
              >
                <SelectTrigger id="reminder-type" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOLLOW_UP">Relance candidature</SelectItem>
                  <SelectItem value="INTERVIEW">Préparation / Entretien</SelectItem>
                  <SelectItem value="DEADLINE">Date limite d'envoi</SelectItem>
                  <SelectItem value="OTHER">Autre action</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-xs font-medium">Date d'échéance *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueTime" className="text-xs font-medium">Heure</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium">Notes (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Ajouter des notes, coordonnées ou liens utiles..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="min-h-[80px] text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={closeDialog} className="h-9 text-xs">
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!formData.title || !formData.dueDate || createMutation.isPending || updateMutation.isPending}
              className="h-9 text-xs"
            >
              {editingReminder ? 'Enregistrer' : 'Créer le rappel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ReminderItemCardProps {
  reminder: Reminder;
  isOverdue?: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ReminderItemCard({
  reminder,
  isOverdue,
  isSelected,
  onToggleSelect,
  onToggleComplete,
  onEdit,
  onDelete,
}: ReminderItemCardProps) {
  return (
    <Card
      className={cn(
        'group border transition-all duration-150 relative overflow-hidden',
        reminder.isCompleted
          ? 'bg-muted/30 border-border/40 opacity-70'
          : isOverdue
            ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
            : 'border-border/70 hover:border-border hover:shadow-xs bg-card',
        isSelected && 'ring-2 ring-primary border-primary bg-primary/5'
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Quick Complete / Status Toggle */}
          <button
            type="button"
            onClick={onToggleComplete}
            className="mt-0.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            title={reminder.isCompleted ? 'Marquer comme non fait' : 'Marquer comme fait'}
          >
            {reminder.isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
            )}
          </button>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cn(
                  'text-sm font-medium leading-snug',
                  reminder.isCompleted && 'line-through text-muted-foreground'
                )}
              >
                {reminder.title}
              </h3>

              {/* Type Badge */}
              <Badge
                variant="outline"
                className={cn('text-[10px] py-0 px-1.5 font-normal', reminderTypeColors[reminder.type as ReminderType])}
              >
                {reminderTypeLabels[reminder.type as ReminderType]}
              </Badge>

              {/* Email Sent indicator */}
              {reminder.emailSent && (
                <Badge
                  variant="secondary"
                  className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/50 flex items-center gap-1"
                >
                  <Mail className="h-2.5 w-2.5" />
                  Email envoyé
                </Badge>
              )}
            </div>

            {reminder.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {reminder.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
              <span
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && !reminder.isCompleted && 'text-red-600 dark:text-red-400 font-semibold'
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDateTime(reminder.dueDate)}
              </span>

              {reminder.application && (
                <span className="truncate text-muted-foreground/80">
                  {reminder.application.companyName} • {reminder.application.position}
                </span>
              )}
            </div>
          </div>

          {/* Actions & Checkbox selection */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onToggleSelect}
              className={cn(
                'w-4 h-4 rounded border text-center transition-all flex items-center justify-center mr-1',
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border/70 text-transparent hover:border-foreground/60'
              )}
              title="Sélectionner"
            >
              <Check className="h-3 w-3 stroke-[3]" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={onToggleComplete}>
                  {reminder.isCompleted ? 'Marquer comme non fait' : 'Marquer comme fait'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-3.5 w-3.5" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
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
