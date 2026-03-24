/** Persistencia del modo de vista de sociales en Explore (carrusel / lista / cartelera). */
export const FECHAS_VIEW_MODE_STORAGE_KEY = "explore:fechasViewMode";

export type FechasViewMode = "carousel" | "list" | "cartelera";

export function readFechasViewMode(): FechasViewMode | null {
  try {
    const v = localStorage.getItem(FECHAS_VIEW_MODE_STORAGE_KEY);
    if (v === "list" || v === "carousel" || v === "cartelera") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeFechasViewMode(mode: FechasViewMode): void {
  try {
    localStorage.setItem(FECHAS_VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
