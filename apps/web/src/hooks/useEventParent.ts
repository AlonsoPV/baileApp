import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useEventParent(parentId?: number) {
  return useQuery({
    queryKey: ["event", "parent", parentId],
    queryFn: async () => {
      console.log('[useEventParent] Fetching parent with ID:', parentId);
      if (!parentId) {
        console.log('[useEventParent] No parentId provided, returning null');
        return null;
      }
      
      const { data, error } = await supabase
        .from("events_parent")
        .select("id, organizer_id, nombre, biografia, descripcion, estilos, zonas, sede_general, ubicaciones, faq, media, created_at, updated_at")
        .eq("id", parentId)
        .maybeSingle();
        
      console.log('[useEventParent] Supabase response:', { data, error });
      
      if (error) {
        console.error('[useEventParent] Supabase error:', error);
        throw error;
      }
      
      console.log('[useEventParent] Returning data:', data);
      return data;
    },
    enabled: !!parentId
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