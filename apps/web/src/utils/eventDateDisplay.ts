import { calculateNextDateWithTime } from "./calculateRecurringDates";
import { getEffectiveEventDate } from "./effectiveEventDate";

const CDMX_TZ = "America/Mexico_City";

/** Día civil YYYY-MM-DD en CDMX para un instante (alineado a eventos en México). */
export function formatYmdInMexicoCity(d: Date): string | null {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: CDMX_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !day) return null;
  return `${y}-${m}-${day}`;
}

/**
 * Convierte `fecha` de events_date (string YYYY-MM-DD, ISO, o Date) a YYYY-MM-DD estable para UI y ordenación.
 * Evita desfaces cuando Supabase/devuelve Date o timestamp con zona.
 */
export function normalizeEventDateYmd(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const m = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    return null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // Fechas-only suelen serializarse como medianoche UTC; el día civil del ISO coincide con getUTC*.
    const y = value.getUTCFullYear();
    const mo = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  const s = String(value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * Fecha+hora local (componentes de calendario del navegador) a partir de YYYY-MM-DD y HH:MM.
 * Evita `new Date("YYYY-MM-DDTHH:mm:ss")` (comportamiento inconsistente entre motores).
 */
export function localDateTimeFromYmdAndHhMm(
  ymd: string | null | undefined,
  hhmm: string | null | undefined
): Date | null {
  const clean = normalizeEventDateYmd(ymd);
  if (!clean) return null;
  const [y, mo, d] = clean.split("-").map((n) => parseInt(n, 10));
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const t = formatEventTimeHHMM(hhmm || undefined) || "00:00";
  const [hhS, mmS] = t.split(":");
  const hh = parseInt(hhS ?? "0", 10);
  const mm = parseInt(mmS ?? "0", 10);
  const out = new Date(y, mo - 1, d, hh, mm, 0, 0);
  return Number.isNaN(out.getTime()) ? null : out;
}

/** HH:MM desde "19:00:00" o "19:00" (alineado a chips de Explore). */
export function formatEventTimeHHMM(h: string | null | undefined): string {
  if (h == null || h === "") return "";
  const parts = String(h).split(":");
  if (parts.length < 2) return String(h).trim();
  const hh = parts[0]!.padStart(2, "0").slice(-2);
  const mm = parts[1]!.padStart(2, "0").slice(-2);
  return `${hh}:${mm}`;
}

/** Devuelve YYYY-MM-DD para mostrar en UI. */
export function resolveEventDateYmd(item: any): string | null {
  // 1) Fuente de verdad compartida en todo Explore/Event cards.
  const fecha = getEffectiveEventDate(item) || item?.evento_fecha || null;
  if (fecha) return String(fecha).split("T")[0] ?? null;

  // 2) Si no hay fecha, y es recurrente legacy:
  // usamos dia_semana + hora_inicio para calcular (solo para display)
  const dia = item?.dia_semana;
  const hora = item?.hora_inicio || "20:00";
  if (typeof dia === "number") {
    const next = calculateNextDateWithTime(dia, hora);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, "0");
    const d = String(next.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

// Alias retrocompatible (usado en varias pantallas).
export const getEventDateYmd = resolveEventDateYmd;

