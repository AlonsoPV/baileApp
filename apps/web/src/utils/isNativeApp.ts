import { isMobileWebView } from "@/utils/authRedirect";

declare global {
  interface Window {
    /**
     * Optional flag set by the native host (React Native WebView).
     * If true, we treat the session as "inside the app".
     */
    IS_NATIVE_APP?: boolean;
  }
}

/**
 * Detect if we are being rendered inside the native app.
 *
 * Priority:
 * 1) Native-injected global flag (hardest to spoof from the web)
 * 2) Explicit query param: ?source=app (simple integration)
 * 3) Heuristic WebView detection (ReactNativeWebView / Android WebView UA)
 */
export function isNativeApp(search: string = ""): boolean {
  if (typeof window !== "undefined" && window.IS_NATIVE_APP === true) return true;

  try {
    const source = new URLSearchParams(search || "").get("source");
    if (source === "app") return true;
  } catch {
    // ignore malformed search
  }

  return typeof window !== "undefined" ? isMobileWebView() : false;
}

