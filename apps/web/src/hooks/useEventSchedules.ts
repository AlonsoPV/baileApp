import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type EventSchedule = {
  id?: number;
  event_date_id: number;
  tipo: "clase" | "show" | "social" | "otro";
  titulo: string;
  descripcion?: string;
  hora_inicio: string;
  hora_fin?: string;
  ritmo?: number;
};

/** Minutos desde medianoche; valores inválidos al final. */
function horaInicioToMinutes(hora: string | undefined | null): number {
  if (!hora || typeof hora !== "string") return Number.MAX_SAFE_INTEGER;
  const m = hora.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return Number.MAX_SAFE_INTEGER;
  return hh * 60 + mm;
}

export function sortEventSchedulesByHoraInicio(rows: EventSchedule[]): EventSchedule[] {
  return [...rows].sort((a, b) => {
    const diff = horaInicioToMinutes(a.hora_inicio) - horaInicioToMinutes(b.hora_inicio);
    if (diff !== 0) return diff;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

export function useEventSchedules(eventDateId?: number) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["event_schedules", eventDateId],
    enabled: !!eventDateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_schedules")
        .select("*")
        .eq("event_date_id", eventDateId!)
        .order("hora_inicio");
      if (error) throw error;
      return sortEventSchedulesByHoraInicio((data || []) as EventSchedule[]);
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<EventSchedule>) => {
      const { data, error } = await supabase
        .from("event_schedules")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_schedules", eventDateId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("event_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_schedules", eventDateId] }),
  });

  return { ...list, upsert, remove };
}
