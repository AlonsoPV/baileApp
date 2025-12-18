import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Text, View, StyleSheet } from "react-native";
// import { useOTAUpdates } from "./src/hooks/useOTAUpdates"; // Temporarily disabled to prevent crash

const queryClient = new QueryClient();

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
  // Verificar y descargar actualizaciones OTA automáticamente
  // useOTAUpdates(); // Temporarily disabled to prevent crash

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ConfigDebug />
        <RootNavigator />
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return <AppContent />;
}
