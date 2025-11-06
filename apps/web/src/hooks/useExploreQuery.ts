import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ExploreFilters, ExploreType } from "../state/exploreFilters";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";

const PAGE_LIMIT = 12;

type QueryParams = ExploreFilters;

/**
 * Determina qué tabla o vista usar para cada tipo de exploración
 * Para eventos y organizadores, usamos las vistas LIVE que solo muestran contenido aprobado/publicado
 */
function baseSelect(type: ExploreType) {
  switch (type) {
    case "fechas":
      // Mismo que eventos pero específicamente para fechas
      // NOTA: No podemos hacer join directo events_parent->profiles_organizer
      // porque la FK es events_parent.organizer_id -> auth.users.id, no -> profiles_organizer
      return { 
        table: "events_date", 
        select: `
          id,
          parent_id,
          nombre,
          fecha,
          hora_inicio,
          hora_fin,
          lugar,
          direccion,
          ciudad,
          zona,
          estilos,
          ritmos_seleccionados,
          media,
          flyer_url,
          created_at,
          updated_at,
          events_parent(
            id,
            nombre,
            descripcion,
            estilos,
            ritmos_seleccionados,
            zonas,
            media,
            organizer_id
          )
        `
      };
    case "organizadores":  
      // Usar tabla profiles_organizer directamente
      return { table: "profiles_organizer", select: "*" };
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
      // Incluir media y estado de onboarding para filtrar solo perfiles completos
      return { table: "profiles_user", select: "user_id, display_name, avatar_url, media, ritmos, zonas, bio, onboarding_complete" };
    default:               
      return { table: "events_date", select: "*" };
  }
}

async function fetchPage(params: QueryParams, page: number) {
  console.log('[useExploreQuery] Fetching page:', { page, params });
  
  const { type, q, ritmos, zonas, dateFrom, dateTo } = params;
  const { table, select } = baseSelect(type);

  // Construir query
  let query = supabase.from(table).select(select, { count: "exact" });

  // Mapeo opcional: de ritmos (tags numéricos) a catálogo (string IDs) para permitir OR sobre ritmos_seleccionados
  let selectedCatalogIds: string[] = [];
  try {
    if (ritmos && ritmos.length > 0) {
      // Obtener nombres de tags seleccionados
      const { data: tagRows, error: tagErr } = await supabase
        .from('tags')
        .select('id,nombre,tipo')
        .in('id', ritmos as any)
        .eq('tipo', 'ritmo');
      if (!tagErr && tagRows && tagRows.length > 0) {
        const labelToId = new Map<string, string>();
        RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelToId.set(i.label, i.id)));
        selectedCatalogIds = (tagRows as any[])
          .map(r => labelToId.get(r.nombre))
          .filter(Boolean) as string[];
      }
    }
  } catch (e) {
    console.warn('[useExploreQuery] Catalog mapping failed, continuing with numeric only', e);
  }

  // Filtros por tipo
  if (type === "fechas") {
    // DEBUG: Log the current date filter
    const today = new Date().toISOString().split('T')[0];
    console.log('[useExploreQuery] Filtering fechas from date:', today);
    
    // TEMPORARY: Comment out future events filter to debug
    // query = query.gte("fecha", today);
    
    // Filtrar por organizadores aprobados (removido por ahora - el !inner falla si no hay relación)
    // query = query.eq("events_parent.profiles_organizer.estado_aprobacion", "aprobado");
    
    if (dateFrom) query = query.gte("fecha", dateFrom);
    if (dateTo)   query = query.lte("fecha", dateTo);
    
    // filtrar por estilos/ritmos - a nivel de fecha y de parent
    if ((ritmos?.length || 0) > 0 || (selectedCatalogIds?.length || 0) > 0) {
      const parts: string[] = [];
      if ((ritmos?.length || 0) > 0) {
        const setTags = `{${(ritmos as number[]).join(',')}}`;
        parts.push(`estilos.ov.${setTags}`); // fecha.estilos
        parts.push(`events_parent.estilos.ov.${setTags}`); // parent.estilos
      }
      if ((selectedCatalogIds?.length || 0) > 0) {
        const setCat = `{${selectedCatalogIds.join(',')}}`;
        parts.push(`ritmos_seleccionados.ov.${setCat}`); // fecha.ritmos_seleccionados
        parts.push(`events_parent.ritmos_seleccionados.ov.${setCat}`); // parent.ritmos_seleccionados
      }
      if (parts.length > 0) query = query.or(parts.join(','));
    }
    // zonas específicas de la fecha (campo zona numérico)
    if (zonas?.length)   query = query.in("zona", zonas as any);
    
    // búsqueda textual básica (lugar/ciudad/direccion)
    if (q) {
      query = query.or(`lugar.ilike.%${q}%,ciudad.ilike.%${q}%,direccion.ilike.%${q}%`);
    }
    
    // orden por fecha asc (próximos primero)
    query = query.order("fecha", { ascending: true });
  } 
  else if (type === "organizadores") {
    // Filtrar solo organizadores aprobados
    query = query.eq("estado_aprobacion", "aprobado");
    
    if (q) query = query.ilike("nombre_publico", `%${q}%`);
    
    query = query.order("created_at", { ascending: false });
  }
  else if (type === "maestros" || type === "academias") {
    if (q) query = query.ilike("nombre_publico", `%${q}%`);
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
    if (q) query = query.ilike("nombre", `%${q}%`);
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
    if (q) query = query.ilike("display_name", `%${q}%`);
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
    // Solo mostrar usuarios con onboarding completo
    query = query.eq("onboarding_complete", true);
    
    query = query.order("created_at", { ascending: false });
  } 
  else {
    // maestros / academias / marcas – usar columnas correctas
    if (q) query = query.ilike("nombre_publico", `%${q}%`);
    if (ritmos?.length) query = query.overlaps("ritmos", ritmos as any);
    if (zonas?.length)  query = query.overlaps("zonas", zonas as any);
    
    // Filtrar solo perfiles aprobados
    query = query.eq("estado_aprobacion", "aprobado");
    
    query = query.order("created_at", { ascending: false });
  }

  // Paginación (range)
  const from = page * (params.pageSize || PAGE_LIMIT);
  const to   = from + (params.pageSize || PAGE_LIMIT) - 1;
  
  const { data, error, count } = await query.range(from, to);
  
  if (error) {
    console.error('[useExploreQuery] Error:', error);
    throw error;
  }
  
  console.log('[useExploreQuery] Success:', { 
    dataCount: data?.length, 
    totalCount: count, 
    hasMore: (to + 1 < (count || 0)),
    type: params.type,
    filters: { q, ritmos, zonas, dateFrom, dateTo }
  });
  
  // DEBUG: Log first few events for debugging
  if (params.type === "fechas" && data && data.length > 0) {
    console.log('[useExploreQuery] Sample events:', data.slice(0, 3).map(e => ({
      id: e.id,
      nombre: e.nombre,
      fecha: e.fecha,
      organizer_aprobado: e.events_parent?.profiles_organizer?.estado_aprobacion
    })));
  }
  
  return { 
    data, 
    nextPage: (to + 1 < (count || 0)) ? page + 1 : undefined, 
    count: count || 0 
  };
}

export function useExploreQuery(params: QueryParams) {
  return useInfiniteQuery({
    queryKey: ["explore", params],
    queryFn: ({ pageParam = 0 }) => fetchPage(params, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
  });
}

// Diagnostic function to help debug event display issues
export async function diagnoseEventDisplay() {
  console.log('=== DIAGNOSTIC: Event Display Issues ===');
  
  // Check total events in database
  const { data: allEvents, error: allEventsError } = await supabase
    .from('events_date')
    .select('id, nombre, fecha, parent_id', { count: 'exact' });
  
  if (allEventsError) {
    console.error('Error fetching all events:', allEventsError);
    return;
  }
  
  console.log('Total events in database:', allEvents?.length || 0);
  
  // Check events by date range
  const today = new Date().toISOString().split('T')[0];
  const { data: futureEvents, error: futureError } = await supabase
    .from('events_date')
    .select('id, nombre, fecha', { count: 'exact' })
    .gte('fecha', today);
  
  console.log('Future events (>= today):', futureEvents?.length || 0);
  
  // Check organizer approval status
  const { data: eventsWithOrganizers, error: orgError } = await supabase
    .from('events_date')
    .select(`
      id, nombre, fecha,
      events_parent!inner(
        id,
        organizer_id,
        profiles_organizer!inner(
          id,
          nombre_publico,
          estado_aprobacion
        )
      )
    `, { count: 'exact' })
    .gte('fecha', today);
  
  if (orgError) {
    console.error('Error fetching events with organizers:', orgError);
    return;
  }
  
  console.log('Events with approved organizers:', eventsWithOrganizers?.length || 0);
  
  // Check approval status breakdown
  const { data: approvalBreakdown, error: approvalError } = await supabase
    .from('profiles_organizer')
    .select('estado_aprobacion', { count: 'exact' });
  
  if (!approvalError && approvalBreakdown) {
    const breakdown = approvalBreakdown.reduce((acc: any, org: any) => {
      acc[org.estado_aprobacion] = (acc[org.estado_aprobacion] || 0) + 1;
      return acc;
    }, {});
    console.log('Organizer approval breakdown:', breakdown);
  }
  
  console.log('=== END DIAGNOSTIC ===');
}

// Make diagnostic function available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).diagnoseEventDisplay = diagnoseEventDisplay;
}

