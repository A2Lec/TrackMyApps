import { Link } from 'react-router';
import { toast } from 'sonner';
import { Calendar, Check, CheckCircle2, Circle, Download, Edit, ExternalLink, Mail, MoreVertical, Trash2 } from 'lucide-react';
import type { Reminder, ReminderType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReminderTypeBadge } from '@/components/StatusBadge';
import { downloadIcsFile, generateIcsContent, getGoogleCalendarUrl, getOutlookCalendarUrl } from '@/lib/calendarExport';
import { reminderToCalendarEvent } from '@/lib/reminders';
import { cn, formatDateTime } from '@/lib/utils';

interface ReminderCardProps {
  reminder: Reminder;
  isOverdue?: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ReminderCard({
  reminder,
  isOverdue,
  isSelected,
  onToggleSelect,
  onToggleComplete,
  onEdit,
  onDelete,
}: ReminderCardProps) {
  const event = reminderToCalendarEvent(reminder);

  const downloadIcs = () => {
    downloadIcsFile(`${reminder.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`, generateIcsContent([event]));
    toast.success('Fichier .ics téléchargé');
  };

  return (
    <Card
      className={cn(
        'group border transition-all duration-150 relative overflow-hidden',
        reminder.isCompleted
          ? 'bg-muted/30 border-border/40 opacity-70'
          : isOverdue
            ? 'border-destructive/40 bg-destructive/10 hover:border-destructive'
            : 'border-border/70 hover:border-border bg-card',
        isSelected && 'ring-2 ring-primary border-primary bg-primary/5'
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onToggleComplete}
            className="mt-0.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
            title={reminder.isCompleted ? 'Marquer comme non fait' : 'Marquer comme fait'}
          >
            {reminder.isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cn('text-sm font-medium leading-snug', reminder.isCompleted && 'line-through text-muted-foreground')}>
                {reminder.title}
              </h3>
              <ReminderTypeBadge type={reminder.type as ReminderType} />
              {reminder.emailSent && (
                <Badge
                  variant="secondary"
                  className="text-[11px] py-0 px-1.5 bg-card text-muted-foreground border-border flex items-center gap-1"
                >
                  <Mail className="h-2.5 w-2.5" />
                  Email envoyé
                </Badge>
              )}
            </div>

            {reminder.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{reminder.description}</p>}

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
              <span className={cn('flex items-center gap-1', isOverdue && !reminder.isCompleted && 'text-destructive font-semibold')}>
                <Calendar className="h-3 w-3" />
                <span className="font-mono">{formatDateTime(reminder.dueDate)}</span>
              </span>
            </div>

            {reminder.application && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40 text-xs">
                <div className="h-6 w-6 rounded bg-primary/10 text-primary font-semibold text-[10px] flex items-center justify-center flex-shrink-0">
                  {reminder.application.companyName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-semibold text-foreground mr-1.5">{reminder.application.companyName}</span>
                  <span className="text-muted-foreground text-[11px]">{reminder.application.position}</span>
                </div>
                <Link
                  to={`/applications/${reminder.application.id}`}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium flex-shrink-0"
                >
                  Voir la candidature <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

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
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(event), '_blank')}>
                  <Calendar className="mr-2 h-3.5 w-3.5 text-status-sent" />
                  Google Agenda
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(getOutlookCalendarUrl(event), '_blank')}>
                  <Calendar className="mr-2 h-3.5 w-3.5 text-status-sent" />
                  Outlook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadIcs}>
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Télécharger .ics
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
