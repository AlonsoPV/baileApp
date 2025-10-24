/**
 * Hook para manejar el perfil del organizador con edición completa persistente
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { buildSafePatch } from "../utils/safePatch";
import { normalizeSocialInput } from "../utils/normalize";

export type ProfileOrganizer = {
  id: string;
  nombre_publico?: string | null;
  bio?: string | null;
  estilos?: number[];
  media?: any;
  estado_aprobacion?: string | null;
  updated_at?: string;
};

const KEY = (id: string) => ["profile", "organizer", id];

export function useOrganizerProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: KEY(user?.id || ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_organizer")
        .select("id, nombre_publico, bio, estilos, media, estado_aprobacion, updated_at")
        .eq("id", user?.id)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    },
    enabled: !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: async (next: Partial<ProfileOrganizer>) => {
      if (!user?.id) throw new Error("No user ID");

      const prev = query.data || {};
      
      // Normalizar datos antes del patch
      const normalizedCandidate = {
        ...next,
        estilos: next.estilos || [],
        media: next.media || {}
      };

      // Usar buildSafePatch para merge inteligente
      const patch = buildSafePatch(prev, normalizedCandidate, { 
        allowEmptyArrays: ["estilos"] as any 
      });

      if (Object.keys(patch).length === 0) {
        console.log("[useOrganizerProfile] No changes to save");
        return;
      }

      // Diagnóstico en desarrollo
      if (import.meta.env.MODE === "development") {
        console.log("[useOrganizerProfile] PREV:", prev);
        console.log("[useOrganizerProfile] NEXT:", normalizedCandidate);
        console.log("[useOrganizerProfile] PATCH:", patch);
      }

      // Usar RPC merge para actualizaciones seguras
      const { error } = await supabase.rpc("merge_profiles_organizer", {
        p_organizer_id: user.id,
        p_patch: patch,
      });

      if (error) {
        console.error("[useOrganizerProfile] Error updating profile:", error);
        throw error;
      }

      console.log("[useOrganizerProfile] Profile updated successfully");
    },
    onSuccess: async () => {
      console.log("[useOrganizerProfile] Invalidating profile cache");
      await qc.invalidateQueries({ queryKey: KEY(user?.id || "") });
    },
  });

  async function refetchProfile() {
    return qc.fetchQuery({ queryKey: KEY(user?.id || "") });
  }

  return {
    profile: query.data,
    isLoading: query.isLoading,
    updateProfile: mutation.mutateAsync,
    refetchProfile,
  };
}
