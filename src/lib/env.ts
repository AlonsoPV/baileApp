/**
 * Environment validation and logging
 * 
 * This module provides utilities to validate and log environment variables
 * at app startup, helping debug configuration issues in TestFlight builds.
 * 
 * ✅ RECOMENDACIÓN: En bare RN + Expo SDK, confía en Constants.expoConfig.extra
 * NO uses process.env.EXPO_PUBLIC_* en runtime (solo funciona en build-time).
 */

import Constants from "expo-constants";
import { getRuntimeConfig } from "../config/runtimeConfig";

/**
 * Read extra config from Constants (defensive)
 * 
 * In bare RN, app.config.ts generates extra that is available via Constants.expoConfig.extra
 * This is the reliable source for runtime environment variables.
 */
function readExtra() {
  const expoExtra = (Constants.expoConfig?.extra as any) ?? {};
  const manifestExtra = (Constants.manifest as any)?.extra ?? {};
  const manifest2Extra = (Constants.manifest2 as any)?.extra ?? {};
  
  // Merge in order of priority: manifest2 > manifest > expoConfig
  return { ...manifestExtra, ...expoExtra, ...manifest2Extra };
}

/**
 * Centralized environment configuration
 *
 * ✅ Runtime-safe: lee SIEMPRE desde Constants.expoConfig.extra (no process.env en el dispositivo).
 * app.config.ts inyecta SUPABASE_URL/SUPABASE_ANON_KEY desde process.env al build; aquí solo leemos extra.
 */
export const ENV = (() => {
  // ✅ Single source of truth
  const cfg = getRuntimeConfig();
  return {
    supabaseUrl: (cfg.supabase.url ?? null) as string | null,
    supabaseAnonKey: (cfg.supabase.anonKey ?? null) as string | null,
  };
})();

/**
 * Assert and log environment variables
 * 
 * This function validates that required environment variables are present
 * and logs detailed information for debugging in TestFlight.
 * 
 * ✅ Uses ENV (from Constants.expoConfig.extra) which is reliable in bare RN
 * 
 * @returns Object with url and key (may be null if missing)
 */
export function assertEnv() {
  const { supabaseUrl: url, supabaseAnonKey: key } = ENV;

  // Log detailed information for debugging
  console.log("[ENV] ===== Environment Validation =====");
  console.log("[ENV] supabaseUrl?", !!url, url ? "(present)" : "(missing)");
  console.log("[ENV] anonKey?", !!key, key ? "(present)" : "(missing)");
  
  // Log sources (without exposing sensitive data)
  console.log("[ENV] Constants.expoConfig?.extra exists:", !!Constants.expoConfig?.extra);
  console.log("[ENV] Constants.manifest?.extra exists:", !!(Constants as any).manifest?.extra);
  console.log("[ENV] Constants.manifest2?.extra exists:", !!(Constants as any).manifest2?.extra);
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

