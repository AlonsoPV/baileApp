import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ExploreFilters, ExploreType } from "../state/exploreFilters";

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
      return { 
        table: "events_date", 
        select: `
          id,
          parent_id,
          nombre,
          biografia,
          fecha,
          hora_inicio,
          hora_fin,
          lugar,
          direccion,
          ciudad,
          zona,
          referencias,
          requisitos,
          cronograma,
          costos,
          media,
          flyer_url,
          created_at,
          updated_at,
          events_parent!inner(
            id,
            nombre,
            descripcion,
            biografia,
            estilos,
            zonas,
            sede_general,
            faq,
            media,
            organizer_id,
            profiles_organizer!inner(
              id,
              nombre_publico,
              bio,
              media,
              estado_aprobacion
            )
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
      // Eventos padre (sociales)
      return { table: "events_parent", select: `
        id,
        organizer_id,
        nombre,
        descripcion,
        biografia,
        sede_general,
        estilos,
        zonas,
        created_at
      ` };
    case "usuarios":       
      return { table: "profiles_user", select: "user_id, display_name, avatar_url, ritmos, zonas, bio" };
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

  // Filtros por tipo
  if (type === "fechas") {
    // DEBUG: Log the current date filter
    const today = new Date().toISOString().split('T')[0];
    console.log('[useExploreQuery] Filtering fechas from date:', today);
    
    // TEMPORARY: Comment out future events filter to debug
    // query = query.gte("fecha", today);
    
    // Filtrar por organizadores aprobados
    query = query.eq("events_parent.profiles_organizer.estado_aprobacion", "aprobado");
    
    if (dateFrom) query = query.gte("fecha", dateFrom);
    if (dateTo)   query = query.lte("fecha", dateTo);
    
    // filtrar por estilos/ritmos - usar la relación con events_parent
    if (ritmos?.length)  query = query.overlaps("events_parent.estilos", ritmos as any);
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
    if (ritmos?.length) query = query.overlaps("ritmos", ritmos as any);
    if (zonas?.length)  query = query.overlaps("zonas", zonas as any);
    // Solo mostrar perfiles aprobados
    query = query.eq("estado_aprobacion", "aprobado");
    query = query.order("created_at", { ascending: false });
  }
  else if (type === "sociales") {
    // Eventos padre (sociales) - usar estilos y zonas
    if (q) query = query.ilike("nombre", `%${q}%`);
    if (ritmos?.length) query = query.overlaps("estilos", ritmos as any);
    if (zonas?.length)  query = query.overlaps("zonas", zonas as any);
    
    query = query.order("created_at", { ascending: false });
  }
  else if (type === "usuarios") {
    if (q) query = query.ilike("display_name", `%${q}%`);
    if (ritmos?.length) query = query.overlaps("ritmos", ritmos as any);
    if (zonas?.length)  query = query.overlaps("zonas", zonas as any);
    
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

