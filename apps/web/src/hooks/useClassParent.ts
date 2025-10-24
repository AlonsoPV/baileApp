import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface ClassParent {
  id: number;
  academy_id: number;
  nombre: string;
  descripcion?: string;
  sede_general?: string;
  estilos: number[];
  media: any[];
  estado_aprobacion: 'borrador' | 'en_revision' | 'aprobado' | 'rechazado';
  created_at: string;
  updated_at: string;
}

export function useCreateClassParent() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ academyId, patch }: { academyId: number; patch: Partial<ClassParent> }) => {
      console.log('🔍 [useClassParent] Creando clase padre...');
      console.log('📥 [useClassParent] Academy ID:', academyId);
      console.log('📥 [useClassParent] Patch:', patch);

      const { data, error } = await supabase.rpc('create_class_parent', {
        p_academy_id: academyId,
        p_patch: patch
      });

      if (error) {
        console.error('[useClassParent] Error creando clase:', error);
        throw error;
      }

      console.log('✅ [useClassParent] Clase creada exitosamente, ID:', data);
      return data;
    },
    onSuccess: (classId, { academyId }) => {
      qc.invalidateQueries({ queryKey: ["classes", "by-academy", academyId] });
      qc.invalidateQueries({ queryKey: ["academy", "my"] });
    },
  });
}

export function useUpdateClassParent() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ classId, patch }: { classId: number; patch: Partial<ClassParent> }) => {
      console.log('🔍 [useClassParent] Actualizando clase padre...');
      console.log('📥 [useClassParent] Class ID:', classId);
      console.log('📥 [useClassParent] Patch:', patch);

      const { error } = await supabase.rpc('merge_classes_parent', {
        p_parent_id: classId,
        p_patch: patch
      });

      if (error) {
        console.error('[useClassParent] Error actualizando clase:', error);
        throw error;
      }

      console.log('✅ [useClassParent] Clase actualizada exitosamente');
    },
    onSuccess: (_, { classId }) => {
      qc.invalidateQueries({ queryKey: ["class", classId] });
      qc.invalidateQueries({ queryKey: ["classes", "by-academy"] });
    },
  });
}

export function useListClassParentsByAcademy(academyId: number) {
  return useQuery({
    queryKey: ["classes", "by-academy", academyId],
    enabled: !!academyId,
    queryFn: async (): Promise<ClassParent[]> => {
      const { data, error } = await supabase
        .from("classes_parent")
        .select("*")
        .eq("academy_id", academyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useClassParent(classId: number) {
  return useQuery({
    queryKey: ["class", classId],
    enabled: !!classId,
    queryFn: async (): Promise<ClassParent | null> => {
      const { data, error } = await supabase
        .from("classes_parent")
        .select("*")
        .eq("id", classId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
