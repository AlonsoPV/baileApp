import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

type Status = {
  complete: boolean;
  exists: boolean;
  profile: any;
  reason?: 'NO_SESSION' | 'NO_PROFILE' | 'INCOMPLETE' | 'ERROR';
};

async function fetchStatus(userId: string): Promise<Status> {
  // 1) Perfil con timeout
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort('timeout'), 5000); // 5s max
  
  try {
    const { data, error } = await supabase
      .from("profiles_user")
      .select("user_id, display_name, ritmos, zonas, respuestas")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    clearTimeout(timeout);

    if (error) {
      console.error('[useOnboardingStatus] select profiles_user error:', error);
      return { complete: false, exists: false, profile: null, reason: 'ERROR' };
    }
    
    if (!data) return { complete: false, exists: false, profile: null, reason: 'NO_PROFILE' };

    const hasName = !!data.display_name && data.display_name.trim().length > 0;
    const hasR = Array.isArray(data.ritmos) && data.ritmos.length > 0;
    const hasZ = Array.isArray(data.zonas) && data.zonas.length > 0;
    const complete = hasName || hasR || hasZ;

    console.log('✅ [useOnboardingStatus] Profile complete:', complete);

    return { complete: true, exists: true, profile: data, reason: complete ? undefined : 'INCOMPLETE' };
  } catch (e: any) {
    clearTimeout(timeout);
    console.error('[useOnboardingStatus] exception:', e?.message || e);
    return { complete: false, exists: false, profile: null, reason: 'ERROR' };
  }
}

export function useOnboardingStatus() {
  const { user } = useAuth();
  
  const q = useQuery({
    queryKey: ["onboarding-status", user?.id],
    queryFn: () => fetchStatus(user!.id),
    enabled: !!user?.id,
    staleTime: 10_000, // evita refetchs en cascada
    retry: false,      // no hagas retry infinito en prod
    refetchOnWindowFocus: false,
  });

  console.log('📊 [useOnboardingStatus] Query state:', {
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    error: q.error,
    data: q.data
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
