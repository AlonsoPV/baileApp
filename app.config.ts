import { ConfigContext, ExpoConfig } from "expo/config";

const APP_NAME = "Donde Bailar MX";
const APP_SLUG = "donde-bailar-mx";
const SCHEME = "dondebailarmx";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: APP_SLUG,
  scheme: SCHEME,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
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
    bundleIdentifier: "com.tuorg.dondebailarmx",
    supportsTablet: true,
    // Si en el futuro sirves contenido HTTP no seguro, añade excepciones ATS aquí.
  },
  android: {
    package: "com.tuorg.dondebailarmx",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    edgeToEdgeEnabled: true,
    // Permite tráfico HTTP claro si algún recurso no va por HTTPS (por ahora todo es HTTPS)
    usesCleartextTraffic: true,
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
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      // Copiado del output de `eas init`
      projectId: "8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66",
    },
  },
  updates: {
    url: "https://u.expo.dev/8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
});

