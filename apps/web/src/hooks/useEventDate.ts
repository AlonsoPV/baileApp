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
    mutationFn: async (payload: any | any[]) => {
      // Soporte para crear una fecha o múltiples fechas en batch
      const isArray = Array.isArray(payload);
      const payloads = isArray ? payload : [payload];
      
      console.log(`[useCreateEventDate] Creating ${payloads.length} date(s)`);
      
      // Insertar todas las fechas en una sola operación (más eficiente)
      const { data, error } = await supabase
        .from("events_date")
        .insert(payloads)
        .select("*");
      
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
      
      console.log(`[useCreateEventDate] Success: ${data?.length || 0} date(s) created`);
      // Retornar array si se insertaron múltiples, o el primer elemento si fue uno solo
      return isArray ? (data || []) : (data?.[0] || null);
    },
    onMutate: async (payload) => {
      // Cancelar queries en progreso para evitar conflictos
      await qc.cancelQueries({ queryKey: ["event-dates", "by-organizer"] });
      await qc.cancelQueries({ queryKey: ["event-parents", "by-organizer"] });
      
      // Snapshot del estado anterior
      const previousDates = qc.getQueryData(["event-dates", "by-organizer"]);
      const previousParents = qc.getQueryData(["event-parents", "by-organizer"]);
      
      return { previousDates, previousParents };
    },
    onError: (err, payload, context) => {
      // Revertir en caso de error
      if (context?.previousDates) {
        qc.setQueryData(["event-dates", "by-organizer"], context.previousDates);
      }
      if (context?.previousParents) {
        qc.setQueryData(["event-parents", "by-organizer"], context.previousParents);
      }
    },
    onSuccess: (data) => {
      // Invalidar queries de forma optimizada
      const rows = Array.isArray(data) ? data : [data];
      const organizerIds = new Set<number>();
      const parentIds = new Set<number | null>();
      
      rows.forEach((row) => {
        if (row?.organizer_id) organizerIds.add(row.organizer_id);
        if (row?.parent_id) parentIds.add(row.parent_id);
      });
      
      // Invalidar queries principales (solo una vez)
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      
      // Invalidar queries específicas si existen
      parentIds.forEach((parentId) => {
        if (parentId) {
          qc.invalidateQueries({ queryKey: ["dates", parentId] });
          qc.invalidateQueries({ queryKey: ["event", "dates", parentId] });
        }
      });
    },
    onSettled: () => {
      // Asegurar que las queries se refresquen al final
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
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