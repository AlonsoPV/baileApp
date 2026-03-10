import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ZoneContext } from "@/filters/exploreContext";

type ZoneRow = {
  id: number;
  nombre: string;
  slug: string | null;
};

export function useUsedZonesByContext(context: ZoneContext | null) {
  const q = useQuery<ZoneRow[]>({
    queryKey: ["used_zones", context ?? "none"],
    enabled: !!context,
    queryFn: async () => {
      if (!context) return [];
      const { data, error } = await supabase.rpc("rpc_get_used_zones_by_context", {
        p_context: context,
      });
      if (error) throw error;
      return (data || []) as ZoneRow[];
    },
    staleTime: 60_000,
  });

  const zoneIds = React.useMemo(
    () => Array.from(new Set((q.data || []).map((z) => z.id).filter((id) => Number.isFinite(id)))),
    [q.data],
  );

  return {
    zones: q.data || [],
    zoneIds,
    isLoading: q.isLoading,
    isFetched: q.isFetched,
    error: q.error,
  };
}

