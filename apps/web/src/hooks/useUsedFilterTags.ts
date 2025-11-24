import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type UsedTagRow = {
  tag_id: number;
  tipo: 'ritmo' | 'zona';
};

export function useUsedFilterTags() {
  const q = useQuery<UsedTagRow[]>({
    queryKey: ['used-filter-tags'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_get_used_tags');
      if (error) throw error;
      return (data || []) as UsedTagRow[];
    },
    staleTime: 60_000,
  });

  const usedRitmoIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          (q.data || [])
            .filter((row) => row.tipo === 'ritmo')
            .map((row) => row.tag_id),
        ),
      ),
    [q.data],
  );

  const usedZonaIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          (q.data || [])
            .filter((row) => row.tipo === 'zona')
            .map((row) => row.tag_id),
        ),
      ),
    [q.data],
  );

  // Log solo cuando los datos cambian (no en cada render)
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && q.isFetched && !q.isLoading) {
      // Ayuda a depurar por qué se ve todo el catálogo
      // Mira en la consola del navegador qué IDs llegan realmente del backend.
      // Si aquí están casi todos los IDs, el problema está en los datos/RPC, no en el filtro del frontend.
      // eslint-disable-next-line no-console
      console.log('[useUsedFilterTags]', {
        loading: q.isLoading,
        error: q.error,
        totalFromRpc: q.data?.length ?? 0,
        usedRitmoIds,
        usedZonaIds,
      });
    }
  }, [q.isFetched, q.isLoading, q.error, q.data?.length, usedRitmoIds.length, usedZonaIds.length]);

  return {
    usedRitmoIds,
    usedZonaIds,
    isLoading: q.isLoading,
    isFetched: q.isFetched,
    error: q.error,
  };
}


