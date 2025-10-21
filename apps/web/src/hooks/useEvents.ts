import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { EventParent, EventDate, RSVPStatus, RSVPCount } from "../types/events";
import { useMyOrganizer } from "./useOrganizer";
import { useAuth } from "./useAuth";

export function useParentsByOrganizer(organizerId?: number) {
  return useQuery({
    queryKey: ["parents", organizerId],
    enabled: !!organizerId,
    queryFn: async (): Promise<EventParent[]> => {
      const { data, error } = await supabase
        .from("events_parent")
        .select("*")
        .eq("organizer_id", organizerId!)
        .order("created_at", { ascending: false });
      if (error) throw error; 
      return data || [];
    }
  });
}

export function useCreateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Pick<EventParent, 'organizer_id'|'nombre'> & Partial<EventParent>) => {
      const { data, error } = await supabase
        .from("events_parent")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error; 
      return data as EventParent;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["parents", v.organizer_id] });
    }
  });
}

export function useUpdateParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<EventParent> }) => {
      const { error } = await supabase
        .from("events_parent")
        .update(patch)
        .eq("id", id);
      if (error) throw error; 
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["parents"] });
      qc.invalidateQueries({ queryKey: ["parent", id] });
    }
  });
}

export function useDatesByParent(parentId?: number, publishedOnly?: boolean) {
  return useQuery({
    queryKey: ["dates", parentId, publishedOnly],
    enabled: !!parentId,
    queryFn: async (): Promise<EventDate[]> => {
      let q = supabase
        .from("events_date")
        .select("*")
        .eq("parent_id", parentId!);
      
      if (publishedOnly) q = q.eq("estado_publicacion", "publicado");
      
      const { data, error } = await q.order("fecha", { ascending: true });
      if (error) throw error; 
      return data || [];
    }
  });
}

export function useCreateDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Pick<EventDate, 'parent_id'|'fecha'> & Partial<EventDate>) => {
      const { data, error } = await supabase
        .from("events_date")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error; 
      return data as EventDate;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["dates", d.parent_id] });
    }
  });
}

export function useUpdateDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<EventDate> }) => {
      const { error } = await supabase
        .from("events_date")
        .update(patch)
        .eq("id", id);
      if (error) throw error; 
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["dates"] });
      qc.invalidateQueries({ queryKey: ["date", id] });
    }
  });
}

export function useRSVPCounts(parentId?: number) {
  return useQuery({
    queryKey: ["rsvp", "counts", parentId],
    enabled: !!parentId,
    queryFn: async (): Promise<RSVPCount[]> => {
      // Obtener series de fechas del mismo parent
      const { data: dates, error: e1 } = await supabase
        .from("events_date")
        .select("id")
        .eq("parent_id", parentId!);
      if (e1) throw e1;
      if (!dates?.length) return [];

      const ids = dates.map(d => d.id);
      
      // Obtener todos los RSVPs para esas fechas
      const { data: all, error: e2 } = await supabase
        .from("rsvp")
        .select("event_date_id, status")
        .in("event_date_id", ids);
      if (e2) throw e2;

      // Agrupar por fecha
      const map = new Map<number, RSVPCount>();
      ids.forEach(id => map.set(id, { 
        event_date_id: id, 
        voy: 0, 
        interesado: 0, 
        no_voy: 0 
      }));
      
      all?.forEach(r => {
        const row = map.get(r.event_date_id)!;
        if (r.status === "voy") row.voy++;
        else if (r.status === "interesado") row.interesado++;
        else if (r.status === "no_voy") row.no_voy++;
      });
      
      return Array.from(map.values());
    }
  });
}

export function useMyRSVP() {
  const { user } = useAuth();
  return {
    async set(event_date_id: number, status: RSVPStatus) {
      const { error } = await supabase
        .from("rsvp")
        .insert({ user_id: user!.id, event_date_id, status })
        .onConflict("user_id,event_date_id")
        .merge();
      if (error) throw error;
    }
  };
}