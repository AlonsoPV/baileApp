import { buildKey, buildAppKey, buildSessionKey, type KeyPart } from "./keys";
import { getActiveUserId } from "./activeUser";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function safeGetActiveUserId(): string | null {
  try {
    return getActiveUserId();
  } catch {
    return null;
  }
}

export function userLocalStorageKey(parts: KeyPart[], userIdOverride?: string): string {
  const uid = userIdOverride ?? safeGetActiveUserId();
  if (!uid) throw new Error("userLocalStorageKey requires active userId");
  return buildKey(uid, parts);
}

export function userSessionStorageKey(parts: KeyPart[], userIdOverride?: string): string {
  const uid = userIdOverride ?? safeGetActiveUserId();
  if (!uid) throw new Error("userSessionStorageKey requires active userId");
  return buildKey(uid, parts);
}

export const userLocalStorage = {
  getItem(parts: KeyPart[], userIdOverride?: string): string | null {
    if (typeof localStorage === "undefined") return null;
    try {
      return localStorage.getItem(userLocalStorageKey(parts, userIdOverride));
    } catch {
      // No active user → do not read unscoped keys
      return null;
    }
  },
  setItem(parts: KeyPart[], value: string, userIdOverride?: string): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(userLocalStorageKey(parts, userIdOverride), value);
    } catch {
      // No active user → do not write unscoped keys
    }
  },
  removeItem(parts: KeyPart[], userIdOverride?: string): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.removeItem(userLocalStorageKey(parts, userIdOverride));
    } catch {
      // No active user → do not remove unscoped keys
    }
  },
};

export const appLocalStorage = {
  getItem(parts: KeyPart[]): string | null {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(buildAppKey(parts));
  },
  setItem(parts: KeyPart[], value: string): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(buildAppKey(parts), value);
  },
  removeItem(parts: KeyPart[]): void {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(buildAppKey(parts));
  },
};

export const sessionStorageScoped = {
  getItem(parts: KeyPart[]): string | null {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(buildSessionKey(parts));
  },
  setItem(parts: KeyPart[], value: string): void {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(buildSessionKey(parts), value);
  },
  removeItem(parts: KeyPart[]): void {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(buildSessionKey(parts));
  },
};

/**
 * Remove known legacy unscoped keys that can cause cross-user bleed.
 * IMPORTANT: we delete (do not migrate) because ownership is ambiguous.
 */
export function clearLegacyUnscopedWebKeys() {
  if (typeof localStorage !== "undefined") {
    try { localStorage.removeItem("ba_explore_filters_v1"); } catch {}
    try { localStorage.removeItem("ba_profile_mode"); } catch {}
    try { localStorage.removeItem("db_language"); } catch {}
    // Legacy default profile key pattern
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("default_profile_")) {
          try { localStorage.removeItem(k); } catch {}
        }
      }
    } catch {}
    try { localStorage.removeItem("baileapp:drafts:v1"); } catch {}
    // Supabase session key is handled by supabase itself; do not delete here unless logging out.
  }
  if (typeof sessionStorage !== "undefined") {
    try { sessionStorage.removeItem("@baileapp:appTerminated"); } catch {}
    try { sessionStorage.removeItem("ba_pin_verified_v1"); } catch {}
    try { sessionStorage.removeItem("ba_pin_needs_verify_v1"); } catch {}
  }
}

/** Remove all persisted user-scoped keys for a given userId. */
export function clearUserScopedWebStorage(userId: string) {
  const prefix = `u:${String(userId)}:`;
  if (typeof localStorage !== "undefined") {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          try { localStorage.removeItem(k); } catch {}
        }
      }
    } catch {}
  }
  if (typeof sessionStorage !== "undefined") {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(prefix)) {
          try { sessionStorage.removeItem(k); } catch {}
        }
      }
    } catch {}
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[UserIsolation] cleared user-scoped storage for", userId);
  }
}

/**
 * Create a Zustand persist Storage that automatically namespaces by active userId.
 * This keeps persist "name" stable in code, while storage keys are user-scoped.
 */
export function createUserScopedZustandStorage(base: StorageLike) {
  return {
    getItem: (name: string) => {
      const uid = safeGetActiveUserId();
      if (!uid) return null;
      const key = buildKey(uid, ["zustand", name]);
      return base.getItem(key);
    },
    setItem: (name: string, value: string) => {
      const uid = safeGetActiveUserId();
      if (!uid) return;
      const key = buildKey(uid, ["zustand", name]);
      base.setItem(key, value);
    },
    removeItem: (name: string) => {
      const uid = safeGetActiveUserId();
      if (!uid) return;
      const key = buildKey(uid, ["zustand", name]);
      base.removeItem(key);
    },
  };
}

