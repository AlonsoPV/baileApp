import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * Solo `events_date` (sin joins a `events_parent`) para bulk editor.
 */
export function useEventDatesBulk(organizerId?: number) {
  return useQuery({
    queryKey: ["event-dates", "bulk", organizerId],
    enabled: !!organizerId,
    queryFn: async () => {
      if (!organizerId) return [];
      const { data, error } = await supabase
        .from("events_date")
        .select(
          [
            "id",
            "parent_id",
            "organizer_id",
            "nombre",
            "fecha",
            "dia_semana",
            "hora_inicio",
            "hora_fin",
            "lugar",
            "direccion",
            "ciudad",
            "referencias",
            "requisitos",
            "ritmos_seleccionados",
            "zonas",
            "flyer_url",
            "estado_publicacion",
            "updated_at",
          ].join(",")
        )
        .eq("organizer_id", organizerId)
        .order("fecha", { ascending: true })
        .order("hora_inicio", { ascending: true, nullsFirst: false })
        .order("id", { ascending: true });
      if (error) throw error;
      return [...(data || [])].sort((a: any, b: any) => {
        const ymdA = String(a?.fecha || a?.fecha_inicio || '').split('T')[0];
        const ymdB = String(b?.fecha || b?.fecha_inicio || '').split('T')[0];
        if (ymdA !== ymdB) return ymdA < ymdB ? -1 : 1;
        const horaA = String(a?.hora_inicio || '99:99');
        const horaB = String(b?.hora_inicio || '99:99');
        if (horaA !== horaB) return horaA.localeCompare(horaB);
        return Number(a?.id || 0) - Number(b?.id || 0);
      });
    },
  });
}

