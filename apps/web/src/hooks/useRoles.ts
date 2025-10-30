import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Role, UserRole, RoleRequest, RoleSlug, RoleRequestStatus } from '@/types/roles';
import { useAuth } from '@/contexts/AuthProvider';

export function useMyRoles() {
  const { user } = useAuth();
  return useQuery<UserRole[]>({
    queryKey: ['user_roles', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id,user_id,role_slug,granted_at')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}

export function useRolesCatalog() {
  return useQuery<Role[]>({
    queryKey: ['roles_catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('roles').select('id,slug,name');
      if (error) throw error;
      return data || [];
    },
    staleTime: Infinity,
  });
}

export function useMyRoleRequests() {
  const { user } = useAuth();
  return useQuery<RoleRequest[]>({
    queryKey: ['role_requests_me', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_requests')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateRoleRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      role_slug: RoleSlug;
      full_name: string;
      email: string;
      phone: string;
      socials: RoleRequest['socials'];
    }) => {
      const { error } = await supabase.from('role_requests').insert({
        user_id: user!.id,
        ...payload,
        // Compat: algunos esquemas usan columna "role" en vez de "role_slug"
        role: (payload as any).role_slug,
        status: 'pending',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role_requests_me', user?.id] });
    },
  });
}

export function useAdminRoleRequests(status?: RoleRequestStatus) {
  return useQuery<RoleRequest[]>({
    queryKey: ['role_requests_admin', status],
    queryFn: async () => {
      let q = supabase.from('role_requests').select('*').order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateRoleRequestStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; status: RoleRequestStatus; admin_note?: string }) => {
      const { error } = await supabase.from('role_requests').update({
        status: payload.status,
        admin_note: payload.admin_note ?? null,
        reviewed_at: new Date().toISOString(),
      }).eq('id', payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role_requests_admin'] });
      qc.invalidateQueries({ queryKey: ['user_roles'] });
    },
  });
}


