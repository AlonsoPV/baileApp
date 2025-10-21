import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import type { Organizer } from "../types/events";

export function useMyOrganizer() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["organizer", "me", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Organizer|null> => {
      const { data, error } = await supabase
        .from("profiles_organizer")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
  });
}

export function useUpsertMyOrganizer() {
  const { user } = useAuth(); 
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Organizer>) => {
      if (!user?.id) throw new Error("No user");
      
      // try get mine
      const { data: existing, error: e1 } = await supabase
        .from("profiles_organizer")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (e1) throw e1;
      
      if (existing) {
        const { error } = await supabase
          .from("profiles_organizer")
          .update(patch)
          .eq("id", existing.id);
        if (error) throw error; 
        return existing.id;
      } else {
        const payload = { 
          user_id: user.id, 
          nombre_publico: patch.nombre_publico || "Mi Organizador", 
          ...patch 
        };
        const { data, error } = await supabase
          .from("profiles_organizer")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error; 
        return data.id as number;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizer"] }),
  });
}

export function useSubmitOrganizerForReview() {
  const { user } = useAuth(); 
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles_organizer")
        .update({ estado_aprobacion: "en_revision" })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organizer"] }),
  });
}

export function useOrganizerPublic(id?: number) {
  return useQuery({
    queryKey: ["organizer", "public", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles_organizer")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error; 
      return data;
    },
  });
}