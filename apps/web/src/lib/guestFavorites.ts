/**
 * Favoritos de invitado (sin sesión): solo en este dispositivo (web: localStorage).
 * Los usuarios logueados siguen usando Supabase vía useUserFavorites.
 */

export const GUEST_FAVORITES_STORAGE_KEY = "guest_favorites";

export const GUEST_FAVORITES_CHANGED_EVENT = "baileapp:guest-favorites-changed";

export type GuestFavorite = {
  entityType: "event" | "class";
  entityId: string;
  savedAt: string;
};

function isGuestFavorite(x: unknown): x is GuestFavorite {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const et = o.entityType;
  if (et !== "event" && et !== "class") return false;
  if (typeof o.entityId !== "string" || !o.entityId.trim()) return false;
  if (typeof o.savedAt !== "string") return false;
  return true;
}

export function parseGuestFavorites(raw: string | null): GuestFavorite[] {
  try {
    const j = JSON.parse(raw || "[]");
    if (!Array.isArray(j)) return [];
    return j.filter(isGuestFavorite);
  } catch {
    return [];
  }
}

let cachedList: GuestFavorite[] = [];
let cachedRaw = "__init__";

function syncCacheFromStorage(): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(GUEST_FAVORITES_STORAGE_KEY);
  const next = raw ?? "";
  if (next === cachedRaw) return;
  cachedRaw = next;
  cachedList = parseGuestFavorites(next);
}

/** Lectura para useSyncExternalStore (misma referencia si el raw no cambió). */
export function getGuestFavoritesSnapshot(): GuestFavorite[] {
  if (typeof window === "undefined") return [];
  syncCacheFromStorage();
  return cachedList;
}

export function getGuestFavoritesServerSnapshot(): GuestFavorite[] {
  return [];
}

export function subscribeGuestFavorites(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === GUEST_FAVORITES_STORAGE_KEY || e.key === null) {
      cachedRaw = "__force__";
      onStoreChange();
    }
  };
  const onCustom = () => {
    cachedRaw = "__force__";
    onStoreChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(GUEST_FAVORITES_CHANGED_EVENT, onCustom as EventListener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(GUEST_FAVORITES_CHANGED_EVENT, onCustom as EventListener);
  };
}

function persist(list: GuestFavorite[]): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(list);
  window.localStorage.setItem(GUEST_FAVORITES_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedList = list;
  window.dispatchEvent(new Event(GUEST_FAVORITES_CHANGED_EVENT));
}

export function eventEntityId(eventDateId: number): string {
  return String(Math.floor(Number(eventDateId)));
}

export function classEntityId(
  sourceType: "teacher" | "academy",
  sourceId: number,
  cronogramaIndex: number
): string {
  const st = sourceType === "academy" ? "academy" : "teacher";
  return `${st}:${Math.floor(sourceId)}:${Math.floor(cronogramaIndex)}`;
}

export function isGuestEventFavoriteInList(list: GuestFavorite[], eventDateId?: number | null): boolean {
  if (!Number.isFinite(Number(eventDateId))) return false;
  const id = eventEntityId(Number(eventDateId));
  return list.some((x) => x.entityType === "event" && x.entityId === id);
}

export function isGuestClassFavoriteInList(
  list: GuestFavorite[],
  sourceType: "teacher" | "academy",
  sourceId: number,
  cronogramaIndex: number
): boolean {
  const id = classEntityId(sourceType, sourceId, cronogramaIndex);
  return list.some((x) => x.entityType === "class" && x.entityId === id);
}

/** @returns siguiente estado: true = quedó guardado como favorito */
export function toggleGuestEventFavorite(eventDateId: number): boolean {
  if (typeof window === "undefined") return false;
  const list = [...parseGuestFavorites(window.localStorage.getItem(GUEST_FAVORITES_STORAGE_KEY))];
  const id = eventEntityId(eventDateId);
  const idx = list.findIndex((x) => x.entityType === "event" && x.entityId === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    persist(list);
    return false;
  }
  list.push({ entityType: "event", entityId: id, savedAt: new Date().toISOString() });
  persist(list);
  return true;
}

export function toggleGuestClassFavorite(payload: {
  sourceType: "teacher" | "academy";
  sourceId: number;
  cronogramaIndex: number;
}): boolean {
  if (typeof window === "undefined") return false;
  const list = [...parseGuestFavorites(window.localStorage.getItem(GUEST_FAVORITES_STORAGE_KEY))];
  const id = classEntityId(payload.sourceType, payload.sourceId, payload.cronogramaIndex);
  const idx = list.findIndex((x) => x.entityType === "class" && x.entityId === id);
  if (idx >= 0) {
    list.splice(idx, 1);
    persist(list);
    return false;
  }
  list.push({ entityType: "class", entityId: id, savedAt: new Date().toISOString() });
  persist(list);
  return true;
}
