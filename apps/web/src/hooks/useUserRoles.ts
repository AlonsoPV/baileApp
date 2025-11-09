import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/roles';

export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ['user_roles', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      const rows = (data || []) as any[];
      // Normalizar: soportar 'role_slug' o 'role'
      return rows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        role_slug: (r.role_slug ?? r.role) as any,
        created_at: r.created_at,
      })) as UserRole[];
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}


