import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";

type UseAddToCalendarStatusArgs = {
  eventId: string | number;
  userId?: string | null;
  classId?: number;
  fecha?: string | null;
};

export function useAddToCalendarStatus({
  eventId,
  userId,
  classId,
  fecha,
}: UseAddToCalendarStatusArgs) {
  const eventIdStr = String(eventId);
  const isClass = !!classId;

  const countQuery = useQuery({
    queryKey: ["calendar-interest-count", eventIdStr, classId ?? null, fecha ?? ""],
    staleTime: 60_000,
    gcTime: 300_000,
    queryFn: async () => {
      if (isClass && classId) {
        const nowCDMX = new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" });
        const todayCDMX = new Date(nowCDMX).toISOString().split("T")[0];

        let classCountQuery = supabase
          .from("clase_asistencias")
          .select("*", { count: "exact", head: true })
          .eq("class_id", classId)
          .eq("status", "tentative");

        if (fecha) {
          classCountQuery = classCountQuery.eq("fecha_especifica", fecha);
        } else {
          classCountQuery = classCountQuery.or(`fecha_especifica.is.null,fecha_especifica.gte.${todayCDMX}`);
        }

        const { count, error } = await classCountQuery;
        if (error) throw error;
        return typeof count === "number" ? count : 0;
      }

      const eventDateIdNum = typeof eventId === "number" ? eventId : parseInt(eventIdStr, 10);
      if (Number.isNaN(eventDateIdNum)) return 0;

      try {
        const { data: stats, error } = await supabase.rpc("get_event_rsvp_stats", { event_id: eventDateIdNum });
        if (error) throw error;
        if (Array.isArray(stats) && stats.length > 0) {
          return stats[0].interesado || 0;
        }
      } catch (error) {
        logger.error("[useAddToCalendarStatus] Error obteniendo stats:", error);
      }

      return 0;
    },
  });

  const alreadyAddedQuery = useQuery({
    queryKey: ["calendar-interest-user", eventIdStr, userId ?? ""],
    enabled: !!userId,
    staleTime: 60_000,
    gcTime: 300_000,
    queryFn: async () => {
      if (!userId) return false;
      const { data } = await supabase
        .from("eventos_interesados")
        .select("id")
        .eq("event_id", eventIdStr)
        .eq("user_id", userId)
        .maybeSingle();
      return !!data;
    },
  });

  return useMemo(
    () => ({
      count: countQuery.data ?? 0,
      alreadyAdded: alreadyAddedQuery.data ?? false,
      isLoading: countQuery.isLoading || alreadyAddedQuery.isLoading,
    }),
    [alreadyAddedQuery.data, alreadyAddedQuery.isLoading, countQuery.data, countQuery.isLoading]
  );
}
