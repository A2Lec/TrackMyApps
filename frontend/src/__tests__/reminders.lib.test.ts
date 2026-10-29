import { describe, it, expect } from 'vitest';
import { groupRemindersByDueDate, reminderToCalendarEvent } from '@/lib/reminders';
import type { Reminder } from '@/types';

const reminder = (id: string, dueDate: string, isCompleted = false): Reminder =>
  ({ id, title: id, type: 'FOLLOW_UP', dueDate, isCompleted }) as Reminder;

describe('lib/reminders', () => {
  const now = new Date(2026, 9, 15, 14, 0);

  it('splits reminders into overdue, today, upcoming and completed', () => {
    const groups = groupRemindersByDueDate(
      [
        reminder('late', new Date(2026, 9, 14, 18, 0).toISOString()),
        reminder('morning', new Date(2026, 9, 15, 8, 0).toISOString()),
        reminder('tonight', new Date(2026, 9, 15, 23, 30).toISOString()),
        reminder('tomorrow', new Date(2026, 9, 16, 9, 0).toISOString()),
        reminder('done', new Date(2026, 9, 1).toISOString(), true),
      ],
      now
    );

    expect(groups.overdue.map((r) => r.id)).toEqual(['late']);
    // Earlier today is still "today", not overdue
    expect(groups.today.map((r) => r.id)).toEqual(['morning', 'tonight']);
    expect(groups.upcoming.map((r) => r.id)).toEqual(['tomorrow']);
    expect(groups.completed.map((r) => r.id)).toEqual(['done']);
  });

  it('builds a 30-minute calendar event described by its application', () => {
    const event = reminderToCalendarEvent({
      ...reminder('r1', '2026-10-15T09:00:00.000Z'),
      application: { id: 'a1', companyName: 'Doctolib', position: 'Développeur' },
    } as Reminder);

    expect(event.description).toBe('Poste : Développeur chez Doctolib');
    expect(new Date(event.endDate!).getTime() - new Date(event.startDate).getTime()).toBe(30 * 60 * 1000);
  });
});
