import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type OrganizerLocation = {
  id?: number;
  organizer_id: number;
  nombre?: string | null;
  direccion?: string | null;
  referencias?: string | null;
  zona_ids?: number[] | null;
  created_at?: string;
  updated_at?: string;
};

export function useOrganizerLocations(organizerId?: number) {
  return useQuery({
    queryKey: ["organizer_locations", organizerId],
    enabled: !!organizerId,
    queryFn: async (): Promise<OrganizerLocation[]> => {
      const { data, error } = await supabase
        .from("organizer_locations")
        .select("*")
        .eq("organizer_id", organizerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as OrganizerLocation[];
    }
  });
}

export function useCreateOrganizerLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OrganizerLocation) => {
      const { data, error } = await supabase
        .from("organizer_locations")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as OrganizerLocation;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["organizer_locations", d.organizer_id] }),
  });
}

export function useUpdateOrganizerLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<OrganizerLocation> }) => {
      const { data, error } = await supabase
        .from("organizer_locations")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as OrganizerLocation;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["organizer_locations", d.organizer_id] }),
  });
}

export function useDeleteOrganizerLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, organizer_id }: { id: number; organizer_id: number }) => {
      const { error } = await supabase
        .from("organizer_locations")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { id, organizer_id };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["organizer_locations", d.organizer_id] }),
  });
}


