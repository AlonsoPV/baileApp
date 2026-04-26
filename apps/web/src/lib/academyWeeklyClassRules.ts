/**
 * Reglas de modalidad semanal en cronograma de academia según plan.
 * Alinear con el trigger en Postgres (`enforce_academy_subscription_cronograma_rules`).
 */

import { canCreateWeeklyClasses, maxWeeklyDaysPerClassForPlan } from './planCapabilities';
import type { SubscriptionPlan } from './subscription';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/** Ítem `tipo: clase` en modalidad semanal (persistido o legado). */
export function isCronogramaClassWeeklyItem(item: unknown): boolean {
  if (!isRecord(item)) return false;
  if (item.tipo !== 'clase') return false;
  if (item.fechaModo === 'semanal') return true;
  if (item.recurrente === 'semanal') return true;
  return false;
}

/** Cantidad de días distintos declarados para una fila semanal (array o día único). */
export function weeklyDayCountForCronogramaItem(item: unknown): number {
  if (!isRecord(item)) return 0;
  const ds = item.diasSemana;
  if (Array.isArray(ds) && ds.length > 0) return ds.length;
  const dia = item.diaSemana;
  if (dia !== null && dia !== undefined && String(dia).trim() !== '') return 1;
  return 0;
}

export type AcademyWeeklyViolation = 'basic_no_weekly' | 'pro_multi_day';

export function weeklyDayCountFromFormInput(c: {
  fechaModo?: 'especifica' | 'semanal' | 'por_agendar';
  diasSemana?: number[] | null;
  diaSemana?: number | null;
}): number {
  if (c.fechaModo !== 'semanal') return 0;
  if (c.diasSemana && c.diasSemana.length > 0) return c.diasSemana.length;
  if (c.diaSemana !== null && c.diaSemana !== undefined) return 1;
  return 0;
}

/** Validación de un alta/edición desde el formulario CrearClase. */
export function academyWeeklyFormViolation(
  plan: SubscriptionPlan,
  fechaModo: 'especifica' | 'semanal' | 'por_agendar' | undefined,
  dayCount: number
): AcademyWeeklyViolation | null {
  if (fechaModo !== 'semanal') return null;
  if (!canCreateWeeklyClasses(plan)) return 'basic_no_weekly';
  const max = maxWeeklyDaysPerClassForPlan(plan);
  if (max === 1 && dayCount > 1) return 'pro_multi_day';
  return null;
}

/** Recorre el cronograma persistido (p. ej. antes de guardar perfil). */
export function academyCronogramaWeeklyViolation(
  plan: SubscriptionPlan,
  cronograma: unknown
): AcademyWeeklyViolation | null {
  if (!Array.isArray(cronograma)) return null;
  for (const it of cronograma) {
    if (!isCronogramaClassWeeklyItem(it)) continue;
    if (!canCreateWeeklyClasses(plan)) return 'basic_no_weekly';
    const n = weeklyDayCountForCronogramaItem(it);
    const max = maxWeeklyDaysPerClassForPlan(plan);
    if (max === 1 && n > 1) return 'pro_multi_day';
  }
  return null;
}

export const ACADEMY_BASIC_NO_WEEKLY_ERROR_MARKER = 'ACADEMY_BASIC_NO_WEEKLY_CLASS';
export const ACADEMY_PRO_WEEKLY_MAX_ONE_DAY_ERROR_MARKER = 'ACADEMY_PRO_WEEKLY_MAX_ONE_DAY';

export function messageForAcademyWeeklyViolation(v: AcademyWeeklyViolation): string {
  if (v === 'basic_no_weekly') {
    return 'La modalidad semanal está disponible en Pro o Premium. Actualiza tu plan para crear clases semanales recurrentes.';
  }
  return 'Tu plan Pro permite solo 1 día semanal por clase.';
}
