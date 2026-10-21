import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  Phone,
  Video,
  Laptop,
  Building2,
  Mail,
  MessageSquare,
  Calendar,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import {
  type ExchangeDebrief,
  type ExchangeType,
  type ExchangeFeeling,
  EXCHANGE_TYPE_CONFIG,
  EXCHANGE_FEELING_CONFIG,
} from '@/lib/journal';
import { formatDate, formatDateTime, EVENT_TYPE_LABELS, cn } from '@/lib/utils';
import { EVENT_TYPE_STATUS } from '@/constants/labels';
import { StatusDot } from '@/components/StatusBadge';
import type { Application, EventType } from '@/types';
import { remindersService } from '@/services/reminders.service';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ApplicationJournalProps {
  application: Application;
  exchanges: ExchangeDebrief[];
  onSaveExchanges: (exchanges: ExchangeDebrief[]) => Promise<void> | void;
  isSaving?: boolean;
}

const TYPE_ICONS: Record<ExchangeType, React.ComponentType<{ className?: string }>> = {
  CALL: Phone,
  VISIO: Video,
  TECH: Laptop,
  PHYSICAL: Building2,
  EMAIL: Mail,
  OTHER: MessageSquare,
};

export function ApplicationJournal({
  application,
  exchanges,
  onSaveExchanges,
  isSaving,
}: ApplicationJournalProps) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSystemEvents, setShowSystemEvents] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    date: string;
    type: ExchangeType;
    interlocutorName: string;
    interlocutorRoleOrLink: string;
    feeling: ExchangeFeeling;
    notes: string;
    nextSteps: string;
    createReminder: boolean;
    reminderDueDate: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    type: 'VISIO',
    interlocutorName: '',
    interlocutorRoleOrLink: '',
    feeling: 'POSITIVE',
    notes: '',
    nextSteps: '',
    createReminder: false,
    reminderDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'VISIO',
      interlocutorName: '',
      interlocutorRoleOrLink: '',
      feeling: 'POSITIVE',
      notes: '',
      nextSteps: '',
      createReminder: false,
      reminderDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowDialog(true);
  };

  const handleOpenEdit = (exchange: ExchangeDebrief) => {
    setEditingId(exchange.id);
    setFormData({
      date: exchange.date,
      type: exchange.type,
      interlocutorName: exchange.interlocutorName,
      interlocutorRoleOrLink: exchange.interlocutorRoleOrLink || '',
      feeling: exchange.feeling || 'POSITIVE',
      notes: exchange.notes,
      nextSteps: exchange.nextSteps || '',
      createReminder: false,
      reminderDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    const updated = exchanges.filter((e) => e.id !== id);
    await onSaveExchanges(updated);
    toast.success('Entrée du journal supprimée');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.interlocutorName.trim()) {
      toast.error("Veuillez renseigner le nom de l'interlocuteur");
      return;
    }

    if (!formData.notes.trim()) {
      toast.error('Veuillez renseigner les points abordés');
      return;
    }

    let updatedExchanges: ExchangeDebrief[];

    if (editingId) {
      updatedExchanges = exchanges.map((item) =>
        item.id === editingId
          ? {
              ...item,
              date: formData.date,
              type: formData.type,
              interlocutorName: formData.interlocutorName.trim(),
              interlocutorRoleOrLink: formData.interlocutorRoleOrLink.trim() || undefined,
              feeling: formData.feeling,
              notes: formData.notes.trim(),
              nextSteps: formData.nextSteps.trim() || undefined,
            }
          : item
      );
    } else {
      const newEntry: ExchangeDebrief = {
        id: 'exc_' + Date.now(),
        date: formData.date,
        type: formData.type,
        interlocutorName: formData.interlocutorName.trim(),
        interlocutorRoleOrLink: formData.interlocutorRoleOrLink.trim() || undefined,
        feeling: formData.feeling,
        notes: formData.notes.trim(),
        nextSteps: formData.nextSteps.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      updatedExchanges = [newEntry, ...exchanges];
    }

    // Save reminder if requested
    if (formData.createReminder && formData.reminderDueDate) {
      try {
        await remindersService.create({
          title: `Suite échange ${application.companyName}: ${formData.interlocutorName.trim()}`,
          description: formData.nextSteps ? `Prochaine étape : ${formData.nextSteps}` : undefined,
          dueDate: new Date(formData.reminderDueDate).toISOString(),
          type: 'RELANCE',
          applicationId: application.id,
        });
        queryClient.invalidateQueries({ queryKey: ['application', application.id] });
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
        queryClient.invalidateQueries({ queryKey: ['upcomingReminders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast.success('Rappel programmé pour la prochaine étape');
      } catch (err: any) {
        toast.error('Erreur lors de la création du rappel');
      }
    }

    await onSaveExchanges(updatedExchanges);
    setShowDialog(false);
    toast.success(editingId ? 'Échange mis à jour' : 'Échange consigné dans le journal');
  };

  // Sort exchanges by date desc
  const sortedExchanges = [...exchanges].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Journal Cockpit Card */}
      <Card className="border-border/80">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Journal de bord des échanges ({exchanges.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Historique qualifié de vos entretiens, contacts recruteurs et prochaines étapes
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-8 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Noter un échange
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {sortedExchanges.length === 0 ? (
            <div className="py-10 px-4 text-center border border-dashed border-border/80 rounded-lg bg-muted/20 space-y-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Aucun échange consigné pour cette candidature
                </p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Notez chaque étape (premier call RH, entretien visio, test technique, debrief...)
                  pour garder le fil des questions posées et de vos ressentis.
                </p>
              </div>
              <Button size="sm" onClick={handleOpenCreate} className="h-8 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Noter mon premier échange
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedExchanges.map((exchange) => {
                const typeConfig = EXCHANGE_TYPE_CONFIG[exchange.type] || EXCHANGE_TYPE_CONFIG.OTHER;
                const feelingConfig = exchange.feeling
                  ? EXCHANGE_FEELING_CONFIG[exchange.feeling]
                  : null;
                const Icon = TYPE_ICONS[exchange.type] || MessageSquare;

                return (
                  <div
                    key={exchange.id}
                    className="p-4 rounded-lg border border-border/70 bg-card hover:border-border transition-all space-y-3"
                  >
                    {/* Top Row: Type, Date, Feeling, Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                            typeConfig.badgeClass
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {typeConfig.label}
                        </span>

                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(exchange.date, 'long')}
                        </span>

                        {feelingConfig && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                              feelingConfig.badgeClass
                            )}
                          >
                            <span>{feelingConfig.emoji}</span>
                            <span>{feelingConfig.label}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEdit(exchange)}
                          title="Modifier"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(exchange.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Interlocutor */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-primary" />
                        Interlocuteur :
                      </span>
                      <span className="font-semibold text-foreground">
                        {exchange.interlocutorName}
                      </span>
                      {exchange.interlocutorRoleOrLink && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          {exchange.interlocutorRoleOrLink.startsWith('http') ? (
                            <a
                              href={exchange.interlocutorRoleOrLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-0.5 truncate max-w-xs"
                            >
                              <span>Profil LinkedIn / Web</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground italic">
                              {exchange.interlocutorRoleOrLink}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Notes & Points abordés */}
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {exchange.notes}
                    </div>

                    {/* Next Steps (if any) */}
                    {exchange.nextSteps && (
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-primary">Prochaine étape promise : </span>
                          <span className="text-foreground/90">{exchange.nextSteps}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Collapsible System Events Audit Trail */}
          {application.events && application.events.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSystemEvents(!showSystemEvents)}
                className="text-xs text-muted-foreground hover:text-foreground w-full justify-between h-8"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Historique technique des statuts ({application.events.length})
                </span>
                {showSystemEvents ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>

              {showSystemEvents && (
                <div className="mt-3 pl-4 space-y-2 border-l-2 border-border/60 ml-2 animate-in fade-in-50 duration-200">
                  {application.events.map((event) => (
                    <div key={event.id} className="text-xs py-1 text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          {(() => {
                            const eventType = event.eventType || (event.type as EventType);
                            const status = EVENT_TYPE_STATUS[eventType];
                            if (!status) return null;
                            // A finished interview is the interview square, hollow
                            return eventType === 'INTERVIEW_DONE' ? (
                              <span aria-hidden="true" className="h-[9px] w-[9px] shrink-0 rounded-[2px] border-[1.5px] border-status-interview" />
                            ) : (
                              <StatusDot status={status} />
                            );
                          })()}
                          {EVENT_TYPE_LABELS[event.eventType || (event.type as EventType)] ||
                            event.eventType ||
                            event.type}
                        </span>
                        <span className="font-mono text-[11px]">{formatDateTime(event.createdAt)}</span>
                      </div>
                      {(event.notes || event.description) && (
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                          {event.notes || event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Exchange Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              {editingId ? "Modifier l'échange" : 'Noter un nouvel échange'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Consignez le compte-rendu de votre échange pour {application.companyName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date de l'échange</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Type d'échange</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData({ ...formData, type: val as ExchangeType })}
                >
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXCHANGE_TYPE_CONFIG).map(([typeKey, cfg]) => (
                      <SelectItem key={typeKey} value={typeKey} className="text-xs">
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Interlocuteur (Nom, Prénom) *</Label>
                <Input
                  placeholder="ex: Sophie Bernard"
                  value={formData.interlocutorName}
                  onChange={(e) => setFormData({ ...formData, interlocutorName: e.target.value })}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Rôle ou Profil LinkedIn</Label>
                <Input
                  placeholder="ex: Lead Tech ou https://linkedin..."
                  value={formData.interlocutorRoleOrLink}
                  onChange={(e) =>
                    setFormData({ ...formData, interlocutorRoleOrLink: e.target.value })
                  }
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Ressenti global</Label>
              <Select
                value={formData.feeling}
                onValueChange={(val) =>
                  setFormData({ ...formData, feeling: val as ExchangeFeeling })
                }
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXCHANGE_FEELING_CONFIG).map(([feelKey, cfg]) => (
                    <SelectItem key={feelKey} value={feelKey} className="text-xs">
                      {cfg.emoji} {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Points abordés & questions posées *</Label>
              <Textarea
                placeholder="Questions techniques posées, présentation du poste, ambiance, points où j'ai été à l'aise..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="text-xs leading-relaxed"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Prochaine étape promise (optionnel)</Label>
              <Input
                placeholder="ex: Réponse RH d'ici vendredi pour test technique"
                value={formData.nextSteps}
                onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                className="text-xs h-8"
              />
            </div>

            {!editingId && (
              <div className="p-3 rounded-lg bg-muted/40 border border-border/70 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.createReminder}
                    onChange={(e) =>
                      setFormData({ ...formData, createReminder: e.target.checked })
                    }
                    className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span>Créer automatiquement un rappel pour la prochaine étape</span>
                </label>

                {formData.createReminder && (
                  <div className="pt-2 space-y-1 animate-in fade-in-50 duration-200">
                    <Label className="text-[11px] text-muted-foreground">
                      Date d'échéance du rappel
                    </Label>
                    <Input
                      type="date"
                      value={formData.reminderDueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, reminderDueDate: e.target.value })
                      }
                      className="text-xs h-8"
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="h-8 text-xs"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving} className="h-8 text-xs font-semibold">
                {editingId ? 'Mettre à jour' : 'Enregistrer dans le journal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
