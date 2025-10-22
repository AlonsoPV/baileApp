import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export type RoleType = 'organizador' | 'maestro' | 'academia' | 'marca';

export type RoleRequest = {
  id: number;
  user_id: string;
  role: RoleType;
  note?: string | null;
  status: 'pendiente' | 'aprobado' | 'rechazado';
  created_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

export function useMyRoleRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["role-requests", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<RoleRequest[]> => {
      const { data, error } = await supabase
        .from("role_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as RoleRequest[];
    }
  });
}

export function useRequestRole() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ role, note }: { role: RoleType; note?: string }) => {
      console.log('[useRequestRole] Requesting role:', { role, note });
      const { error } = await supabase
        .from("role_requests")
        .insert({ user_id: user!.id, role, note: note || null });
      if (error) {
        console.error('[useRequestRole] Error:', error);
        throw error;
      }
      console.log('[useRequestRole] Success');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role-requests", user?.id] });
    }
  });
}

/** Admin hooks */
export function useAdminRoleRequests(status?: 'pendiente' | 'aprobado' | 'rechazado') {
  return useQuery({
    queryKey: ["admin-role-requests", status],
    queryFn: async (): Promise<RoleRequest[]> => {
      console.log('[useAdminRoleRequests] Fetching requests with status:', status);
      let q = supabase
        .from("role_requests")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (status) q = q.eq("status", status);
      
      const { data, error } = await q;
      if (error) {
        console.error('[useAdminRoleRequests] Error:', error);
        throw error;
      }
      console.log('[useAdminRoleRequests] Success:', data?.length, 'requests');
      return data as RoleRequest[];
    }
  });
}

export function useApproveRoleRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approve, note }: { id: number; approve: boolean; note?: string }) => {
      console.log('[useApproveRoleRequest] Approving request:', { id, approve, note });
      const { error } = await supabase.rpc("approve_role_request", {
        p_request_id: id,
        p_approve: approve,
        p_note: note || null
      });
      if (error) {
        console.error('[useApproveRoleRequest] Error:', error);
        throw error;
      }
      console.log('[useApproveRoleRequest] Success');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-role-requests"] });
    }
  });
}

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    }
  });
}

