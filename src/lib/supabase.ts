import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Read from extra (set in app.config.ts) - this works in Xcode Cloud
const extra = (Constants.expoConfig?.extra as any) || {};
const supabaseUrl =
  extra.supabaseUrl ?? 
  extra.EXPO_PUBLIC_SUPABASE_URL ?? 
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
  extra.supabaseAnonKey ?? 
  extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const missingEnvMsg =
  "[Supabase] ❌ Missing Supabase configuration (supabaseUrl / supabaseAnonKey). " +
  "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in Xcode Cloud environment variables or EAS.";

// ✅ Protect startup: Don't crash on import, fail explicitly when client is used
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(missingEnvMsg);
    console.error("[Supabase] supabaseUrl:", supabaseUrl ? "✓" : "✗");
    console.error("[Supabase] supabaseAnonKey:", supabaseAnonKey ? "✓" : "✗");

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

