// Centraliza el redirect de auth para Web vs App (WebView)
//
// Problema que resuelve:
// - Dentro de la app (React Native WebView), OAuth/Magic Link abrían navegador externo
//   y luego no regresaban a la app.
// - Para solucionarlo, en WebView usamos un deep link (scheme) como redirectTo.

const MOBILE_APP_SCHEME = "dondebailarmx";

export function isMobileWebView(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent || "";
  const isReactNativeWebView =
    userAgent.includes("ReactNativeWebView") ||
    userAgent.includes("wv") || // Android WebView
    (window as any).ReactNativeWebView !== undefined;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  const isWebView =
    isReactNativeWebView || (isMobile && !userAgent.includes("Safari") && !userAgent.includes("Chrome"));

  return isWebView;
}

export function getSiteUrl(): string {
  if (typeof window === "undefined") return "";

  // Producción (Vercel / dominio real)
  if (import.meta.env.VITE_SITE_URL) return import.meta.env.VITE_SITE_URL;

  // Desarrollo / fallback
  return window.location.origin;
}

/**
 * Deep link a la app.
 *
 * Importante: en custom schemes, la parte después de `//` se interpreta como "host".
 * Usamos `dondebailarmx://auth/callback` porque Expo Linking genera ese formato.
 */
export function getMobileAppAuthRedirectUrl(): string {
  return `${MOBILE_APP_SCHEME}://auth/callback`;
}

/**
 * Generic redirect helper.
 * - Web: https://<site>/<path>
 * - App: <scheme>://<path-without-leading-slash>
 *
 * Nota: En custom schemes, `scheme://auth/pin` se interpreta como host "auth" + pathname "/pin".
 * En la app lo convertimos de vuelta a `/auth/pin`.
 */
export function getRedirectUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (isMobileWebView()) {
    // remove leading slash to create scheme://auth/pin style URLs
    return `${MOBILE_APP_SCHEME}://${cleanPath.slice(1)}`;
  }
  return `${getSiteUrl()}${cleanPath}`;
}

/**
 * Redirect que usa Supabase en signInWithOAuth / signInWithOtp.
 * - Web normal: https://dondebailar.com.mx/auth/callback
 * - Dentro de la app (WebView): dondebailarmx://auth/callback
 */
export function getAuthRedirectUrl(): string {
  return getRedirectUrl("/auth/callback");
}

