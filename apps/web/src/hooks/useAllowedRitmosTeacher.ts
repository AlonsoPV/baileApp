import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { useMyRoles } from './useRoles';

type AllowedResult = { allowedIds: string[]; isLoading: boolean; error?: any };

export function useAllowedRitmosTeacher(): AllowedResult {
  const { user } = useAuth();
  const { data: roles = [] } = useMyRoles();
  const isTeacher = Array.isArray(roles) && roles.some((r: any) => r.role_slug === 'maestro');

  const q = useQuery<string[]>({
    enabled: Boolean(user?.id) && isTeacher,
    queryKey: ['allowed-ritmos-teacher', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_teacher')
        .select('ritmos_seleccionados')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      const list = (data?.ritmos_seleccionados || []) as string[];
      return list;
    },
    staleTime: 60_000,
  });

  return {
    allowedIds: isTeacher ? (q.data || []) : [],
    isLoading: isTeacher && (q.isLoading || q.isFetching),
    error: q.error,
  };
}


