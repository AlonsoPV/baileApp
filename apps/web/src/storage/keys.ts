export type KeyPart = string | number;

/**
 * Universal per-user key builder.
 *
 * Rule: any user data persisted locally MUST use this format.
 * Example: buildKey(userId, ['filters']) -> "u:<userId>:filters"
 */
export function buildKey(userId: string, parts: KeyPart[]): string {
  const safeUserId = String(userId).trim();
  if (!safeUserId) {
    throw new Error("buildKey requires a non-empty userId");
  }
  const tail = parts.map((p) => String(p).trim()).filter(Boolean).join(":");
  return tail ? `u:${safeUserId}:${tail}` : `u:${safeUserId}`;
}

/** Session-scoped (NOT user data). Cleared on logout. */
export function buildSessionKey(parts: KeyPart[]): string {
  const tail = parts.map((p) => String(p).trim()).filter(Boolean).join(":");
  return tail ? `s:${tail}` : "s";
}

/** App-scoped (NOT user data). Shared across users on device. */
export function buildAppKey(parts: KeyPart[]): string {
  const tail = parts.map((p) => String(p).trim()).filter(Boolean).join(":");
  return tail ? `app:${tail}` : "app";
}

