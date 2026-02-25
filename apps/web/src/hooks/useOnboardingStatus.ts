// path: src/hooks/useOnboardingStatus.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "@/contexts/AuthProvider";

type OnboardingStatus = {
  exists: boolean;
  complete: boolean;
  profile: {
    user_id: string;
    display_name: string | null;
    ritmos: any[] | null;
    zonas: any[] | null;
    onboarding_complete: boolean | null;
  } | null;
};

export function useOnboardingStatus() {
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const q = useQuery<OnboardingStatus>({
    // ✅ KEY ÚNICA (no colisiona con useUserProfile)
    queryKey: ["onboarding-status", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_user")
        .select("user_id, display_name, ritmos, zonas, onboarding_complete")
        .eq("user_id", uid!)
        .maybeSingle();

      if (error) throw error;

      // Fallback computado (si un día re-habilitas onboarding)
      const computedComplete =
        !!data?.onboarding_complete ||
        (!!data?.display_name &&
          (data?.ritmos?.length || 0) > 0 &&
          (data?.zonas?.length || 0) > 0);

      return {
        exists: !!data,
        // ✅ Si está deshabilitado, deja true.
        // Si lo reactivas: complete: computedComplete
        complete: true,
        profile: (data as any) ?? null,
      };
    },
    staleTime: 60_000,
    gcTime: 300_000,
  });

  return {
    loading: q.isLoading || q.isFetching,
    error: (q.error as Error) ?? null,
    exists: q.data?.exists ?? false,
    complete: q.data?.complete ?? false,
    profile: q.data?.profile ?? null,
    refetch: q.refetch,
  };
}