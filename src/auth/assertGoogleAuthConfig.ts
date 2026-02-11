import { Platform } from "react-native";

/**
 * Self-check de configuración de Google Sign-In antes de iniciar el flujo.
 * Lanza con un mensaje accionable si falta algo crítico.
 *
 * - iOS: valida que tengamos al menos el iOS Client ID (desde extra o plist vía nativo).
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
    // Si ambos están vacíos desde JS, es muy probable que extra/plist no estén configurados.
    // (El nativo puede leer GIDClientID/GIDServerClientID del Info.plist en builds CI.)
    if (!iosClientId && !webClientId) {
      throw new Error(
        "Google Sign-In no está configurado: faltan iOS y Web Client ID. " +
          "Configura EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID y EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en .env y en EAS/Xcode Cloud, " +
          "o asegura que GIDClientID y GIDServerClientID estén en Info.plist del target."
      );
    }
    // No usar el Web Client ID como iOS Client ID (error común que rompe Supabase).
    if (iosClientId && webClientId && iosClientId === webClientId) {
      throw new Error(
        "Google Sign-In mal configurado: el iOS Client ID no puede ser igual al Web Client ID. " +
          "En Google Cloud crea un cliente tipo iOS y otro tipo Web; usa el de iOS en GIDClientID y el Web en GIDServerClientID."
      );
    }
  }

  if (Platform.OS === "android") {
    // Cuando se implemente Google Sign-In nativo en Android, validar aquí
    // presencia de google-services.json / client id (sin exponer valores).
    // Por ahora no lanzamos; el flujo actual es iOS-only.
  }
}
