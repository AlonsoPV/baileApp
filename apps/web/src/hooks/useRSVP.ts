import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthProvider";

// =====================================================
// TIPOS DE RSVP
// =====================================================
export type RSVPStatus = 'interesado';

export interface RSVPStats {
  interesado: number;
  total: number;
  // Backwards compat: algunas RPCs/vistas devuelven `total_interesado`
  total_interesado?: number;
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
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ["rsvp", "user-events", status, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      let req = supabase
        .from("event_rsvp")
        .select(`
          *,
          events_date!inner (
            *,
            events_parent!inner (
              *,
              profiles_organizer (*)
            )
          )
        `)
        .eq("user_id", userId);
      
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
      console.log('[useUpdateRSVP] Success, invalidating cache for eventDateId:', variables.eventDateId);
      
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
      
      // Forzar refetch inmediato de las queries específicas
      queryClient.refetchQueries({ queryKey: ["rsvp", "user", variables.eventDateId] });
      queryClient.refetchQueries({ queryKey: ["rsvp", "stats", variables.eventDateId] });
      
      // Invalidar también las queries de eventos específicos
      queryClient.invalidateQueries({ queryKey: ["event", "date", variables.eventDateId] });
      queryClient.invalidateQueries({ queryKey: ["event", "parent"] });
      
      // Invalidar perfil público (UserPublicScreen usa ['user-rsvps', userId])
      queryClient.invalidateQueries({ queryKey: ["user-rsvps"] });
      
      console.log('[useUpdateRSVP] Cache invalidation completed');
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
      console.log('[useRemoveRSVP] Success, invalidating cache for eventDateId:', variables);
      
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
      
      // Forzar refetch de las queries específicas
      queryClient.refetchQueries({ queryKey: ["rsvp", "user", variables] });
      queryClient.refetchQueries({ queryKey: ["rsvp", "stats", variables] });
      
      // Invalidar perfil público (UserPublicScreen usa ['user-rsvps', userId])
      queryClient.invalidateQueries({ queryKey: ["user-rsvps"] });
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
  
  const handleRSVP = async (status: RSVPStatus | null) => {
    if (!eventDateId) return;
    
    console.log('[useEventRSVP] handleRSVP called with:', { eventDateId, status });
    
    try {
      // Si se pasa null, removemos el RSVP
      if (status === null) {
        console.log('[useEventRSVP] Removing RSVP for eventDateId:', eventDateId);
        await removeRSVP.mutateAsync(eventDateId);
      } else {
        // Si se pasa 'interesado', lo actualizamos
        console.log('[useEventRSVP] Updating RSVP for eventDateId:', eventDateId, 'status:', status);
        await updateRSVP.mutateAsync({ eventDateId, status });
      }
      
      console.log('[useEventRSVP] RSVP operation completed successfully');
    } catch (error) {
      console.error('[useEventRSVP] Error updating RSVP:', error);
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
    toggleInterested: () => handleRSVP(userRSVP.data === 'interesado' ? null : 'interesado'),
    isUpdating: updateRSVP.isPending || removeRSVP.isPending,
    
    // Estados de mutación
    updateError: updateRSVP.error,
    removeError: removeRSVP.error
  };
}
