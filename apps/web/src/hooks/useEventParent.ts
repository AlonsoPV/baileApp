import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { perfLog } from "../utils/perfLog";

export function useEventParent(parentId?: number) {
  return useQuery({
    queryKey: ["event", "parent", parentId],
    queryFn: async () => {
      if (!parentId) return null;
      
      const start = performance.now();
      // Try to fetch with ubicaciones first, fallback if column doesn't exist
      let query = supabase
        .from("events_parent")
        .select("id, organizer_id, nombre, biografia, descripcion, estilos, zonas, sede_general, faq, media, ubicaciones, created_at, updated_at")
        .eq("id", parentId);
      
      const { data, error } = await query.maybeSingle();
      const end = performance.now();
      perfLog({ hook: 'useEventParent', step: 'events_parent_by_id', duration_ms: end - start, rows: data ? 1 : 0, data, error, extra: { parentId } });
      
      if (error) {
        // If the error is about the record not existing, return null instead of throwing
        if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
          return null;
        }
        // If the error is about a missing column (like ubicaciones), try without that column
        if (error.code === '42703' && error.message?.includes('ubicaciones')) {
          const retryStart = performance.now();
          // Fetch again without ubicaciones
          const { data: retryData, error: retryError } = await supabase
            .from("events_parent")
            .select("id, organizer_id, nombre, biografia, descripcion, estilos, zonas, sede_general, faq, media, created_at, updated_at")
            .eq("id", parentId)
            .maybeSingle();
          
          if (retryError) {
            throw retryError;
          }
          const retryEnd = performance.now();
          perfLog({ hook: 'useEventParent', step: 'events_parent_by_id_retry', duration_ms: retryEnd - retryStart, rows: retryData ? 1 : 0, data: retryData, extra: { parentId } });
          return retryData;
        }
        throw error;
      }
      
      return data;
    },
    enabled: !!parentId,
    retry: (failureCount, error: any) => {
      // Don't retry if the record doesn't exist
      if (error?.code === 'PGRST116' || error?.message?.includes('No rows found')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

export function useCreateEventParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      organizer_id: number;
      nombre: string;
      descripcion?: string;
      biografia?: string;
      estilos?: number[];
      zonas?: number[];
      sede_general?: string;
      ubicaciones?: any[];
      faq?: any[];
      media?: any;
    }) => {
      const { data, error } = await supabase.from("events_parent")
        .insert(payload).select("*").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["organizer", "events", row.organizer_id] });
      qc.invalidateQueries({ queryKey: ["event", "parent", row.id] });
    }
  });
}

export function useUpdateEventParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: any }) => {
      const { data, error } = await supabase.from("events_parent")
        .update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["event", "parent", row.id] });
      qc.invalidateQueries({ queryKey: ["organizer", "events", row.organizer_id] });
    }
  });
}