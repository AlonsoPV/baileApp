import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export function useOnboardingStatus() {
  const { user } = useAuth();

  const q = useQuery({
    queryKey: ["profile","me", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_user")
        .select("user_id, display_name, ritmos, zonas, onboarding_complete")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      
      // Si aún no existe fila, considéralo incompleto.
      return {
        exists: !!data,
        complete: !!data?.onboarding_complete,
        profile: data
      };
    },
    staleTime: 0,
  });

  return {
    loading: q.isLoading || q.isFetching,
    error: q.error as Error | null,
    exists: q.data?.exists ?? false,
    complete: q.data?.complete ?? false,
    profile: q.data?.profile ?? null,
    refetch: q.refetch,
  };
}
