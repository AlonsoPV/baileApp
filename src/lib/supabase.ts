import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// ✅ Read from all possible sources (expoConfig, manifest, manifest2)
// This handles different Expo runtimes (SDK 54, standalone, TestFlight, etc.)
function getExtra(): any {
  // expoConfig (SDK moderno / Expo Go / Dev builds)
  const expoConfigExtra = (Constants.expoConfig as any)?.extra;
  
  // manifest / manifest2 (standalone / TestFlight / diferentes runtimes)
  const manifestExtra =
    (Constants as any)?.manifest?.extra ??
    (Constants as any)?.manifest2?.extra;
  
  return expoConfigExtra ?? manifestExtra ?? {};
}

// Lazy evaluation: only access Constants when supabase is actually used
// This prevents crashes during module import before React Native is initialized
function getSupabaseConfig() {
  const extra = getExtra();
  
  // Priority: extra.supabaseUrl > extra.EXPO_PUBLIC_SUPABASE_URL
  // NO process.env fallback in runtime iOS (doesn't exist as expected)
  const supabaseUrl =
    extra.supabaseUrl ??
    extra.EXPO_PUBLIC_SUPABASE_URL;
  
  const supabaseAnonKey =
    extra.supabaseAnonKey ??
    extra.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  return { supabaseUrl, supabaseAnonKey };
}

const missingEnvMsg =
  "[Supabase] ❌ Missing Supabase configuration (supabaseUrl / supabaseAnonKey). " +
  "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in Xcode Cloud environment variables or EAS.";

// ✅ Lazy initialization: Don't access Constants.expoConfig until supabase is actually used
let supabaseClient: ReturnType<typeof createClient> | null = null;
let supabaseProxy: any = null;

// ✅ Null client that returns rejected promises instead of throwing
// This prevents SIGABRT crashes in production/TestFlight
function createNullClient() {
  const errorResponse = { data: null, error: { message: missingEnvMsg, code: 'CONFIG_MISSING' } };
  
  return {
    from: () => ({
      select: async () => errorResponse,
      insert: async () => errorResponse,
      update: async () => errorResponse,
      delete: async () => errorResponse,
      upsert: async () => errorResponse,
    }),
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: missingEnvMsg } }),
      signUp: async () => ({ data: null, error: { message: missingEnvMsg } }),
      signOut: async () => ({ error: { message: missingEnvMsg } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: { message: missingEnvMsg } }),
    },
  } as any;
}

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
    
    const extra = getExtra();
    console.error("[Supabase] Constants.expoConfig?.extra:", (Constants.expoConfig as any)?.extra ? "exists" : "missing");
    console.error("[Supabase] Constants.manifest?.extra:", (Constants as any)?.manifest?.extra ? "exists" : "missing");
    console.error("[Supabase] Constants.manifest2?.extra:", (Constants as any)?.manifest2?.extra ? "exists" : "missing");
    console.error("[Supabase] getExtra() result:", extra);
    
    // In development: throw to catch config issues early
    // @ts-ignore - __DEV__ is a React Native global
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      throw new Error(missingEnvMsg);
    }

    // In production: return null client that doesn't crash
    // UI can handle the error gracefully
    supabaseProxy = createNullClient();
    return supabaseProxy;
  }

  supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
  return supabaseClient;
}

// ✅ Enhanced Proxy that handles all property access patterns (methods, properties, etc.)
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getSupabase();
    const value = client[prop as keyof typeof client];
    
    // If it's a function, bind it to the client to preserve 'this' context
    if (typeof value === 'function') {
      return value.bind(client);
    }
    
    return value;
  },
  // Handle 'in' operator checks
  has(_target, prop) {
    const client = getSupabase();
    return prop in client;
  },
  // Handle Object.keys() and similar operations
  ownKeys(_target) {
    const client = getSupabase();
    return Reflect.ownKeys(client);
  },
  // Handle property descriptors
  getOwnPropertyDescriptor(_target, prop) {
    const client = getSupabase();
    return Reflect.getOwnPropertyDescriptor(client, prop);
  },
});

