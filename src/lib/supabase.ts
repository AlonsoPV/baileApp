import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { ENV } from "./env";

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
  supabaseUrl =
    ENV.supabaseUrl ||
    extra.supabaseUrl ||
    extra.EXPO_PUBLIC_SUPABASE_URL ||
    ENV_URL;

  supabaseAnonKey =
    ENV.supabaseAnonKey ||
    extra.supabaseAnonKey ||
    extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    ENV_KEY;

  // ✅ En producción NO queremos crashear la app por config faltante
  // Retornamos null en lugar de un Proxy que puede fallar
  // Tipo explícito: SupabaseClient | null
  if (supabaseUrl && supabaseAnonKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.error("[Supabase] Error creating client:", e);
      supabase = null;
    }
  } else {
    supabase = null;
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
  
  console.warn(missingMsg);
  console.warn("[Supabase] supabaseUrl:", supabaseUrl ? "✓" : "✗");
  console.warn("[Supabase] supabaseAnonKey:", supabaseAnonKey ? "✓" : "✗");
  console.warn("[Supabase] Constants.expoConfig?.extra:", Constants.expoConfig?.extra ? "exists" : "missing");
  console.warn("[Supabase] Constants.manifest?.extra:", (Constants as any)?.manifest?.extra ? "exists" : "missing");
  console.warn("[Supabase] Constants.manifest2?.extra:", (Constants as any)?.manifest2?.extra ? "exists" : "missing");
  console.warn("[Supabase] ENV_URL:", ENV_URL ? "✓" : "✗");
  console.warn("[Supabase] ENV_KEY:", ENV_KEY ? "✓" : "✗");
  
  // En desarrollo: mostrar error más visible pero NO crashear
  // @ts-ignore - __DEV__ is a React Native global
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.error(missingMsg);
  }
}
