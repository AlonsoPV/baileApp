import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import React from "react";
import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { assertEnv, ENV } from "./src/lib/env";
import { envReport } from "./src/lib/envReport";
// import { useOTAUpdates } from "./src/hooks/useOTAUpdates"; // Temporarily disabled to prevent crash
import { clearLastCrash, readLastCrash, type CrashRecord } from "./src/lib/crashRecorder";

// ✅ Generate ENV report at startup (logs to console for debugging)
const envReportResult = envReport();

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
        Por favor, configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY
        en Xcode Cloud environment variables.
      </Text>
      <Text style={styles.fallbackSubtext}>
        Revisa los logs para más detalles.
      </Text>
    </View>
  );
}

// ✅ Temporary debug component to verify extra config in TestFlight
function ConfigDebug() {
  const extra =
    (Constants.expoConfig as any)?.extra ??
    (Constants as any)?.manifest?.extra ??
    (Constants as any)?.manifest2?.extra;

  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugText}>🔍 Config Debug (remove after testing)</Text>
      <Text style={styles.debugText}>extra exists: {extra ? "YES" : "NO"}</Text>
      <Text style={styles.debugText}>supabaseUrl: {extra?.supabaseUrl ? "YES" : "NO"}</Text>
      <Text style={styles.debugText}>anonKey: {extra?.supabaseAnonKey ? "YES" : "NO"}</Text>
      <Text style={styles.debugText}>EXPO_PUBLIC_SUPABASE_URL: {extra?.EXPO_PUBLIC_SUPABASE_URL ? "YES" : "NO"}</Text>
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
    // Load last fatal crash from disk so we can debug without Xcode Device Logs.
    readLastCrash().then(setLastCrash).catch(() => {});
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

  // Only show the debug overlay when explicitly enabled.
  // @ts-ignore - __DEV__ is a React Native global
  const shouldShowDebug =
    (typeof __DEV__ !== "undefined" && __DEV__) ||
    Boolean(
      (Constants.expoConfig as any)?.extra?.showConfigDebug ??
        (Constants as any)?.manifest?.extra?.showConfigDebug ??
        (Constants as any)?.manifest2?.extra?.showConfigDebug
    );

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
