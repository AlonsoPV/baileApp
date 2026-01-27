/**
 * Global active userId holder (web).
 *
 * Why: some persisted stores are created outside React (e.g. zustand stores),
 * but must still namespace keys by the currently authenticated user.
 *
 * AuthProvider is responsible for calling setActiveUserId() on auth changes.
 */
let activeUserId: string | null = null;

export function setActiveUserId(next: string | null | undefined) {
  activeUserId = next ? String(next) : null;
  if (import.meta.env.DEV) {
    // High-signal dev log: confirms isolation boundary.
    // eslint-disable-next-line no-console
    console.log("[UserIsolation] activeUserId =", activeUserId);
  }
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

