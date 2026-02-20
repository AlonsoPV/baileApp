import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import * as ExpoLinking from "expo-linking";
import * as Updates from "expo-updates";
import React from "react";
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from "react-native";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { assertEnv, ENV } from "./src/lib/env";
import { envReport } from "./src/lib/envReport";
// import { useOTAUpdates } from "./src/hooks/useOTAUpdates"; // Temporarily disabled to prevent crash
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearLastCrash, readLastCrash, type CrashRecord } from "./src/lib/crashRecorder";
import { markPerformance, logPerformanceReport } from "./src/lib/performance";
import { AuthCoordinator } from "./src/auth/AuthCoordinator";
import { formatFingerprint, getConfigFingerprint, getNativeGoogleConfigStatus, getRuntimeConfig } from "./src/config/runtimeConfig";
import { PerformanceLogger } from "./src/utils/perf";

// ✅ Generate ENV report at startup (logs to console for debugging)
PerformanceLogger.mark("app_start");
markPerformance("app_config_start");
const envReportResult = envReport();
markPerformance("env_report_generated");

const queryClient = new QueryClient();

// ✅ Validar ENV al inicio (antes de renderizar)
// Uses ENV (from Constants.expoConfig.extra) which is reliable in bare RN
const { url, key } = assertEnv();

// ✅ Fallback screen cuando falta configuración
function ConfigMissingScreen() {
  return (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackTitle}>⚠️ Configuración Faltante</Text>
      <Text style={styles.fallbackText}>
        La aplicación no puede iniciar porque faltan variables de entorno.
      </Text>
      <Text style={styles.fallbackText}>
        Configura SUPABASE_URL y SUPABASE_ANON_KEY en EAS (Dashboard → Project → Environment variables) o en Xcode Cloud (workflow env vars).
      </Text>
      <Text style={styles.fallbackText}>
        También puedes usar EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env o config/local.env para builds locales.
      </Text>
      <Text style={styles.fallbackSubtext}>
        Revisa los logs para más detalles.
      </Text>
    </View>
  );
}

// ✅ Temporary debug component to verify extra config in TestFlight
function ConfigDebug() {
  const cfg = getRuntimeConfig();
  const extra = cfg.extra;

  const supabaseUrl = String(cfg.supabase.url ?? "").trim();
  const supabaseAnonKey = String(cfg.supabase.anonKey ?? "").trim();
  const maskUrl = (v: string) => (v ? (v.length > 80 ? `${v.slice(0, 60)}…${v.slice(-12)}` : v) : "(empty)");
  const [nativeGoogleStatus, setNativeGoogleStatus] = React.useState<any | null>(null);

  React.useEffect(() => {
    getNativeGoogleConfigStatus().then(setNativeGoogleStatus).catch(() => setNativeGoogleStatus(null));
  }, []);

  const fp = getConfigFingerprint();
  const fpText = formatFingerprint(fp);

  const showReason =
    Platform.OS === "ios" && typeof __DEV__ !== "undefined" && !__DEV__
      ? "iOS Release (TestFlight/App Store)"
      : cfg.debug.showConfigDebug
        ? "SHOW_CONFIG_DEBUG=1"
        : "dev mode";
  const isPlaceholder =
    (supabaseUrl && (supabaseUrl.includes("TU_PROYECTO") || supabaseUrl.includes("TU_ANON"))) ||
    (supabaseAnonKey && supabaseAnonKey.length < 30);
  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugText}>🔍 Config Debug</Text>
      {isPlaceholder ? (
        <Text style={[styles.debugText, { color: "#fbbf24", fontWeight: "700", marginVertical: 4 }]}>
          ⚠️ Supabase con placeholder o key corta. Configura SUPABASE_URL y SUPABASE_ANON_KEY en Xcode Cloud / EAS y haz un build nuevo.
        </Text>
      ) : null}
      <Text style={[styles.debugText, { opacity: 0.9 }]}>Visible: {showReason}</Text>
      <Text style={styles.debugText}>--- fingerprint (comparar 253 vs 254/255) ---</Text>
      <Text style={[styles.debugText, { fontFamily: "monospace", fontSize: 11 }]}>{fpText}</Text>
      <Text style={styles.debugText}>--- expo-updates ---</Text>
      <Text style={styles.debugText}>Updates.isEnabled: {String(Updates.isEnabled)}</Text>
      <Text style={styles.debugText}>Updates.isEmbeddedLaunch: {String((Updates as any)?.isEmbeddedLaunch)}</Text>
      <Text style={styles.debugText}>Updates.channel: {String((Updates as any)?.channel ?? "(none)")}</Text>
      <Text style={styles.debugText}>Updates.runtimeVersion: {String((Updates as any)?.runtimeVersion ?? "(none)")}</Text>
      <Text style={styles.debugText}>Updates.updateId: {String((Updates as any)?.updateId ?? "(none)")}</Text>
      <Text style={styles.debugText}>--- google native ---</Text>
      <Text style={styles.debugText}>
        native.isTestFlight: {nativeGoogleStatus ? String(!!nativeGoogleStatus.isTestFlight) : "(loading)"}
      </Text>
      <Text style={styles.debugText}>
        native.configured: {nativeGoogleStatus ? String(!!nativeGoogleStatus.configured) : "(loading)"}{" "}
        schemeOK: {nativeGoogleStatus ? String(!!nativeGoogleStatus.schemeOK) : "(loading)"}{" "}
        gidHash12: {nativeGoogleStatus ? String(nativeGoogleStatus.gidClientIdHash12 ?? "") : "(loading)"}
      </Text>
      <Text style={styles.debugText}>extra exists: {extra ? "YES" : "NO"}</Text>
      <Text style={styles.debugText}>supabaseUrl: {extra?.supabaseUrl ? "YES" : "NO"}</Text>
      <Text style={styles.debugText}>anonKey: {extra?.supabaseAnonKey ? "YES" : "NO"}</Text>
      <Text style={styles.debugText}>EXPO_PUBLIC_SUPABASE_URL: {extra?.EXPO_PUBLIC_SUPABASE_URL ? "YES" : "NO"}</Text>
      <Text style={styles.debugText}>SUPABASE_URL: {extra?.SUPABASE_URL ? "YES" : "NO"}</Text>
      <Text style={styles.debugText}>ENV.supabaseUrl: {maskUrl(supabaseUrl)}</Text>
      <Text style={styles.debugText}>ENV.anon length: {supabaseAnonKey ? String(supabaseAnonKey.length) : "0"}</Text>

      <TouchableOpacity
        style={[styles.crashButton, { marginTop: 12, backgroundColor: "#16a34a" }]}
        onPress={async () => {
          const baseUrl = String(cfg.supabase.url ?? "").trim().replace(/\/$/, "");
          const anonKey = String(cfg.supabase.anonKey ?? "").trim();
          if (!baseUrl || !anonKey) {
            Alert.alert("Supabase health", "SUPABASE_URL o SUPABASE_ANON_KEY vacío.");
            return;
          }
          try {
            // GET rest/v1/ con anon key devuelve 200 y confirma conectividad (401 en /auth/v1/health es normal si está protegido).
            const r = await fetch(`${baseUrl}/rest/v1/`, {
              method: "GET",
              headers: {
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
              },
            });
            const body = await r.text();
            const preview = body.length > 80 ? `${body.slice(0, 80)}…` : body;
            Alert.alert("Supabase health", `status: ${r.status}\n${preview ? `body: ${preview}` : ""}`);
          } catch (e: any) {
            Alert.alert("Supabase health FAIL", String(e?.message ?? e));
          }
        }}
      >
        <Text style={styles.crashButtonText}>Health check Supabase</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  crashContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#000",
  },
  crashTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  crashSubtitle: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 12,
  },
  crashBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    marginBottom: 12,
  },
  crashMono: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "monospace",
  },
  crashButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  crashButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#000",
  },
  fallbackTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  fallbackText: {
    color: "#fff",
    fontSize: 16,
    marginVertical: 10,
    textAlign: "center",
    lineHeight: 24,
  },
  fallbackSubtext: {
    color: "#999",
    fontSize: 14,
    marginTop: 20,
    textAlign: "center",
  },
  debugContainer: {
    position: "absolute",
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 15,
    borderRadius: 8,
    zIndex: 9999,
  },
  debugText: {
    color: "white",
    fontSize: 12,
    marginVertical: 2,
    fontFamily: "monospace",
  },
});

function AppContent() {
  const [lastCrash, setLastCrash] = React.useState<CrashRecord | null>(null);

  React.useEffect(() => {
    markPerformance("app_content_mounted");
    // Load last fatal crash from disk so we can debug without Xcode Device Logs.
    readLastCrash()
      .then((crash) => {
        markPerformance("crash_record_loaded");
        setLastCrash(crash);
      })
      .catch(() => {
        markPerformance("crash_record_skipped");
      });
  }, []);

  // ✅ Dev-only diagnostics for Google Sign-In iOS CI issues
  React.useEffect(() => {
    if (!__DEV__) return;
    try {
      const extra =
        (Constants.expoConfig as any)?.extra ??
        (Constants as any)?.manifest?.extra ??
        (Constants as any)?.manifest2?.extra ??
        {};

      const iosClientId =
        (extra.googleIosClientId as string | undefined) ||
        (extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string | undefined) ||
        "";
      const webClientId =
        (extra.googleWebClientId as string | undefined) ||
        (extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined) ||
        "";

      const mask = (v: string) => (v ? `${v.slice(0, 10)}...${v.slice(-8)}` : "(empty)");
      const redirectUri = ExpoLinking.createURL("auth/callback");
      const reversed =
        iosClientId && iosClientId.includes(".apps.googleusercontent.com")
          ? `com.googleusercontent.apps.${iosClientId.split(".apps.googleusercontent.com")[0]}`
          : "(cannot-derive)";

      // eslint-disable-next-line no-console
      console.log("[GoogleAuth][dev] iosClientId:", mask(String(iosClientId)));
      // eslint-disable-next-line no-console
      console.log("[GoogleAuth][dev] webClientId:", mask(String(webClientId)));
      // eslint-disable-next-line no-console
      console.log("[GoogleAuth][dev] redirectUri:", redirectUri);
      // eslint-disable-next-line no-console
      console.log("[GoogleAuth][dev] reversedScheme:", reversed);
      // eslint-disable-next-line no-console
      console.log("[GoogleAuth][dev] appScheme:", (Constants.expoConfig as any)?.scheme);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("[GoogleAuth][dev] failed to log diagnostics:", String(e));
    }
  }, []);

  if (lastCrash) {
    return (
      <SafeAreaProvider>
        <View style={styles.crashContainer}>
          <Text style={styles.crashTitle}>🧯 Último error fatal (debug)</Text>
          <Text style={styles.crashSubtitle}>
            Copia y pégame esto (message + stack) para ubicar la causa exacta.
          </Text>
          <ScrollView style={styles.crashBox} contentContainerStyle={{ padding: 12 }}>
            <Text style={styles.crashMono}>{JSON.stringify(lastCrash, null, 2)}</Text>
          </ScrollView>
          <TouchableOpacity
            style={styles.crashButton}
            onPress={() => {
              clearLastCrash()
                .then(() => setLastCrash(null))
                .catch(() => setLastCrash(null));
            }}
          >
            <Text style={styles.crashButtonText}>Borrar y continuar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaProvider>
    );
  }

  // ✅ Guardrail: Si falta config, mostrar pantalla de fallback en lugar de crashear
  // This prevents cascade crashes from missing env vars
  if (!url || !key) {
    console.error("[App] Missing required environment variables. Showing fallback screen.");
    console.error("[App] ENV report:", JSON.stringify(envReportResult, null, 2));
    return <ConfigMissingScreen />;
  }

  // Verificar y descargar actualizaciones OTA automáticamente
  // useOTAUpdates(); // Temporarily disabled to prevent crash

  // Overlay solo en desarrollo o si activas SHOW_CONFIG_DEBUG=1 en EAS/Xcode Cloud.
  const cfg = getRuntimeConfig();
  const shouldShowDebug =
    (typeof __DEV__ !== "undefined" && __DEV__) ||
    Boolean(cfg.debug.showConfigDebug);

  React.useEffect(() => {
    markPerformance("providers_rendered");
  }, []);

  // ✅ Keychain/build change: TestFlight puede preservar tokens en Keychain al actualizar build;
  // si el nuevo build tiene distinta config (o keychain group), Google puede devolver "no configurado".
  // Al detectar cambio de build, hacemos signOut para forzar login fresco y evitar estado inconsistente.
  const BUILD_STORAGE_KEY = "@baileapp/last_build";
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const currentBuild =
          (Constants.expoConfig as any)?.ios?.buildNumber ??
          (Constants.manifest as any)?.ios?.buildNumber ??
          "0";
        const lastBuild = (await AsyncStorage.getItem(BUILD_STORAGE_KEY)) ?? "";
        if (lastBuild !== "" && lastBuild !== currentBuild) {
          if (!cancelled) {
            console.log("[App] Build changed", lastBuild, "->", currentBuild, "; signing out to avoid keychain/config mismatch.");
            await AuthCoordinator.signOut();
          }
        }
        if (!cancelled) await AsyncStorage.setItem(BUILD_STORAGE_KEY, currentBuild);
      } catch (e) {
        if (!cancelled) console.warn("[App] Build-change cleanup failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {shouldShowDebug ? <ConfigDebug /> : null}
        <ErrorBoundary title="Error al iniciar la app">
          <RootNavigator />
        </ErrorBoundary>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return <AppContent />;
}
