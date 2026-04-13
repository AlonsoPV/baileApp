import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

type EventDateCreatePayload = Record<string, any>;

function toOrganizerId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function needsResolvedParent(payload: EventDateCreatePayload): boolean {
  const organizerId = toOrganizerId(payload.organizer_id);
  const parentId = toOrganizerId(payload.parent_id);
  return organizerId != null && parentId == null;
}

function buildMinimalParentFromDate(payload: EventDateCreatePayload, organizerId: number) {
  const bio = typeof payload.biografia === "string" ? payload.biografia.trim() : "";
  const name = typeof payload.nombre === "string" ? payload.nombre.trim() : "";
  return {
    organizer_id: organizerId,
    nombre: name || "Social sin nombre",
    descripcion: bio || null,
    biografia: bio,
    ritmos_seleccionados: Array.isArray(payload.ritmos_seleccionados) ? payload.ritmos_seleccionados : [],
    estilos: Array.isArray(payload.estilos) ? payload.estilos : [],
    zonas: Array.isArray(payload.zonas) ? payload.zonas : [],
    ubicaciones: Array.isArray(payload.ubicaciones) ? payload.ubicaciones : [],
    media: [],
  };
}

async function resolveParentIdsForPayloads(payloads: EventDateCreatePayload[]) {
  const organizerIdsNeedingParent = [
    ...new Set(
      payloads
        .filter(needsResolvedParent)
        .map((payload) => toOrganizerId(payload.organizer_id))
        .filter((id): id is number => id != null)
    ),
  ];

  if (organizerIdsNeedingParent.length === 0) {
    return payloads;
  }

  const firstParentByOrganizer: Record<number, number> = {};
  const { data: parents, error: parentsError } = await supabase
    .from("events_parent")
    .select("id, organizer_id")
    .in("organizer_id", organizerIdsNeedingParent)
    .order("created_at", { ascending: false });

  if (parentsError) {
    console.error("[useCreateEventDate] Error fetching parents by organizer", parentsError);
    throw parentsError;
  }

  (parents || []).forEach((parent: any) => {
    const organizerId = toOrganizerId(parent.organizer_id);
    const parentId = toOrganizerId(parent.id);
    if (organizerId != null && parentId != null && !(organizerId in firstParentByOrganizer)) {
      firstParentByOrganizer[organizerId] = parentId;
    }
  });

  for (const organizerId of organizerIdsNeedingParent) {
    if (firstParentByOrganizer[organizerId] != null) continue;

    const sourcePayload = payloads.find((payload) => toOrganizerId(payload.organizer_id) === organizerId);
    const minimalParent = buildMinimalParentFromDate(sourcePayload || {}, organizerId);
    const { data: newParent, error: parentErr } = await supabase
      .from("events_parent")
      .insert(minimalParent)
      .select("id")
      .single();

    if (parentErr) {
      console.error("[useCreateEventDate] Error creating parent for organizer", organizerId, parentErr);
      throw parentErr;
    }

    const newParentId = toOrganizerId(newParent?.id);
    if (newParentId != null) {
      firstParentByOrganizer[organizerId] = newParentId;
    }
  }

  return payloads.map((payload) => {
    if (!needsResolvedParent(payload)) return payload;
    const organizerId = toOrganizerId(payload.organizer_id);
    const resolvedParentId = organizerId != null ? firstParentByOrganizer[organizerId] : null;
    return resolvedParentId != null ? { ...payload, parent_id: resolvedParentId } : payload;
  });
}

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
    queryFn: async () => fetchEventDateById(dateId),
    enabled: !!dateId,
    // Reduce refetch churn when opening/closing the drawer.
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });
}

export async function fetchEventDateById(dateId?: number) {
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
}

export async function prefetchEventDate(queryClient: QueryClient, dateId?: number) {
  if (!dateId) return null;
  return queryClient.prefetchQuery({
    queryKey: ["event", "date", dateId],
    queryFn: () => fetchEventDateById(dateId),
    staleTime: 1000 * 30,
  });
}

export function useCreateEventDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any | any[]) => {
      const isArray = Array.isArray(payload);
      const initialPayloads = isArray ? payload.map((item: any) => ({ ...item })) : [{ ...payload }];
      const payloads = await resolveParentIdsForPayloads(initialPayloads);

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