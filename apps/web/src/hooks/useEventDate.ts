import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useEventDatesByParent(parentId?: number) {
  return useQuery({
    queryKey: ["event", "dates", parentId],
    queryFn: async () => {
      if (!parentId) return [];
      console.log('[useEventDatesByParent] Fetching dates for parent:', parentId);
      const { data, error } = await supabase
        .from("events_date")
        .select("*")
        .eq("parent_id", parentId)
        .order("fecha", { ascending: true })
        .order("hora_inicio", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });
      if (error) {
        console.error('[useEventDatesByParent] Error:', error);
        throw error;
      }
      const rows = [...(data || [])].sort((a: any, b: any) => {
        const ymdA = String(a?.fecha || a?.fecha_inicio || '').split('T')[0];
        const ymdB = String(b?.fecha || b?.fecha_inicio || '').split('T')[0];
        if (ymdA !== ymdB) return ymdA < ymdB ? -1 : 1;
        const horaA = String(a?.hora_inicio || '99:99');
        const horaB = String(b?.hora_inicio || '99:99');
        if (horaA !== horaB) return horaA.localeCompare(horaB);
        return Number(a?.id || 0) - Number(b?.id || 0);
      });
      console.log('[useEventDatesByParent] Success:', rows);
      return rows;
    },
    enabled: !!parentId
  });
}

export function useEventDate(dateId?: number) {
  return useQuery({
    queryKey: ["event", "date", dateId],
    queryFn: async () => {
      if (!dateId) return null;
      const { data, error } = await supabase
        .from("events_date")
        .select("*")
        .eq("id", dateId)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: !!dateId,
    // Reduce refetch churn when opening/closing the drawer.
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });
}

export function useCreateEventDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any | any[]) => {
      const isArray = Array.isArray(payload);
      let payloads = isArray ? [...payload] : [{ ...payload }];

      // Usar organizer_id como "parent": si viene organizer_id y no parent_id, buscar o crear
      // un events_parent para ese organizador y usar su id como parent_id (una fecha = un parent por org).
      const organizerIdsNeedingParent = [...new Set(
        payloads
          .filter((p: any) => (p.organizer_id != null && p.organizer_id !== '') && (p.parent_id == null || p.parent_id === ''))
          .map((p: any) => Number(p.organizer_id))
          .filter((id: number) => Number.isFinite(id))
      )];
      const firstParentByOrganizer: Record<number, number> = {};

      if (organizerIdsNeedingParent.length > 0) {
        const { data: parents } = await supabase
          .from("events_parent")
          .select("id, organizer_id")
          .in("organizer_id", organizerIdsNeedingParent)
          .order("created_at", { ascending: false });
        (parents || []).forEach((p: any) => {
          const oid = Number(p.organizer_id);
          if (Number.isFinite(oid) && !(oid in firstParentByOrganizer) && p.id != null) {
            firstParentByOrganizer[oid] = Number(p.id);
          }
        });

        for (const oid of organizerIdsNeedingParent) {
          if (firstParentByOrganizer[oid] != null) continue;
          const firstPayload = payloads.find((p: any) => Number(p.organizer_id) === oid);
          const { data: newParent, error: parentErr } = await supabase
            .from("events_parent")
            .insert({
              organizer_id: oid,
              nombre: firstPayload?.nombre ?? "Mi evento",
              descripcion: firstPayload?.biografia ?? null,
              estilos: firstPayload?.estilos ?? [],
              zonas: firstPayload?.zonas ?? [],
              media: [],
            })
            .select("id")
            .single();
          if (parentErr) {
            console.error("[useCreateEventDate] Error creating parent for organizer", oid, parentErr);
            throw parentErr;
          }
          if (newParent?.id != null) firstParentByOrganizer[oid] = Number(newParent.id);
        }

        payloads = payloads.map((p: any) => {
          const oid = p.organizer_id != null ? Number(p.organizer_id) : null;
          const needParent = oid != null && Number.isFinite(oid) && (p.parent_id == null || p.parent_id === '');
          const resolvedParentId = needParent ? firstParentByOrganizer[oid] : undefined;
          if (resolvedParentId != null) {
            return { ...p, parent_id: resolvedParentId };
          }
          return p;
        });
      }

      console.log(`[useCreateEventDate] Creating ${payloads.length} date(s)`);

      const { data, error } = await supabase
        .from("events_date")
        .insert(payloads)
        .select("*");

      if (error) {
        console.error('[useCreateEventDate] Supabase error:', error);
        throw error;
      }

      // Materializar ocurrencias recurrentes (todas las fechas tienen parent_id ahora)
      const parentIdsRecurring = [...new Set(
        (data || [])
          .filter((r: any) => r?.parent_id != null && typeof r?.dia_semana === 'number')
          .map((r: any) => Number(r.parent_id))
          .filter((n: number) => Number.isFinite(n))
      )];
      for (const pid of parentIdsRecurring) {
        try {
          await supabase.rpc('ensure_weekly_occurrences', { p_parent_id: pid, p_weeks_ahead: 13 });
        } catch (e) {
          console.warn('[useCreateEventDate] ensure_weekly_occurrences failed for parent', pid, e);
        }
      }

      console.log(`[useCreateEventDate] Success: ${data?.length || 0} date(s) created`);
      return isArray ? (data || []) : (data?.[0] || null);
    },
    onMutate: async (payload) => {
      // Cancelar queries en progreso para evitar conflictos
      await qc.cancelQueries({ queryKey: ["event-dates", "by-organizer"] });
      await qc.cancelQueries({ queryKey: ["event-parents", "by-organizer"] });
      
      // Snapshot del estado anterior
      const previousDates = qc.getQueryData(["event-dates", "by-organizer"]);
      const previousParents = qc.getQueryData(["event-parents", "by-organizer"]);
      
      return { previousDates, previousParents };
    },
    onError: (err, payload, context) => {
      // Revertir en caso de error
      if (context?.previousDates) {
        qc.setQueryData(["event-dates", "by-organizer"], context.previousDates);
      }
      if (context?.previousParents) {
        qc.setQueryData(["event-parents", "by-organizer"], context.previousParents);
      }
    },
    onSuccess: (data) => {
      // Invalidar queries de forma optimizada
      const rows = Array.isArray(data) ? data : [data];
      const organizerIds = new Set<number>();
      const parentIds = new Set<number | null>();
      
      rows.forEach((row) => {
        if (row?.organizer_id) organizerIds.add(row.organizer_id);
        if (row?.parent_id) parentIds.add(row.parent_id);
      });
      
      // Invalidar queries principales (solo una vez)
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      
      // Invalidar queries específicas si existen
      parentIds.forEach((parentId) => {
        if (parentId) {
          qc.invalidateQueries({ queryKey: ["dates", parentId] });
          qc.invalidateQueries({ queryKey: ["event", "dates", parentId] });
        }
      });
    },
    onSettled: () => {
      // Asegurar que las queries se refresquen al final
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
    }
  });
}

export function useUpdateEventDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: any }) => {
      const { data, error } = await supabase.from("events_date")
        .update(patch).eq("id", id).select("*").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      // Invalidar con las keys correctas que usa useDatesByParent
      qc.invalidateQueries({ queryKey: ["dates", row.parent_id] });
      qc.invalidateQueries({ queryKey: ["dates"] }); // Invalidar todas las fechas
      qc.invalidateQueries({ queryKey: ["event", "date", row.id] });
      qc.invalidateQueries({ queryKey: ["event", "dates", row.parent_id] });
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["event-dates", "bulk"] }); // Refrescar lista bulk (OrganizerProfileEditor)
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["parents"] }); // Refrescar lista de parents
    }
  });
}