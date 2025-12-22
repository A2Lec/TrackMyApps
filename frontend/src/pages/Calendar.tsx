import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationsService } from '@/services/applications.service';
import { remindersService } from '@/services/reminders.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Briefcase,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, statusLabels, statusColors, cn } from '@/lib/utils';
import type { Reminder } from '@/types';

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: kanbanData } = useQuery({
    queryKey: ['applications', 'kanban'],
    queryFn: () => applicationsService.getByStatus(),
  });

  const { data: reminders } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersService.getAll(),
  });

  const applications = useMemo(() => {
    if (!kanbanData) return [];
    return Object.values(kanbanData).flat();
  }, [kanbanData]);

  const getEventsForDate = (date: Date) => {
    const toLocalDateString = (d: Date) => {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const dateStr = toLocalDateString(date);
    
    const appsOnDate = applications.filter((app) => {
      return toLocalDateString(new Date(app.applicationDate)) === dateStr;
    });

    const remindersOnDate = (reminders || []).filter((reminder: Reminder) => {
      return toLocalDateString(new Date(reminder.dueDate)) === dateStr;
    });

    return { applications: appsOnDate, reminders: remindersOnDate };
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const calendarDays = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground">
            Visualisez vos candidatures et rappels sur le calendrier
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goToToday}>
            Aujourd'hui
          </Button>
          <Select value={view} onValueChange={(v) => setView(v as 'month' | 'week')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {MONTHS[month]} {year}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const date = new Date(year, month, day);
                const events = getEventsForDate(date);
                const hasEvents = events.applications.length > 0 || events.reminders.length > 0;
                const isSelected =
                  selectedDate &&
                  day === selectedDate.getDate() &&
                  month === selectedDate.getMonth() &&
                  year === selectedDate.getFullYear();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      'aspect-square p-1 rounded-lg border transition-colors hover:border-primary relative',
                      isToday(day) && 'bg-primary/10 border-primary',
                      isSelected && 'border-primary ring-2 ring-primary ring-offset-2',
                      !isToday(day) && !isSelected && 'border-transparent hover:bg-muted/50'
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm',
                        isToday(day) && 'font-bold text-primary'
                      )}
                    >
                      {day}
                    </span>
                    {hasEvents && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {events.applications.length > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                        {events.reminders.length > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Candidatures</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Rappels</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Selected Date Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {selectedDate ? formatDate(selectedDate.toISOString()) : "Sélectionnez une date"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDate ? (
              <>
                {/* Applications */}
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4" />
                    Candidatures ({selectedDateEvents?.applications.length || 0})
                  </h4>
                  {selectedDateEvents?.applications.length ? (
                    <div className="space-y-2">
                      {selectedDateEvents.applications.map((app) => (
                        <Link
                          key={app.id}
                          to={`/applications/${app.id}`}
                          className="block p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <p className="text-sm font-medium truncate">{app.position}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {app.companyName}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn('text-xs mt-1', statusColors[app.status])}
                          >
                            {statusLabels[app.status]}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucune candidature</p>
                  )}
                </div>

                {/* Reminders */}
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Bell className="h-4 w-4" />
                    Rappels ({selectedDateEvents?.reminders.length || 0})
                  </h4>
                  {selectedDateEvents?.reminders.length ? (
                    <div className="space-y-2">
                      {selectedDateEvents.reminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className={cn(
                            'p-2 rounded-lg',
                            reminder.isCompleted
                              ? 'bg-muted/50 opacity-60'
                              : 'bg-yellow-500/10'
                          )}
                        >
                          <p
                            className={cn(
                              'text-sm font-medium',
                              reminder.isCompleted && 'line-through'
                            )}
                          >
                            {reminder.title}
                          </p>
                          {reminder.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {reminder.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun rappel</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Cliquez sur une date pour voir les événements
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
