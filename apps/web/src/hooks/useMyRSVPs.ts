import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from "../lib/supabase";

export function useMyRSVPs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["rsvp","me", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      // 1) Obtener mis RSVPs
      const { data: rsvp, error } = await supabase
        .from("rsvp")
        .select("*")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!rsvp?.length) return [];

      const dateIds = rsvp.map((r) => r.event_date_id);
      
      // 2) Obtener fechas de eventos
      const { data: dates, error: e2 } = await supabase
        .from("events_date")
        .select("*")
        .in("id", dateIds);
      
      if (e2) throw e2;
      if (!dates?.length) return [];

      const parentIds = Array.from(new Set(dates.map((d) => d.parent_id)));
      
      // 3) Obtener eventos padre
      const { data: parents, error: e3 } = await supabase
        .from("events_parent")
        .select("id, nombre")
        .in("id", parentIds);
      
      if (e3) throw e3;

      // 4) Combinar datos
      return dates.map((d) => ({
        date: d,
        parent: parents?.find((p) => p.id === d.parent_id),
        my: rsvp.find((r) => r.event_date_id === d.id),
      })).filter(item => item.parent); // Solo incluir items con parent
    },
  });
}
