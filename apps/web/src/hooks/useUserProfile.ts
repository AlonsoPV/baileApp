import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { guardedPatch } from "../utils/safeUpdate";

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
        .select("*")
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

        // Usar guardedPatch para evitar pérdida de datos accidental
        const patch = guardedPatch<ProfileUser>(prev, candidate, {
          allowEmptyArrays: ["ritmos", "zonas"], // permitir vaciar intencionalmente
          blockEmptyStrings: ["display_name"],    // no permitir nombre vacío
        });

        if (Object.keys(patch).length === 0) {
          console.log("[useUserProfile] No changes to save");
          return;
        }

        // Diagnóstico en desarrollo
        if (import.meta.env.MODE === "development") {
          console.log("[useUserProfile] PATCH:", patch);
        }

        // Usar RPC merge para actualizaciones seguras
        const { error } = await supabase.rpc("merge_profiles_user", {
          p_user_id: user.id,
          p_patch: patch,
        });
        
        if (error) {
          console.error("[useUserProfile] Error updating profile:", error);
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

  return {
    profile: profile.data,
    isLoading: profile.isLoading,
    updateProfileFields: updateFields.mutateAsync,
    refetch: profile.refetch,
  };
}
