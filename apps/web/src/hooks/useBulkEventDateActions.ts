/**
 * Acciones masivas sobre `events_date` (EventDatesSheet / OrganizerProfileEditor).
 *
 * ---------------------------------------------------------------------------
 * RECURRENCIA — riesgos y comportamiento esperado (edición masiva)
 * ---------------------------------------------------------------------------
 *
 * **Recurrente (`dia_semana` numérico 0–6 + lógica semanal):**
 * - Cambiar `hora_inicio` / `hora_fin` en batch es coherente: las ocurrencias siguen el mismo día de semana.
 * - Cambiar `fecha` masivamente en filas que aún tienen `dia_semana` puede dejar el modelo incoherente
 *   (fecha fija vs patrón semanal). En EventDatesSheet, al fijar una nueva fecha en batch se envía
 *   `dia_semana: null` igual que en edición por fila, para convertir a evento puntual en esas filas.
 * - Antes de tocar fechas en lote, conviene advertir cuántas filas son recurrentes.
 *
 * **Quitar recurrencia:**
 * - Es una acción sensible: hoy está implementada en `EventDatesSheet.removeRecurrenceFromSelected`
 *   (próxima ocurrencia → `fecha` fija, `dia_semana: null`). No duplicar otra semántica en batch
 *   sin revisar `ensure_weekly_occurrences` y padres (`parent_id`).
 *
 * **Frecuente (planificador / `onStartFrecuentes`):**
 * - No es un campo único de `events_date`: la UX actual usa **una** fecha como plantilla y navega al
 *   modo frecuentes. La edición masiva de “ser frecuente” no debe inventarse como update SQL hasta que
 *   producto defina el modelo; mantener como acción de navegación (1 fecha seleccionada).
 *
 * ---------------------------------------------------------------------------
 * Helpers: validación de horario y construcción de parches seguros.
 * ---------------------------------------------------------------------------
 */

/** Minutos desde medianoche para "HH:mm" o "HH:mm:ss"; null si inválido/vacío. */
export function parseHHmmToMinutes(value?: string | null): number | null {
  if (value == null || String(value).trim() === "") return null;
  const s = String(value).trim();
  const m = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(s);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  return h * 60 + min;
}

/**
 * Devuelve mensaje de error si hora_fin debe ser estrictamente posterior a hora_inicio;
 * si falta una de las dos, no valida el par (permite actualizar solo inicio o solo fin).
 */
export function validateHoraOrder(hora_inicio?: string | null, hora_fin?: string | null): string | null {
  const a = parseHHmmToMinutes(hora_inicio ?? undefined);
  const b = parseHHmmToMinutes(hora_fin ?? undefined);
  if (a === null || b === null) return null;
  if (b <= a) return "La hora de fin debe ser posterior a la de inicio.";
  return null;
}

/** Solo incluye campos con texto: evita borrar masivamente por campos vacíos en el formulario batch. Las zonas (`zonas: number[]`) se añaden aparte en EventDatesSheet cuando el usuario usa ZonaGroupedChips. */
export function buildLocationBulkPatchFromFilled(parts: {
  lugar: string;
  direccion: string;
  ciudad: string;
  referencias: string;
}): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (parts.lugar.trim()) patch.lugar = parts.lugar.trim();
  if (parts.direccion.trim()) patch.direccion = parts.direccion.trim();
  if (parts.ciudad.trim()) patch.ciudad = parts.ciudad.trim();
  if (parts.referencias.trim()) patch.referencias = parts.referencias.trim();
  return patch;
}

export function isWeeklyRecurrentRow(row: { dia_semana?: unknown }): boolean {
  const d = row?.dia_semana;
  return typeof d === "number" && d >= 0 && d <= 6;
}
