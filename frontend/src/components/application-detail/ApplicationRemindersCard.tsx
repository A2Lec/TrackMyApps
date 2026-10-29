import { Link } from 'react-router';
import { Bell, Calendar, CheckCircle2, Mail, Plus } from 'lucide-react';
import type { Reminder } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';

interface ApplicationRemindersCardProps {
  reminders: Reminder[];
  onAdd: () => void;
  onComplete: (reminderId: string) => void;
  onShowTemplates: () => void;
}

export function ApplicationRemindersCard({ reminders, onAdd, onComplete, onShowTemplates }: ApplicationRemindersCardProps) {
  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Rappels & Actions
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onAdd} className="h-7 text-xs px-2 text-primary font-semibold hover:bg-primary/10">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
          <Button variant="ghost" size="sm" asChild className="h-7 text-xs px-2 text-muted-foreground">
            <Link to="/reminders">Voir tout</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {reminders.length > 0 ? (
          <>
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <p className={cn('font-semibold truncate', reminder.isCompleted && 'line-through text-muted-foreground')}>
                    {reminder.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(reminder.dueDate)}
                  </p>
                </div>

                {!reminder.isCompleted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onComplete(reminder.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-success"
                    title="Marquer comme fait"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <div className="pt-2 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onAdd} className="text-xs h-7 flex-1">
                <Plus className="h-3 w-3 mr-1" />
                Nouveau rappel
              </Button>
              <Button variant="ghost" size="sm" onClick={onShowTemplates} className="text-xs h-7 text-primary hover:bg-primary/10 px-2">
                <Mail className="h-3 w-3 mr-1" />
                Modèles d'emails
              </Button>
            </div>
          </>
        ) : (
          <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/70 rounded-lg space-y-2.5">
            <p>Aucun rappel actif pour cette candidature.</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button size="sm" onClick={onAdd} className="h-7 text-xs font-semibold">
                <Plus className="h-3 w-3 mr-1" />
                Ajouter un rappel
              </Button>
              <Button variant="outline" size="sm" onClick={onShowTemplates} className="h-7 text-xs">
                <Mail className="h-3 w-3 mr-1 text-primary" />
                Modèles d'emails
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
