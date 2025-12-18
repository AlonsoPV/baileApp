import type { ExpoConfig } from "expo/config";

// ✅ NUNCA throw en producción - siempre retornar valor por defecto
// ⚠️ Durante el build de Xcode Cloud, las variables pueden no estar disponibles inmediatamente
// En runtime (TestFlight), nunca debemos crashear por falta de env vars
// Las variables se inyectarán desde Xcode Cloud environment variables o EAS
const required = (key: string, defaultValue: string = ''): string => {
  // @ts-ignore - process.env is available at build time
  const value = typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  
  // Si hay un valor, usarlo
  if (value) {
    return value;
  }
  
  // ✅ SIEMPRE retornar defaultValue si no hay valor
  // NUNCA throw en producción - esto previene crashes en TestFlight
  // Solo mostrar warning si no estamos en un contexto silencioso
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(`[app.config] Using default/empty value for ${key} (should be set in Xcode Cloud environment variables or EAS)`);
  }
  return defaultValue;
};

const config: ExpoConfig = {
  name: "Donde Bailar MX",
  slug: "donde-bailar-mx",
  version: "1.0.0",

  // ✅ para bare workflow / evita r e l error
  // (este archivo tiene prioridad sobre app. json)
  runtimeVersion: "1.0.0",

  scheme: "dondebailarmx",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: false, // ⚠️ Deshabilitado temporalmente debido a crash en TurboModules (iOS 18.1)

  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },

  web: {
    bundler: "metro",
    favicon: "./assets/favicon.png",
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.tuorg.dondebailarmx",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false, // Usa cifrado estándar/exento (HTTPS)
      // ✅ Configuración de Expo Updates (se genera automáticamente desde updates.url y runtimeVersion)
      // EXUpdatesURL se genera desde updates.url
      // EXUpdatesRuntimeVersion se genera desde runtimeVersion
      // EXUpdatesEnabled se genera automáticamente como true
    },
  },

  android: {
    package: "com.tuorg.dondebailarmx",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    edgeToEdgeEnabled: true,
    intentFilters: [
      {
        action: "VIEW",
        data: [
          {
            scheme: "https",
            host: "dondebailar.com.mx",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  extra: {
    // Supabase config - durante el build, permitir valores vacíos si no están disponibles
    // Las variables se inyectarán en  runtime desde las variables de entorno de Xcode Cloud
    supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', ''),
    supabaseAnonKey: required('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
    // Keep EXPO_PUBLIC_* for backwards compatibility
    EXPO_PUBLIC_SUPABASE_URL: required('EXPO_PUBLIC_SUPABASE_URL', ''),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: required('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
    eas: {
      projectId: "8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66",
    },
  },

  updates: {
    enabled: false, // Temporarily disabled to prevent crashes
    url: "https://u.expo.dev/8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66",
    fallbackToCacheTimeout: 0,
  },
};

export default config;

