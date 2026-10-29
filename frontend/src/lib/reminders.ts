import type { Reminder } from '@/types';
import type { CalendarExportEvent } from './calendarExport';

const REMINDER_DURATION_MS = 30 * 60 * 1000;

/** Calendar event (Google, Outlook, .ics) for a reminder: 30 minutes from its due time */
export function reminderToCalendarEvent(reminder: Reminder): CalendarExportEvent {
  const start = new Date(reminder.dueDate);
  return {
    title: reminder.title,
    description:
      reminder.description ||
      (reminder.application
        ? `Poste : ${reminder.application.position} chez ${reminder.application.companyName}`
        : undefined),
    startDate: start,
    endDate: new Date(start.getTime() + REMINDER_DURATION_MS),
  };
}

export interface RemindersByDueDate {
  overdue: Reminder[];
  today: Reminder[];
  upcoming: Reminder[];
  completed: Reminder[];
}

/** Split reminders into the sections of the reminders page */
export function groupRemindersByDueDate(reminders: Reminder[], now = new Date()): RemindersByDueDate {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const groups: RemindersByDueDate = { overdue: [], today: [], upcoming: [], completed: [] };

  for (const reminder of reminders) {
    const due = new Date(reminder.dueDate);
    if (reminder.isCompleted) groups.completed.push(reminder);
    else if (due < startOfToday) groups.overdue.push(reminder);
    else if (due <= endOfToday) groups.today.push(reminder);
    else groups.upcoming.push(reminder);
  }
  return groups;
}
