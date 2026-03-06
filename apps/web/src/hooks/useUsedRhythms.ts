import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ExploreContext } from "@/filters/exploreContext";

type RhythmRow = {
  id: number;
  nombre: string;
  slug: string | null;
};

export function useUsedRhythmsByContext(context: ExploreContext | null) {
  const q = useQuery<RhythmRow[]>({
    queryKey: ["used_rhythms", context ?? "none"],
    enabled: !!context,
    queryFn: async () => {
      if (!context) return [];
      const { data, error } = await supabase.rpc("rpc_get_used_rhythms_by_context", {
        p_context: context,
      });
      if (error) throw error;
      return (data || []) as RhythmRow[];
    },
    staleTime: 60_000,
  });

  const rhythmIds = React.useMemo(
    () => Array.from(new Set((q.data || []).map((r) => r.id).filter((id) => Number.isFinite(id)))),
    [q.data],
  );

  return {
    rhythms: q.data || [],
    rhythmIds,
    isLoading: q.isLoading,
    isFetched: q.isFetched,
    error: q.error,
  };
}

// Backward-compatible alias while migrating call sites.
export const useUsedRhythms = useUsedRhythmsByContext;
