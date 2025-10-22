import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { EventParent, EventDate, EventSchedule, EventPrice } from "../types/events";

export function useEventFullByDateId(eventDateId?: number) {
  return useQuery({
    queryKey: ["event-full", eventDateId],
    enabled: !!eventDateId,
    queryFn: async () => {
      console.log('[useEventFullByDateId] Fetching data for dateId:', eventDateId);
      
      const { data: date, error: e1 } = await supabase
        .from("events_date").select("*").eq("id", eventDateId!).maybeSingle();
      if (e1) {
        console.error('[useEventFullByDateId] Error fetching date:', e1);
        throw e1;
      }
      if (!date) {
        console.log('[useEventFullByDateId] No date found');
        return null;
      }

      const { data: parent, error: e2 } = await supabase
        .from("events_parent").select("*").eq("id", date.parent_id).maybeSingle();
      if (e2) {
        console.error('[useEventFullByDateId] Error fetching parent:', e2);
        throw e2;
      }

      const { data: schedules, error: e3 } = await supabase
        .from("event_schedules").select("*").eq("event_date_id", eventDateId!).order("hora_inicio");
      if (e3) {
        console.error('[useEventFullByDateId] Error fetching schedules:', e3);
        throw e3;
      }

      const { data: prices, error: e4 } = await supabase
        .from("event_prices").select("*").eq("event_date_id", eventDateId!).order("monto");
      if (e4) {
        console.error('[useEventFullByDateId] Error fetching prices:', e4);
        throw e4;
      }

      console.log('[useEventFullByDateId] Data loaded successfully:', {
        parent: parent?.nombre,
        date: date.fecha,
        schedulesCount: schedules?.length || 0,
        pricesCount: prices?.length || 0
      });

      return {
        parent: parent as EventParent,
        date: date as EventDate,
        schedules: (schedules || []) as EventSchedule[],
        prices: (prices || []) as EventPrice[],
      };
    }
  });
}

