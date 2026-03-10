import React from "react";
import { useUserFavorites } from "@/hooks/useUserFavorites";

type ClassSourceType = "teacher" | "academy";

export function useEventFavorite(eventDateId?: number | null) {
  const fav = useUserFavorites();
  const isFavorite = React.useMemo(() => fav.isEventFavorite(eventDateId), [fav, eventDateId]);
  return {
    isFavorite,
    isLoading: fav.isLoading,
    toggle: async () => {
      if (!Number.isFinite(Number(eventDateId))) return false;
      return fav.toggleEventFavorite(Number(eventDateId));
    },
    isToggling: fav.togglingEvent,
  };
}

export function useClassFavorite(payload?: { sourceType: ClassSourceType; sourceId: number; cronogramaIndex: number }) {
  const fav = useUserFavorites();
  const isFavorite = React.useMemo(() => {
    if (!payload) return false;
    return fav.isClassFavorite(payload.sourceType, payload.sourceId, payload.cronogramaIndex);
  }, [fav, payload]);
  return {
    isFavorite,
    isLoading: fav.isLoading,
    toggle: async () => {
      if (!payload) return false;
      return fav.toggleClassFavorite(payload);
    },
    isToggling: fav.togglingClass,
  };
}

export function useToggleFavorite() {
  const fav = useUserFavorites();
  const toggle = async (
    input:
      | { entityType: "event"; eventDateId: number }
      | { entityType: "class"; sourceType: ClassSourceType; sourceId: number; cronogramaIndex: number; classItemId?: number | null }
  ) => {
    if (input.entityType === "event") {
      return fav.toggleEventFavorite(input.eventDateId);
    }
    return fav.toggleClassFavorite({
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      cronogramaIndex: input.cronogramaIndex,
      classItemId: input.classItemId ?? null,
    });
  };
  return {
    toggle,
    isToggling: fav.togglingEvent || fav.togglingClass,
  };
}

export { useUserFavorites };

