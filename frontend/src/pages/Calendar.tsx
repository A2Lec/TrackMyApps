import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationsService } from '@/services/applications.service';
import { remindersService } from '@/services/reminders.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Briefcase,
  Bell,
  CheckCircle2,
  Circle,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, statusLabels, statusColors, cn } from '@/lib/utils';
import type { Reminder, Application, ApplicationStatus } from '@/types';

const DAYS_HEADER = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function CalendarPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<'all' | 'applications' | 'reminders'>('all');

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

    const appsOnDate = applications.filter((app) => {
      if (!app.applicationDate) return false;
      return toDateString(new Date(app.applicationDate)) === dateStr;
    });

    const remindersOnDate = (reminders || []).filter((reminder: Reminder) => {
      if (!reminder.dueDate) return false;
      return toDateString(new Date(reminder.dueDate)) === dateStr;
    });

    return { applications: appsOnDate, reminders: remindersOnDate };
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
    const dayOfWeek = curr.getDay(); // 0 is Sunday
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

  const filteredApps = filterType === 'reminders' ? [] : selectedEvents.applications;
  const filteredReminders = filterType === 'applications' ? [] : selectedEvents.reminders;

  const totalEventsToday = getEventsForDate(new Date()).applications.length + getEventsForDate(new Date()).reminders.length;

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden animate-in fade-in-50 duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Calendrier</h1>
            {totalEventsToday > 0 && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                {totalEventsToday} aujourd'hui
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivez le rythme de vos candidatures, entretiens et relances programmées
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="h-9 text-xs">
            Aujourd'hui
          </Button>

          {/* View Toggle */}
          <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border text-xs">
            <button
              onClick={() => setView('month')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all',
                view === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mois
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all',
                view === 'week'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Semaine
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar (3 cols) + Event Drawer/Preview (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
        <Card className="lg:col-span-8 border border-border/70 shadow-sm w-full min-w-0 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => navigate('prev')}
                aria-label="Période précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base sm:text-lg font-semibold capitalize">
                {view === 'month'
                  ? `${MONTHS[month]} ${year}`
                  : `Semaine du ${currentWeekDays[0].getDate()} ${MONTHS[currentWeekDays[0].getMonth()]} au ${currentWeekDays[6].getDate()} ${MONTHS[currentWeekDays[6].getMonth()]}`}
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

            {/* Filter pills */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Candidatures
              </span>
              <span className="flex items-center gap-1 ml-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Rappels
              </span>
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
                    return <div key={`empty-${idx}`} className="aspect-square bg-muted/10 rounded-md" />;
                  }

                  const cellDate = new Date(year, month, day);
                  const cellDateStr = toDateString(cellDate);
                  const isCurrentDay = cellDateStr === todayStr;
                  const isSelected = cellDateStr === selectedDateStr;
                  const events = getEventsForDate(cellDate);
                  const hasApps = events.applications.length > 0;
                  const hasReminders = events.reminders.length > 0;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(cellDate)}
                      className={cn(
                        'aspect-square p-1 sm:p-2 rounded-lg border text-left flex flex-col justify-between transition-all duration-150 relative group',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                          : 'border-border/50 hover:border-border hover:bg-muted/40',
                        isCurrentDay && !isSelected && 'bg-primary/5 border-primary/40'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={cn(
                            'text-xs sm:text-sm font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full',
                            isCurrentDay && 'bg-primary text-primary-foreground font-bold shadow-xs',
                            isSelected && !isCurrentDay && 'text-primary font-bold'
                          )}
                        >
                          {day}
                        </span>
                      </div>

                      {/* Event Micro-indicators */}
                      {(hasApps || hasReminders) && (
                        <div className="flex items-center gap-1 mt-auto pt-1">
                          {hasApps && (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                          {hasReminders && (
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 flex-shrink-0" />
                          )}
                          <span className="text-[10px] text-muted-foreground hidden sm:inline font-mono">
                            {events.applications.length + events.reminders.length}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Week Mode */
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {currentWeekDays.map((date) => {
                  const cellDateStr = toDateString(date);
                  const isCurrentDay = cellDateStr === todayStr;
                  const isSelected = cellDateStr === selectedDateStr;
                  const events = getEventsForDate(date);

                  return (
                    <button
                      key={cellDateStr}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'min-h-[140px] sm:min-h-[180px] p-2 rounded-lg border text-left flex flex-col justify-between transition-all',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                          : 'border-border/60 hover:border-border hover:bg-muted/40',
                        isCurrentDay && !isSelected && 'bg-primary/5 border-primary/40'
                      )}
                    >
                      <div className="flex flex-col items-center sm:items-start">
                        <span
                          className={cn(
                            'text-xs sm:text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1',
                            isCurrentDay ? 'bg-primary text-primary-foreground' : 'text-foreground'
                          )}
                        >
                          {date.getDate()}
                        </span>
                      </div>

                      <div className="space-y-1 w-full mt-2 overflow-hidden">
                        {events.applications.slice(0, 2).map((app) => (
                          <div
                            key={app.id}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 truncate"
                          >
                            {app.companyName}
                          </div>
                        ))}
                        {events.reminders.slice(0, 2).map((rem) => (
                          <div
                            key={rem.id}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 truncate"
                          >
                            {rem.title}
                          </div>
                        ))}
                        {events.applications.length + events.reminders.length > 4 && (
                          <p className="text-[9px] text-muted-foreground text-center">
                            +{events.applications.length + events.reminders.length - 4} autres
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Mobile Legend */}
            <div className="flex sm:hidden items-center justify-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Candidatures
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Rappels
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Agenda / Detail Sidebar */}
        <Card className="lg:col-span-4 border border-border/70 shadow-sm w-full min-w-0 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span>
                  {selectedDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </span>
              </CardTitle>
            </div>

            {/* Filter tags inside sidebar */}
            <div className="flex items-center gap-1.5 pt-2">
              <button
                onClick={() => setFilterType('all')}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  filterType === 'all'
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                )}
              >
                Tous ({selectedEvents.applications.length + selectedEvents.reminders.length})
              </button>
              <button
                onClick={() => setFilterType('applications')}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  filterType === 'applications'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                )}
              >
                Candidatures ({selectedEvents.applications.length})
              </button>
              <button
                onClick={() => setFilterType('reminders')}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  filterType === 'reminders'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                )}
              >
                Rappels ({selectedEvents.reminders.length})
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[550px]">
            {filteredApps.length === 0 && filteredReminders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Aucun événement ce jour</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sélectionnez un autre jour ou planifiez un rappel
                </p>
              </div>
            ) : (
              <>
                {/* Applications section */}
                {filteredApps.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                      Candidatures ({filteredApps.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredApps.map((app) => (
                        <Link
                          key={app.id}
                          to={`/applications/${app.id}`}
                          className="group block p-3 rounded-lg border border-border/60 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate group-hover:text-blue-600 transition-colors">
                                {app.position}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{app.companyName}</p>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] py-0 px-1.5', statusColors[app.status as ApplicationStatus])}
                            >
                              {statusLabels[app.status as ApplicationStatus]}
                            </Badge>
                            {app.location && (
                              <span className="text-[11px] text-muted-foreground truncate">
                                {app.location}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reminders section */}
                {filteredReminders.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Bell className="h-3.5 w-3.5 text-amber-500" />
                      Rappels ({filteredReminders.length})
                    </h3>
                    <div className="space-y-2">
                      {filteredReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className={cn(
                            'p-3 rounded-lg border transition-all flex items-start gap-2.5',
                            reminder.isCompleted
                              ? 'bg-muted/40 border-border/40 opacity-70'
                              : 'border-border/60 bg-card hover:border-amber-500/40'
                          )}
                        >
                          <button
                            onClick={() =>
                              toggleReminderMutation.mutate({
                                id: reminder.id,
                                isCompleted: !reminder.isCompleted,
                              })
                            }
                            className="mt-0.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                            title={reminder.isCompleted ? 'Marquer comme non fait' : 'Marquer comme fait'}
                          >
                            {reminder.isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'text-sm font-medium leading-tight',
                                reminder.isCompleted && 'line-through text-muted-foreground'
                              )}
                            >
                              {reminder.title}
                            </p>
                            {reminder.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {reminder.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(reminder.dueDate)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
