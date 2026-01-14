import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Tag } from '../types/db';
import { withTimeout } from '../utils/withTimeout';

const TAGS_QUERY_TIMEOUT_MS = 7_000;

async function fetchTags(tipo?: 'ritmo' | 'zona'): Promise<Tag[]> {
  let query = supabase
    .from('tags')
    .select('*')
    .order('nombre', { ascending: true });

  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  const { data, error } = await withTimeout(query, TAGS_QUERY_TIMEOUT_MS, 'Load tags');
  if (error) throw new Error(error.message);
  return data || [];
}

export function useTags(tipo?: 'ritmo' | 'zona') {
  const query = useQuery({
    queryKey: ['tags', tipo],
    queryFn: () => fetchTags(tipo),
    staleTime: 1000 * 60 * 5, // 5 minutos - tags cambian poco
    gcTime: 1000 * 60 * 10, // 10 minutos en cache
  });

  // Si no se especifica tipo, separar ritmos y zonas del resultado
  if (!tipo) {
    const allTags = query.data || [];
    return {
      ...query,
      ritmos: allTags.filter(t => t.tipo === 'ritmo'),
      zonas: allTags.filter(t => t.tipo === 'zona'),
    };
  }

  // Si se especifica tipo, devolver en el campo correspondiente
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

