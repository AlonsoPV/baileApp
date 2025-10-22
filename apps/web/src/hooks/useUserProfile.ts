import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { pickDefined } from "../utils/patch";

type ProfileUser = {
  user_id: string;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  ritmos?: number[];
  zonas?: number[];
  media?: any[]; // ⚠️ NO actualizar desde este hook
  onboarding_complete?: boolean; // ⚠️ NO actualizar desde este hook
  respuestas?: Record<string, any>;
};

const KEY = (uid?: string) => ["profile","me", uid];

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
    mutationFn: async (patch: Partial<ProfileUser>) => {
      if (!user?.id) throw new Error("No user");
      // 🚫 Blindaje: JAMÁS mandar media ni onboarding_complete desde aquí
      const { media, onboarding_complete, ...rest } = patch;
      const clean = pickDefined<ProfileUser>(rest);
      if (Object.keys(clean).length === 0) return;

      const { error } = await supabase
        .from("profiles_user")
        .update(clean)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(user?.id) }),
  });

  return {
    profile: profile.data,
    isLoading: profile.isLoading,
    updateProfileFields: updateFields.mutateAsync, // usa este para nombre/bio/ritmos/zonas
  };
}

