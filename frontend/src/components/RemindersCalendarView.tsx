import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsService } from '@/services/applications.service';
import { remindersService } from '@/services/reminders.service';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, cn } from '@/lib/utils';
import type { Reminder, Application } from '@/types';

const DAYS_HEADER = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

interface RemindersCalendarViewProps {
  onNewReminder?: () => void;
}

export function RemindersCalendarView({ onNewReminder }: RemindersCalendarViewProps) {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: kanbanData } = useQuery({
    queryKey: ['applications', 'kanban'],
    queryFn: () => applicationsService.getByStatus(),
  });

  const { data: reminders } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersService.getAll(),
  });

  const toggleReminderMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      remindersService.update(id, { isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const applications: Application[] = useMemo(() => {
    if (!kanbanData) return [];
    return Object.values(kanbanData).flat();
  }, [kanbanData]);

  const toDateString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = toDateString(date);

    // Only actionable future events / interviews, not every application creation (TICK-204)
    const interviewsOnDate = applications.filter((app) => {
      if (!app.interviewDate) return false;
      return toDateString(new Date(app.interviewDate)) === dateStr;
    });

    const remindersOnDate = (reminders || []).filter((reminder: Reminder) => {
      if (!reminder.dueDate) return false;
      return toDateString(new Date(reminder.dueDate)) === dateStr;
    });

    return { interviews: interviewsOnDate, reminders: remindersOnDate };
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + (direction === 'next' ? 1 : -1), 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Week days calculation
  const currentWeekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Month days calculation
  const monthDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  }, [year, month]);

  const todayStr = toDateString(new Date());
  const selectedDateStr = toDateString(selectedDate);
  const selectedEvents = getEventsForDate(selectedDate);

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Action / View Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 p-3 sm:p-4 rounded-lg border border-border/80">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs font-semibold">
            Aujourd'hui
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => navigate('prev')}
              aria-label="Période précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm sm:text-base font-semibold capitalize px-2 min-w-[150px] text-center">
              {view === 'month'
                ? `${MONTHS[month]} ${year}`
                : `Semaine du ${currentWeekDays[0].getDate()} ${MONTHS[currentWeekDays[0].getMonth()]}`}
            </h2>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => navigate('next')}
              aria-label="Période suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60 text-xs">
            <button
              onClick={() => setView('month')}
              className={cn(
                'px-3 py-1 rounded-md font-medium transition-all',
                view === 'month' ? 'bg-background text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mois
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                'px-3 py-1 rounded-md font-medium transition-all',
                view === 'week' ? 'bg-background text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Semaine
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar (8 cols) + Selected Date Details (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
        <Card className="lg:col-span-8 border border-border/80 overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {view === 'month' ? 'Vue mensuelle' : 'Vue hebdomadaire'}
              </span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-[2px] bg-status-interview" /> Entretiens
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-[2px] bg-status-sent" /> Rappels & Relances
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-5">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_HEADER.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-muted-foreground/80 py-1.5 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Cells: Month Mode */}
            {view === 'month' ? (
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {monthDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-lg bg-muted/10 opacity-30" />;
                  }

                  const cellDate = new Date(year, month, day);
                  const cellDateStr = toDateString(cellDate);
                  const isToday = cellDateStr === todayStr;
                  const isSelected = cellDateStr === selectedDateStr;
                  const events = getEventsForDate(cellDate);
                  const total = events.interviews.length + events.reminders.length;

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => setSelectedDate(cellDate)}
                      className={cn(
                        'h-20 sm:h-24 p-1.5 sm:p-2 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 relative group',
                        isToday
                          ? 'border-primary ring-1 ring-primary bg-primary/5'
                          : isSelected
                            ? 'border-primary/80 bg-accent/30'
                            : 'border-border/60 hover:bg-muted/40 bg-card/60'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            'text-xs font-semibold flex items-center justify-center h-6 w-6 rounded-full',
                            isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                          )}
                        >
                          {day}
                        </span>
                        {total > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 font-mono font-semibold">
                            {total}
                          </Badge>
                        )}
                      </div>

                      {/* Event Dots */}
                      <div className="space-y-1 w-full overflow-hidden">
                        {events.interviews.slice(0, 1).map((app) => (
                          <div
                            key={app.id}
                            className="text-[10px] font-medium truncate px-1 py-0.5 rounded bg-secondary text-status-interview border border-border"
                            title={`Entretien ${app.companyName}`}
                          >
                            Entretien {app.companyName}
                          </div>
                        ))}
                        {events.reminders.slice(0, 1).map((rem) => (
                          <div
                            key={rem.id}
                            className={cn(
                              'text-[10px] font-medium truncate px-1 py-0.5 rounded border',
                              rem.isCompleted
                                ? 'bg-muted text-muted-foreground line-through opacity-70 border-border/50'
                                : 'bg-secondary text-status-sent  border-border'
                            )}
                            title={rem.title}
                          >
                            {rem.title}
                          </div>
                        ))}
                        {total > 2 && (
                          <span className="text-[9px] text-muted-foreground block truncate pl-1">
                            +{total - 2} autre(s)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Week Mode */
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {currentWeekDays.map((date) => {
                  const cellDateStr = toDateString(date);
                  const isToday = cellDateStr === todayStr;
                  const isSelected = cellDateStr === selectedDateStr;
                  const events = getEventsForDate(date);

                  return (
                    <button
                      key={cellDateStr}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'min-h-[220px] p-2 rounded-lg border text-left flex flex-col justify-start gap-2 transition-all group',
                        isToday
                          ? 'border-primary ring-1 ring-primary bg-primary/5'
                          : isSelected
                            ? 'border-primary/80 bg-accent/30'
                            : 'border-border/60 hover:bg-muted/40 bg-card/60'
                      )}
                    >
                      <div className="flex items-center justify-between w-full border-b pb-1">
                        <span className="text-xs text-muted-foreground">
                          {DAYS_HEADER[date.getDay()]}
                        </span>
                        <span
                          className={cn(
                            'text-xs font-semibold flex items-center justify-center h-6 w-6 rounded-full',
                            isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                          )}
                        >
                          {date.getDate()}
                        </span>
                      </div>

                      <div className="space-y-1.5 w-full">
                        {events.interviews.map((app) => (
                          <div
                            key={app.id}
                            className="text-[11px] p-1.5 rounded-md bg-secondary text-status-interview border border-border"
                          >
                            <span className="font-semibold block truncate">Entretien</span>
                            <span className="text-[10px] text-muted-foreground truncate block">
                              {app.companyName}
                            </span>
                          </div>
                        ))}
                        {events.reminders.map((rem) => (
                          <div
                            key={rem.id}
                            className={cn(
                              'text-[11px] p-1.5 rounded-md border',
                              rem.isCompleted
                                ? 'bg-muted/50 text-muted-foreground line-through opacity-70'
                                : 'bg-secondary text-status-sent  border-border'
                            )}
                          >
                            <span className="font-medium block truncate">{rem.title}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Date Details Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-border/80">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">
                    {formatDate(selectedDate, 'long')}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {selectedEvents.interviews.length + selectedEvents.reminders.length} action(s) prévue(s)
                  </span>
                </div>
                {onNewReminder && (
                  <Button size="sm" onClick={onNewReminder} className="h-7 text-xs">
                    + Rappel
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {selectedEvents.interviews.length === 0 && selectedEvents.reminders.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground space-y-2">
                  <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p>Aucun événement ni relance pour ce jour.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Interviews */}
                  {selectedEvents.interviews.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-lg bg-secondary border border-border space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <Badge className="bg-status-interview text-white text-[10px] px-2 py-0">Entretien</Badge>
                        <Link
                          to={`/applications/${app.id}`}
                          className="text-[11px] text-status-interview hover:underline flex items-center gap-1 font-medium"
                        >
                          Fiche <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{app.position}</p>
                      <p className="text-muted-foreground font-medium">{app.companyName}</p>
                    </div>
                  ))}

                  {/* Reminders */}
                  {selectedEvents.reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className={cn(
                        'p-3 rounded-lg border text-xs space-y-2 transition-all',
                        rem.isCompleted
                          ? 'bg-muted/40 border-border/60 opacity-70'
                          : 'bg-card border-border/80'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleReminderMutation.mutate({
                                id: rem.id,
                                isCompleted: !rem.isCompleted,
                              })
                            }
                            className="text-muted-foreground hover:text-primary"
                          >
                            {rem.isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <span className={cn('font-semibold', rem.isCompleted && 'line-through text-muted-foreground')}>
                            {rem.title}
                          </span>
                        </div>
                      </div>

                      {rem.application && (
                        <div className="pl-6 flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                          <span className="truncate">
                            {rem.application.companyName} ({rem.application.position})
                          </span>
                          <Link
                            to={`/applications/${rem.application.id}`}
                            className="text-primary hover:underline flex items-center gap-0.5 ml-2 font-medium"
                          >
                            Voir <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
