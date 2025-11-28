import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useEventDatesByParent(parentId?: number) {
  return useQuery({
    queryKey: ["event", "dates", parentId],
    queryFn: async () => {
      if (!parentId) return [];
      console.log('[useEventDatesByParent] Fetching dates for parent:', parentId);
      const { data, error } = await supabase
        .from("events_date")
        .select("*")
        .eq("parent_id", parentId)
        .order("fecha", { ascending: true });
      if (error) {
        console.error('[useEventDatesByParent] Error:', error);
        throw error;
      }
      console.log('[useEventDatesByParent] Success:', data);
      return data || [];
    },
    enabled: !!parentId
  });
}

export function useEventDate(dateId?: number) {
  return useQuery({
    queryKey: ["event", "date", dateId],
    queryFn: async () => {
      console.log('[useEventDate] Fetching date with ID:', dateId);
      if (!dateId) {
        console.log('[useEventDate] No dateId provided, returning null');
        return null;
      }
      
      const { data, error } = await supabase
        .from("events_date")
        .select("*")
        .eq("id", dateId)
        .maybeSingle();
        
      console.log('[useEventDate] Supabase response:', { data, error });
      
      if (error) {
        console.error('[useEventDate] Supabase error:', error);
        console.error('[useEventDate] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('[useEventDate] Returning data:', data);
      return data;
    },
    enabled: !!dateId
  });
}

export function useCreateEventDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      console.log('[useCreateEventDate] Payload received:', payload);
      
      const { data, error } = await supabase.from("events_date")
        .insert(payload).select("*").single();
      
      if (error) {
        console.error('[useCreateEventDate] Supabase error:', error);
        console.error('[useCreateEventDate] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('[useCreateEventDate] Success:', data);
      return data;
    },
    onSuccess: (row) => {
      // Invalidar con las keys correctas que usa useDatesByParent
      if (row.parent_id) {
        qc.invalidateQueries({ queryKey: ["dates", row.parent_id] });
        qc.invalidateQueries({ queryKey: ["event", "dates", row.parent_id] });
      }
      qc.invalidateQueries({ queryKey: ["dates"] }); // Invalidar todas las fechas
      qc.invalidateQueries({ queryKey: ["event", "date", row.id] });
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["parents"] }); // Refrescar lista de parents
    }
  });
}

export function useUpdateEventDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: any }) => {
      const { data, error } = await supabase.from("events_date")
        .update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      // Invalidar con las keys correctas que usa useDatesByParent
      qc.invalidateQueries({ queryKey: ["dates", row.parent_id] });
      qc.invalidateQueries({ queryKey: ["dates"] }); // Invalidar todas las fechas
      qc.invalidateQueries({ queryKey: ["event", "date", row.id] });
      qc.invalidateQueries({ queryKey: ["event", "dates", row.parent_id] });
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["parents"] }); // Refrescar lista de parents
    }
  });
}