/**
 * Helper para logs estructurados de autenticación con flag BAILEAPP_AUTH_DEBUG
 * 
 * Uso:
 * - En web: verifica process.env.BAILEAPP_AUTH_DEBUG o window.BAILEAPP_AUTH_DEBUG
 * - En RN: verifica Constants.expoConfig.extra.BAILEAPP_AUTH_DEBUG
 * 
 * Formato de logs: [WEB], [HOST], [NATIVE], [AUTH]
 */

import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Verifica si el flag de debug está activo
 */
export function shouldAuthDebug(): boolean {
  // @ts-ignore
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    return true; // Siempre activo en desarrollo
  }

  // En React Native
  if (Platform.OS !== "web") {
    const extra =
      (Constants.expoConfig as any)?.extra ??
      (Constants as any)?.manifest?.extra ??
      (Constants as any)?.manifest2?.extra ??
      {};
    const v = extra.BAILEAPP_AUTH_DEBUG;
    if (typeof v === "boolean") return v;
    const s = String(v ?? "").trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes";
  }

  // En web
  if (typeof window !== "undefined") {
    const env = (window as any).BAILEAPP_AUTH_DEBUG ?? (process as any)?.env?.BAILEAPP_AUTH_DEBUG;
    if (typeof env === "boolean") return env;
    const s = String(env ?? "").trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes";
  }

  return false;
}

/**
 * Log estructurado con prefijo [WEB]
 */
export function logWeb(message: string, data?: any): void {
  if (!shouldAuthDebug()) return;
  if (data) {
    console.log(`[WEB] ${message}`, data);
  } else {
    console.log(`[WEB] ${message}`);
  }
}

/**
 * Log estructurado con prefijo [HOST]
 */
export function logHost(message: string, data?: any): void {
  if (!shouldAuthDebug()) return;
  if (data) {
    console.log(`[HOST] ${message}`, data);
  } else {
    console.log(`[HOST] ${message}`);
  }
}

/**
 * Log estructurado con prefijo [AUTH]
 */
export function logAuth(message: string, data?: any): void {
  if (!shouldAuthDebug()) return;
  if (data) {
    console.log(`[AUTH] ${message}`, data);
  } else {
    console.log(`[AUTH] ${message}`);
  }
}

/**
 * Helper para enmascarar valores sensibles en logs
 */
export function mask(value: string | null | undefined): string {
  const t = String(value ?? "").trim();
  if (!t) return "(empty)";
  if (t.length <= 10) return `${t.slice(0, 2)}...${t.slice(-2)}`;
  return `${t.slice(0, 6)}...${t.slice(-6)}`;
}
