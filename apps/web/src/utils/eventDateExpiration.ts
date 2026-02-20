/**
 * Event date expiration utilities for RSVP filtering.
 * Matches server-side logic: event_end_ts = fecha + hora_fin | hora_inicio | 23:59:59
 * Timezone: America/Mexico_City (app default)
 */

const TZ = 'America/Mexico_City';

export interface EventDateLike {
  fecha?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  dia_semana?: number | null;
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
