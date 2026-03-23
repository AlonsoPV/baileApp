/** Persistencia del modo de vista de sociales en Explore (carousel vs lista). */
export const FECHAS_VIEW_MODE_STORAGE_KEY = "explore:fechasViewMode";

export type FechasViewMode = "carousel" | "list";

export function readFechasViewMode(): FechasViewMode | null {
  try {
    const v = localStorage.getItem(FECHAS_VIEW_MODE_STORAGE_KEY);
    if (v === "list" || v === "carousel") return v;
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
