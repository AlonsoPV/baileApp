/**
 * Agrupa ritmos y zonas usados en la app en estructura jerárquica padre → hijos
 * para dropdowns con multi-selección en Explore.
 */
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import type { ZonaGroupInfo } from "@/hooks/useZonaCatalogGroups";

export type TreeGroup = {
  id: string;
  label: string;
  children: Array<{ id: number; label: string }>;
};

type RitmoTag = { id: number; nombre: string; slug?: string };

const normalizeLabel = (s: string) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

/**
 * Agrupa ritmos (tags) según RITMOS_CATALOG.
 * Solo incluye ritmos que coinciden con algún ítem del catálogo (por label o slug).
 * Los que no coinciden van a grupo "Otros".
 */
export function groupRitmos(usedRitmos: RitmoTag[]): TreeGroup[] {
  if (!usedRitmos?.length) return [];

  const byParent = new Map<string, Array<{ id: number; label: string }>>();
  const catalogLabelToSlug = new Map<string, string>();
  for (const g of RITMOS_CATALOG) {
    for (const item of g.items) {
      catalogLabelToSlug.set(normalizeLabel(item.label), item.id);
    }
  }

  const parentBySlug = new Map<string, string>();
  for (const g of RITMOS_CATALOG) {
    for (const item of g.items) {
      parentBySlug.set(item.id, g.id);
    }
  }

  const others: Array<{ id: number; label: string }> = [];

  for (const tag of usedRitmos) {
    const label = String(tag.nombre ?? "").trim();
    const labelNorm = normalizeLabel(label);
    const slug = tag.slug?.trim().toLowerCase();
    let parentId: string | null = null;

    const slugFromCatalog = catalogLabelToSlug.get(labelNorm);
    if (slugFromCatalog) {
      parentId = parentBySlug.get(slugFromCatalog) ?? null;
    }
    if (!parentId && slug) {
      parentId = parentBySlug.get(slug) ?? null;
    }
    const child = { id: tag.id, label: label || `Ritmo #${tag.id}` };
    if (parentId) {
      const list = byParent.get(parentId) ?? [];
      if (!list.some((c) => c.id === tag.id)) list.push(child);
      byParent.set(parentId, list);
    } else {
      others.push(child);
    }
  }

  const result: TreeGroup[] = [];
  for (const g of RITMOS_CATALOG) {
    const children = byParent.get(g.id);
    if (children?.length) {
      result.push({ id: g.id, label: g.label, children });
    }
  }
  if (others.length) {
    result.push({ id: "otros", label: "Otros", children: others });
  }
  return result;
}

/**
 * Convierte grupos de useZonaCatalogGroups al formato TreeGroup.
 */
export function zonaGroupsToTreeGroups(groups: ZonaGroupInfo[]): TreeGroup[] {
  return groups.map((g) => ({
    id: g.id,
    label: g.label,
    children: g.items.map((it) => ({ id: it.id, label: it.label })),
  }));
}
