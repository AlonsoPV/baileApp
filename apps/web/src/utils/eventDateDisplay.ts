import { calculateNextDateWithTime } from "./calculateRecurringDates";

/** Devuelve YYYY-MM-DD para mostrar en UI. */
export function resolveEventDateYmd(item: any): string | null {
  // 1) Fuente de verdad: fecha real en row de events_date
  const fecha = item?.fecha || item?.evento_fecha || item?.fecha_inicio;
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

