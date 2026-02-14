import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { NativeModules, Platform } from "react-native";

type Extra = Record<string, any>;

function readExtra(): Extra {
  const anyConst = Constants as any;
  const expoExtra = (Constants.expoConfig?.extra as any) ?? {};
  const manifestExtra = (anyConst.manifest?.extra as any) ?? {};
  const manifest2Extra = (anyConst.manifest2?.extra as any) ?? {};
  // Priority: manifest2 > manifest > expoConfig
  return { ...expoExtra, ...manifestExtra, ...manifest2Extra };
}

function normalizeString(v: unknown): string {
  return String(v ?? "").trim();
}

function normalizeOptional(v: unknown): string | null {
  const s = normalizeString(v);
  return s ? s : null;
}

function hostOnly(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    // If invalid URL, return trimmed string (helps debugging)
    return url;
  }
}

function suffix(v: string | null, n: number): string {
  if (!v) return "(empty)";
  const t = v.trim();
  if (!t) return "(empty)";
  return t.length <= n ? t : t.slice(-n);
}

function truthyFlag(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = normalizeString(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

export type RuntimeConfig = {
  extra: Extra;
  app: {
    platform: string;
    appOwnership: string | null;
    bundleIdentifier: string | null;
    version: string | null;
    buildNumber: string | null;
  };
  updates: {
    isEnabled: boolean;
    updateId: string | null;
    createdAt: string | null;
    runtimeVersion: string | null;
    channel: string | null;
    isEmbeddedLaunch: boolean | null;
  };
  supabase: {
    url: string | null;
    anonKey: string | null;
    host: string | null;
    anonKeyLength: number;
  };
  google: {
    iosClientId: string | null;
    webClientId: string | null;
    iosClientIdSuffix6: string;
    webClientIdSuffix6: string;
  };
  debug: {
    // legacy flags supported
    showConfigDebug: boolean;
    authDebug: boolean;
    googleDebug: boolean;
    // always show overlay on iOS standalone (TestFlight/App Store)
    isLikelyTestFlight: boolean;
  };
};

export function getRuntimeConfig(): RuntimeConfig {
  const extra = readExtra();

  const supabaseUrl =
    normalizeOptional(extra.SUPABASE_URL) ??
    normalizeOptional(extra.EXPO_PUBLIC_SUPABASE_URL) ??
    normalizeOptional(extra.supabaseUrl);

  const supabaseAnonKey =
    normalizeOptional(extra.SUPABASE_ANON_KEY) ??
    normalizeOptional(extra.EXPO_PUBLIC_SUPABASE_ANON_KEY) ??
    normalizeOptional(extra.supabaseAnonKey);

  const iosClientId =
    normalizeOptional(extra.googleIosClientId) ??
    normalizeOptional(extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);

  const webClientId =
    normalizeOptional(extra.googleWebClientId) ??
    normalizeOptional(extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);

  // iOS bundle id / build info (from expo config if available)
  const bundleIdentifier =
    normalizeOptional((Constants.expoConfig as any)?.ios?.bundleIdentifier) ??
    normalizeOptional((Constants.expoConfig as any)?.ios?.bundleIdentifier);

  const buildNumber =
    normalizeOptional((Constants.expoConfig as any)?.ios?.buildNumber) ??
    normalizeOptional((Constants.manifest as any)?.ios?.buildNumber) ??
    normalizeOptional((Constants as any)?.manifest2?.ios?.buildNumber);

  const appOwnership = normalizeOptional((Constants as any)?.appOwnership);

  const isStandaloneIOS =
    Platform.OS === "ios" && normalizeString(appOwnership).toLowerCase() === "standalone";

  return {
    extra,
    app: {
      platform: Platform.OS,
      appOwnership,
      bundleIdentifier,
      version: normalizeOptional((Constants.expoConfig as any)?.version),
      buildNumber,
    },
    updates: {
      isEnabled: Boolean((Updates as any)?.isEnabled),
      updateId: normalizeOptional((Updates as any)?.updateId),
      createdAt: ((Updates as any)?.createdAt ? String((Updates as any)?.createdAt) : null) as string | null,
      runtimeVersion: normalizeOptional((Updates as any)?.runtimeVersion),
      channel: normalizeOptional((Updates as any)?.channel),
      isEmbeddedLaunch:
        typeof (Updates as any)?.isEmbeddedLaunch === "boolean" ? (Updates as any).isEmbeddedLaunch : null,
    },
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      host: hostOnly(supabaseUrl),
      anonKeyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
    },
    google: {
      iosClientId,
      webClientId,
      iosClientIdSuffix6: suffix(iosClientId, 6),
      webClientIdSuffix6: suffix(webClientId, 6),
    },
    debug: {
      showConfigDebug: truthyFlag(extra.showConfigDebug ?? extra.SHOW_CONFIG_DEBUG),
      authDebug: truthyFlag(extra.BAILEAPP_AUTH_DEBUG ?? extra.EXPO_PUBLIC_AUTH_DEBUG),
      googleDebug: truthyFlag(extra.BAILEAPP_GOOGLE_SIGNIN_DEBUG ?? extra.EXPO_PUBLIC_GOOGLE_SIGNIN_DEBUG),
      // Best-effort heuristic. True for TestFlight *and* App Store installs.
      // We'll also surface native receipt-based detection via GoogleSignInModule.getConfigStatus() if available.
      isLikelyTestFlight: isStandaloneIOS,
    },
  };
}

export type ConfigFingerprint = {
  buildNumber: string | null;
  version: string | null;
  bundleIdentifier: string | null;
  appOwnership: string | null;
  updates: {
    channel: string | null;
    runtimeVersion: string | null;
    updateId: string | null;
    isEmbeddedLaunch: boolean | null;
    isEnabled: boolean;
  };
  supabase: {
    host: string | null;
    anonKeyLength: number;
  };
  google: {
    iosClientIdSuffix6: string;
    webClientIdSuffix6: string;
  };
};

export function getConfigFingerprint(): ConfigFingerprint {
  const c = getRuntimeConfig();
  return {
    buildNumber: c.app.buildNumber,
    version: c.app.version,
    bundleIdentifier: c.app.bundleIdentifier,
    appOwnership: c.app.appOwnership,
    updates: {
      channel: c.updates.channel,
      runtimeVersion: c.updates.runtimeVersion,
      updateId: c.updates.updateId,
      isEmbeddedLaunch: c.updates.isEmbeddedLaunch,
      isEnabled: c.updates.isEnabled,
    },
    supabase: {
      host: c.supabase.host,
      anonKeyLength: c.supabase.anonKeyLength,
    },
    google: {
      iosClientIdSuffix6: c.google.iosClientIdSuffix6,
      webClientIdSuffix6: c.google.webClientIdSuffix6,
    },
  };
}

export function formatFingerprint(fp: ConfigFingerprint): string {
  return [
    `build=${fp.buildNumber ?? "?"} version=${fp.version ?? "?"}`,
    `bundleId=${fp.bundleIdentifier ?? "?"} ownership=${fp.appOwnership ?? "?"}`,
    `updates enabled=${String(fp.updates.isEnabled)} embedded=${String(fp.updates.isEmbeddedLaunch)} channel=${fp.updates.channel ?? "(none)"} runtime=${fp.updates.runtimeVersion ?? "(none)"} updateId=${fp.updates.updateId ?? "(none)"}`,
    `supabase host=${fp.supabase.host ?? "(missing)"} anonLen=${String(fp.supabase.anonKeyLength)}`,
    `google iosSuffix=${fp.google.iosClientIdSuffix6} webSuffix=${fp.google.webClientIdSuffix6}`,
  ].join("\n");
}

export async function getNativeGoogleConfigStatus(): Promise<any | null> {
  const m = (NativeModules as any)?.GoogleSignInModule;
  if (!m?.getConfigStatus) return null;
  try {
    return await m.getConfigStatus();
  } catch {
    return null;
  }
}

