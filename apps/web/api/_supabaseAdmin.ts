import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function getEnv(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const key = serviceRoleKey || anonKey;
  if (!url || !key) return null;
  return { url, key };
}

/** No lanzar al importar el módulo: evita 500 en cold start de serverless. */
export function getSupabaseAdminForApi(): SupabaseClient | null {
  if (cached) return cached;
  const env = getEnv();
  if (!env) {
    console.error(
      "[supabaseAdmin] Missing Supabase server env. Expected SUPABASE_URL plus SUPABASE_SERVICE_ROLE or SUPABASE_ANON_KEY (VITE_* also supported).",
    );
    return null;
  }
  try {
    cached = createClient(env.url, env.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (e) {
    console.error("[supabaseAdmin] createClient failed", e);
    return null;
  }
  return cached;
}
