/**
 * Utility for exporting reminders and interviews to iCal (.ics), Google Calendar, and Outlook.
 */

export interface CalendarExportEvent {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date | string;
  endDate?: Date | string;
  allDay?: boolean;
}

/**
 * Format a Date to UTC string for iCalendar (YYYYMMDDTHHMMSSZ)
 */
function formatIcsDate(dateInput: Date | string): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Clean text for iCalendar escaping commas, semicolons, and newlines
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate standard RFC 5545 iCalendar content string (.ics)
 */
export function generateIcsContent(events: CalendarExportEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TrackMyApps//Job Application Tracker//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((ev, index) => {
    const start = new Date(ev.startDate);
    if (isNaN(start.getTime())) return;

    // Default duration: 45 minutes for interviews / reminders if not specified
    const end = ev.endDate ? new Date(ev.endDate) : new Date(start.getTime() + 45 * 60 * 1000);
    const uid = ev.id || `trackmyapps-${Date.now()}-${index}@trackmyapps.fr`;
    const now = formatIcsDate(new Date());

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${formatIcsDate(start)}`);
    lines.push(`DTEND:${formatIcsDate(end)}`);
    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);

    if (ev.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    }

    if (ev.location) {
      lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    }

    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger file download of .ics content in the browser
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar Web Add URL
 */
export function getGoogleCalendarUrl(event: CalendarExportEvent): string {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 45 * 60 * 1000);

  const datesParam = `${formatIcsDate(start)}/${formatIcsDate(end)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: datesParam,
  });

  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar Web Add URL
 */
export function getOutlookCalendarUrl(event: CalendarExportEvent): string {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 45 * 60 * 1000);

  const params = new URLSearchParams({
    subject: event.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });

  if (event.description) params.set('body', event.description);
  if (event.location) params.set('location', event.location);

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
