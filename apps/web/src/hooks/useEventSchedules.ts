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
      return data as EventSchedule[];
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
