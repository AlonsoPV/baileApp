import { useQuery } from "@tanstack/react-query";
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from "../lib/supabase";
import { perfLog } from "../utils/perfLog";

export function useMyRSVPs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["rsvp","me", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      const totalStart = performance.now();

      // 1) Obtener mis RSVPs (tabla event_rsvp)
      const rsvpStart = performance.now();
      const { data: rsvp, error } = await supabase
        .from("event_rsvp")
        .select("*")
        .eq("user_id", user.id)
        .order('created_at', { ascending: false });
      const rsvpEnd = performance.now();
      perfLog({ hook: 'useMyRSVPs', step: 'event_rsvp_by_user', duration_ms: rsvpEnd - rsvpStart, rows: rsvp?.length ?? 0, data: rsvp, error });
      
      if (error) throw error;
      if (!rsvp?.length) return [];

      const dateIds = rsvp.map((r) => r.event_date_id);
      
      // 2) Obtener fechas de eventos
      const datesStart = performance.now();
      const { data: dates, error: e2 } = await supabase
        .from("events_date")
        .select("*")
        .in("id", dateIds);
      const datesEnd = performance.now();
      perfLog({ hook: 'useMyRSVPs', step: 'events_date_by_ids', duration_ms: datesEnd - datesStart, rows: dates?.length ?? 0, data: dates, error: e2 });
      
      if (e2) throw e2;
      if (!dates?.length) return [];

      // Filtrar para quedarnos solo con fechas estrictamente posteriores a hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingDates = dates.filter((d: any) => {
        if (!d.fecha) return false;
        const fd = new Date(d.fecha);
        if (Number.isNaN(fd.getTime())) return false;
        fd.setHours(0, 0, 0, 0);
        return fd > today;
      });

      if (!upcomingDates.length) return [];

      const parentIds = Array.from(new Set(upcomingDates.map((d: any) => d.parent_id)));
      
      // 3) Obtener eventos padre
      const parentsStart = performance.now();
      const { data: parents, error: e3 } = await supabase
        .from("events_parent")
        .select("id, nombre")
        .in("id", parentIds);
      const parentsEnd = performance.now();
      perfLog({ hook: 'useMyRSVPs', step: 'events_parent_by_ids', duration_ms: parentsEnd - parentsStart, rows: parents?.length ?? 0, data: parents, error: e3 });
      
      if (e3) throw e3;

      const totalEnd = performance.now();

      // 4) Combinar datos
      const result = upcomingDates.map((d: any) => ({
        date: d,
        parent: parents?.find((p) => p.id === d.parent_id),
        my: rsvp.find((r) => r.event_date_id === d.id),
      })).filter(item => item.parent); // Solo incluir items con parent

      perfLog({ hook: 'useMyRSVPs', step: 'total', duration_ms: totalEnd - totalStart, rows: result.length, data: result });
      return result;
    },
  });
}
