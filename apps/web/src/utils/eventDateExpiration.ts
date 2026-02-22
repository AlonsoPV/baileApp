/**
 * Event date expiration utilities for RSVP filtering.
 * Matches server-side logic: event_end_ts = fecha + hora_fin | hora_inicio | 23:59:59
 * Timezone: America/Mexico_City (app default)
 */

import { startOfDay } from 'date-fns';

const TZ = 'America/Mexico_City';

export interface EventDateLike {
  fecha?: string | null;
  fecha_inicio?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  dia_semana?: number | null;
}

/**
 * Gets the primary date string for an event (fecha or fecha_inicio fallback).
 * Returns null if both are empty/invalid.
 */
export function getEventPrimaryDate(
  eventDate: EventDateLike | null | undefined
): string | null {
  if (!eventDate) return null;
  const raw = (eventDate as any).fecha ?? (eventDate as any).fecha_inicio ?? null;
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  return raw.trim();
}

/**
 * Returns true if the event date is today or in the future (day-based comparison).
 * Used for "Eventos de interés" to show only upcoming/today events, not past.
 * - Events with invalid/null date are excluded (returns false).
 * - Compares by start of day (local) to avoid timezone/hour issues.
 */
export function isEventUpcomingOrToday(
  eventDate: EventDateLike | null | undefined,
  options?: IsEventDateExpiredOptions
): boolean {
  const dateStr = getEventPrimaryDate(eventDate);
  if (!dateStr) return false;
  try {
    const dateOnly = String(dateStr).split('T')[0];
    const [y, m, d] = dateOnly.split('-').map((n: string) => parseInt(n, 10));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
    const eventDateObj = new Date(y, m - 1, d);
    if (Number.isNaN(eventDateObj.getTime())) return false;
    const eventDayStart = startOfDay(eventDateObj);
    const today = options?.nowOverride ?? new Date();
    const todayStart = startOfDay(today);
    return eventDayStart >= todayStart;
  } catch {
    return false;
  }
}

/**
 * Compute event end timestamp (America/Mexico_City).
 * - If hora_fin exists: fecha + hora_fin
 * - Else if hora_inicio exists: fecha + hora_inicio
 * - Else: fecha 23:59:59
 */
function getEventEndTimestamp(evento: EventDateLike): Date | null {
  const raw = (evento as any).fecha;
  if (!raw) return null;
  try {
    const base = String(raw).split('T')[0];
    const [y, m, d] = base.split('-').map((n: string) => parseInt(n, 10));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    const horaFin = (evento as any).hora_fin;
    const horaInicio = (evento as any).hora_inicio;
    let timeStr = '23:59:59';
    if (horaFin && typeof horaFin === 'string' && horaFin.length >= 5) {
      timeStr = horaFin.length >= 8 ? horaFin.slice(0, 8) : `${horaFin.slice(0, 5)}:00`;
    } else if (horaInicio && typeof horaInicio === 'string' && horaInicio.length >= 5) {
      timeStr = horaInicio.length >= 8 ? horaInicio.slice(0, 8) : `${horaInicio.slice(0, 5)}:00`;
    }
    const dt = new Date(`${base}T${timeStr}`);
    if (Number.isNaN(dt.getTime())) return null;
    return dt;
  } catch {
    return null;
  }
}

/**
 * Get "now" in Mexico City for comparison.
 * Uses same date/time interpretation as server.
 * For testing, pass options.nowOverride.
 */
function getNowInMexicoCity(nowOverride?: Date): Date {
  if (nowOverride) return nowOverride;
  const str = new Date().toLocaleString('en-CA', { timeZone: TZ });
  return new Date(str);
}

export type IsEventDateExpiredOptions = { nowOverride?: Date };

/**
 * Returns true if the event has ended (event_end_ts < now).
 * Events without fecha are considered NOT expired (e.g. dia_semana recurring).
 * Use nowOverride for deterministic tests.
 */
export function isEventDateExpired(
  evento: EventDateLike | null | undefined,
  options?: IsEventDateExpiredOptions
): boolean {
  if (!evento) return true;
  const raw = (evento as any).fecha;
  if (!raw) return false;
  const endTs = getEventEndTimestamp(evento);
  if (!endTs) return false;
  const now = getNowInMexicoCity(options?.nowOverride);
  return endTs < now;
}

/**
 * Returns true if the event is still upcoming (not expired).
 * Alias for !isEventDateExpired for clarity in "Eventos de interés" lists.
 */
export function isEventDateUpcoming(
  evento: EventDateLike | null | undefined,
  options?: IsEventDateExpiredOptions
): boolean {
  return !isEventDateExpired(evento, options);
}
