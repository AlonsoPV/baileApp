import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl =
  (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  (Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const missingEnvMsg =
  "[Supabase] ❌ Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
  "Set them in EAS env or app.config.ts extra.";

// ✅ Paso 3 — proteger el arranque: NO crashear al importar el módulo
// En su lugar, loguear el error y fallar de forma explícita cuando se intente usar el cliente.
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(missingEnvMsg);

    return new Proxy(
      {},
      {
        get() {
          throw new Error(missingEnvMsg);
        },
      }
    ) as any;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
})();

