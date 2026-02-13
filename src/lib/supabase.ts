import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRuntimeConfig } from "../config/runtimeConfig";
import { markPerformance } from "./performance";

/**
 * Runtime Supabase init
 *
 * ✅ Regla: en iOS/TestFlight NO se lee `process.env` en runtime.
 * Solo se leen valores desde `Constants.expoConfig.extra` (vía `runtimeConfig`).
 *
 * REGLA: `supabase` debe ser null o un cliente válido. Nunca Proxy que lanza.
 */

function readExtra() {
  try {
    // expoConfig a veces no existe en prod; manifest/manifest2 depende del SDK
    const anyConst = Constants as any;
    return (
      Constants.expoConfig?.extra ??
      anyConst.manifest?.extra ??
      anyConst.manifest2?.extra ??
      {}
    );
  } catch (e) {
    console.warn("[Supabase] Error reading Constants.extra:", e);
    return {};
  }
}

let supabaseUrl: string | undefined;
let supabaseAnonKey: string | undefined;
let supabase: SupabaseClient | null = null;

try {
  const cfg = getRuntimeConfig();
  const extra = cfg.extra;

  // ✅ Use ENV (from Constants.expoConfig.extra) as primary source
  // This is reliable in bare RN, process.env may be undefined in runtime
  // ⚠️ IMPORTANT: Treat empty strings as missing (app.config.ts may return '' if vars not available at build-time)
  const normalizeValue = (v: string | undefined | null): string | undefined => {
    const s = String(v ?? '').trim();
    return s.length > 0 ? s : undefined;
  };

  supabaseUrl = normalizeValue(cfg.supabase.url) || normalizeValue(extra.supabaseUrl) || normalizeValue(extra.EXPO_PUBLIC_SUPABASE_URL);

  supabaseAnonKey =
    normalizeValue(cfg.supabase.anonKey) ||
    normalizeValue(extra.supabaseAnonKey) ||
    normalizeValue(extra.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  // ✅ En producción NO queremos crashear la app por config faltante
  // Retornamos null en lugar de un Proxy que puede fallar
  // Tipo explícito: SupabaseClient | null
  if (supabaseUrl && supabaseAnonKey) {
    try {
      markPerformance("supabase_init_start");
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // React Native: persistencia y refresh usando AsyncStorage
          storage: AsyncStorage as any,
          persistSession: true,
          autoRefreshToken: true,
          // RN no usa "callback URL hash" como web
          detectSessionInUrl: false,
        },
      });
      markPerformance("supabase_init_complete");
    } catch (e) {
      console.error("[Supabase] Error creating client:", e);
      supabase = null;
      markPerformance("supabase_init_failed");
    }
  } else {
    supabase = null;
    markPerformance("supabase_init_skipped");
  }
} catch (e) {
  console.error("[Supabase] Critical error during initialization:", e);
  // Asegurar que supabase sea null en caso de error
  supabase = null;
  supabaseUrl = undefined;
  supabaseAnonKey = undefined;
}

export { supabase };

// Helper para obtener URL pública de buckets (si supabase está disponible)
export function getBucketPublicUrl(bucket: string, path: string): string | null {
  if (!supabase || !supabaseUrl) {
    console.warn("[Supabase] getBucketPublicUrl called but Supabase is not configured");
    return null;
  }
  
  // Construir URL pública de Supabase Storage
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  // Usar la variable supabaseUrl que está en el scope del módulo
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

// Log de diagnóstico (solo en desarrollo o si falta config)
if (!supabase) {
  const missingMsg = "[Supabase] ❌ Missing Supabase configuration. " +
    "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in Xcode Cloud environment variables or EAS.";
  
  // Diagnóstico detallado para ayudar a debuggear en TestFlight
  console.warn(missingMsg);
  console.warn("[Supabase] ===== Configuration Diagnostics =====");
  console.warn("[Supabase] supabaseUrl:", supabaseUrl ? `✓ (len=${String(supabaseUrl).length})` : "✗ (missing or empty)");
  console.warn("[Supabase] supabaseAnonKey:", supabaseAnonKey ? `✓ (len=${String(supabaseAnonKey).length})` : "✗ (missing or empty)");
  console.warn("[Supabase] Constants.expoConfig?.extra:", Constants.expoConfig?.extra ? "exists" : "missing");
  if (Constants.expoConfig?.extra) {
    const extraUrl = (Constants.expoConfig.extra as any)?.EXPO_PUBLIC_SUPABASE_URL ?? (Constants.expoConfig.extra as any)?.supabaseUrl;
    const extraKey = (Constants.expoConfig.extra as any)?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? (Constants.expoConfig.extra as any)?.supabaseAnonKey;
    console.warn("[Supabase] extra.EXPO_PUBLIC_SUPABASE_URL:", extraUrl ? `present (len=${String(extraUrl).length})` : "missing");
    console.warn("[Supabase] extra.EXPO_PUBLIC_SUPABASE_ANON_KEY:", extraKey ? `present (len=${String(extraKey).length})` : "missing");
    // Si están presentes pero son strings vacíos, eso es el problema
    if (extraUrl === '' || extraKey === '') {
      console.warn("[Supabase] ⚠️  WARNING: Variables found but are empty strings. This means app.config.ts received empty values at build-time.");
      console.warn("[Supabase] ⚠️  Ensure Xcode Cloud environment variables are set and ci_post_clone.sh creates .env BEFORE Metro runs.");
    }
  }
  console.warn("[Supabase] Constants.manifest?.extra:", (Constants as any)?.manifest?.extra ? "exists" : "missing");
  console.warn("[Supabase] Constants.manifest2?.extra:", (Constants as any)?.manifest2?.extra ? "exists" : "missing");
  const cfg = getRuntimeConfig();
  console.warn("[Supabase] runtimeConfig.supabase.url:", cfg.supabase.url ? `✓ (len=${String(cfg.supabase.url).length})` : "✗");
  console.warn("[Supabase] runtimeConfig.supabase.anonKey:", cfg.supabase.anonKey ? `✓ (len=${String(cfg.supabase.anonKey).length})` : "✗");
  console.warn("[Supabase] ======================================");
  
  // En desarrollo: mostrar error más visible pero NO crashear
  // @ts-ignore - __DEV__ is a React Native global
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.error(missingMsg);
  }
}
