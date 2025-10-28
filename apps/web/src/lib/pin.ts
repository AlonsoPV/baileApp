// Simple PIN hashing and verification utilities using Web Crypto API

/** Hash a 4-digit PIN using SHA-256 and return hex string */
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Compare plaintext PIN to a stored hex hash */
export async function verifyPin(pin: string, hashHex: string): Promise<boolean> {
  const h = await hashPin(pin);
  return h === hashHex;
}

const LS_KEY = 'ba_pin_verified_v1';

type VerifiedMap = Record<string, number>; // userId -> epoch ms

/** Mark the PIN as verified for the current user (stored locally) */
export function setPinVerified(userId: string): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const map: VerifiedMap = raw ? JSON.parse(raw) : {};
    map[userId] = Date.now();
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {}
}

/** Remove verified flag for the given user */
export function clearPinVerified(userId: string): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const map: VerifiedMap = raw ? JSON.parse(raw) : {};
    delete map[userId];
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {}
}

/** Clear all local verifications (e.g., on global sign out) */
export function clearAllPinVerified(): void {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

/** Check if user has a locally verified PIN session */
export function isPinVerified(userId?: string | null): boolean {
  if (!userId) return false;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const map: VerifiedMap = JSON.parse(raw);
    return !!map[userId];
  } catch {
    return false;
  }
}


