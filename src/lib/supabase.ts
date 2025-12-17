import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Safe access to process.env
const getEnvVar = (key: string): string | undefined => {
  // @ts-ignore - process.env is available at runtime
  return typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
};

// Lazy evaluation: only access Constants.expoConfig when supabase is actually used
// This prevents crashes during module import before React Native is initialized
function getSupabaseConfig() {
  try {
    const extra = (Constants.expoConfig?.extra as any) || {};
    return {
      supabaseUrl:
        extra.supabaseUrl ??
        extra.EXPO_PUBLIC_SUPABASE_URL ??
        getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
      supabaseAnonKey:
        extra.supabaseAnonKey ??
        extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
        getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    };
  } catch (error) {
    console.warn('[Supabase] Error reading config:', error);
    return {
      supabaseUrl: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
      supabaseAnonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    };
  }
}

const missingEnvMsg =
  "[Supabase] ❌ Missing Supabase configuration (supabaseUrl / supabaseAnonKey). " +
  "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in Xcode Cloud environment variables or EAS.";

// ✅ Lazy initialization: Don't access Constants.expoConfig until supabase is actually used
let supabaseClient: ReturnType<typeof createClient> | null = null;
let supabaseProxy: any = null;

function getSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (supabaseProxy) {
    return supabaseProxy;
  }

  const config = getSupabaseConfig();
  
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.error(missingEnvMsg);
    console.error("[Supabase] supabaseUrl:", config.supabaseUrl ? "✓" : "✗");
    console.error("[Supabase] supabaseAnonKey:", config.supabaseAnonKey ? "✓" : "✗");

    supabaseProxy = new Proxy(
      {},
      {
        get() {
          throw new Error(missingEnvMsg);
        },
      }
    ) as any;
    return supabaseProxy;
  }

  supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
  return supabaseClient;
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return getSupabase()[prop as keyof ReturnType<typeof createClient>];
  },
});

