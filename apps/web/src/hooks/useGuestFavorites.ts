import React from "react";
import {
  getGuestFavoritesServerSnapshot,
  getGuestFavoritesSnapshot,
  isGuestClassFavoriteInList,
  isGuestEventFavoriteInList,
  subscribeGuestFavorites,
  toggleGuestClassFavorite,
  toggleGuestEventFavorite,
} from "@/lib/guestFavorites";

type ClassSourceType = "teacher" | "academy";

/**
 * Favoritos locales para usuarios sin sesión (web: localStorage).
 * No mezclar con useUserFavorites: en pantallas, ramificar con `user`.
 */
export function useGuestFavorites() {
  const list = React.useSyncExternalStore(
    subscribeGuestFavorites,
    getGuestFavoritesSnapshot,
    getGuestFavoritesServerSnapshot
  );

  const isEventFavorite = React.useCallback(
    (eventDateId?: number | null) => isGuestEventFavoriteInList(list, eventDateId),
    [list]
  );

  const isClassFavorite = React.useCallback(
    (sourceType: ClassSourceType, sourceId: number, cronogramaIndex: number) =>
      isGuestClassFavoriteInList(list, sourceType, sourceId, cronogramaIndex),
    [list]
  );

  const toggleEventFavorite = React.useCallback((eventDateId: number) => toggleGuestEventFavorite(eventDateId), []);

  const toggleClassFavorite = React.useCallback(
    (payload: {
      sourceType: ClassSourceType;
      sourceId: number;
      cronogramaIndex: number;
    }) => toggleGuestClassFavorite(payload),
    []
  );

  return {
    list,
    isEventFavorite,
    isClassFavorite,
    toggleEventFavorite,
    toggleClassFavorite,
  };
}
