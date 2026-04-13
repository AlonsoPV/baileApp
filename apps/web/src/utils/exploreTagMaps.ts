import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";

export type ExploreTagMaps = {
  zonaById: Map<number, string>;
  ritmoById: Map<number, string>;
};

const ritmoCatalogLabelById = new Map<string, string>();
RITMOS_CATALOG.forEach((group) => {
  group.items.forEach((item) => {
    ritmoCatalogLabelById.set(item.id, item.label);
  });
});

export function buildExploreTagMaps(allTags?: any[] | null): ExploreTagMaps {
  const zonaById = new Map<number, string>();
  const ritmoById = new Map<number, string>();

  if (!Array.isArray(allTags)) {
    return { zonaById, ritmoById };
  }

  for (const tag of allTags) {
    if (!tag || typeof tag.id !== "number") continue;
    if (tag.tipo === "zona") zonaById.set(tag.id, String(tag.nombre || ""));
    if (tag.tipo === "ritmo") ritmoById.set(tag.id, String(tag.nombre || ""));
  }

  return { zonaById, ritmoById };
}

export function zonaNamesFromMap(
  zonas: Array<number | string> | undefined | null,
  zonaById: Map<number, string>,
): string[] {
  if (!Array.isArray(zonas) || zonas.length === 0) return [];

  return zonas
    .map((rawId) => {
      const id = Number(rawId);
      return Number.isFinite(id) ? zonaById.get(id) : undefined;
    })
    .filter((value): value is string => Boolean(value));
}

export function ritmoLabelsFromMap(item: any, ritmoById: Map<number, string>): string[] {
  try {
    const catalogIds = (item?.ritmosSeleccionados || item?.ritmos_seleccionados || []) as string[];
    if (Array.isArray(catalogIds) && catalogIds.length > 0) {
      return catalogIds
        .map((id) => ritmoCatalogLabelById.get(String(id)))
        .filter((value): value is string => Boolean(value));
    }

    const ritmoIds = (item?.ritmos || []) as Array<number | string>;
    if (Array.isArray(ritmoIds) && ritmoIds.length > 0) {
      return ritmoIds
        .map((rawId) => {
          const id = Number(rawId);
          return Number.isFinite(id) ? ritmoById.get(id) : undefined;
        })
        .filter((value): value is string => Boolean(value));
    }
  } catch {
    /* ignore */
  }

  return [];
}
