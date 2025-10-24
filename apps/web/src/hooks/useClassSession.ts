import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface ClassSession {
  id: number;
  parent_id: number;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  lugar?: string;
  direccion?: string;
  ciudad?: string;
  zona?: number;
  estilos: number[];
  requisitos?: string;
  cronograma: any[];
  costos: any[];
  media: any[];
  estado_publicacion: 'borrador' | 'publicado';
  created_at: string;
  updated_at: string;
}

export function useCreateClassSession() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ parentId, patch }: { parentId: number; patch: Partial<ClassSession> }) => {
      console.log('🔍 [useClassSession] Creando sesión de clase...');
      console.log('📥 [useClassSession] Parent ID:', parentId);
      console.log('📥 [useClassSession] Patch:', patch);

      const { data, error } = await supabase.rpc('create_class_session', {
        p_parent_id: parentId,
        p_patch: patch
      });

      if (error) {
        console.error('[useClassSession] Error creando sesión:', error);
        throw error;
      }

      console.log('✅ [useClassSession] Sesión creada exitosamente, ID:', data);
      return data;
    },
    onSuccess: (sessionId, { parentId }) => {
      qc.invalidateQueries({ queryKey: ["sessions", "by-parent", parentId] });
      qc.invalidateQueries({ queryKey: ["class", parentId] });
    },
  });
}

export function useUpdateClassSession() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, patch }: { sessionId: number; patch: Partial<ClassSession> }) => {
      console.log('🔍 [useClassSession] Actualizando sesión de clase...');
      console.log('📥 [useClassSession] Session ID:', sessionId);
      console.log('📥 [useClassSession] Patch:', patch);

      const { error } = await supabase.rpc('merge_classes_session', {
        p_session_id: sessionId,
        p_patch: patch
      });

      if (error) {
        console.error('[useClassSession] Error actualizando sesión:', error);
        throw error;
      }

      console.log('✅ [useClassSession] Sesión actualizada exitosamente');
    },
    onSuccess: (_, { sessionId }) => {
      qc.invalidateQueries({ queryKey: ["session", sessionId] });
      qc.invalidateQueries({ queryKey: ["sessions", "by-parent"] });
    },
  });
}

export function useListSessionsByParent(parentId: number) {
  return useQuery({
    queryKey: ["sessions", "by-parent", parentId],
    enabled: !!parentId,
    queryFn: async (): Promise<ClassSession[]> => {
      const { data, error } = await supabase
        .from("classes_session")
        .select("*")
        .eq("parent_id", parentId)
        .order("fecha", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useClassSession(sessionId: number) {
  return useQuery({
    queryKey: ["session", sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<ClassSession | null> => {
      const { data, error } = await supabase
        .from("classes_session")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function usePublicSessions() {
  return useQuery({
    queryKey: ["sessions", "public"],
    queryFn: async (): Promise<ClassSession[]> => {
      const { data, error } = await supabase
        .from("classes_session")
        .select(`
          *,
          classes_parent!inner(
            *,
            profiles_academy!inner(*)
          )
        `)
        .eq("estado_publicacion", "publicado")
        .order("fecha", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}
