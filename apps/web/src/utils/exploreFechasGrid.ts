/** Utilidades para la vista cuadrícula (2 filas) de sociales en Explore. */

export function getEventCreatedTs(e: any): number {
  const raw =
    e?.created_at ??
    e?.events_parent?.created_at ??
    e?.updated_at ??
    e?.events_parent?.updated_at;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Orden “recién cargados”: más reciente primero (created_at / updated_at). */
export function sortFechasByRecentFirst(events: any[]): any[] {
  return [...events].sort((a, b) => getEventCreatedTs(b) - getEventCreatedTs(a));
}
