import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import type { ExpoConfig } from "expo/config";

// In some Expo config evaluation contexts, mutating process.env can be unreliable.
// We'll parse the local env file into an object and use it as the source of truth.
const LOCAL_ENV: Record<string, string> = {};

function getConfigDebug(): boolean {
  return (typeof process !== "undefined" && process.env?.BAILEAPP_CONFIG_DEBUG === "1");
}

function required(key: string, defaultValue: string = ""): string {
  const value =
    (LOCAL_ENV[key] as string | undefined) ??
    (typeof process !== "undefined" && process.env ? (process.env[key] as string | undefined) : undefined);
  if (value != null && value !== "") return value;
  if (typeof console !== "undefined" && console.warn) {
    console.warn(`[app.config] Using default/empty value for ${key} (should be set in Xcode Cloud environment variables or EAS)`);
  }
  return defaultValue;
}

function loadLocalEnvFile(filePath: string) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const urlMatch = raw.match(/^EXPO_PUBLIC_SUPABASE_URL=(.*)$/m);
    const keyMatch = raw.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m);
    if (getConfigDebug()) {
      // eslint-disable-next-line no-console
      console.log("[app.config] local.env diagnostics:", {
        filePath,
        rawLen: raw.length,
        hasHttps: raw.includes("https://"),
        hasJwtPrefix: raw.includes("eyJ"),
        urlLineLen: urlMatch?.[1]?.trim()?.length ?? 0,
        anonLineLen: keyMatch?.[1]?.trim()?.length ?? 0,
      });
    }
    const parsed = dotenv.parse(raw);
    for (const [k, v] of Object.entries(parsed)) {
      const cleanKey = k.replace(/^\uFEFF/, "");
      LOCAL_ENV[cleanKey] = v;
    }
    if (getConfigDebug()) {
      // eslint-disable-next-line no-console
      console.log("[app.config] LOCAL_ENV parsed keys:", Object.keys(LOCAL_ENV));
    }
  } catch {
    // ignore
  }
}

// Load local env file for Expo Go / simulator runs.
// ✅ Prefer .env over config/local.env so CI wins: ci_post_clone.sh creates .env with real values;
//    if we preferred config/local.env, placeholder TU_PROYECTO would be used and health check fails.
try {
  // Use process.cwd() (more reliable than __dirname if this file is loaded as ESM).
  const cwd = process.cwd();
  const localEnvPath = path.join(cwd, "config", "local.env");
  const defaultEnvPath = path.join(cwd, ".env");

  const hasLocal = fs.existsSync(localEnvPath);
  const hasDefault = fs.existsSync(defaultEnvPath);

  if (getConfigDebug()) {
    // eslint-disable-next-line no-console
    console.log("[app.config] dotenv cwd:", cwd);
    // eslint-disable-next-line no-console
    console.log("[app.config] dotenv files:", {
      localEnvPath,
      hasLocal,
      defaultEnvPath,
      hasDefault,
    });
  }

  const chosenPath = hasDefault ? defaultEnvPath : localEnvPath;
  const fileExists = hasDefault || hasLocal;

  // Load into LOCAL_ENV first (reliable)
  if (fileExists) {
    loadLocalEnvFile(chosenPath);
  }

  // Also try dotenv.config to support tooling that expects process.env to be populated.
  // ✅ Only call dotenv.config if the file actually exists (prevents ENOENT errors in Xcode Cloud)
  const result = fileExists
    ? dotenv.config({ path: chosenPath, override: true })
    : { error: null, parsed: {} };

  if (getConfigDebug()) {
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
  }
} catch (e) {
  if (getConfigDebug()) {
    // eslint-disable-next-line no-console
    console.log("[app.config] dotenv load failed:", String(e));
  }
}

// Debug helper — only when BAILEAPP_CONFIG_DEBUG=1; no secrets, only presence/length.
const logEnvPresence = () => {
  if (!getConfigDebug()) return;
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

// Google Sign-In (production defaults) — OAuth client identifiers, not secrets.
const GOOGLE_IOS_CLIENT_ID_PROD =
  "168113490186-cv9q1lfu1gfucfa01vvdr6vbfghj23lf.apps.googleusercontent.com";
const GOOGLE_WEB_CLIENT_ID_PROD =
  "168113490186-26aectjk20ju91tao4phqb2fta2mrk5u.apps.googleusercontent.com";

// Debug flags (required is hoisted above)
const GOOGLE_SIGNIN_DEBUG_FLAG =
  required("BAILEAPP_GOOGLE_SIGNIN_DEBUG", "") || required("EXPO_PUBLIC_GOOGLE_SIGNIN_DEBUG", "");
const AUTH_DEBUG_FLAG =
  required("BAILEAPP_AUTH_DEBUG", "") || GOOGLE_SIGNIN_DEBUG_FLAG || required("EXPO_PUBLIC_AUTH_DEBUG", "");

const config: ExpoConfig = {
  name: "Donde Bailar MX",
  slug: "donde-bailar-mx",
  version: "1.0.6",

  // ✅ para bare workflow / evita r e l error
  // (este archivo tiene prioridad sobre app. json)
  runtimeVersion: "1.0.6",

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
    buildNumber: "254",
    infoPlist: (() => {
      const googleIosClientId = required("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID", GOOGLE_IOS_CLIENT_ID_PROD);
      const googleWebClientId = required("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID", GOOGLE_WEB_CLIENT_ID_PROD);
      const googleDebug =
        String(GOOGLE_SIGNIN_DEBUG_FLAG || "").trim() === "1" ||
        String(GOOGLE_SIGNIN_DEBUG_FLAG || "").trim().toLowerCase() === "true";
      
      const authDebug =
        String(AUTH_DEBUG_FLAG || "").trim() === "1" ||
        String(AUTH_DEBUG_FLAG || "").trim().toLowerCase() === "true" ||
        googleDebug;
      const reversed = (() => {
        const v = String(googleIosClientId || '').trim();
        if (!v || !v.includes('.apps.googleusercontent.com')) return '';
        const prefix = v.split('.apps.googleusercontent.com')[0];
        return prefix ? `com.googleusercontent.apps.${prefix}` : '';
      })();

      const schemes = [
        'dondebailarmx',
        'com.tuorg.dondebailarmx',
        reversed,
      ].filter(Boolean);

      return {
      ITSAppUsesNonExemptEncryption: false, // Usa cifrado estándar/exento (HTTPS)
      // ✅ Permisos de cámara y galería para selección de fotos
      NSCameraUsageDescription: "Necesitamos acceso a la cámara para tomar fotos de perfil y eventos.",
      // Algunas UIs de cámara pueden requerir micrófono (p. ej. si el usuario cambia a video)
      NSMicrophoneUsageDescription: "Necesitamos acceso al micrófono para grabar video cuando lo solicites.",
      NSPhotoLibraryUsageDescription: "Necesitamos acceso a tu galería para seleccionar fotos de perfil y eventos.",
      NSPhotoLibraryAddUsageDescription: "Permite guardar fotos en tu galería cuando lo desees.",
      // Native Google Sign-In (used by iOS module). Keeping these in Info.plist helps CI builds.
      ...(googleIosClientId ? { GIDClientID: googleIosClientId } : {}),
      ...(googleWebClientId ? { GIDServerClientID: googleWebClientId } : {}),
      ...(googleDebug ? { BAILEAPP_GOOGLE_SIGNIN_DEBUG: true } : {}),
      // General auth debug flag (for structured logs [WEB]/[HOST]/[NATIVE]/[AUTH])
      ...(authDebug ? { BAILEAPP_AUTH_DEBUG: true } : {}),
      ...(schemes.length > 0
        ? {
            CFBundleURLTypes: [
              {
                CFBundleURLSchemes: schemes,
              },
            ],
          }
        : {}),
      // ✅ Configuración de Expo Updates (se genera automáticamente desde updates.url y runtimeVersion)
      // EXUpdatesURL se genera desde updates.url
      // EXUpdatesRuntimeVersion se genera desde runtimeVersion
      // EXUpdatesEnabled se genera automáticamente como true
      };
    })(),
  },

  android: {
    package: "com.tuorg.dondebailarmx",
    // versionCode debe ser MAYOR que el último subido a Google Play. Si Play rechaza la versión,
    // en Consola → tu app → Producción/Prueba interna → revisa "Código de versión" del último AAB y pon aquí un número mayor.
    versionCode: 12,
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

  // Defaults for Google Sign-In (same as infoPlist) so production works when app.config is evaluated without .env (e.g. Xcode Cloud). See docs/auth/ios-google-signin-config.md.
  // ✅ Forma correcta Expo/TestFlight: inyectar en extra desde process.env (build-time); en runtime la app lee solo Constants.expoConfig.extra.
  extra: {
    // Supabase: EAS/TestFlight usa SUPABASE_URL / SUPABASE_ANON_KEY; local .env puede usar EXPO_PUBLIC_*
    SUPABASE_URL: required('SUPABASE_URL', '') || required('EXPO_PUBLIC_SUPABASE_URL', ''),
    SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY', '') || required('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
    supabaseUrl: required('SUPABASE_URL', '') || required('EXPO_PUBLIC_SUPABASE_URL', ''),
    supabaseAnonKey: required('SUPABASE_ANON_KEY', '') || required('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
    EXPO_PUBLIC_SUPABASE_URL: required('SUPABASE_URL', '') || required('EXPO_PUBLIC_SUPABASE_URL', ''),
    EXPO_PUBLIC_SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY', '') || required('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
    // Debug overlay for TestFlight (enable via EAS/Xcode Cloud env var SHOW_CONFIG_DEBUG=1)
    showConfigDebug: required("SHOW_CONFIG_DEBUG", ""),
    SHOW_CONFIG_DEBUG: required("SHOW_CONFIG_DEBUG", ""),
    // Native Google Sign-In (iOS). Fallback = production defaults so JS never blocks iOS for missing extra.
    googleIosClientId: required("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID", GOOGLE_IOS_CLIENT_ID_PROD),
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: required("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID", GOOGLE_IOS_CLIENT_ID_PROD),
    // Web Client ID (audience for idToken; used as GIDServerClientID)
    googleWebClientId: required("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID", GOOGLE_WEB_CLIENT_ID_PROD),
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: required("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID", GOOGLE_WEB_CLIENT_ID_PROD),
    // Optional debug flag (can be "1"/"true") — keep both keys for compatibility.
    BAILEAPP_GOOGLE_SIGNIN_DEBUG: GOOGLE_SIGNIN_DEBUG_FLAG,
    googleSignInDebug: GOOGLE_SIGNIN_DEBUG_FLAG,
    EXPO_PUBLIC_GOOGLE_SIGNIN_DEBUG: required("EXPO_PUBLIC_GOOGLE_SIGNIN_DEBUG", ""),
    // General auth debug flag (for structured logs [WEB]/[HOST]/[NATIVE]/[AUTH])
    BAILEAPP_AUTH_DEBUG: AUTH_DEBUG_FLAG,
    EXPO_PUBLIC_AUTH_DEBUG: required("EXPO_PUBLIC_AUTH_DEBUG", ""),
    eas: {
      projectId: "8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66",
    },
  },

  updates: {
    // ⚠️ Debugging builds 254/255 vs 253:
    // Si sospechas que el build está cargando OTRO JS bundle vía OTA (overlay no aparece),
    // puedes deshabilitar Updates temporalmente seteando DISABLE_EXPO_UPDATES=1 en CI/EAS.
    enabled: !(
      String(LOCAL_ENV.DISABLE_EXPO_UPDATES ?? (typeof process !== "undefined" ? process.env?.DISABLE_EXPO_UPDATES : "") ?? "")
        .trim()
        .toLowerCase() === "1" ||
      String(LOCAL_ENV.DISABLE_EXPO_UPDATES ?? (typeof process !== "undefined" ? process.env?.DISABLE_EXPO_UPDATES : "") ?? "")
        .trim()
        .toLowerCase() === "true"
    ),
    // ⚠️ Si alcanzas el límite del plan gratuito, las actualizaciones OTA no funcionarán
    // En ese caso, usa builds completos: pnpm build:prod:ios → pnpm submit:ios
    url: "https://u.expo.dev/8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66",
    fallbackToCacheTimeout: 0,
  },
};

export default config;

