import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface UserMeta {
  name: string;
  bio?: string;
  route?: string;
}

/**
 * Hook para obtener metadata de usuarios (nombre, bio, ruta de perfil)
 * Optimizado con React Query para evitar fetches repetidos
 * 
 * @param userIds - Array de user IDs para obtener metadata
 */
export function useUserMeta(userIds: string[]) {
  return useQuery<Record<string, UserMeta>>({
    queryKey: ['user-meta', userIds.sort().join(',')],
    enabled: userIds.length > 0,
    queryFn: async () => {
      if (userIds.length === 0) return {};

      // Fetch profiles y roles en paralelo
      const [{ data: profiles, error: profilesError }, { data: rolesData, error: rolesError }] = await Promise.all([
        supabase
          .from('profiles_user')
          .select('user_id, display_name, email, bio')
          .in('user_id', userIds),
        supabase
          .from('user_roles')
          .select('user_id, role_slug')
          .in('user_id', userIds)
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;

      // Mapear roles por usuario
      const roleByUser = new Map<string, string>();
      (rolesData || []).forEach((r: any) => {
        if (r?.user_id && r?.role_slug) {
          roleByUser.set(r.user_id, r.role_slug);
        }
      });

      // Construir mapa de metadata
      const map: Record<string, UserMeta> = {};
      (profiles || []).forEach((p: any) => {
        const name = p.display_name || p.email || p.user_id;
        const role = roleByUser.get(p.user_id);
        let route: string | undefined = undefined;
        
        if (role === 'organizador') route = `/organizer/${p.user_id}`;
        if (role === 'maestro') route = `/maestro/${p.user_id}`;
        if (role === 'academia') route = `/academia/${p.user_id}`;
        
        map[p.user_id] = { name, bio: p.bio, route };
      });

      return map;
    },
    staleTime: 1000 * 60, // 1 minuto - metadata de usuarios cambia poco
    gcTime: 1000 * 60 * 5, // 5 minutos en cache
  });
}

