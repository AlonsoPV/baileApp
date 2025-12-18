// ✅ EARLY LOGGER: Debe estar ANTES de cualquier import grande
// Esto captura errores fatales en TestFlight antes de que se pierdan
// @ts-ignore - __DEV__ is a React Native global
if (typeof __DEV__ !== "undefined" && !__DEV__) {
  try {
    const originalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
    (global as any).ErrorUtils?.setGlobalHandler?.((error: any, isFatal?: boolean) => {
      console.log("[GlobalErrorHandler]", { 
        message: String(error?.message ?? error), 
        isFatal, 
        stack: error?.stack,
        name: error?.name,
        toString: String(error)
      });
      originalHandler?.(error, isFatal);
    });
  } catch (e) {
    // Si falla el setup del logger, al menos loguear que falló
    console.error("[EarlyLogger] Failed to setup early logger:", e);
  }
}

import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Text, View, StyleSheet } from "react-native";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { assertEnv } from "./src/lib/env";
// import { useOTAUpdates } from "./src/hooks/useOTAUpdates"; // Temporarily disabled to prevent crash

const queryClient = new QueryClient();

// ✅ Validar ENV al inicio (antes de renderizar)
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
  // ✅ Guardrail: Si falta config, mostrar pantalla de fallback en lugar de crashear
  if (!url || !key) {
    console.error("[App] Missing required environment variables. Showing fallback screen.");
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
