import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersService } from '@/services/reminders.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogBody,
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
  CheckCircle,
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import type { Reminder, ReminderType } from '@/types';

const reminderTypeLabels: Record<ReminderType, string> = {
  FOLLOW_UP: 'Relance',
  INTERVIEW: 'Entretien',
  DEADLINE: 'Date limite',
  OTHER: 'Autre',
};

const reminderTypeColors: Record<ReminderType, string> = {
  FOLLOW_UP: 'bg-blue-500/10 text-blue-700 border-blue-200',
  INTERVIEW: 'bg-purple-500/10 text-purple-700 border-purple-200',
  DEADLINE: 'bg-red-500/10 text-red-700 border-red-200',
  OTHER: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

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

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: remindersService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: remindersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Reminder> }) =>
      remindersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: remindersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      remindersService.update(id, { isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
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

  const openEditDialog = (reminder: Reminder) => {
    const date = new Date(reminder.dueDate);
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      type: reminder.type,
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

  const filteredReminders = reminders?.filter((reminder) => {
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

  const upcomingReminders = filteredReminders?.filter((r) => !r.isCompleted && new Date(r.dueDate) >= new Date());
  const overdueReminders = filteredReminders?.filter((r) => !r.isCompleted && new Date(r.dueDate) < new Date());
  const completedReminders = filteredReminders?.filter((r) => r.isCompleted);

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  if (isLoading) {
    return <RemindersSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rappels</h1>
          <p className="text-muted-foreground">
            Ne manquez plus aucune relance ou entretien
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau rappel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ReminderType | 'all')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="FOLLOW_UP">Relance</SelectItem>
              <SelectItem value="INTERVIEW">Entretien</SelectItem>
              <SelectItem value="DEADLINE">Date limite</SelectItem>
              <SelectItem value="OTHER">Autre</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'pending' | 'completed')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="completed">Terminés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-semibold">{reminders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">À venir</p>
                <p className="text-xl font-semibold">{upcomingReminders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En retard</p>
                <p className="text-xl font-semibold">{overdueReminders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terminés</p>
                <p className="text-xl font-semibold">{completedReminders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Reminders */}
      {overdueReminders && overdueReminders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            En retard ({overdueReminders.length})
          </h2>
          <div className="space-y-2">
            {overdueReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={() => openEditDialog(reminder)}
                onDelete={() => deleteMutation.mutate(reminder.id)}
                onToggleComplete={() =>
                  toggleCompleteMutation.mutate({ id: reminder.id, isCompleted: !reminder.isCompleted })
                }
                isOverdue
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders && upcomingReminders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            À venir ({upcomingReminders.length})
          </h2>
          <div className="space-y-2">
            {upcomingReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={() => openEditDialog(reminder)}
                onDelete={() => deleteMutation.mutate(reminder.id)}
                onToggleComplete={() =>
                  toggleCompleteMutation.mutate({ id: reminder.id, isCompleted: !reminder.isCompleted })
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Reminders */}
      {completedReminders && completedReminders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Terminés ({completedReminders.length})
          </h2>
          <div className="space-y-2">
            {completedReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onEdit={() => openEditDialog(reminder)}
                onDelete={() => deleteMutation.mutate(reminder.id)}
                onToggleComplete={() =>
                  toggleCompleteMutation.mutate({ id: reminder.id, isCompleted: !reminder.isCompleted })
                }
              />
            ))}
          </div>
        </div>
      )}

      {filteredReminders?.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun rappel</h3>
          <p className="text-muted-foreground mb-4">
            {search || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Aucun rappel ne correspond à votre recherche'
              : 'Créez votre premier rappel pour ne rien oublier'}
          </p>
          {!search && typeFilter === 'all' && statusFilter === 'all' && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau rappel
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReminder ? 'Modifier le rappel' : 'Nouveau rappel'}</DialogTitle>
            <DialogDescription>
              {editingReminder
                ? 'Modifiez les informations du rappel'
                : 'Créez un rappel pour ne rien oublier'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                placeholder="Relancer Google..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as ReminderType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOLLOW_UP">Relance</SelectItem>
                  <SelectItem value="INTERVIEW">Entretien</SelectItem>
                  <SelectItem value="DEADLINE">Date limite</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueTime">Heure</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Notes supplémentaires..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingReminder ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  isOverdue?: boolean;
}

function ReminderCard({ reminder, onEdit, onDelete, onToggleComplete, isOverdue }: ReminderCardProps) {
  return (
    <Card className={cn(
      'hover:border-primary transition-colors',
      reminder.isCompleted && 'opacity-60',
      isOverdue && 'border-red-200 bg-red-50/50'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={onToggleComplete}
          >
            {reminder.isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <div className={cn(
                'h-5 w-5 rounded-full border-2',
                isOverdue ? 'border-red-400' : 'border-muted-foreground'
              )} />
            )}
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn('font-medium', reminder.isCompleted && 'line-through')}>
                {reminder.title}
              </h3>
              <Badge variant="outline" className={cn('text-xs', reminderTypeColors[reminder.type])}>
                {reminderTypeLabels[reminder.type]}
              </Badge>
            </div>
            {reminder.description && (
              <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <Calendar className="h-3 w-3" />
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {formatDateTime(reminder.dueDate)}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function RemindersSkeleton() {
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
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
