import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthProvider";

type EntityType = "event" | "class";
type ClassSourceType = "teacher" | "academy";

type FavoriteRow = {
  id: number;
  user_id: string;
  entity_type: EntityType;
  event_date_id: number | null;
  class_source_type: ClassSourceType | null;
  class_source_id: number | null;
  class_cronograma_index: number | null;
  class_item_id: number | null;
  created_at: string;
};

type ResolvedClassFavorite = {
  favorite_id: number;
  sourceType: ClassSourceType;
  sourceId: number;
  cronogramaIndex: number;
  href: string;
  title: string;
  ownerName: string;
  dayLabel?: string;
  timeLabel?: string;
  locationLabel?: string;
  coverUrl?: string;
};

type VisibleFavoriteRow = {
  favorite_id: number;
  entity_type: EntityType;
  entity_id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  date_label: string | null;
  location_label: string | null;
  detail_route: string;
  created_at: string;
};

function getTodayCDMX(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

export function useUserFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ["user-favorites", user?.id || "anon"],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) {
        return { rows: [] as FavoriteRow[], events: [] as any[], classes: [] as ResolvedClassFavorite[] };
      }

      const { data: rows, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const favRows = (rows || []) as FavoriteRow[];

      const eventIds = Array.from(
        new Set(
          favRows
            .filter((r) => r.entity_type === "event" && Number.isFinite(Number(r.event_date_id)))
            .map((r) => Number(r.event_date_id))
        )
      );

      let eventsResolved: any[] = [];
      if (eventIds.length > 0) {
        const { data: eventsRows, error: eventsErr } = await supabase
          .from("events_date")
          .select("id,parent_id,nombre,fecha,dia_semana,hora_inicio,hora_fin,lugar,direccion,ciudad,flyer_url,estado_publicacion")
          .in("id", eventIds as any)
          .eq("estado_publicacion", "publicado");
        if (!eventsErr && Array.isArray(eventsRows)) {
          const today = getTodayCDMX();
          eventsResolved = eventsRows.filter((ev: any) => {
            if (typeof ev?.dia_semana === "number") return true;
            const ymd = String(ev?.fecha || "");
            if (!ymd) return false;
            return ymd >= today;
          });
        }
      }

      let classesResolved: ResolvedClassFavorite[] = [];
      const { data: visibleRows } = await supabase.rpc("rpc_get_user_visible_favorites");
      const visibleClassRows = ((visibleRows || []) as VisibleFavoriteRow[]).filter(
        (r) => String(r?.entity_type || "").toLowerCase() === "class"
      );
      classesResolved = visibleClassRows.map((row) => {
        const parts = String(row.detail_route || "").split("?");
        const base = parts[0] || "";
        const sourceType = base.includes("/clase/academy/") ? "academy" : "teacher";
        const sourceId = Number(base.split("/").pop() || 0);
        const qs = new URLSearchParams(parts[1] || "");
        const cronogramaIndex = Number(qs.get("i") || 0);
        return {
          favorite_id: Number(row.favorite_id),
          sourceType,
          sourceId,
          cronogramaIndex,
          href: row.detail_route,
          title: String(row.title || "Clase"),
          ownerName: String(row.subtitle || "—"),
          dayLabel: row.date_label || undefined,
          timeLabel: undefined,
          locationLabel: row.location_label || undefined,
          coverUrl: row.image_url || undefined,
        };
      });

      return {
        rows: favRows,
        events: eventsResolved,
        classes: classesResolved,
      };
    },
    staleTime: 30_000,
  });

  const rows = q.data?.rows || [];
  const eventIdSet = React.useMemo(() => {
    const s = new Set<number>();
    rows.forEach((r) => {
      if (r.entity_type === "event" && Number.isFinite(Number(r.event_date_id))) s.add(Number(r.event_date_id));
    });
    return s;
  }, [rows]);
  const classKeySet = React.useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => {
      if (
        r.entity_type === "class" &&
        r.class_source_type &&
        Number.isFinite(Number(r.class_source_id)) &&
        Number.isFinite(Number(r.class_cronograma_index))
      ) {
        s.add(`${r.class_source_type}:${Number(r.class_source_id)}:${Number(r.class_cronograma_index)}`);
      }
    });
    return s;
  }, [rows]);

  const invalidate = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["user-favorites", user?.id || "anon"] });
  }, [queryClient, user?.id]);

  const toggleEventMutation = useMutation({
    mutationFn: async (eventDateId: number) => {
      if (!user?.id) throw new Error("auth_required");
      const existing = rows.find((r) => r.entity_type === "event" && Number(r.event_date_id) === Number(eventDateId));
      if (existing) {
        const { error } = await supabase.from("user_favorites").delete().eq("id", existing.id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from("user_favorites").insert({
        user_id: user.id,
        entity_type: "event",
        event_date_id: eventDateId,
      } as any);
      if (error) throw error;
      return true;
    },
    onSuccess: invalidate,
  });

  const toggleClassMutation = useMutation({
    mutationFn: async (payload: { sourceType: ClassSourceType; sourceId: number; cronogramaIndex: number; classItemId?: number | null }) => {
      if (!user?.id) throw new Error("auth_required");
      const sourceId = Math.floor(Number(payload.sourceId));
      const cronogramaIndex = Math.floor(Number(payload.cronogramaIndex));
      if (!Number.isFinite(sourceId) || sourceId < 0) throw new Error("invalid_class_source_id");
      if (!Number.isFinite(cronogramaIndex) || cronogramaIndex < 0) throw new Error("invalid_cronograma_index");
      const sourceType = payload.sourceType === "academy" ? "academy" : "teacher";

      const key = `${sourceType}:${sourceId}:${cronogramaIndex}`;
      const existing = rows.find(
        (r) =>
          r.entity_type === "class" &&
          `${r.class_source_type}:${Number(r.class_source_id)}:${Number(r.class_cronograma_index)}` === key
      );
      if (existing) {
        const { error } = await supabase.from("user_favorites").delete().eq("id", existing.id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from("user_favorites").insert({
        user_id: user.id,
        entity_type: "class",
        class_source_type: sourceType,
        class_source_id: sourceId,
        class_cronograma_index: cronogramaIndex,
        class_item_id: payload.classItemId != null && Number.isFinite(Number(payload.classItemId)) ? Number(payload.classItemId) : null,
      } as any);
      if (error) throw error;
      return true;
    },
    onSuccess: invalidate,
  });

  const isEventFavorite = React.useCallback((eventDateId?: number | null) => {
    if (!Number.isFinite(Number(eventDateId))) return false;
    return eventIdSet.has(Number(eventDateId));
  }, [eventIdSet]);

  const isClassFavorite = React.useCallback((sourceType: ClassSourceType, sourceId: number, cronogramaIndex: number) => {
    return classKeySet.has(`${sourceType}:${sourceId}:${cronogramaIndex}`);
  }, [classKeySet]);

  return {
    rows,
    events: q.data?.events || [],
    classes: q.data?.classes || [],
    isLoading: q.isLoading,
    error: q.error,
    isEventFavorite,
    isClassFavorite,
    toggleEventFavorite: toggleEventMutation.mutateAsync,
    toggleClassFavorite: toggleClassMutation.mutateAsync,
    togglingEvent: toggleEventMutation.isPending,
    togglingClass: toggleClassMutation.isPending,
  };
}

