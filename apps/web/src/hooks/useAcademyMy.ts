import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface AcademyProfile {
  id: number;
  user_id: string;
  nombre_publico: string;
  bio?: string;
  sede_general?: string;
  estilos: number[];
  media: any[];
  redes_sociales?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  respuestas?: {
    redes?: {
      instagram?: string;
      facebook?: string;
      whatsapp?: string;
    };
    dato_curioso?: string;
    gusta_bailar?: string;
  };
  estado_aprobacion: 'borrador' | 'en_revision' | 'aprobado' | 'rechazado';
  created_at: string;
  updated_at: string;
}

export function useAcademyMy() {
  return useQuery({
    queryKey: ["academy", "my"],
    queryFn: async (): Promise<AcademyProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles_academy")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        // PGRST116 = No rows found (esperado cuando no hay perfil)
        if (error.code === 'PGRST116') {
          return null;
        }
        // Error 406 = Not Acceptable (posible problema de RLS o tabla no existe)
        if (error.code === '406' || error.status === 406) {
          console.warn('[useAcademyMy] Error 406 al cargar perfil (posible problema de RLS):', error);
          // Retornar null en lugar de lanzar error para evitar bloqueo de UI
          return null;
        }
        // Para otros errores, lanzar para que React Query los maneje
        console.error('[useAcademyMy] Error inesperado al cargar perfil:', error);
        throw error;
      }
      return data;
    },
    retry: (failureCount, error: any) => {
      // No reintentar si es error 406 o PGRST116
      if (error?.code === '406' || error?.code === 'PGRST116' || error?.status === 406) {
        return false;
      }
      // Reintentar hasta 2 veces para otros errores
      return failureCount < 2;
    },
  });
}

export function useUpsertAcademy() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async (patch: Partial<AcademyProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      console.log('🔍 [useAcademyMy] ===== INICIO GUARDADO ACADEMIA =====');
      console.log('📥 [useAcademyMy] Datos recibidos:', patch);

      const { error } = await supabase.rpc('merge_profiles_academy', {
        p_user_id: user.id,
        p_patch: patch
      });

      if (error) {
        console.error('[useAcademyMy] Error en RPC:', error);
        throw error;
      }

      console.log('✅ [useAcademyMy] merge_profiles_academy ejecutado exitosamente');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy", "my"] });
    },
  });
}

export function useSubmitAcademyForReview() {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      console.log('🔍 [useAcademyMy] Enviando academia a revisión...');

      const { error } = await supabase.rpc('submit_academy_for_review', {
        p_user_id: user.id
      });

      if (error) {
        console.error('[useAcademyMy] Error enviando a revisión:', error);
        throw error;
      }

      console.log('✅ [useAcademyMy] Academia enviada a revisión exitosamente');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academy", "my"] });
    },
  });
}
