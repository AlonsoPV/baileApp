import { Platform } from "react-native";

/**
 * Self-check de configuración de Google Sign-In antes de iniciar el flujo.
 * Lanza con un mensaje accionable si falta algo crítico.
 *
 * - iOS (native): NO bloquear si JS no tiene iosClientId/webClientId. El módulo nativo
 *   puede usar fallback desde Info.plist (GIDClientID/GIDServerClientID).
 * - Web (browser): requiere Web Client ID (no hay fallback nativo).
 * - Android: valida presencia de config (cuando se implemente Google en Android).
 *
 * No expone tokens ni secrets en logs.
 */
export type AssertGoogleAuthConfigOptions = {
  getIosClientId: () => string;
  getWebClientId: () => string;
};

export function assertGoogleAuthConfig(options: AssertGoogleAuthConfigOptions): void {
  const { getIosClientId, getWebClientId } = options;
  const iosClientId = String(getIosClientId() ?? "").trim();
  const webClientId = String(getWebClientId() ?? "").trim();

  if (Platform.OS === "ios") {
    // iOS nativo: permitir fallback del módulo a Info.plist.
    if (!iosClientId) {
      // eslint-disable-next-line no-console
      console.warn("[Auth] iosClientId missing in JS; relying on Info.plist fallback");
    }
    if (!webClientId) {
      // eslint-disable-next-line no-console
      console.warn("[Auth] webClientId missing in JS; relying on Info.plist fallback");
    }
    // Mantener validación solo cuando ambos están presentes (evita falsos positivos).
    if (iosClientId && webClientId && iosClientId === webClientId) {
      throw new Error(
        "Google Sign-In mal configurado: el iOS Client ID no puede ser igual al Web Client ID. " +
          "En Google Cloud crea un cliente tipo iOS y otro tipo Web; usa el de iOS en GIDClientID y el Web en GIDServerClientID."
      );
    }
    return;
  }

  if (Platform.OS === "web") {
    // Web (browser): aquí NO existe fallback nativo.
    if (!webClientId) {
      throw new Error(
        "Google Sign-In no está configurado en Web: falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. " +
          "Configúralo en .env / variables del hosting."
      );
    }
  }

  if (Platform.OS === "android") {
    // Cuando se implemente Google Sign-In nativo en Android, validar aquí
    // presencia de google-services.json / client id (sin exponer valores).
    // Por ahora no lanzamos; el flujo actual es iOS-only.
  }
}
