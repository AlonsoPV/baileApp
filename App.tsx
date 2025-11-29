import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "./src/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useOTAUpdates } from "./src/hooks/useOTAUpdates";

const queryClient = new QueryClient();

function AppContent() {
  // Verificar y descargar actualizaciones OTA automáticamente
  useOTAUpdates();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return <AppContent />;
}
