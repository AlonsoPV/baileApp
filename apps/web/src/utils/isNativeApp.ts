import { isMobileWebView } from "@/utils/authRedirect";

declare global {
  interface Window {
    /**
     * Optional flag set by the native host (React Native WebView).
     * If true, we treat the session as "inside the app".
     */
    IS_NATIVE_APP?: boolean;
    /**
     * React Native WebView bridge (iOS/Android)
     */
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

/**
 * Detect if we are being rendered inside the native app (iOS/Android).
 *
 * Priority:
 * 1) Native-injected global flag (hardest to spoof from the web)
 * 2) Explicit query param: ?source=app (simple integration)
 * 3) ReactNativeWebView bridge detection (iOS/Android)
 * 4) Heuristic WebView detection (ReactNativeWebView / Android WebView UA)
 */
export function isNativeApp(search: string = ""): boolean {
  if (typeof window === "undefined") return false;

  // 1) Native-injected global flag (most reliable)
  if (window.IS_NATIVE_APP === true) return true;

  // 2) Explicit query param: ?source=app
  try {
    const source = new URLSearchParams(search || window.location.search).get("source");
    if (source === "app") return true;
  } catch {
    // ignore malformed search
  }

  // 3) ReactNativeWebView bridge detection (iOS/Android)
  if (window.ReactNativeWebView !== undefined) return true;

  // 4) Heuristic WebView detection (fallback)
  return isMobileWebView();
}

