import React from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";

/**
 * Fallback mínimo mientras JS termina de montar.
 * El splash nativo se oculta más tarde, cuando la WebView/web ya está lista o si ocurre un error.
 */
export default function AppLoadingScreen() {
  return (
    <View style={styles.container} accessibilityLabel="Cargando aplicación">
      <StatusBar style="light" />
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
