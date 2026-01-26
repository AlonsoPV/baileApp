import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { EventParent, EventDate, RSVPStatus, RSVPCount } from "../types/events";
import { useMyOrganizer } from "./useOrganizer";
import { useAuth } from '@/contexts/AuthProvider';

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

export function useDeleteParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      console.log('[useDeleteParent] Deleting parent:', id);
      const { error } = await supabase
        .from("events_parent")
        .delete()
        .eq("id", id);
      if (error) {
        console.error('[useDeleteParent] Error:', error);
        throw error;
      }
      console.log('[useDeleteParent] Successfully deleted:', id);
      return id;
    },
    onSuccess: (id, variables, context) => {
      console.log('[useDeleteParent] Invalidating queries after deletion');
      // Invalidar todas las queries relacionadas con parents
      qc.invalidateQueries({ queryKey: ["parents"] });
      qc.invalidateQueries({ queryKey: ["parent", id] });
      // También invalidar queries de fechas relacionadas
      qc.invalidateQueries({ queryKey: ["dates"] });
      // Forzar refetch inmediato
      qc.refetchQueries({ queryKey: ["parents"] });
    }
  });
}

export function useDatesByParent(parentId?: number, publishedOnly?: boolean) {
  return useQuery({
    queryKey: ["dates", parentId, publishedOnly],
    enabled: !!parentId,
    queryFn: async (): Promise<EventDate[]> => {
      console.log('[useDatesByParent] Fetching dates for parentId:', parentId, 'publishedOnly:', publishedOnly);
      
      let q = supabase
        .from("events_date")
        // Importante: incluir TODOS los campos que el editor permite modificar,
        // para no pisar valores con defaults vacíos al guardar.
        .select("id, parent_id, organizer_id, nombre, biografia, djs, telefono_contacto, mensaje_contacto, fecha, dia_semana, hora_inicio, hora_fin, lugar, direccion, ciudad, zona, referencias, requisitos, estilos, ritmos_seleccionados, zonas, ubicaciones, cronograma, costos, media, flyer_url, estado_publicacion, created_at, updated_at")
        .eq("parent_id", parentId!);
      
      if (publishedOnly) q = q.eq("estado_publicacion", "publicado");
      
      const { data, error } = await q.order("fecha", { ascending: true });
      
      console.log('[useDatesByParent] Supabase response:', { data, error });
      
      if (error) {
        console.error('[useDatesByParent] Supabase error:', error);
        throw error;
      }
      
      console.log('[useDatesByParent] Returning dates:', data);
      return data || [];
    }
  });
}

export function useCreateDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Pick<EventDate, 'parent_id'|'fecha'> & Partial<EventDate>) => {
      console.log('[useCreateDate] Creating date:', payload);
      
      const { data, error } = await supabase
        .from("events_date")
        .insert(payload)
        .select("*")
        .single();
      
      if (error) {
        console.error('[useCreateDate] Error:', error);
        throw error;
      }
      
      console.log('[useCreateDate] Success:', data);
      return data as EventDate;
    },
    onSuccess: (d) => {
      // Claves antiguas usadas en algunas vistas
      qc.invalidateQueries({ queryKey: ["dates", d.parent_id] });
      qc.invalidateQueries({ queryKey: ["date", d.id] });
      qc.invalidateQueries({ queryKey: ["dates"] });

      // Claves nuevas/unificadas usadas por hooks de eventos modernos
      qc.invalidateQueries({ queryKey: ["event", "dates", d.parent_id] });
      qc.invalidateQueries({ queryKey: ["event", "date", d.id] });

      // Listas por organizador
      if (d.organizer_id) {
        qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer", d.organizer_id] });
        qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer", d.organizer_id] });
      }
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
    }
  });
}

export function useUpdateDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: number } & Partial<EventDate>) => {
      const { id, ...patch } = payload;
      
      console.log('[useUpdateDate] Updating date:', { id, patch });
      
      const { data, error } = await supabase
        .from("events_date")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        console.error('[useUpdateDate] Error:', error);
        throw error;
      }
      
      console.log('[useUpdateDate] Success:', data);
      return data as EventDate;
    },
    onSuccess: (data) => {
      console.log('[useUpdateDate] Invalidating queries after update');
      // Claves antiguas
      qc.invalidateQueries({ queryKey: ["dates"] });
      qc.invalidateQueries({ queryKey: ["dates", data.parent_id] });
      qc.invalidateQueries({ queryKey: ["date", data.id] });

      // Claves nuevas/unificadas
      qc.invalidateQueries({ queryKey: ["event", "dates", data.parent_id] });
      qc.invalidateQueries({ queryKey: ["event", "date", data.id] });
      
      // Listas por organizador
      if (data.organizer_id) {
        qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer", data.organizer_id] });
        qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer", data.organizer_id] });
      }
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });

      // Forzar refetch inmediato de la query específica para actualizar la UI
      qc.refetchQueries({ queryKey: ["event", "date", data.id] });
    }
  });
}

export function useDeleteDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      // Obtener datos antes de eliminar (necesario para invalidar queries correctamente)
      const { data: dateData } = await supabase
        .from("events_date")
        .select("id,parent_id,organizer_id")
        .eq("id", id)
        .single();
      
      if (!dateData) {
        throw new Error('Fecha no encontrada');
      }
      
      // Eliminar la fecha
      const { error } = await supabase
        .from("events_date")
        .delete()
        .eq("id", id);
      
      if (error) throw error; 
      
      return { 
        id: dateData.id, 
        parent_id: dateData.parent_id, 
        organizer_id: dateData.organizer_id 
      };
    },
    onMutate: async (id) => {
      // Cancelar queries en progreso para evitar conflictos
      await qc.cancelQueries({ queryKey: ["event-dates", "by-organizer"] });
      await qc.cancelQueries({ queryKey: ["event-parents", "by-organizer"] });
      
      // Snapshot del estado anterior
      const previousDates = qc.getQueryData(["event-dates", "by-organizer"]);
      const previousParents = qc.getQueryData(["event-parents", "by-organizer"]);
      
      return { previousDates, previousParents };
    },
    onError: (err, id, context) => {
      // Revertir en caso de error
      if (context?.previousDates) {
        qc.setQueryData(["event-dates", "by-organizer"], context.previousDates);
      }
      if (context?.previousParents) {
        qc.setQueryData(["event-parents", "by-organizer"], context.previousParents);
      }
    },
    onSuccess: ({ id, parent_id, organizer_id }) => {
      // Invalidar queries de forma optimizada (solo las necesarias)
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      
      // Invalidar queries específicas si existen
      if (parent_id) {
        qc.invalidateQueries({ queryKey: ["dates", parent_id] });
        qc.invalidateQueries({ queryKey: ["event", "dates", parent_id] });
      }
      
      // Invalidar query de la fecha eliminada
      qc.removeQueries({ queryKey: ["date", id] });
      qc.removeQueries({ queryKey: ["event", "date", id] });
    },
    onSettled: () => {
      // Asegurar que las queries se refresquen al final
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
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
  const qc = useQueryClient();

  return {
    async set(event_date_id: number, status: RSVPStatus) {
      if (!user?.id) throw new Error("User not authenticated");

      // Usar upsert con onConflict explícito
      const { error } = await supabase
        .from("rsvp")
        .upsert(
          { 
            user_id: user.id, 
            event_date_id, 
            status 
          },
          { 
            onConflict: 'user_id,event_date_id',
            ignoreDuplicates: false 
          }
        );

      if (error) {
        console.error('[useMyRSVP] Error upserting RSVP:', error);
        throw error;
      }

      // Invalidar queries relacionadas
      qc.invalidateQueries({ queryKey: ["rsvp"] });
      qc.invalidateQueries({ queryKey: ["myRSVPs"] });
    }
  };
}