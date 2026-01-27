import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import type { ExpoConfig } from "expo/config";

// In some Expo config evaluation contexts, mutating process.env can be unreliable.
// We'll parse the local env file into an object and use it as the source of truth.
const LOCAL_ENV: Record<string, string> = {};
function loadLocalEnvFile(filePath: string) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    // Safe diagnostics (no secrets): verify Node is reading the expected content.
    const urlMatch = raw.match(/^EXPO_PUBLIC_SUPABASE_URL=(.*)$/m);
    const keyMatch = raw.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m);
    // eslint-disable-next-line no-console
    console.log("[app.config] local.env diagnostics:", {
      filePath,
      rawLen: raw.length,
      hasHttps: raw.includes("https://"),
      hasJwtPrefix: raw.includes("eyJ"),
      urlLineLen: urlMatch?.[1]?.trim()?.length ?? 0,
      anonLineLen: keyMatch?.[1]?.trim()?.length ?? 0,
    });

    const parsed = dotenv.parse(raw);
    for (const [k, v] of Object.entries(parsed)) {
      // Remove potential UTF-8 BOM on the first key
      const cleanKey = k.replace(/^\uFEFF/, "");
      LOCAL_ENV[cleanKey] = v;
    }
    // eslint-disable-next-line no-console
    console.log("[app.config] LOCAL_ENV parsed keys:", Object.keys(LOCAL_ENV));
  } catch {
    // ignore
  }
}

// Load local env file for Expo Go / simulator runs (does NOT affect Xcode Cloud)
// Prefer config/local.env if it exists (we'll gitignore it), otherwise fall back to .env behavior.
try {
  // Use process.cwd() (more reliable than __dirname if this file is loaded as ESM).
  const cwd = process.cwd();
  const localEnvPath = path.join(cwd, "config", "local.env");
  const defaultEnvPath = path.join(cwd, ".env");

  const hasLocal = fs.existsSync(localEnvPath);
  const hasDefault = fs.existsSync(defaultEnvPath);

  // eslint-disable-next-line no-console
  console.log("[app.config] dotenv cwd:", cwd);
  // eslint-disable-next-line no-console
  console.log("[app.config] dotenv files:", {
    localEnvPath,
    hasLocal,
    defaultEnvPath,
    hasDefault,
  });

  const chosenPath = hasLocal ? localEnvPath : defaultEnvPath;
  const fileExists = hasLocal || hasDefault;

  // Load into LOCAL_ENV first (reliable)
  if (fileExists) {
    loadLocalEnvFile(chosenPath);
  }

  // Also try dotenv.config to support tooling that expects process.env to be populated.
  // ✅ Only call dotenv.config if the file actually exists (prevents ENOENT errors in Xcode Cloud)
  const result = fileExists
    ? dotenv.config({ path: chosenPath, override: true })
    : { error: null, parsed: {} };

  // eslint-disable-next-line no-console
  console.log("[app.config] dotenv loaded:", {
    used: hasLocal ? "config/local.env" : hasDefault ? ".env" : "(none found - using Xcode Cloud env vars)",
    error: result.error ? String(result.error) : null,
  });

  // eslint-disable-next-line no-console
  console.log("[app.config] LOCAL_ENV presence:", {
    hasUrl: (LOCAL_ENV.EXPO_PUBLIC_SUPABASE_URL ?? "").length > 0,
    urlLen: (LOCAL_ENV.EXPO_PUBLIC_SUPABASE_URL ?? "").length,
    hasAnonKey: (LOCAL_ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").length > 0,
    anonKeyLen: (LOCAL_ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").length,
    anonKeyPrefix: LOCAL_ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY
      ? `${LOCAL_ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY.slice(0, 12)}...`
      : "",
  });
} catch (e) {
  // eslint-disable-next-line no-console
  console.log("[app.config] dotenv load failed:", String(e));
}

// Debug helper (prints in `expo start` logs) — no secrets, only presence/length.
const logEnvPresence = () => {
  try {
    const url = (LOCAL_ENV.EXPO_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "") as string;
    const key = (LOCAL_ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "") as string;
    // eslint-disable-next-line no-console
    console.log("[app.config] ENV presence:", {
      hasUrl: url.length > 0,
      urlLen: url.length,
      hasAnonKey: key.length > 0,
      anonKeyLen: key.length,
      anonKeyPrefix: key ? `${key.slice(0, 12)}...` : "",
    });
  } catch {
    // ignore
  }
};

logEnvPresence();

// ✅ NUNCA throw en producción - siempre retornar valor por defecto
// ⚠️ Durante el build de Xcode Cloud, las variables pueden no estar disponibles inmediatamente
// En runtime (TestFlight), nunca debemos crashear por falta de env vars
// Las variables se inyectarán desde Xcode Cloud environment variables o EAS
const required = (key: string, defaultValue: string = ''): string => {
  // @ts-ignore - process.env is available at build time
  const value =
    (LOCAL_ENV[key] as string | undefined) ||
    (typeof process !== "undefined" && process.env ? (process.env[key] as string | undefined) : undefined);
  
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
  version: "1.0.4",

  // ✅ para bare workflow / evita r e l error
  // (este archivo tiene prioridad sobre app. json)
  runtimeVersion: "1.0.4",

  scheme: "dondebailarmx",
  orientation: "default", // Permite todas las orientaciones para compatibilidad con pantallas grandes (Android 16+)
  icon: "./assets/adaptive-icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: false, // ⚠️ Deshabilitado temporalmente debido a crash en TurboModules (iOS 18.1)

  splash: {
    image: "./assets/adaptive-icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },

  web: {
    bundler: "metro",
    favicon: "./assets/adaptive-icon.png",
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.tuorg.dondebailarmx",
    // ✅ App Store Connect: must be numeric and increase over last uploaded build.
    // Last uploaded reported: 181 → next safe default: 182 (EAS production also auto-increments).
    buildNumber: "187",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false, // Usa cifrado estándar/exento (HTTPS)
      // ✅ Permisos de cámara y galería para selección de fotos
      NSCameraUsageDescription: "Necesitamos acceso a la cámara para tomar fotos de perfil y eventos.",
      // Algunas UIs de cámara pueden requerir micrófono (p. ej. si el usuario cambia a video)
      NSMicrophoneUsageDescription: "Necesitamos acceso al micrófono para grabar video cuando lo solicites.",
      NSPhotoLibraryUsageDescription: "Necesitamos acceso a tu galería para seleccionar fotos de perfil y eventos.",
      NSPhotoLibraryAddUsageDescription: "Permite guardar fotos en tu galería cuando lo desees.",
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
      // Deep link custom scheme para auth callbacks (Magic Link / OAuth redirect_to)
      // dondebailarmx://auth/callback
      {
        action: "VIEW",
        data: [
          {
            scheme: "dondebailarmx",
            host: "auth",
            pathPrefix: "/callback",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
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
    // Native Google Sign-In (iOS) - required for in-app OAuth without Safari
    googleIosClientId: required('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', ''),
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: required('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', ''),
    eas: {
      projectId: "8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66",
    },
  },

  updates: {
    enabled: true, // ✅ Habilitado - Nota: Requiere plan de Expo con límites adecuados
    // ⚠️ Si alcanzas el límite del plan gratuito, las actualizaciones OTA no funcionarán
    // En ese caso, usa builds completos: pnpm build:prod:ios → pnpm submit:ios
    url: "https://u.expo.dev/8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66",
    fallbackToCacheTimeout: 0,
  },
};

export default config;

