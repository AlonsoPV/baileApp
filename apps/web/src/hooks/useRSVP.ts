import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// =====================================================
// TIPOS DE RSVP
// =====================================================
export type RSVPStatus = 'asistire' | 'interesado' | 'no_asistire';

export interface RSVPStats {
  asistire: number;
  interesado: number;
  no_asistire: number;
  total: number;
}

export interface RSVPResponse {
  success: boolean;
  user_status: RSVPStatus | null;
  stats: RSVPStats;
  error?: string;
}

// =====================================================
// HOOKS DE CONSULTA
// =====================================================

/**
 * Obtiene el estado RSVP del usuario actual para un evento
 */
export function useUserRSVP(eventDateId?: number) {
  return useQuery({
    queryKey: ["rsvp", "user", eventDateId],
    enabled: !!eventDateId,
    queryFn: async () => {
      if (!eventDateId) return null;
      
      const { data, error } = await supabase
        .rpc('get_user_rsvp_status', { event_id: eventDateId });
      
      if (error) throw error;
      return data as RSVPStatus | null;
    }
  });
}

/**
 * Obtiene las estadísticas de RSVP para un evento
 */
export function useEventRSVPStats(eventDateId?: number) {
  return useQuery({
    queryKey: ["rsvp", "stats", eventDateId],
    enabled: !!eventDateId,
    queryFn: async () => {
      if (!eventDateId) return null;
      
      const { data, error } = await supabase
        .rpc('get_event_rsvp_stats', { event_id: eventDateId });
      
      if (error) throw error;
      return data?.[0] as RSVPStats | null;
    }
  });
}

/**
 * Obtiene eventos con estadísticas de RSVP
 */
export function useEventsWithRSVPStats(params?: {
  q?: string;
  ritmos?: number[];
  zonas?: number[];
  dateFrom?: string;
  dateTo?: string;
}) {
  const { q, ritmos, zonas, dateFrom, dateTo } = params || {};
  
  return useQuery({
    queryKey: ["events", "with-rsvp", q, ritmos, zonas, dateFrom, dateTo],
    queryFn: async () => {
      let req = supabase
        .from("events_with_rsvp_stats")
        .select("*")
        .order("fecha", { ascending: true });
      
      if (dateFrom) req = req.gte("fecha", dateFrom);
      if (dateTo) req = req.lte("fecha", dateTo);
      if (q) req = req.or(`lugar.ilike.%${q}%,ciudad.ilike.%${q}%,direccion.ilike.%${q}%`);
      if (ritmos?.length) req = req.overlaps("evento_estilos", ritmos as any);
      if (zonas?.length) req = req.in("zona", zonas as any);
      
      const { data, error } = await req;
      if (error) throw error;
      return data || [];
    }
  });
}

/**
 * Obtiene los eventos donde el usuario tiene RSVP
 */
export function useUserRSVPEvents(status?: RSVPStatus) {
  return useQuery({
    queryKey: ["rsvp", "user-events", status],
    queryFn: async () => {
      let req = supabase
        .from("event_rsvp")
        .select(`
          *,
          events_date!inner (
            *,
            events_parent!inner (
              *,
              profiles_organizer!inner (*)
            )
          )
        `)
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);
      
      if (status) {
        req = req.eq("status", status);
      }
      
      const { data, error } = await req;
      if (error) throw error;
      return data || [];
    }
  });
}

// =====================================================
// HOOKS DE MUTACIÓN
// =====================================================

/**
 * Hook para actualizar RSVP de un evento
 */
export function useUpdateRSVP() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      eventDateId, 
      status 
    }: { 
      eventDateId: number; 
      status: RSVPStatus 
    }) => {
      const { data, error } = await supabase
        .rpc('upsert_event_rsvp', {
          p_event_date_id: eventDateId,
          p_status: status
        });
      
      if (error) throw error;
      return data as RSVPResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidar todas las queries relacionadas con RSVP
      queryClient.invalidateQueries({ queryKey: ["rsvp"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["live"] });
      
      // Invalidar queries específicas
      queryClient.invalidateQueries({ queryKey: ["rsvp", "user", variables.eventDateId] });
      queryClient.invalidateQueries({ queryKey: ["rsvp", "stats", variables.eventDateId] });
      queryClient.invalidateQueries({ queryKey: ["rsvp", "user-events"] });
      queryClient.invalidateQueries({ queryKey: ["events", "with-rsvp"] });
      queryClient.invalidateQueries({ queryKey: ["events", "live"] });
    }
  });
}

/**
 * Hook para eliminar RSVP de un evento
 */
export function useRemoveRSVP() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventDateId: number) => {
      const { data, error } = await supabase
        .rpc('delete_event_rsvp', {
          p_event_date_id: eventDateId
        });
      
      if (error) throw error;
      return data as RSVPResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidar todas las queries relacionadas con RSVP
      queryClient.invalidateQueries({ queryKey: ["rsvp"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["live"] });
      
      // Invalidar queries específicas
      queryClient.invalidateQueries({ queryKey: ["rsvp", "user", variables] });
      queryClient.invalidateQueries({ queryKey: ["rsvp", "stats", variables] });
      queryClient.invalidateQueries({ queryKey: ["rsvp", "user-events"] });
      queryClient.invalidateQueries({ queryKey: ["events", "with-rsvp"] });
      queryClient.invalidateQueries({ queryKey: ["events", "live"] });
    }
  });
}

// =====================================================
// HOOKS COMPUESTOS
// =====================================================

/**
 * Hook completo para manejar RSVP de un evento
 * Combina estado del usuario y estadísticas
 */
export function useEventRSVP(eventDateId?: number) {
  const userRSVP = useUserRSVP(eventDateId);
  const stats = useEventRSVPStats(eventDateId);
  const updateRSVP = useUpdateRSVP();
  const removeRSVP = useRemoveRSVP();
  
  const handleRSVP = async (status: RSVPStatus) => {
    if (!eventDateId) return;
    
    try {
      // Si ya tiene ese estado, lo removemos
      if (userRSVP.data === status) {
        await removeRSVP.mutateAsync(eventDateId);
      } else {
        // Si no tiene ese estado, lo actualizamos
        await updateRSVP.mutateAsync({ eventDateId, status });
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      throw error;
    }
  };
  
  const handleRemoveRSVP = async () => {
    if (!eventDateId) return;
    await removeRSVP.mutateAsync(eventDateId);
  };
  
  return {
    // Estado actual
    userStatus: userRSVP.data,
    stats: stats.data,
    isLoading: userRSVP.isLoading || stats.isLoading,
    error: userRSVP.error || stats.error,
    
    // Acciones
    updateRSVP: handleRSVP,
    removeRSVP: handleRemoveRSVP,
    isUpdating: updateRSVP.isPending || removeRSVP.isPending,
    
    // Estados de mutación
    updateError: updateRSVP.error,
    removeError: removeRSVP.error
  };
}
