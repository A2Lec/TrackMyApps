import { useState } from 'react';
import type { Application, Reminder, ReminderType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NO_APPLICATION = 'none';

export interface ReminderFormValues {
  title: string;
  description?: string;
  type: ReminderType;
  dueDate: string;
  applicationId?: string;
}

export interface ReminderPreset {
  label: string;
  title: string;
  type: ReminderType;
  dueInDays: number;
}

interface ReminderFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Reminder being edited; a new one is created otherwise */
  reminder: Reminder | null;
  /** Applications the reminder can be linked to */
  applications: Application[];
  /** Create the reminder for this application only (no application picker) */
  fixedApplication?: Application;
  /** Starting values of a new reminder */
  defaults?: { title?: string; dueInDays?: number };
  /** One-click shortcuts filling the title, type and due date */
  presets?: ReminderPreset[];
  onSubmit: (values: ReminderFormValues) => void;
  isSubmitting: boolean;
}

const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const followUpTitle = (applications: Application[], applicationId: string) => {
  const app = applications.find((a) => a.id === applicationId);
  return app ? `Relancer ${app.companyName}` : '';
};

/**
 * Create or edit a reminder. Mount it only while open so the form starts from
 * the reminder being edited.
 */
export function ReminderFormDialog({
  open,
  onClose,
  reminder,
  applications,
  fixedApplication,
  defaults,
  presets,
  onSubmit,
  isSubmitting,
}: ReminderFormDialogProps) {
  const [form, setForm] = useState(() => {
    const due = reminder ? new Date(reminder.dueDate) : inDays(defaults?.dueInDays ?? 0);
    return {
      title: reminder?.title ?? defaults?.title ?? '',
      description: reminder?.description ?? '',
      type: (reminder?.type as ReminderType) ?? 'FOLLOW_UP',
      dueDate: due.toISOString().split('T')[0],
      dueTime: reminder ? due.toTimeString().slice(0, 5) : '09:00',
      applicationId: reminder?.applicationId ?? fixedApplication?.id ?? NO_APPLICATION,
    };
  });

  const canSubmit = Boolean(form.title && form.dueDate) && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      dueDate: new Date(`${form.dueDate}T${form.dueTime}`).toISOString(),
      applicationId: form.applicationId !== NO_APPLICATION ? form.applicationId : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {reminder
              ? 'Modifier le rappel'
              : fixedApplication
                ? `Nouveau rappel pour ${fixedApplication.companyName}`
                : 'Nouveau rappel'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {reminder
              ? 'Mettez à jour les détails de ce rappel.'
              : 'Planifiez une action clé pour garder le fil de vos opportunités.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {presets && presets.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase font-semibold">Raccourcis express</Label>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm({
                        ...form,
                        title: preset.title,
                        type: preset.type,
                        dueDate: inDays(preset.dueInDays).toISOString().split('T')[0],
                      })
                    }
                    className="h-7 text-[11px] px-2"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {!fixedApplication && (
          <div className="space-y-1.5">
            <Label htmlFor="applicationId" className="text-xs font-medium">
              Candidature associée (optionnel)
            </Label>
            <Select
              value={form.applicationId}
              onValueChange={(applicationId) =>
                setForm((prev) => ({
                  ...prev,
                  applicationId,
                  // Suggest a title when the user has not typed one
                  title: prev.title || followUpTitle(applications, applicationId),
                }))
              }
            >
              <SelectTrigger id="applicationId" className="h-9 text-xs">
                <SelectValue placeholder="Aucune (Rappel général)" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value={NO_APPLICATION}>Aucune (Rappel général)</SelectItem>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.companyName} — {app.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Titre *
            </Label>
            <Input
              id="title"
              placeholder="Ex : Relancer le recruteur après l'entretien..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reminder-type" className="text-xs font-medium">
              Catégorie
            </Label>
            <Select value={form.type} onValueChange={(type) => setForm({ ...form, type: type as ReminderType })}>
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
              <Label htmlFor="dueDate" className="text-xs font-medium">
                Date d'échéance *
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueTime" className="text-xs font-medium">
                Heure
              </Label>
              <Input
                id="dueTime"
                type="time"
                value={form.dueTime}
                onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium">
              Notes (optionnel)
            </Label>
            <Textarea
              id="description"
              placeholder="Ajouter des notes, coordonnées ou liens utiles..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[80px] text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} className="h-9 text-xs">
            Annuler
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit} className="h-9 text-xs">
            {reminder ? 'Enregistrer' : 'Créer le rappel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
