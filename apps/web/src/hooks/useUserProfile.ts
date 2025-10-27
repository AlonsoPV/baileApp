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
  ritmos?: number[];
  zonas?: number[];
  media?: any[]; // ⚠️ NO actualizar desde este hook
  onboarding_complete?: boolean; // ⚠️ NO actualizar desde este hook
  respuestas?: Record<string, any>;
  redes_sociales?: Record<string, any>;
  updated_at?: string; // Para rehidratación confiable
};

const KEY = (uid?: string) => ["profile", "me", uid];

export function useUserProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: KEY(user?.id),
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_user")
        .select("user_id, display_name, bio, avatar_url, ritmos, zonas, respuestas, updated_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as ProfileUser | null;
    },
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
          allowEmptyArrays: ["ritmos", "zonas"] as any 
        });

        if (Object.keys(patch).length === 0) {
          console.log("[useUserProfile] No changes to save");
          return;
        }

        // Diagnóstico en desarrollo
        if (import.meta.env.MODE === "development") {
          console.log("[useUserProfile] PREV:", prev);
          console.log("[useUserProfile] NEXT:", normalizedCandidate);
          console.log("[useUserProfile] PATCH:", patch);
        }

        // Usar RPC merge para actualizaciones seguras
        console.log("[useUserProfile] Llamando a merge_profiles_user con:", {
          p_user_id: user.id,
          p_patch: patch
        });
        
        const { error } = await supabase.rpc("merge_profiles_user", {
          p_user_id: user.id,
          p_patch: patch,
        });
        
        if (error) {
          console.error("[useUserProfile] Error updating profile:", error);
          console.error("[useUserProfile] Error details:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        console.log("[useUserProfile] Profile updated successfully");
      } catch (e: any) {
        console.error("[useUserProfile] Caught error:", e);
        throw e;
      }
    },
    onSuccess: async () => {
      console.log("[useUserProfile] Invalidating profile cache");
      await qc.invalidateQueries({ queryKey: KEY(user?.id) });
      await qc.invalidateQueries({ queryKey: ["profile", "media", user?.id] });
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
