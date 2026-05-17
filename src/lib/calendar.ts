import { GOOGLE_MAPS_LINK } from './constants';

function toGoogleCalendarDate(date: Date): string {
  if (isNaN(date.getTime())) return '';
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '');
}

interface CalendarItem {
  name: string;
  startDateTime: string;
  endDateTime?: string;
  duration?: number;
}

export function buildGoogleCalendarUrl(item: CalendarItem, isLoggedIn?: boolean): string {
  const startDate = new Date(item.startDateTime);
  if (isNaN(startDate.getTime())) return '';

  const durationMs = (item.duration ?? 60) * 60_000;
  const endMs = item.endDateTime
    ? new Date(item.endDateTime).getTime()
    : startDate.getTime() + durationMs;
  const endDate = new Date(endMs);

  const start = toGoogleCalendarDate(startDate);
  const end = toGoogleCalendarDate(endDate);
  if (!start || !end) return '';

  const details = '';

  const query = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(item.name)}`,
    `dates=${start}/${end}`,
    details ? `details=${encodeURIComponent(details)}` : '',
    `location=${encodeURIComponent(GOOGLE_MAPS_LINK)}`,
    'sf=true',
    'output=xml',
  ]
    .filter(Boolean)
    .join('&');

  return `https://www.google.com/calendar/render?${query}`;
}
