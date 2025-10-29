/**
 * Utilidades para generar URLs y archivos de calendario
 */

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
}

/**
 * Construye un archivo ICS para descarga
 */
export function buildICS(event: CalendarEvent): string {
  const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const start = formatDate(event.start);
  const end = formatDate(event.end);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const description = (event.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,');
  const location = (event.location || '').replace(/,/g, '\\,');
  
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BaileApp//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
    description ? `DESCRIPTION:${description}` : '',
    location ? `LOCATION:${location}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

/**
 * Construye URL para Google Calendar
 */
export function buildGoogleUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const start = formatGoogleDate(event.start);
  const end = formatGoogleDate(event.end);
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description || '',
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Construye URL para Yahoo Calendar
 */
export function buildYahooUrl(event: CalendarEvent): string {
  const formatYahooDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hour = String(d.getUTCHours()).padStart(2, '0');
    const minute = String(d.getUTCMinutes()).padStart(2, '0');
    return `${year}${month}${day}T${hour}${minute}00`;
  };

  const st = formatYahooDate(event.start);
  const dur = (() => {
    const start = typeof event.start === 'string' ? new Date(event.start) : event.start;
    const end = typeof event.end === 'string' ? new Date(event.end) : event.end;
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
  })();

  const params = new URLSearchParams({
    v: '60',
    view: 'd',
    type: '20',
    title: event.title,
    st: st,
    dur: dur,
    desc: event.description || '',
    in_loc: event.location || '',
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

