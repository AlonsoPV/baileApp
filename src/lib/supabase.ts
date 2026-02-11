import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "./env";
import { markPerformance } from "./performance";

/**
 * ✅ FIX CRÍTICO: Acceso estático a process.env para que Metro pueda inlinear
 * 
 * Metro solo puede inlinear variables EXPO_PUBLIC_* cuando se acceden de forma estática:
 * ✅ process.env.EXPO_PUBLIC_SUPABASE_URL
 * ❌ process.env[key] (NO funciona en runtime)
 * 
 * En TestFlight, el acceso dinámico devuelve undefined y causa crash fatal.
 * 
 * REGLA: supabase debe ser null o un cliente válido. Nunca Proxy que lanza.
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

let extra: any = {};
let ENV_URL: string | undefined;
let ENV_KEY: string | undefined;
let supabaseUrl: string | undefined;
let supabaseAnonKey: string | undefined;
let supabase: SupabaseClient | null = null;

try {
  extra = readExtra();

  // ⚠️ acceso estático (no dinámico) para que Metro inlinee
  // Esto es crítico: Metro necesita ver la referencia literal a la variable
  ENV_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  ENV_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // ✅ Use ENV (from Constants.expoConfig.extra) as primary source
  // This is reliable in bare RN, process.env may be undefined in runtime
  // ⚠️ IMPORTANT: Treat empty strings as missing (app.config.ts may return '' if vars not available at build-time)
  const normalizeValue = (v: string | undefined | null): string | undefined => {
    const s = String(v ?? '').trim();
    return s.length > 0 ? s : undefined;
  };

  supabaseUrl =
    normalizeValue(ENV.supabaseUrl) ||
    normalizeValue(extra.supabaseUrl) ||
    normalizeValue(extra.EXPO_PUBLIC_SUPABASE_URL) ||
    normalizeValue(ENV_URL);

  supabaseAnonKey =
    normalizeValue(ENV.supabaseAnonKey) ||
    normalizeValue(extra.supabaseAnonKey) ||
    normalizeValue(extra.EXPO_PUBLIC_SUPABASE_ANON_KEY) ||
    normalizeValue(ENV_KEY);

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
  console.warn("[Supabase] ENV_URL (process.env):", ENV_URL ? `✓ (len=${String(ENV_URL).length})` : "✗ (not available in RN runtime)");
  console.warn("[Supabase] ENV_KEY (process.env):", ENV_KEY ? `✓ (len=${String(ENV_KEY).length})` : "✗ (not available in RN runtime)");
  console.warn("[Supabase] ENV.supabaseUrl:", ENV.supabaseUrl ? `✓ (len=${String(ENV.supabaseUrl).length})` : "✗");
  console.warn("[Supabase] ENV.supabaseAnonKey:", ENV.supabaseAnonKey ? `✓ (len=${String(ENV.supabaseAnonKey).length})` : "✗");
  console.warn("[Supabase] ======================================");
  
  // En desarrollo: mostrar error más visible pero NO crashear
  // @ts-ignore - __DEV__ is a React Native global
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.error(missingMsg);
  }
}
