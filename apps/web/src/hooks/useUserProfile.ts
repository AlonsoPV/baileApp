import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from '@/contexts/AuthProvider';
import { buildSafePatch } from "../utils/safePatch";
import { normalizeSocialInput, normalizeQuestions } from "../utils/normalize";

export type ProfileUser = {
  user_id: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  rol_baile?: 'lead' | 'follow' | 'ambos' | null;
  ritmos_seleccionados?: string[]; // catálogo (RITMOS_CATALOG)
  ritmos?: number[];
  zonas?: number[];
  media?: any[]; // ⚠️ NO actualizar desde este hook
  onboarding_complete?: boolean; // ⚠️ NO actualizar desde este hook
  respuestas?: Record<string, any>;
  redes_sociales?: Record<string, any>;
  updated_at?: string; // Para rehidratación confiable
  created_at?: string; // Para mostrar "miembro desde" en el perfil
};

const KEY = (uid?: string) => ["profile", "me", uid];

export function useUserProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: KEY(user?.id),
    enabled: !!user?.id && typeof user.id === 'string' && user.id.length > 0,
    queryFn: async () => {
      if (!user?.id || typeof user.id !== 'string') {
        throw new Error('Usuario sin ID válido');
      }
      
      const { data, error } = await supabase
        .from("profiles_user")
        .select("user_id, display_name, bio, avatar_url, rol_baile, ritmos_seleccionados, ritmos, zonas, respuestas, redes_sociales, updated_at, created_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileUser | null;
    },
    staleTime: 1000 * 30, // 30 segundos - perfil puede cambiar pero no tan frecuentemente
    gcTime: 1000 * 60 * 5, // 5 minutos en cache
    retry: 1, // Reducir retries para onboarding más rápido
    retryDelay: 500, // Reducir delay entre retries
    refetchOnWindowFocus: false, // No refetch automático en onboarding
    refetchOnMount: false, // Usar cache si está disponible
  });

  const updateFields = useMutation({
    mutationFn: async (next: Partial<ProfileUser>) => {
      if (!user?.id) throw new Error("No user");
      
      try {
        const prev = profile.data || {};
        
        // 🚫 Blindaje: JAMÁS mandar media ni onboarding_complete desde aquí
        const { media, onboarding_complete, ...candidate } = next;

        // Normalizar datos antes del patch
        const normalizedCandidate = {
          ...candidate,
          respuestas: {
            ...candidate.respuestas,
            redes: normalizeSocialInput(candidate.respuestas?.redes || {}),
            ...normalizeQuestions(candidate.respuestas || {})
          }
        };

        // Usar buildSafePatch para merge inteligente
        const patch = buildSafePatch(prev, normalizedCandidate, { 
          allowEmptyArrays: ["ritmos_seleccionados", "ritmos", "zonas"] as any 
        });

        if (Object.keys(patch).length === 0) {
          console.log("[useUserProfile] No changes to save");
          return;
        }

        // Diagnóstico en desarrollo
        if (import.meta.env.MODE === "development") {
          console.log("[useUserProfile] PATCH:", patch);
        }

        // Usar RPC merge para actualizaciones seguras (ya hace upsert internamente)
        const { error: rpcError } = await supabase.rpc("merge_profiles_user", {
          p_user_id: user.id,
          p_patch: patch,
        });
        
        if (rpcError) {
          // Si el RPC falla, intentar upsert directo como fallback
          if (import.meta.env.MODE === "development") {
            console.warn("[useUserProfile] RPC failed, trying direct upsert:", rpcError);
          }
          const { error: upsertError } = await supabase
            .from("profiles_user")
            .upsert({ user_id: user.id, ...(patch as any) }, { onConflict: 'user_id' });
          if (upsertError) {
            console.error("[useUserProfile] Upsert fallback failed:", upsertError);
            throw upsertError;
          }
        }
      } catch (e: any) {
        console.error("[useUserProfile] Caught error:", e);
        throw e;
      }
    },
    onSuccess: async () => {
      // Invalidar queries en paralelo para mejor rendimiento (no bloquea la UI)
      Promise.all([
        qc.invalidateQueries({ queryKey: KEY(user?.id) }),
        qc.invalidateQueries({ queryKey: ["onboarding-status", user?.id] }),
        qc.invalidateQueries({ queryKey: ["profile", "media", user?.id] }),
      ]).catch(err => {
        if (import.meta.env.MODE === "development") {
          console.warn("[useUserProfile] Error invalidating queries:", err);
        }
      });
    },
  });

  async function refetchProfile() {
    return qc.fetchQuery({ queryKey: KEY(user?.id) });
  }

  return {
    profile: profile.data,
    isLoading: profile.isLoading,
    updateProfileFields: updateFields.mutateAsync,
    refetch: profile.refetch,
    refetchProfile,
  };
}
