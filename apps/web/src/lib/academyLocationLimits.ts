/**
 * Límite de ubicaciones/sedes en perfil de academia según plan.
 * Alinear con el trigger `enforce_academy_basic_ubicaciones_limit` en Postgres.
 */

import { maxLocationsForPlan } from './planCapabilities';
import type { SubscriptionPlan } from './subscription';

export function countUbicaciones(ubicaciones: unknown): number {
  if (!Array.isArray(ubicaciones)) return 0;
  return ubicaciones.length;
}

/** Basic con más de `maxLocations` filas (p. ej. datos legacy). */
export function academyUbicacionesExceedsPlanLimit(plan: SubscriptionPlan, ubicaciones: unknown): boolean {
  const max = maxLocationsForPlan(plan);
  if (max == null) return false;
  return countUbicaciones(ubicaciones) > max;
}

export const ACADEMY_BASIC_UBICACIONES_LIMIT_ERROR_MARKER = 'ACADEMY_BASIC_UBICACIONES_LIMIT';

export const COPY_UBICACIONES_UPGRADE =
  'Tu plan Basic permite registrar 1 ubicación. Actualiza a Pro o Premium para agregar ubicaciones ilimitadas.';

export const COPY_UBICACIONES_LEGACY_OVER_LIMIT =
  'Esta academia tiene más ubicaciones de las permitidas en Basic. Para guardar cambios, reduce a 1 ubicación o actualiza el plan.';
