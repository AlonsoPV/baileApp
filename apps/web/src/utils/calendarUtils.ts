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
 * Valida y normaliza una fecha
 */
function normalizeDate(date: string | Date): Date {
  if (!date) {
    throw new Error('Date is required');
  }
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
  
  return d;
}

/**
 * Formatea una fecha para ICS/Google Calendar
 */
function formatDateForCalendar(date: string | Date): string {
  const d = normalizeDate(date);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Construye un archivo ICS para descarga
 */
export function buildICS(event: CalendarEvent): string {
  try {
    const start = formatDateForCalendar(event.start);
    const end = formatDateForCalendar(event.end);
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
  } catch (error) {
    console.error('[buildICS] Error building ICS file:', error);
    throw error;
  }
}

/**
 * Construye URL para Google Calendar
 */
export function buildGoogleUrl(event: CalendarEvent): string {
  try {
    const start = formatDateForCalendar(event.start);
    const end = formatDateForCalendar(event.end);
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description || '',
      location: event.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (error) {
    console.error('[buildGoogleUrl] Error building Google Calendar URL:', error);
    throw error;
  }
}

/**
 * Construye URL para Yahoo Calendar
 */
export function buildYahooUrl(event: CalendarEvent): string {
  try {
    const formatYahooDate = (date: string | Date): string => {
      const d = normalizeDate(date);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const hour = String(d.getUTCHours()).padStart(2, '0');
      const minute = String(d.getUTCMinutes()).padStart(2, '0');
      return `${year}${month}${day}T${hour}${minute}00`;
    };

    const startDate = normalizeDate(event.start);
    const endDate = normalizeDate(event.end);
    const st = formatYahooDate(startDate);
    const diff = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const dur = `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;

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
  } catch (error) {
    console.error('[buildYahooUrl] Error building Yahoo Calendar URL:', error);
    throw error;
  }
}

