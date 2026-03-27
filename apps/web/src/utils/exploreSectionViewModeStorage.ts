/**
 * Modos de vista Explore: `list`, `cartelera` (mosaico), `carousel` (carrusel horizontal tipo Sociales/Clases).
 */

export const EXPLORE_SECTION_VIEW_MODES_KEY = "explore:sectionViewModes";

export type ExploreSectionViewMode = "list" | "cartelera" | "carousel";

export type ExploreListableSectionId = "clases" | "academias" | "maestros" | "usuarios" | "organizadores";

const DEFAULTS: Record<ExploreListableSectionId, ExploreSectionViewMode> = {
  clases: "carousel",
  academias: "cartelera",
  maestros: "cartelera",
  usuarios: "cartelera",
  organizadores: "cartelera",
};

function isListableSectionId(v: string): v is ExploreListableSectionId {
  return v === "clases" || v === "academias" || v === "maestros" || v === "usuarios" || v === "organizadores";
}

function normalizeStoredModeForSection(
  _sectionId: ExploreListableSectionId,
  v: string | undefined
): ExploreSectionViewMode | null {
  if (v === "list" || v === "cartelera" || v === "carousel") return v;
  if (v === "grid") return "carousel";
  return null;
}

export function readExploreSectionViewModes(): Record<ExploreListableSectionId, ExploreSectionViewMode> {
  const base = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(EXPLORE_SECTION_VIEW_MODES_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Record<string, string>;
    for (const [k, v] of Object.entries(parsed)) {
      if (!isListableSectionId(k)) continue;
      const n = normalizeStoredModeForSection(k, v);
      if (n) base[k] = n;
    }
  } catch {
    /* ignore */
  }
  return base;
}

export function writeExploreSectionViewModes(modes: Record<ExploreListableSectionId, ExploreSectionViewMode>): void {
  try {
    localStorage.setItem(EXPLORE_SECTION_VIEW_MODES_KEY, JSON.stringify(modes));
  } catch {
    /* ignore */
  }
}

export function patchExploreSectionViewMode(
  id: ExploreListableSectionId,
  mode: ExploreSectionViewMode,
  prev: Record<ExploreListableSectionId, ExploreSectionViewMode>
): Record<ExploreListableSectionId, ExploreSectionViewMode> {
  const next = { ...prev, [id]: mode };
  writeExploreSectionViewModes(next);
  return next;
}
