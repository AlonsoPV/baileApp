import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type EventPrice = {
  id?: number;
  event_date_id: number;
  tipo: "preventa" | "taquilla" | "promo";
  nombre: string;
  monto?: number;
  descripcion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  descuento?: number;
};

export function useEventPrices(eventDateId?: number) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["event_prices", eventDateId],
    enabled: !!eventDateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_prices")
        .select("*")
        .eq("event_date_id", eventDateId!)
        .order("monto");
      if (error) throw error;
      return data as EventPrice[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<EventPrice>) => {
      const { data, error } = await supabase
        .from("event_prices")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_prices", eventDateId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("event_prices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_prices", eventDateId] }),
  });

  return { ...list, upsert, remove };
}
