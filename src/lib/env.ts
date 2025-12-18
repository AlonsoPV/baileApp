/**
 * Environment validation and logging
 * 
 * This module provides utilities to validate and log environment variables
 * at app startup, helping debug configuration issues in TestFlight builds.
 */

import Constants from "expo-constants";

/**
 * Read extra config from Constants (defensive)
 */
function readExtra() {
  const expoExtra = (Constants.expoConfig?.extra as any) ?? {};
  const manifestExtra = (Constants.manifest as any)?.extra ?? {};
  const manifest2Extra = (Constants.manifest2 as any)?.extra ?? {};
  
  // Merge in order of priority: manifest2 > manifest > expoConfig
  return { ...manifestExtra, ...expoExtra, ...manifest2Extra };
}

/**
 * Assert and log environment variables
 * 
 * This function validates that required environment variables are present
 * and logs detailed information for debugging in TestFlight.
 * 
 * @returns Object with url and key (may be undefined if missing)
 */
export function assertEnv() {
  const extra = readExtra();

  // Try multiple sources in order of priority
  const url =
    extra.supabaseUrl ??
    extra.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL;

  const key =
    extra.supabaseAnonKey ??
    extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // Log detailed information for debugging
  console.log("[ENV] ===== Environment Validation =====");
  console.log("[ENV] extra keys:", Object.keys(extra));
  console.log("[ENV] supabaseUrl?", !!url, url ? "(present)" : "(missing)");
  console.log("[ENV] anonKey?", !!key, key ? "(present)" : "(missing)");
  
  // Log sources (without exposing sensitive data)
  console.log("[ENV] Constants.expoConfig?.extra exists:", !!Constants.expoConfig?.extra);
  console.log("[ENV] Constants.manifest?.extra exists:", !!(Constants as any).manifest?.extra);
  console.log("[ENV] Constants.manifest2?.extra exists:", !!(Constants as any).manifest2?.extra);
  console.log("[ENV] process.env.EXPO_PUBLIC_SUPABASE_URL exists:", !!process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log("[ENV] process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY exists:", !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  console.log("[ENV] ====================================");

  return { url, key };
}

/**
 * Check if environment is valid (both url and key present)
 */
export function isEnvValid(): boolean {
  const { url, key } = assertEnv();
  return !!(url && key);
}

