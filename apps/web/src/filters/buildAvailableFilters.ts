export type AvailableFilterOption = {
  id: number;
  name: string;
  count: number;
};

type BuildAvailableFiltersInput = {
  /** Map id -> display name for ritmos */
  ritmoNameById?: Map<number, string>;
  /** Map id -> display name for zonas */
  zonaNameById?: Map<number, string>;
  /** Map slug -> id for ritmos (para campos como ritmos_seleccionados) */
  ritmoIdBySlug?: Map<string, number>;
  /** Map slug -> id for zonas (si aplica) */
  zonaIdBySlug?: Map<string, number>;
};

function toNumberArray(value: unknown): number[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(toNumberArray);
  if (typeof value === 'number' && Number.isFinite(value)) return [value];
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? [n] : [];
  }
  return [];
}

function uniqPositiveInts(ids: number[]): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const raw of ids) {
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    const id = Math.trunc(n);
    if (id <= 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function toStringArray(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(toStringArray);
  if (typeof value === 'string') return [value];
  if (typeof value === 'number' && Number.isFinite(value)) return [String(value)];
  return [];
}

/**
 * Intenta extraer IDs de ritmos de un registro “visible”.
 *
 * NOTA: Esta función asume un shape “best-effort” porque el proyecto mezcla
 * varias entidades (eventos/clases/perfiles) con campos distintos.
 */
export function extractRitmoIds(item: any, input: Pick<BuildAvailableFiltersInput, 'ritmoIdBySlug'> = {}): number[] {
  if (!item) return [];

  const ids: number[] = [];

  // Campos comunes en perfiles
  ids.push(...toNumberArray(item.ritmos));
  ids.push(...toNumberArray(item.estilos));

  // Shapes alternos
  ids.push(...toNumberArray(item.ritmoId));
  ids.push(...toNumberArray(item.ritmoIds));

  // Slugs del catálogo (compatibilidad): ritmos_seleccionados / ritmosSeleccionados
  const slugCandidates = [
    ...toStringArray(item.ritmos_seleccionados),
    ...toStringArray(item.ritmosSeleccionados),
  ];
  if (slugCandidates.length > 0 && input.ritmoIdBySlug) {
    for (const raw of slugCandidates) {
      const slug = String(raw).trim().toLowerCase();
      const id = input.ritmoIdBySlug.get(slug);
      if (typeof id === 'number') ids.push(id);
    }
  }

  // Eventos: relación anidada
  if (item.events_parent) {
    ids.push(...extractRitmoIds(item.events_parent, input));
  }

  return uniqPositiveInts(ids);
}

/**
 * Intenta extraer IDs de zonas de un registro “visible”.
 */
export function extractZonaIds(item: any, input: Pick<BuildAvailableFiltersInput, 'zonaIdBySlug'> = {}): number[] {
  if (!item) return [];

  const ids: number[] = [];

  // Campos comunes en perfiles
  ids.push(...toNumberArray(item.zonas));

  // Eventos (events_date): `zona` numérico
  ids.push(...toNumberArray(item.zona));

  // Shapes alternos
  ids.push(...toNumberArray(item.zonaId));
  ids.push(...toNumberArray(item.zona_id));
  ids.push(...toNumberArray(item.zonaIds));
  ids.push(...toNumberArray(item.zona_ids));
  ids.push(...toNumberArray(item.zona_tag_id));

  // Algunos objetos traen ubicacionJson.zona_tag_id
  ids.push(...toNumberArray(item.ubicacionJson?.zona_tag_id));
  ids.push(...toNumberArray(item.ubicacionJson?.zona_id));

  // Ubicaciones (arrays)
  if (Array.isArray(item.ubicaciones)) {
    for (const u of item.ubicaciones) {
      ids.push(...toNumberArray((u as any)?.zona_id));
      ids.push(...toNumberArray((u as any)?.zona_tag_id));
      ids.push(...toNumberArray((u as any)?.zona_ids));
    }
  }

  // Eventos: relación anidada
  if (item.events_parent) {
    ids.push(...extractZonaIds(item.events_parent, input));
  }

  return uniqPositiveInts(ids);
}

function addCounts(map: Map<number, number>, ids: number[]) {
  for (const id of ids) {
    map.set(id, (map.get(id) ?? 0) + 1);
  }
}

function sortByCountDescThenName(a: AvailableFilterOption, b: AvailableFilterOption) {
  if (b.count !== a.count) return b.count - a.count;
  return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
}

export function buildAvailableFilters(
  items: any[],
  input: BuildAvailableFiltersInput = {},
): {
  ritmos: AvailableFilterOption[];
  zonas: AvailableFilterOption[];
  ritmoIdSet: Set<number>;
  zonaIdSet: Set<number>;
  ritmoCountById: Map<number, number>;
  zonaCountById: Map<number, number>;
} {
  const ritmoCountById = new Map<number, number>();
  const zonaCountById = new Map<number, number>();

  for (const item of items || []) {
    addCounts(ritmoCountById, extractRitmoIds(item, { ritmoIdBySlug: input.ritmoIdBySlug }));
    addCounts(zonaCountById, extractZonaIds(item, { zonaIdBySlug: input.zonaIdBySlug }));
  }

  const ritmoIdSet = new Set<number>(ritmoCountById.keys());
  const zonaIdSet = new Set<number>(zonaCountById.keys());

  const ritmos: AvailableFilterOption[] = Array.from(ritmoCountById.entries()).map(([id, count]) => ({
    id,
    count,
    name: input.ritmoNameById?.get(id) || `Ritmo #${id}`,
  }));

  const zonas: AvailableFilterOption[] = Array.from(zonaCountById.entries()).map(([id, count]) => ({
    id,
    count,
    name: input.zonaNameById?.get(id) || `Zona #${id}`,
  }));

  ritmos.sort(sortByCountDescThenName);
  zonas.sort(sortByCountDescThenName);

  return { ritmos, zonas, ritmoIdSet, zonaIdSet, ritmoCountById, zonaCountById };
}

