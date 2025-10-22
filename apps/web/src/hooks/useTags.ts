import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Tag } from '../types/db';

async function fetchTags(tipo?: 'ritmo' | 'zona'): Promise<Tag[]> {
  let query = supabase
    .from('tags')
    .select('*')
    .order('nombre', { ascending: true });

  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export function useTags(tipo?: 'ritmo' | 'zona') {
  const query = useQuery({
    queryKey: ['tags', tipo],
    queryFn: () => fetchTags(tipo),
  });

  return {
    ...query,
    ritmos: tipo === 'ritmo' ? (query.data || []) : [],
    zonas: tipo === 'zona' ? (query.data || []) : [],
  };
}

// Convenience hooks for specific tag types
export function useRitmos() {
  return useTags('ritmo');
}

export function useZonas() {
  return useTags('zona');
}

