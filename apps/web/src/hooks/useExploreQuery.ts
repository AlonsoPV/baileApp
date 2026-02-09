import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { ExploreFilters, ExploreType } from "../state/exploreFilters";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { calculateNextDateWithTime } from "../utils/calculateRecurringDates";

const PAGE_LIMIT = 12;

type QueryParams = ExploreFilters;

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
          dia_semana,
          hora_inicio,
          hora_fin,
          lugar,
          direccion,
          ciudad,
          zona,
          estado_publicacion,
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

async function fetchPage(params: QueryParams, page: number) {
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
    
    // filtrar por estilos/ritmos (solo a nivel de fecha).
    // NOTA: Intentar mezclar `events_parent.*` dentro del mismo `.or(...)` rompe el parser
    // de PostgREST ("failed to parse logic tree"). `events_date` ya contiene los campos
    // necesarios (`estilos`, `ritmos_seleccionados`) para filtrar correctamente.
    if ((ritmos?.length || 0) > 0 || (selectedCatalogIds?.length || 0) > 0) {
      const parts: string[] = [];
      if ((ritmos?.length || 0) > 0) {
        const setTags = `{${(ritmos as number[]).join(',')}}`;
        parts.push(`estilos.ov.${setTags}`); // fecha.estilos
      }
      if ((selectedCatalogIds?.length || 0) > 0) {
        const setCat = `{${selectedCatalogIds.join(',')}}`;
        parts.push(`ritmos_seleccionados.ov.${setCat}`); // fecha.ritmos_seleccionados
      }
      if (parts.length > 0) query = query.or(parts.join(','));
    }
    // zonas específicas de la fecha (campo zona numérico)
    if (zonas?.length)   query = query.in("zona", zonas as any);
    
    // búsqueda textual: nombre del evento, lugar, ciudad, direccion
    // Nota: events_parent.nombre se filtra post-query porque Supabase no permite ilike en relaciones anidadas
    // Hacemos una query adicional para eventos que coincidan solo con events_parent.nombre
    if (q) {
      query = query.or(`nombre.ilike.%${q}%,lugar.ilike.%${q}%,ciudad.ilike.%${q}%,direccion.ilike.%${q}%`);
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
    // La vista v_user_public ya filtra por onboarding_complete = true
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

  // Supabase typed client may infer `GenericStringError[]` for complex selects.
  // We normalize to `any[]` because downstream code operates dynamically by `type`.
  let finalData: any[] = (data as any[]) || [];

  // Query adicional para eventos que coincidan solo con events_parent.nombre
  // (no se puede hacer con ilike en relaciones anidadas en la query principal)
  if (type === 'fechas' && q) {
    try {
      const todayCDMX = getTodayCDMX();
      let parentQuery = supabase
        .from("events_date")
        .select(`
          id,
          parent_id,
          nombre,
          fecha,
          dia_semana,
          hora_inicio,
          hora_fin,
          lugar,
          direccion,
          ciudad,
          zona,
          estado_publicacion,
          estilos,
          ritmos_seleccionados,
          media,
          flyer_url,
          created_at,
          updated_at,
          events_parent!inner(
            id,
            nombre,
            descripcion,
            estilos,
            ritmos_seleccionados,
            zonas,
            media,
            organizer_id
          )
        `)
        .eq("estado_publicacion", "publicado")
        .ilike("events_parent.nombre", `%${q}%`);
      
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
      
      // Aplicar filtros de ritmos (simplificado - solo a nivel de fecha, no parent)
      if ((ritmos?.length || 0) > 0 || (selectedCatalogIds?.length || 0) > 0) {
        const parts: string[] = [];
        if ((ritmos?.length || 0) > 0) {
          const setTags = `{${(ritmos as number[]).join(',')}}`;
          parts.push(`estilos.ov.${setTags}`);
        }
        if ((selectedCatalogIds?.length || 0) > 0) {
          const setCat = `{${selectedCatalogIds.join(',')}}`;
          parts.push(`ritmos_seleccionados.ov.${setCat}`);
        }
        if (parts.length > 0) {
          parentQuery = parentQuery.or(parts.join(','));
        }
      }
      
      const { data: parentMatches } = await (parentQuery as any).order("fecha", { ascending: true });
      
      if (Array.isArray(parentMatches) && parentMatches.length > 0) {
        // Combinar resultados, evitando duplicados
        const existingIds = new Set(finalData.map((r: any) => r.id));
        const newMatches = (parentMatches as any[]).filter((r: any) => !existingIds.has(r.id));
        finalData = [...finalData, ...newMatches];
      }
    } catch (error) {
      console.warn('[useExploreQuery] Error en query adicional para events_parent.nombre:', error);
      // Continuar con los resultados de la query principal
    }
  }

  // Filtro post-query para asegurar que todos los resultados coincidan con la búsqueda
  if (type === 'fechas' && q && finalData.length > 0) {
    const searchLower = q.toLowerCase();
    finalData = finalData.filter((row: any) => {
      const nombreMatch = row?.nombre?.toLowerCase().includes(searchLower);
      const lugarMatch = row?.lugar?.toLowerCase().includes(searchLower);
      const ciudadMatch = row?.ciudad?.toLowerCase().includes(searchLower);
      const direccionMatch = row?.direccion?.toLowerCase().includes(searchLower);
      const parentNombreMatch = row?.events_parent?.nombre?.toLowerCase().includes(searchLower);
      
      return nombreMatch || lugarMatch || ciudadMatch || direccionMatch || parentNombreMatch;
    });
  }

  // Filtro adicional para eventos con dia_semana y por hora para eventos de HOY (CDMX):
  if (type === 'fechas' && finalData.length > 0) {
    const todayStr = getTodayCDMX();
    const nowCDMX = getNowCDMX();
    const expandedData: any[] = [];

    // Log para verificar si hay eventos recurrentes
    const recurrentEvents = finalData.filter((row: any) => 
      row.dia_semana !== null && row.dia_semana !== undefined && typeof row.dia_semana === 'number'
    );
    if (recurrentEvents.length > 0) {
      console.log('[useExploreQuery] Eventos recurrentes encontrados:', {
        total: finalData.length,
        recurrentes: recurrentEvents.length,
        eventos: recurrentEvents.map((r: any) => ({
          id: r.id,
          dia_semana: r.dia_semana,
          fecha_original: r.fecha,
          hora_inicio: r.hora_inicio
        }))
      });
    }

    finalData.forEach((row: any) => {
      // Si tiene dia_semana, expandir en 4 ocurrencias
      if (row.dia_semana !== null && row.dia_semana !== undefined && typeof row.dia_semana === 'number') {
        try {
          const horaInicioStr = row.hora_inicio || '20:00';
          
          // Calcular la fecha base (primera ocurrencia)
          const primeraFecha = calculateNextDateWithTime(row.dia_semana, horaInicioStr);
          const ocurrenciasParaEsteEvento: any[] = [];
          
          // Calcular las próximas 4 ocurrencias (sin filtrar dentro del bucle, igual que EventParentPublicScreenModern)
          for (let i = 0; i < 4; i++) {
            // Calcular la fecha de esta ocurrencia (sumar i semanas)
            const fechaOcurrencia = new Date(primeraFecha);
            fechaOcurrencia.setDate(primeraFecha.getDate() + (i * 7));
            
            const year = fechaOcurrencia.getFullYear();
            const month = String(fechaOcurrencia.getMonth() + 1).padStart(2, '0');
            const day = String(fechaOcurrencia.getDate()).padStart(2, '0');
            const fechaStr = `${year}-${month}-${day}`;
            
            // Crear una copia del evento con la fecha de esta ocurrencia
            // NO filtrar aquí - el filtrado se hará después en el frontend
            const expandedItem = {
              ...row,
              fecha: fechaStr,
              _recurrence_index: i, // Para identificar que es una ocurrencia recurrente
              _original_id: row.id, // Mantener referencia al ID original
              id: `${row.id}_${i}`, // ID único para cada ocurrencia
            };
            
            ocurrenciasParaEsteEvento.push(expandedItem);
            expandedData.push(expandedItem);
          }
          
          // Log temporal para depuración - verificar que se generaron las 4 ocurrencias
          if (ocurrenciasParaEsteEvento.length !== 4) {
            console.warn(`[useExploreQuery] Evento ${row.id} solo generó ${ocurrenciasParaEsteEvento.length} ocurrencias de 4 esperadas:`, {
              originalId: row.id,
              dia_semana: row.dia_semana,
              ocurrenciasGeneradas: ocurrenciasParaEsteEvento.length,
              fechas: ocurrenciasParaEsteEvento.map((item: any) => item.fecha).sort(),
              horaInicio: horaInicioStr
            });
          } else {
            console.log(`[useExploreQuery] Evento ${row.id} expandido correctamente:`, {
              originalId: row.id,
              dia_semana: row.dia_semana,
              ocurrenciasGeneradas: ocurrenciasParaEsteEvento.length,
              fechas: ocurrenciasParaEsteEvento.map((item: any) => item.fecha).sort(),
              horaInicio: horaInicioStr
            });
          }
        } catch (e) {
          console.error('Error calculando ocurrencias para evento recurrente:', e);
          // Si falla, incluir el evento original
          expandedData.push(row);
        }
      } else {
        // Para eventos sin dia_semana, verificar que estén en el rango de fechas (si aplica)
        let shouldInclude = true;
        
        if (row?.fecha) {
          const fechaStr = String(row.fecha).split('T')[0];
          
          // Verificar rango de fechas si está disponible en params
          if (params.dateFrom || params.dateTo) {
            // ✅ CORRECCIÓN: Comparar strings YYYY-MM-DD directamente para evitar problemas de zona horaria
            // Esto asegura que eventos del 7, 8, 9 y 10 de febrero se incluyan si el rango es 7-10
            // fechaStr ya está en formato YYYY-MM-DD
            
            // Incluir eventos que estén dentro del rango (>= dateFrom Y <= dateTo)
            // No importa la hora de inicio o fin, si el evento es de un día dentro del rango, se incluye
            if (params.dateFrom && fechaStr < params.dateFrom) {
              shouldInclude = false;
            }
            if (params.dateTo && fechaStr > params.dateTo) {
              shouldInclude = false;
            }
          } else {
            // Si no hay rango de fechas, verificar que sea futuro (solo si es hoy, verificar hora)
            if (fechaStr === todayStr) {
              const horaStr = row.hora_inicio as string | null | undefined;
              if (horaStr) {
                const [yy, mm, dd] = fechaStr.split('-').map((p: string) => parseInt(p, 10));
                if (Number.isFinite(yy) && Number.isFinite(mm) && Number.isFinite(dd)) {
                  const [hhRaw, minRaw] = String(horaStr).split(':');
                  const hh = parseInt(hhRaw ?? '0', 10);
                  const min = parseInt(minRaw ?? '0', 10);
                  const eventDateTime = new Date(Date.UTC(yy, mm - 1, dd, hh, min, 0));
                  
                  // Si la hora de inicio ya pasó en CDMX, no incluir el evento
                  if (eventDateTime.getTime() < nowCDMX.getTime()) {
                    shouldInclude = false;
                  }
                }
              }
            } else {
              // Si no es hoy, verificar que la fecha sea futura
              const fechaDate = new Date(fechaStr + 'T12:00:00');
              const todayDate = new Date(todayStr + 'T12:00:00');
              if (fechaDate < todayDate) {
                shouldInclude = false;
              }
            }
          }
        }
        
        if (shouldInclude) {
          expandedData.push(row);
        }
      }
    });

    finalData = expandedData;
    
    // Ordenar por fecha después de expandir
    finalData.sort((a, b) => {
      const fechaA = a.fecha || '';
      const fechaB = b.fecha || '';
      if (fechaA < fechaB) return -1;
      if (fechaA > fechaB) return 1;
      return 0;
    });
  }
  
  return { 
    data: finalData, 
    nextPage: (to + 1 < (count || 0)) ? page + 1 : undefined, 
    count: count || 0 
  };
}

export function useExploreQuery(params: QueryParams & { enabled?: boolean }) {
  const { enabled = true, ...queryParams } = params;
  return useInfiniteQuery({
    queryKey: ["explore", queryParams],
    queryFn: ({ pageParam = 0 }) => fetchPage(queryParams, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled, // Solo ejecutar la query si enabled es true
  });
}
