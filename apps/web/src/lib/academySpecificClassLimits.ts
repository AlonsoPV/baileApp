/**
 * Límites de clases con fecha específica en el cronograma de academia (JSON en profiles_academy).
 * Debe alinearse con la lógica del trigger en Postgres (misma semántica de conteo).
 */

import {
  canCreateUnlimitedSpecificDateClasses,
  specificDateClassLimitForPlan,
} from './planCapabilities';
import type { SubscriptionPlan } from './subscription';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/**
 * Ítem de cronograma que cuenta como clase de fecha específica para el cupo Basic.
 * - `tipo === 'clase'` y `fechaModo === 'especifica'`
 * - Legado: sin `fechaModo` pero con `fecha` y no recurrente semanal / por_agendar explícito.
 */
export function isCronogramaClassSpecificDateItem(item: unknown): boolean {
  if (!isRecord(item)) return false;
  if (item.tipo !== 'clase') return false;

  const modo = item.fechaModo;
  if (modo === 'especifica') return true;
  if (modo === 'semanal' || modo === 'por_agendar') return false;

  if (modo === undefined || modo === null) {
    if (item.recurrente === 'semanal') return false;
    if (typeof item.fecha === 'string' && item.fecha.trim() !== '') return true;
    return false;
  }

  return false;
}

export function countSpecificDateClassesInCronograma(cronograma: unknown): number {
  if (!Array.isArray(cronograma)) return 0;
  return cronograma.filter((it) => isCronogramaClassSpecificDateItem(it)).length;
}

/**
 * Tras aplicar un alta o edición, ¿superaría el cupo del plan?
 * - `editingClassId`: `id` del ítem en cronograma al editar; omitir en alta.
 * - `nextItemFechaModo`: modalidad resultante del formulario.
 */
export function wouldExceedSpecificDateLimit(params: {
  plan: SubscriptionPlan;
  cronograma: unknown;
  nextItemFechaModo: 'especifica' | 'semanal' | 'por_agendar' | undefined;
  editingClassId?: number | string | null;
}): boolean {
  const { plan, cronograma, nextItemFechaModo, editingClassId } = params;
  if (canCreateUnlimitedSpecificDateClasses(plan)) return false;

  const limit = specificDateClassLimitForPlan(plan);
  if (limit == null) return false;

  const items = Array.isArray(cronograma) ? cronograma : [];
  let count = countSpecificDateClassesInCronograma(items);

  if (editingClassId != null && editingClassId !== '') {
    const prev = items.find(
      (it) => isRecord(it) && (it.id === editingClassId || String(it.id) === String(editingClassId))
    );
    if (prev && isCronogramaClassSpecificDateItem(prev)) {
      count -= 1;
    }
  }

  if (nextItemFechaModo === 'especifica') {
    count += 1;
  }

  return count > limit;
}

/** Mensaje de error alineado con el trigger SQL (frontend puede mapear por includes). */
export const ACADEMY_SPECIFIC_DATE_LIMIT_ERROR_MARKER =
  'ACADEMY_SPECIFIC_DATE_CLASS_LIMIT';

/** Validación del cronograma completo (p. ej. guardado global del perfil). */
export function academyCronogramaExceedsBasicSpecificDateLimit(
  plan: SubscriptionPlan,
  cronograma: unknown
): boolean {
  if (canCreateUnlimitedSpecificDateClasses(plan)) return false;
  const limit = specificDateClassLimitForPlan(plan);
  if (limit == null) return false;
  return countSpecificDateClassesInCronograma(cronograma) > limit;
}
