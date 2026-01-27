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

import { buildKey } from '@/storage/keys';

const VERIFIED_PARTS = ['pin', 'verified', 'v1'] as const;
const NEEDS_PARTS = ['pin', 'needs_verify', 'v1'] as const;

function verifiedKey(userId: string) {
  return buildKey(userId, [...VERIFIED_PARTS]);
}

function needsKey(userId: string) {
  return buildKey(userId, [...NEEDS_PARTS]);
}

/** Mark the PIN as verified for the current user (stored locally) */
export function setPinVerified(userId: string): void {
  try {
    sessionStorage.setItem(verifiedKey(userId), String(Date.now()));
    // Clear needs verify for this user
    clearNeedsPinVerify(userId);
  } catch {}
}

/** Remove verified flag for the given user */
export function clearPinVerified(userId: string): void {
  try {
    sessionStorage.removeItem(verifiedKey(userId));
  } catch {}
}

/** Clear all local verifications (e.g., on global sign out) */
export function clearAllPinVerified(): void {
  try {
    // Remove both legacy unscoped keys and new user-scoped keys.
    sessionStorage.removeItem('ba_pin_verified_v1');
    sessionStorage.removeItem('ba_pin_needs_verify_v1');
  } catch {}
  try {
    // Best-effort: remove any user-scoped PIN keys.
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (!k) continue;
      if (k.includes(':pin:verified:v1') || k.includes(':pin:needs_verify:v1')) {
        try { sessionStorage.removeItem(k); } catch {}
      }
    }
  } catch {}
}

/** Check if user has a locally verified PIN session */
export function isPinVerified(userId?: string | null): boolean {
  if (!userId) return false;
  try {
    const v = sessionStorage.getItem(verifiedKey(userId));
    return !!v;
  } catch {
    return false;
  }
}

/** Mark that current session requires PIN verification (set after fresh login) */
export function setNeedsPinVerify(userId: string): void {
  try {
    sessionStorage.setItem(needsKey(userId), String(Date.now()));
  } catch {}
}

/** Clear needs verify flag for a user */
export function clearNeedsPinVerify(userId: string): void {
  try {
    sessionStorage.removeItem(needsKey(userId));
  } catch {}
}

/** Check if session requires PIN verification for a user */
export function needsPinVerify(userId?: string | null): boolean {
  if (!userId) return false;
  try {
    const v = sessionStorage.getItem(needsKey(userId));
    return !!v;
  } catch {
    return false;
  }
}


