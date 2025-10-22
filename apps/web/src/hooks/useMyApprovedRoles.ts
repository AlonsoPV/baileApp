import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export type RoleKey = "organizador" | "maestro" | "academia" | "marca";

export function useMyApprovedRoles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-approved-roles", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      console.log('[useMyApprovedRoles] Fetching approved roles for user:', user?.id);
      
      // 1) role_requests aprobadas
      const { data: reqs, error: e1 } = await supabase
        .from("role_requests")
        .select("role,status")
        .eq("user_id", user!.id)
        .eq("status", "aprobado");
      
      if (e1) {
        console.error('[useMyApprovedRoles] Error fetching requests:', e1);
        throw e1;
      }

      const approved = new Set((reqs || []).map((r) => r.role as RoleKey));
      console.log('[useMyApprovedRoles] Approved roles:', Array.from(approved));

      // 2) existencia de perfiles (para rutas/edición)
      const exists: Record<RoleKey, boolean> = {
        organizador: false,
        maestro: false,
        academia: false,
        marca: false,
      };

      if (approved.has("organizador")) {
        const { data } = await supabase
          .from("profiles_organizer")
          .select("id")
          .eq("user_id", user!.id)
          .limit(1);
        exists.organizador = !!data?.length;
      }
      
      if (approved.has("maestro")) {
        const { data } = await supabase
          .from("profiles_teacher")
          .select("id")
          .eq("user_id", user!.id)
          .limit(1);
        exists.maestro = !!data?.length;
      }
      
      if (approved.has("academia")) {
        const { data } = await supabase
          .from("profiles_school")
          .select("id")
          .eq("user_id", user!.id)
          .limit(1);
        exists.academia = !!data?.length;
      }
      
      if (approved.has("marca")) {
        const { data } = await supabase
          .from("profiles_brand")
          .select("id")
          .eq("user_id", user!.id)
          .limit(1);
        exists.marca = !!data?.length;
      }

      console.log('[useMyApprovedRoles] Profile existence:', exists);

      return { 
        approved: Array.from(approved), 
        exists 
      };
    },
    staleTime: 0,
    refetchOnWindowFocus: true, // Refrescar cuando vuelves a la ventana
  });
}

