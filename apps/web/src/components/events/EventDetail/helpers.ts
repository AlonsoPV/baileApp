import { getLocaleFromI18n } from "../../../utils/locale";

/**
 * Formatea una fecha ISO a "Vie, 27 feb"
 */
export function formatHeaderDate(fechaISO: string): string {
  if (!fechaISO) return "";
  const safeDate = (() => {
    const plain = String(fechaISO).split("T")[0];
    const [year, month, day] = plain.split("-").map((part) => parseInt(part, 10));
    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    }
    const parsed = new Date(fechaISO);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  })();

  const locale = getLocaleFromI18n();
  return safeDate.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Mexico_City",
  });
}

/**
 * Formatea una hora a "22:00"
 */
export function formatHeaderTime(hora: string): string {
  if (!hora) return "";
  const segments = hora.split(":");
  const hours = segments[0] ?? "00";
  const minutes = segments[1] ?? "00";
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

/**
 * Formatea rango horario: "22:00 - 04:00" si hay hora_fin, sino "22:00"
 */
export function formatHeaderTimeRange(
  horaInicio: string | null | undefined,
  horaFin: string | null | undefined
): string {
  if (!horaInicio) return "";
  const start = formatHeaderTime(horaInicio);
  if (horaFin) {
    return `${start} - ${formatHeaderTime(horaFin)}`;
  }
  return start;
}
