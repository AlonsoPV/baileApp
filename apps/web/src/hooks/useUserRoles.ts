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
        .select('role_slug, created_at, id, user_id')
        .eq('user_id', userId!);
      if (error) throw error;
      return (data || []) as UserRole[];
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}


