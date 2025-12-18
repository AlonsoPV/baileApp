import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

/**
 * ✅ FIX CRÍTICO: Acceso estático a process.env para que Metro pueda inlinear
 * 
 * Metro solo puede inlinear variables EXPO_PUBLIC_* cuando se acceden de forma estática:
 * ✅ process.env.EXPO_PUBLIC_SUPABASE_URL
 * ❌ process.env[key] (NO funciona en runtime)
 * 
 * En TestFlight, el acceso dinámico devuelve undefined y causa crash fatal.
 */

function readExtra() {
  // expoConfig a veces no existe en prod; manifest/manifest2 depende del SDK
  const anyConst = Constants as any;
  return (
    Constants.expoConfig?.extra ??
    anyConst.manifest?.extra ??
    anyConst.manifest2?.extra ??
    {}
  );
}

const extra = readExtra();

// ✅ OJO: acceso estático para que Metro inlinee EXPO_PUBLIC_*
// Esto es crítico: Metro necesita ver la referencia literal a la variable
const ENV_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ENV_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl =
  (extra.supabaseUrl as string | undefined) ||
  (extra.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
  ENV_URL;

const supabaseAnonKey =
  (extra.supabaseAnonKey as string | undefined) ||
  (extra.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  ENV_KEY;

// ✅ En producción NO queremos crashear la app por config faltante
// Retornamos null en lugar de un Proxy que puede fallar
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

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
