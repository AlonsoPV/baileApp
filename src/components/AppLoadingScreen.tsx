import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

/**
 * Pantalla de carga inicial: fondo negro + indicador blanco.
 * Al montarse, oculta el splash nativo para evitar parpadeo (mismo color #000).
 */
export default function AppLoadingScreen() {
  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={styles.container} accessibilityLabel="Cargando aplicación">
      <StatusBar style="light" />
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
});
