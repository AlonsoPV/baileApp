import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { UserRole, RoleSlug } from '@/types/roles';

export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ['user_roles', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role_slug, granted_at')
        .eq('user_id', userId!);
      if (error) throw error;
      const rows = (data || []) as Array<{ user_id: string; role_slug?: string | null; granted_at?: string | null }>;
      return rows.map((r) => {
        const roleSlug = (r.role_slug ?? 'usuario') as RoleSlug;
        return {
          id: `${r.user_id}-${roleSlug}`,
          user_id: r.user_id,
          role_slug: roleSlug,
          created_at: r.granted_at ?? new Date().toISOString(),
        } satisfies UserRole;
      });
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}


