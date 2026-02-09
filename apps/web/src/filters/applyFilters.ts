import { extractRitmoIds, extractZonaIds } from './buildAvailableFilters';

export type ApplyFiltersInput = {
  selectedRitmos?: number[];
  selectedZonas?: number[];
};

/**
 * Aplica filtrado en memoria (best-effort) usando los extractores de IDs.
 *
 * NOTA: En este proyecto, el filtrado “real” suele ocurrir en el backend vía `useExploreQuery`.
 * Este helper existe para casos donde el dataset ya está en memoria (p. ej. colecciones derivadas)
 * y para mantener una lógica consistente.
 */
export function applyFilters<T>(items: T[], input: ApplyFiltersInput): T[] {
  const selectedRitmos = (input.selectedRitmos || []).filter((n) => Number.isFinite(n) && n > 0).map((n) => Math.trunc(n));
  const selectedZonas = (input.selectedZonas || []).filter((n) => Number.isFinite(n) && n > 0).map((n) => Math.trunc(n));

  const hasR = selectedRitmos.length > 0;
  const hasZ = selectedZonas.length > 0;
  if (!hasR && !hasZ) return items;

  const rSet = hasR ? new Set(selectedRitmos) : null;
  const zSet = hasZ ? new Set(selectedZonas) : null;

  return (items || []).filter((item: any) => {
    if (hasR) {
      const ids = extractRitmoIds(item);
      const ok = ids.some((id) => rSet!.has(id));
      if (!ok) return false;
    }
    if (hasZ) {
      const ids = extractZonaIds(item);
      const ok = ids.some((id) => zSet!.has(id));
      if (!ok) return false;
    }
    return true;
  });
}

