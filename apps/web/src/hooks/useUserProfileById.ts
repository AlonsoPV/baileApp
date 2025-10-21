import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useUserProfileById(userId?: string) {
  return useQuery({
    queryKey: ["profile", "public", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("profiles_user")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data; // { display_name, bio, avatar_url, ritmos, zonas, media, ... }
    },
  });
}
