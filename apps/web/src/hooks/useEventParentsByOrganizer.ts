import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * Hook para obtener eventos padre (sociales) de un organizador
 * @param organizerId ID del organizador
 */
export function useEventParentsByOrganizer(organizerId?: number) {
  return useQuery({
    queryKey: ["event-parents", "by-organizer", organizerId],
    enabled: !!organizerId,
    queryFn: async () => {
      if (!organizerId) {
        console.log('[useEventParentsByOrganizer] No organizerId provided');
        return [];
      }
      
      console.log('[useEventParentsByOrganizer] Fetching events for organizer:', organizerId);
      
      const { data, error } = await supabase
        .from("events_parent")
        .select(`
          id,
          organizer_id,
          nombre,
          descripcion,
          biografia,
          estilos,
          zonas,
          sede_general,
          faq,
          media,
          created_at,
          updated_at
        `)
        .eq("organizer_id", organizerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('[useEventParentsByOrganizer] Error:', error);
        throw error;
      }
      
      console.log('[useEventParentsByOrganizer] Data received:', data);
      return data || [];
    }
  });
}

/**
 * Hook para obtener fechas de eventos de un organizador
 * @param organizerId ID del organizador
 */
export function useEventDatesByOrganizer(organizerId?: number) {
  return useQuery({
    queryKey: ["event-dates", "by-organizer", organizerId],
    enabled: !!organizerId,
    queryFn: async () => {
      if (!organizerId) {
        console.log('[useEventDatesByOrganizer] No organizerId provided');
        return [];
      }
      
      console.log('[useEventDatesByOrganizer] Fetching dates for organizer:', organizerId);
      
      const { data, error } = await supabase
        .from("events_date")
        .select(`
          id,
          parent_id,
          fecha,
          hora_inicio,
          hora_fin,
          lugar,
          direccion,
          ciudad,
          zona,
          estilos,
          requisitos,
          cronograma,
          costos,
          media,
          estado_publicacion,
          created_at,
          updated_at,
          events_parent!inner(
            id,
            nombre,
            organizer_id
          )
        `)
        .eq("events_parent.organizer_id", organizerId)
        .order("fecha", { ascending: true });

      if (error) {
        console.error('[useEventDatesByOrganizer] Error:', error);
        throw error;
      }
      
      console.log('[useEventDatesByOrganizer] Data received:', data);
      return data || [];
    }
  });
}
