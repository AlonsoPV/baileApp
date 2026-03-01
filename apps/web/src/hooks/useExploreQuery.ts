import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ExploreFilters, ExploreType } from "../state/exploreFilters";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { SELECT_EVENTS_CARD } from "@/lib/eventSelects";
import { calculateNextDateWithTime } from "../utils/calculateRecurringDates";
import { perfLog } from "../utils/perfLog";

const PAGE_LIMIT = 12;

type QueryParams = ExploreFilters;

function normalizeSearch(raw?: string) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  // PostgREST logic tree uses commas as separators; escape to avoid broken `.or(...)`.
  // Also escape backslashes so the comma escape survives URL encoding/decoding.
  const esc = s.replace(/\\/g, "\\\\").replace(/,/g, "\\,");
  return {
    raw: s,
    lower: s.toLowerCase(),
    pattern: `%${esc}%`,
  };
}

/** Normaliza hora a "HHMM" para orden estable (acepta "20:00", "20:00:00", "2000") */
function toSortableHora(h?: string | null): string {
  if (!h) return "9999";
  const s = String(h).trim();
  if (s.includes(":")) {
    const [hh = "00", mm = "00"] = s.split(":");
    return hh.padStart(2, "0").slice(-2) + mm.padStart(2, "0").slice(0, 2);
  }
  if (s.length === 4) return s;
  return "9999";
}

function uniqueNumbers(values: any[]): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const v of values) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n) || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function includesLower(haystack: any, needleLower: string) {
  if (!needleLower) return true;
  if (haystack === null || haystack === undefined) return false;
  return String(haystack).toLowerCase().includes(needleLower);
}

function matchesFechaSearch(row: any, needleLower: string, organizerIdSet?: Set<number> | null) {
  if (!needleLower) return true;

  const organizerId = row?.events_parent?.organizer_id;
  const organizerIdNum = typeof organizerId === "number" ? organizerId : Number(organizerId);
  const organizerMatch =
    !!organizerIdSet &&
    Number.isFinite(organizerIdNum) &&
    organizerIdSet.has(organizerIdNum);

  return (
    includesLower(row?.nombre, needleLower) ||
    includesLower(row?.lugar, needleLower) ||
    includesLower(row?.ciudad, needleLower) ||
    includesLower(row?.direccion, needleLower) ||
    includesLower(row?.events_parent?.nombre, needleLower) ||
    organizerMatch
  );
}

/**
 * Obtiene la fecha de hoy en zona horaria de CDMX (America/Mexico_City)
 * Retorna en formato YYYY-MM-DD
 */
function getTodayCDMX(): string {
  // Usar Intl.DateTimeFormat para obtener la fecha en zona horaria de CDMX
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // Formato retorna YYYY-MM-DD
  return formatter.format(new Date());
}

/**
 * Obtiene la fecha y hora actuales en CDMX como Date normalizada a UTC
 * Esto permite comparar contra fechas de eventos construidas también en CDMX.
 */
function getNowCDMX(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const y = Number(parts.find(p => p.type === 'year')?.value || '0');
  const m = Number(parts.find(p => p.type === 'month')?.value || '1');
  const d = Number(parts.find(p => p.type === 'day')?.value || '1');
  const h = Number(parts.find(p => p.type === 'hour')?.value || '0');
  const min = Number(parts.find(p => p.type === 'minute')?.value || '0');
  return new Date(Date.UTC(y, m - 1, d, h, min, 0));
}

/**
 * Determina qué tabla o vista usar para cada tipo de exploración
 * Para eventos y organizadores, usamos las vistas LIVE que solo muestran contenido aprobado/publicado
 */
function baseSelect(type: ExploreType) {
  switch (type) {
    case "fechas":
      // Select mínimo para cards (payload < 10KB). Ver eventSelects.ts
      return { table: "events_date", select: SELECT_EVENTS_CARD };
    case "organizadores":  
      // Usar vista pública que solo muestra organizadores aprobados
      return { table: "v_organizers_public", select: "*" };
    case "maestros":       
      return { table: "profiles_teacher", select: "*" };   // si aún no existe, dejar preparado
    case "academias":      
      return { table: "profiles_academy", select: "*" };    // usar profiles_academy
    case "marcas":         
      return { table: "profiles_brand", select: "*" };     // idem
    case "sociales":
      // Eventos padre (sociales) — simplificado para asegurar retorno de filas
      return { table: "events_parent", select: `*` };
    case "usuarios":       
      // Usar vista pública que ya filtra por onboarding_complete
      return { table: "v_user_public", select: "*" };
    default:               
      return { table: "events_date", select: "*" };
  }
}

/** Exportado para runPerfScenarios (dev). NO usar en producción. */
export async function fetchExplorePage(params: QueryParams, page: number) {
  const fetchStart = performance.now();
  const { type, q, ritmos, zonas, dateFrom, dateTo } = params;
  const { table, select } = baseSelect(type);
  const search = normalizeSearch(q);

  // Construir query
  let query = supabase.from(table).select(select, { count: "exact" });

  // Paralelizar: tags_mapping + búsquedas por texto (cuando aplica)
  let selectedCatalogIds: string[] = [];
  let searchParentRows: any[] = [];
  let searchOrgRows: any[] = [];

  const parallelPromises: Promise<void>[] = [];

  if (ritmos && ritmos.length > 0) {
    parallelPromises.push(
      (async () => {
        try {
          const tagsStart = performance.now();
          const { data: tagRows, error: tagErr } = await supabase
            .from('tags')
            .select('id,nombre,tipo')
            .in('id', ritmos as any)
            .eq('tipo', 'ritmo');
          const tagsEnd = performance.now();
          perfLog({ hook: 'useExploreQuery', step: 'tags_mapping', duration_ms: tagsEnd - tagsStart, rows: tagRows?.length ?? 0, data: tagRows, error: tagErr });
          if (!tagErr && tagRows && tagRows.length > 0) {
            const labelToId = new Map<string, string>();
            RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelToId.set(i.label, i.id)));
            selectedCatalogIds.push(...(tagRows as any[]).map(r => labelToId.get(r.nombre)).filter(Boolean) as string[]);
          }
        } catch (e) {
          console.warn('[useExploreQuery] Catalog mapping failed, continuing with numeric only', e);
        }
      })()
    );
  }

  if (type === "fechas" && search) {
    parallelPromises.push(
      (async () => {
        try {
          const epStart = performance.now();
          const { data: parentRows } = await supabase
            .from("events_parent")
            .select("id")
            .or([`nombre.ilike.${search.pattern}`].join(","))
            .limit(250);
          const epEnd = performance.now();
          if (import.meta.env?.DEV) {
            console.log("[PERF_SQL] search_events_parent:", { pattern: search.pattern });
          }
          perfLog({ hook: 'useExploreQuery', step: 'search_events_parent', duration_ms: epEnd - epStart, rows: parentRows?.length ?? 0, data: parentRows });
          searchParentRows.push(...(parentRows || []));
        } catch (e) {
          console.warn("[useExploreQuery] events_parent text search failed (non-fatal):", e);
        }
      })()
    );
    parallelPromises.push(
      (async () => {
        try {
          const orgStart = performance.now();
          const { data: orgRows } = await supabase
            .from("v_organizers_public")
            .select("id")
            .or([`nombre_publico.ilike.${search.pattern}`].join(","))
            .limit(250);
          const orgEnd = performance.now();
          if (import.meta.env?.DEV) {
            console.log("[PERF_SQL] search_v_organizers_public:", { pattern: search.pattern });
          }
          perfLog({ hook: 'useExploreQuery', step: 'search_v_organizers_public', duration_ms: orgEnd - orgStart, rows: orgRows?.length ?? 0, data: orgRows });
          searchOrgRows.push(...(orgRows || []));
        } catch (e) {
          console.warn("[useExploreQuery] organizer search failed (non-fatal):", e);
        }
      })()
    );
  }

  await Promise.all(parallelPromises);

  // Filtros por tipo
  if (type === "fechas") {
    // Obtener fecha de hoy en zona horaria CDMX
    const todayCDMX = getTodayCDMX();
    
    // Mostrar solo fechas publicadas
    query = query.eq("estado_publicacion", "publicado");
    
    // Filtrar por organizadores aprobados (removido por ahora - el !inner falla si no hay relación)
    // query = query.eq("events_parent.profiles_organizer.estado_aprobacion", "aprobado");
    
    // Para eventos con dia_semana, el filtrado se hará post-query (necesitamos calcular la próxima fecha)
    // Para eventos sin dia_semana, filtrar por fecha normalmente
    // Estrategia: Incluir eventos recurrentes siempre, filtrar eventos con fecha específica por rango
    if (dateFrom && dateTo) {
      // Si hay rango de fechas: incluir eventos recurrentes O eventos con fecha en el rango
      // Para eventos sin dia_semana: necesitamos fecha >= dateFrom AND fecha <= dateTo
      // En Supabase, múltiples .or() se combinan con AND, así que:
      // (dia_semana.not.is.null OR fecha.gte.dateFrom) AND (dia_semana.not.is.null OR fecha.lte.dateTo)
      // Para eventos sin dia_semana: fecha.gte.dateFrom AND fecha.lte.dateTo ✅
      query = query.or(`dia_semana.not.is.null,fecha.gte.${dateFrom}`);
      query = query.or(`dia_semana.not.is.null,fecha.lte.${dateTo}`);
    } else if (dateFrom) {
      // Solo dateFrom: eventos con dia_semana O eventos con fecha >= dateFrom
      query = query.or(`dia_semana.not.is.null,fecha.gte.${dateFrom}`);
    } else if (dateTo) {
      // Solo dateTo: eventos con dia_semana O eventos con fecha <= dateTo
      query = query.or(`dia_semana.not.is.null,fecha.lte.${dateTo}`);
    } else {
      // Para "todos", mostrar solo eventos futuros (>= hoy en CDMX) O eventos con dia_semana
      query = query.or(`dia_semana.not.is.null,fecha.gte.${todayCDMX}`);
    }
    
    // Ritmos: preferimos filtrar por IDs numéricos (`estilos int[]`).
    // Si el esquema/registro usa slugs (`ritmos_seleccionados text[]`) y no hay IDs, usamos overlaps ahí.
    if ((ritmos?.length || 0) > 0) {
      query = query.overlaps("estilos", ritmos as any);
    } else if ((selectedCatalogIds?.length || 0) > 0) {
      query = query.overlaps("ritmos_seleccionados", selectedCatalogIds as any);
    }

    // zonas específicas de la fecha (campo zona numérico)
    if (zonas?.length)   query = query.in("zona", zonas as any);
    
    // Búsqueda textual (solo si hay texto). Importante: usar %...% y escapar comas.
    if (search) {
      query = query.or([
        `nombre.ilike.${search.pattern}`,
        `lugar.ilike.${search.pattern}`,
        `ciudad.ilike.${search.pattern}`,
        `direccion.ilike.${search.pattern}`,
      ].join(","));
    }
    
    // orden por fecha asc, luego hora_inicio, desempate por id (nulls al final)
    query = query
      .order("fecha", { ascending: true, nullsFirst: false })
      .order("hora_inicio", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });
  } 
  else if (type === "organizadores") {
    // Filtrar solo organizadores aprobados
    query = query.eq("estado_aprobacion", "aprobado");
    
    if (search) {
      // `v_organizers_public` es SELECT * de profiles_organizer → incluye `nombre_publico` y `bio` en la práctica.
      query = query.or([
        `nombre_publico.ilike.${search.pattern}`,
        `bio.ilike.${search.pattern}`,
      ].join(","));
    }
    
    query = query.order("created_at", { ascending: false });
  }
  else if (type === "maestros" || type === "academias") {
    if (search) query = query.ilike("nombre_publico", search.pattern);
    if ((ritmos?.length || 0) > 0 || (selectedCatalogIds?.length || 0) > 0) {
      const parts: string[] = [];
      if ((ritmos?.length || 0) > 0) {
        const set = `{${(ritmos as number[]).join(',')}}`;
        parts.push(`ritmos.ov.${set}`);
        if (type === 'academias') parts.push(`estilos.ov.${set}`);
      }
      if ((selectedCatalogIds?.length || 0) > 0) {
        const setCat = `{${selectedCatalogIds.join(',')}}`;
        parts.push(`ritmos_seleccionados.ov.${setCat}`);
      }
      if (parts.length > 0) query = query.or(parts.join(','));
    }
    if (zonas?.length)  query = query.overlaps("zonas", zonas as any);
    // Solo mostrar perfiles aprobados
    query = query.eq("estado_aprobacion", "aprobado");
    query = query.order("created_at", { ascending: false });
  }
  else if (type === "sociales") {
    // Eventos padre (sociales) - usar estilos y zonas
    if (search) query = query.ilike("nombre", search.pattern);
    if ((ritmos?.length || 0) > 0 || (selectedCatalogIds?.length || 0) > 0) {
      const parts: string[] = [];
      if ((ritmos?.length || 0) > 0) {
        const set = `{${(ritmos as number[]).join(',')}}`;
        parts.push(`estilos.ov.${set}`);
      }
      if ((selectedCatalogIds?.length || 0) > 0) {
        const setCat = `{${selectedCatalogIds.join(',')}}`;
        parts.push(`ritmos_seleccionados.ov.${setCat}`);
      }
      if (parts.length > 0) query = query.or(parts.join(','));
    }
    if (zonas?.length)  query = query.overlaps("zonas", zonas as any);
    
    query = query.order("created_at", { ascending: false });
  }
  else if (type === "usuarios") {
    // La vista v_user_public ya filtra por onboarding_complete = true
    if (search) query = query.ilike("display_name", search.pattern);
    if ((ritmos?.length || 0) > 0 || (selectedCatalogIds?.length || 0) > 0) {
      const parts: string[] = [];
      if ((ritmos?.length || 0) > 0) {
        const set = `{${(ritmos as number[]).join(',')}}`;
        parts.push(`ritmos.ov.${set}`);
      }
      if ((selectedCatalogIds?.length || 0) > 0) {
        const setCat = `{${selectedCatalogIds.join(',')}}`;
        parts.push(`ritmos_seleccionados.ov.${setCat}`);
      }
      if (parts.length > 0) query = query.or(parts.join(','));
    }
    if (zonas?.length)  query = query.overlaps("zonas", zonas as any);
    
    query = query.order("created_at", { ascending: false });
  } 
  else {
    // maestros / academias / marcas – usar columnas correctas
    if (search) query = query.ilike("nombre_publico", search.pattern);
    if (ritmos?.length) query = query.overlaps("ritmos", ritmos as any);
    if (zonas?.length)  query = query.overlaps("zonas", zonas as any);
    
    // Filtrar solo perfiles aprobados
    query = query.eq("estado_aprobacion", "aprobado");
    
    query = query.order("created_at", { ascending: false });
  }

  // Paginación (range)
  const from = page * (params.pageSize || PAGE_LIMIT);
  const to   = from + (params.pageSize || PAGE_LIMIT) - 1;
  
  if (import.meta.env?.DEV && type === "fechas") {
    const todayCDMX = getTodayCDMX();
    console.log("[PERF_SQL] main_events_query params:", {
      table: "events_date",
      select: "id,parent_id,nombre,fecha,dia_semana,...+events_parent(...)",
      filters: {
        estado_publicacion: "publicado",
        dateOr: `dia_semana.not.is.null OR fecha.gte.${dateFrom || todayCDMX}`,
        dateOr2: dateTo ? `dia_semana.not.is.null OR fecha.lte.${dateTo}` : null,
        ritmos: ritmos?.length ? `overlaps(estilos,${JSON.stringify(ritmos)})` : null,
        zonas: zonas?.length ? `in(zona,${JSON.stringify(zonas)})` : null,
        search: search ? `or(nombre.ilike,lugar.ilike,ciudad.ilike,direccion.ilike).${search.pattern}` : null,
      },
      order: "fecha asc",
      range: [from, to],
    });
  }
  
  const mainStart = performance.now();
  const { data, error, count } = await query.range(from, to);
  const mainEnd = performance.now();
  perfLog({ hook: 'useExploreQuery', step: 'main_events_query', duration_ms: mainEnd - mainStart, rows: (data as any[])?.length ?? 0, data, error, extra: { count: count ?? 0, type } });
  
  if (error) {
    console.error('[useExploreQuery] Error:', error);
    throw error;
  }

  // Supabase typed client may infer `GenericStringError[]` for complex selects.
  // We normalize to `any[]` because downstream code operates dynamically by `type`.
  let finalData: any[] = (data as any[]) || [];
  let searchOrganizerIdSet: Set<number> | null = null;

  // Usar resultados de búsqueda paralela (search_events_parent + search_v_organizers ya ejecutados)
  if (type === 'fechas' && search) {
    try {
      const todayCDMX = getTodayCDMX();
      const matchedParentIds = new Set<number>();

      for (const r of searchParentRows as any[]) {
        if (typeof r?.id === "number" && Number.isFinite(r.id)) matchedParentIds.add(r.id);
      }

      const organizerIds = uniqueNumbers((searchOrgRows as any[]).map((r) => (r as any)?.id));
      searchOrganizerIdSet = new Set(organizerIds);

      if (organizerIds.length > 0) {
        const pboStart = performance.now();
        const { data: parentByOrg } = await supabase
          .from("events_parent")
          .select("id")
          .in("organizer_id", organizerIds as any)
          .limit(500);
        const pboEnd = performance.now();
        if (import.meta.env?.DEV) {
          console.log("[PERF_SQL] search_events_parent_by_org:", { organizer_ids: organizerIds });
        }
        perfLog({ hook: 'useExploreQuery', step: 'search_events_parent_by_org', duration_ms: pboEnd - pboStart, rows: parentByOrg?.length ?? 0, data: parentByOrg });
        for (const r of (parentByOrg || []) as any[]) {
          if (typeof r?.id === "number" && Number.isFinite(r.id)) matchedParentIds.add(r.id);
        }
      }

      const parentIds = Array.from(matchedParentIds).slice(0, 250);
      if (parentIds.length === 0 && (searchOrganizerIdSet?.size ?? 0) === 0) {
        // Nada extra que traer; seguimos con la query principal.
      } else if (parentIds.length > 0) {
        let parentQuery = supabase
          .from("events_date")
          .select(select as any)
          .eq("estado_publicacion", "publicado")
          .in("parent_id", parentIds as any);
      
      // Aplicar los mismos filtros de fecha que la query principal
      if (dateFrom && dateTo) {
        parentQuery = parentQuery.or(`dia_semana.not.is.null,fecha.gte.${dateFrom}`);
        parentQuery = parentQuery.or(`dia_semana.not.is.null,fecha.lte.${dateTo}`);
      } else if (dateFrom) {
        parentQuery = parentQuery.or(`dia_semana.not.is.null,fecha.gte.${dateFrom}`);
      } else if (dateTo) {
        parentQuery = parentQuery.or(`dia_semana.not.is.null,fecha.lte.${dateTo}`);
      } else {
        parentQuery = parentQuery.or(`dia_semana.not.is.null,fecha.gte.${todayCDMX}`);
      }
      
      // Aplicar filtros de zonas
      if (zonas?.length) {
        parentQuery = parentQuery.in("zona", zonas as any);
      }
      
      // Aplicar filtros de ritmos (mismo criterio que query principal)
      if ((ritmos?.length || 0) > 0) {
        parentQuery = parentQuery.overlaps("estilos", ritmos as any);
      } else if ((selectedCatalogIds?.length || 0) > 0) {
        parentQuery = parentQuery.overlaps("ritmos_seleccionados", selectedCatalogIds as any);
      }
      
      const pmStart = performance.now();
      const { data: parentMatches } = await (parentQuery as any)
        .order("fecha", { ascending: true, nullsFirst: false })
        .order("hora_inicio", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });
      const pmEnd = performance.now();
      perfLog({ hook: 'useExploreQuery', step: 'search_parent_matches_events_date', duration_ms: pmEnd - pmStart, rows: (parentMatches as any[])?.length ?? 0, data: parentMatches });
      
      if (Array.isArray(parentMatches) && parentMatches.length > 0) {
        // Combinar resultados, evitando duplicados
        const existingIds = new Set(finalData.map((r: any) => r.id));
        const newMatches = (parentMatches as any[]).filter((r: any) => !existingIds.has(r.id));
        finalData = [...finalData, ...newMatches];
      }
      }
    } catch (error) {
      console.warn("[useExploreQuery] Extra search queries failed (non-fatal):", error);
      // Continuar con los resultados de la query principal
    }
  }

  // NOTA: El filtrado final por texto se aplica al final del pipeline (después de materializar ocurrencias),
  // porque el paso de "re-fetch occurrences" puede re-introducir filas del mismo `parent_id`.

  // Filtro adicional para eventos con dia_semana y por hora para eventos de HOY (CDMX):
  if (type === 'fechas' && finalData.length > 0) {
    const todayStr = getTodayCDMX();

    const addDaysYmd = (ymd: string, days: number) => {
      try {
        const [y, m, d] = String(ymd).split("-").map((x) => parseInt(x, 10));
        if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ymd;
        const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        dt.setUTCDate(dt.getUTCDate() + days);
        const yy = dt.getUTCFullYear();
        const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(dt.getUTCDate()).padStart(2, "0");
        return `${yy}-${mm}-${dd}`;
      } catch {
        return ymd;
      }
    };

    // ✅ Materializar ocurrencias reales para plantillas recurrentes (dia_semana no-null)
    // Esto evita "inventar" IDs/fechas en frontend y permite navegación 1:1 con events_date.id real.
    const recurringParentIds = Array.from(
      new Set(
        finalData
          .filter((row: any) => row?.parent_id && typeof row?.dia_semana === "number")
          .map((row: any) => Number(row.parent_id))
          .filter((n: any) => Number.isFinite(n))
      )
    );

    if (recurringParentIds.length > 0) {
      const rpcStart = performance.now();
      for (const pid of recurringParentIds) {
        try {
          await supabase.rpc("ensure_weekly_occurrences", { p_parent_id: pid, p_weeks_ahead: 12 } as any);
        } catch (e) {
          console.warn("[useExploreQuery] ensure_weekly_occurrences failed for parent", pid, e);
        }
      }
      const rpcEnd = performance.now();
      perfLog({ hook: 'useExploreQuery', step: 'ensure_weekly_occurrences_rpc', duration_ms: rpcEnd - rpcStart, rows: 0, extra: { parents_count: recurringParentIds.length } });

      // Re-fetch ocurrencias reales (rango: dateFrom/dateTo o hoy + 84 días)
      try {
        const rangeFrom = dateFrom || todayStr;
        const rangeTo = dateTo || addDaysYmd(rangeFrom, 84);
        const occStart = performance.now();
        const { data: occRows, error: occErr } = await supabase
          .from("events_date")
          .select(select as any)
          .eq("estado_publicacion", "publicado")
          .in("parent_id", recurringParentIds as any)
          .gte("fecha", rangeFrom)
          .lte("fecha", rangeTo)
          .order("fecha", { ascending: true, nullsFirst: false })
          .order("hora_inicio", { ascending: true, nullsFirst: false })
          .order("id", { ascending: true });
        const occEnd = performance.now();
        perfLog({ hook: 'useExploreQuery', step: 'refetch_recurring_occurrences', duration_ms: occEnd - occStart, rows: occRows?.length ?? 0, data: occRows, error: occErr });

        if (!occErr && Array.isArray(occRows) && occRows.length > 0) {
          const byId = new Map<any, any>();
          (finalData as any[]).forEach((r) => byId.set((r as any)?.id, r));
          (occRows as any[]).forEach((r) => byId.set((r as any)?.id, r));
          finalData = Array.from(byId.values());
        }
      } catch (e) {
        console.warn("[useExploreQuery] re-fetch occurrences failed", e);
      }
    }

    const nextData: any[] = [];
    const toYmd = (raw: any) => {
      if (!raw) return '';
      const plain = String(raw).split('T')[0];
      return plain || '';
    };
    const shouldIncludeByYmd = (fechaStr: string) => {
      if (!fechaStr) return false;

      // Verificar rango de fechas si está disponible en params
      if (params.dateFrom || params.dateTo) {
        // Regla por día: se usa solo la fecha de INICIO del evento (fecha).
        // - "Hoy": se muestran todos los eventos que EMPIEZAN hoy, aunque ya haya pasado la hora de inicio
        //   (ej. empieza 7pm sábado, son las 10pm sábado → se sigue viendo en Hoy).
        // - Un evento que empieza sábado 7pm y termina domingo 2am NO se muestra en Domingo.
        if (params.dateFrom && fechaStr < params.dateFrom) return false;
        if (params.dateTo && fechaStr > params.dateTo) return false;
        return true;
      }

      // Si no hay rango de fechas, verificar que la fecha de inicio del evento sea hoy o futura.
      // Los eventos se muestran en el día de su hora de inicio, de 00:00 a 23:59 de ese día,
      // sin importar si ya pasó la hora de inicio.
      const fechaDate = new Date(fechaStr + 'T12:00:00');
      const todayDate = new Date(todayStr + 'T12:00:00');
      return !(fechaDate < todayDate);
    };

    finalData.forEach((row: any) => {
      const hasDiaSemana = row.dia_semana !== null && row.dia_semana !== undefined && typeof row.dia_semana === 'number';
      const parentId = typeof row?.parent_id === "number" ? row.parent_id : null;

      // ✅ Regla de fuente única:
      // - Si `fecha` existe, se usa esa fecha y se filtra como evento normal (aunque exista dia_semana).
      // - Solo si `fecha` NO existe, se calcula una "next occurrence" para display usando dia_semana.
      let ymd = toYmd(row?.fecha || (row as any)?.fecha_inicio);

      if (!ymd && hasDiaSemana) {
        // Si ya hay ocurrencias reales para este parent, NO mostrar la plantilla sin fecha.
        // (La navegación debe ser por occurrences reales con fecha.)
        if (parentId != null) {
          const hasRealForParent = finalData.some((r: any) => r?.parent_id === parentId && !!toYmd(r?.fecha || (r as any)?.fecha_inicio));
          if (hasRealForParent) return;
        }
        try {
          const horaInicioStr = row.hora_inicio || '20:00';
          const next = calculateNextDateWithTime(row.dia_semana, horaInicioStr);
          const year = next.getFullYear();
          const month = String(next.getMonth() + 1).padStart(2, '0');
          const day = String(next.getDate()).padStart(2, '0');
          ymd = `${year}-${month}-${day}`;
        } catch (e) {
          console.error('Error calculando next occurrence para evento recurrente legacy:', e);
          ymd = '';
        }
      }

      if (!ymd) return;
      if (!shouldIncludeByYmd(ymd)) return;

      // Solo en fallback legacy (fecha vacía) inyectamos la fecha display para orden/UI.
      const out = hasDiaSemana && !toYmd(row?.fecha || (row as any)?.fecha_inicio)
        ? { ...row, fecha: ymd, _legacy_next_occurrence: true }
        : row;

      nextData.push(out);
    });

    finalData = nextData;
    
    // Ordenar por fecha, hora_inicio, id (alineado con ORDER del servidor)
    finalData.sort((a, b) => {
      const fechaA = (a.fecha || '').toString().split('T')[0];
      const fechaB = (b.fecha || '').toString().split('T')[0];
      if (fechaA !== fechaB) return fechaA < fechaB ? -1 : 1;
      const horaA = toSortableHora(a.hora_inicio);
      const horaB = toSortableHora(b.hora_inicio);
      if (horaA !== horaB) return horaA < horaB ? -1 : 1;
      return (a.id ?? 0) - (b.id ?? 0);
    });
  }

  // ✅ Filtro final por texto para `fechas` (después de materializar ocurrencias)
  if (type === "fechas" && search && finalData.length > 0) {
    let organizerIds = searchOrganizerIdSet;
    if (!organizerIds) {
      try {
        const foStart = performance.now();
        const { data: orgRows } = await supabase
          .from("v_organizers_public")
          .select("id")
          .or([`nombre_publico.ilike.${search.pattern}`].join(","))
          .limit(250);
        const foEnd = performance.now();
        perfLog({ hook: 'useExploreQuery', step: 'filter_organizers_final', duration_ms: foEnd - foStart, rows: orgRows?.length ?? 0, data: orgRows });
        organizerIds = new Set(uniqueNumbers(((orgRows || []) as any[]).map((r) => (r as any)?.id)));
      } catch {
        organizerIds = new Set<number>();
      }
    }

    finalData = finalData.filter((row: any) => matchesFechaSearch(row, search.lower, organizerIds));
  }
  
  const fetchEnd = performance.now();
  perfLog({ hook: 'useExploreQuery', step: 'fetchPage_total', duration_ms: fetchEnd - fetchStart, rows: finalData.length, data: finalData, extra: { count: count ?? 0, type } });
  
  return { 
    data: finalData, 
    nextPage: (to + 1 < (count || 0)) ? page + 1 : undefined, 
    count: count || 0 
  };
}

export function useExploreQuery(params: QueryParams & { enabled?: boolean }) {
  const { enabled = true, ...queryParams } = params;
  const qKey = String(queryParams.q || "").trim().toLowerCase();
  const ritmosKey = Array.isArray(queryParams.ritmos) ? [...queryParams.ritmos].sort((a, b) => a - b).join(",") : "";
  const zonasKey = Array.isArray(queryParams.zonas) ? [...queryParams.zonas].sort((a, b) => a - b).join(",") : "";
  return useInfiniteQuery({
    queryKey: [
      "explore",
      queryParams.type,
      qKey,
      ritmosKey,
      zonasKey,
      queryParams.dateFrom ?? "",
      queryParams.dateTo ?? "",
      queryParams.pageSize ?? PAGE_LIMIT,
    ],
    queryFn: ({ pageParam = 0 }) => fetchExplorePage(queryParams, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled, // Solo ejecutar la query si enabled es true
    staleTime: 1000 * 120, // 2 min — home/explore no necesita refetch tan seguido; reduce carga en Android
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
