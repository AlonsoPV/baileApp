/**
 * Hooks para consumir vistas "live" (públicas) de contenido aprobado/publicado
 * 
 * Estas vistas solo muestran:
 * - Organizadores con estado_aprobacion = 'aprobado'
 * - Eventos con estado_publicacion = 'publicado' y padre/organizador aprobados
 * 
 * Cualquier usuario autenticado puede ver este contenido.
 * Los dueños pueden ver su contenido aunque no esté aprobado/publicado.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// =====================================================
// TIPOS
// =====================================================

export interface OrganizerLive {
  id: number;
  user_id: string;
  nombre_publico: string;
  bio?: string;
  media?: string[];
  created_at: string;
}

export interface EventLive {
  id: number;
  parent_id: number;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  lugar: string;
  direccion?: string;
  ciudad: string;
  zona?: number;
  aforo_total?: number;
  estado_publicacion: string;
  media?: string[];
  created_at: string;
  // Campos del evento padre
  evento_nombre: string;
  evento_descripcion?: string;
  evento_estilos?: number[];
  sede_general?: string;
  requisitos?: string;
  // Campos del organizador
  organizador_nombre: string;
  organizador_id: number;
  organizador_user_id: string;
  organizador_media?: string[];
}

// =====================================================
// PARÁMETROS DE BÚSQUEDA
// =====================================================

export interface OrganizersLiveParams {
  q?: string; // Búsqueda por nombre
}

export interface EventsLiveParams {
  q?: string; // Búsqueda por lugar/ciudad/dirección
  ritmos?: number[]; // Filtrar por estilos de baile
  zonas?: number[]; // Filtrar por zonas
  dateFrom?: string; // Fecha desde (YYYY-MM-DD)
  dateTo?: string; // Fecha hasta (YYYY-MM-DD)
  ciudad?: string; // Filtrar por ciudad específica
}

// =====================================================
// HOOKS - ORGANIZADORES LIVE
// =====================================================

/**
 * Obtiene lista de organizadores aprobados (públicos)
 * @param params Parámetros de filtrado opcionales
 */
export function useOrganizersLive(params?: OrganizersLiveParams) {
  const q = params?.q?.trim();
  
  return useQuery({
    queryKey: ["live", "organizers", q],
    queryFn: async () => {
      let req = supabase
        .from("organizers_live")
        .select("*")
        .order("created_at", { ascending: false });

      if (q) {
        req = req.ilike("nombre_publico", `%${q}%`);
      }

      const { data, error } = await req;
      if (error) throw error;
      return (data || []) as OrganizerLive[];
    }
  });
}

/**
 * Obtiene un organizador aprobado por ID
 * @param id ID del organizador
 */
export function useOrganizerLiveById(id?: number) {
  return useQuery({
    queryKey: ["live", "organizer", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers_live")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as OrganizerLive | null;
    }
  });
}

// =====================================================
// HOOKS - EVENTOS LIVE
// =====================================================

/**
 * Obtiene lista de eventos publicados (públicos)
 * @param params Parámetros de filtrado opcionales
 */
export function useEventsLive(params?: EventsLiveParams) {
  const { q, ritmos, zonas, dateFrom, dateTo, ciudad } = params || {};
  
  return useQuery({
    queryKey: ["live", "events", q, ritmos, zonas, dateFrom, dateTo, ciudad],
    queryFn: async () => {
      // Consulta sobre events_live (ya viene "solo publicado/aprobado")
      let req = supabase
        .from("events_live")
        .select("*")
        .order("fecha", { ascending: true });

      // Filtros de fecha
      if (dateFrom) req = req.gte("fecha", dateFrom);
      if (dateTo) req = req.lte("fecha", dateTo);

      // Búsqueda de texto en lugar, ciudad o dirección
      if (q) {
        req = req.or(`lugar.ilike.%${q}%,ciudad.ilike.%${q}%,direccion.ilike.%${q}%`);
      }

      // Filtro por ciudad específica
      if (ciudad) {
        req = req.eq("ciudad", ciudad);
      }

      // Filtro por estilos de baile (ritmos)
      if (ritmos?.length) {
        req = req.overlaps("evento_estilos", ritmos);
      }

      // Filtro por zonas
      if (zonas?.length) {
        req = req.in("zona", zonas);
      }

      const { data, error } = await req;
      if (error) throw error;
      return (data || []) as EventLive[];
    }
  });
}

/**
 * Obtiene un evento publicado por ID
 * @param id ID de la fecha del evento (events_date.id)
 */
export function useEventLiveById(id?: number) {
  return useQuery({
    queryKey: ["live", "event", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events_live")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as EventLive | null;
    }
  });
}

/**
 * Obtiene eventos publicados de un organizador específico
 * @param organizerId ID del organizador
 */
export function useEventsByOrganizerLive(organizerId?: number) {
  return useQuery({
    queryKey: ["live", "events", "by-organizer", organizerId],
    enabled: !!organizerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events_live")
        .select("*")
        .eq("organizador_id", organizerId)
        .order("fecha", { ascending: true });

      if (error) throw error;
      return (data || []) as EventLive[];
    }
  });
}

/**
 * Obtiene los próximos N eventos publicados
 * @param limit Número de eventos a obtener (default: 10)
 */
export function useUpcomingEventsLive(limit: number = 10) {
  return useQuery({
    queryKey: ["live", "events", "upcoming", limit],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("events_live")
        .select("*")
        .gte("fecha", today)
        .order("fecha", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data || []) as EventLive[];
    }
  });
}

/**
 * Obtiene eventos destacados (próximos eventos con aforo)
 * @param limit Número de eventos a obtener (default: 6)
 */
export function useFeaturedEventsLive(limit: number = 6) {
  return useQuery({
    queryKey: ["live", "events", "featured", limit],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("events_live")
        .select("*")
        .gte("fecha", today)
        .not("aforo_total", "is", null)
        .order("fecha", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data || []) as EventLive[];
    }
  });
}

