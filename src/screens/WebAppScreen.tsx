import React from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Platform,
  BackHandler,
  Text,
  TouchableOpacity,
  Linking,
  KeyboardAvoidingView,
} from "react-native";
import * as ExpoLinking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import {
  addToCalendar,
  openGoogleCalendarTemplateFallback,
  type AddToCalendarPayload,
} from "../lib/addToCalendar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { getRuntimeConfig } from "../config/runtimeConfig";
import { AuthCoordinator } from "../auth/AuthCoordinator";
import { markPerformance } from "../lib/performance";
import { PerformanceLogger } from "../utils/perf";
import { useInitialAppShell } from "../context/InitialAppShellContext";
import { assertGoogleAuthConfig } from "../auth/assertGoogleAuthConfig";
import { logHost, shouldAuthDebug } from "../utils/authDebug";
import {
  createInitialConnectivitySnapshot,
  runLightweightHealthcheck,
  startNetworkDiagnostics,
  type ConnectivitySnapshot,
} from "../lib/networkDiagnostics";

// URL principal de la web que quieres mostrar dentro de la app móvil.
// Puedes ajustar esto a staging si  lo necesitas.
// Siempre HTTPS; no cargar http:// en el WebView (evita cleartext/SSL en Android).
const WEB_APP_URL = "https://dondebailar.com.mx";

const NAVBAR_TEAL = "#297F96";

/** Timeout de carga (ms): si no llega onLoadEnd/READY, mostrar error. */
const LOAD_TIMEOUT_MS = 20_000;

/** Tras este tiempo desde onLoadStart (solo Android), banner suave “sigue cargando”. iOS: desactivado. */
const ANDROID_LOAD_SLOW_HINT_MS = 3_000;
const IOS_LOAD_SLOW_HINT_MS = 9_000_000;

/** Máximo tiempo mostrando el splash nativo antes de soltar control a la WebView. */
const SPLASH_MAX_DURATION_MS = 5_000;

/** Android: tiempo mínimo con NetInfo “offline” antes del copy fuerte “Sin conexión”. */
const ANDROID_OFFLINE_CONFIRM_MS = 1_500;

/** Android: espera antes de confirmar onError (no aplica a SSL ni crash de proceso). */
const ANDROID_ON_ERROR_DEBOUNCE_MS = 600;

/** Android: healthcheck ligero (solo diagnóstico). */
const ANDROID_HEALTHCHECK_TIMEOUT_MS = 5_750;

function isLikelyDocumentNavigationHttpUrl(url: string): boolean {
  const u = String(url || "").trim();
  if (!u) return true;
  try {
    const parsed = new URL(u);
    const base = new URL(WEB_APP_URL);
    if (parsed.host !== base.host) return false;
    const path = parsed.pathname;
    if (
      /\.(js|mjs|cjs|css|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|json|wasm|mp4|webm|mp3)(\?|$)/i.test(
        path
      )
    ) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

type WebViewErrorDetail = {
  source?:
    | "onError"
    | "onHttpError"
    | "onRenderProcessGone"
    | "onContentProcessDidTerminate"
    | "load_timeout";
  code?: number;
  description?: string;
  url?: string;
  statusCode?: number;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isSsl?: boolean;
  userMessage: string;
};

type ErrorUiCategory = "network" | "backend" | "ssl" | "renderer" | "timeout" | "unknown";

type ErrorUiModel = {
  title: string;
  message: string;
  category: ErrorUiCategory;
};

type LoadPathKind = "explore" | "detail";

type PendingPathLoad = {
  kind: LoadPathKind;
  startLabel: string;
  endLabel: string;
  metricName: string;
  startedAtMs: number;
  url: string;
};

function logWebViewError(
  source: "onError" | "onHttpError" | "onRenderProcessGone" | "onContentProcessDidTerminate",
  payload: Record<string, unknown>
): void {
  if (typeof console?.log !== "function") return;
  console.log(`[WEBVIEW_ERR] ${source}`, JSON.stringify(payload, null, 2));
}

function logWebAppLinking(event: string, payload: Record<string, unknown>): void {
  if (typeof console?.log !== "function") return;
  try {
    console.log(`[WEBAPP_LINKING] ${event}`, JSON.stringify(payload));
  } catch {
    console.log(`[WEBAPP_LINKING] ${event}`, payload);
  }
}

function classifyWebViewError(
  code?: number,
  description?: string,
  statusCode?: number
): { userMessage: string; isSsl: boolean } {
  const desc = String(description ?? "").toLowerCase();
  const codeStr = String(code ?? "");
  const isSsl =
    /ssl|cert|handshake|err_cert|net::err_cert|chain|authority|invalid.*certificate/i.test(desc) ||
    /ssl|cert|err_cert/i.test(codeStr);
  if (isSsl) {
    return {
      userMessage:
        "Problema con certificado SSL. Intenta de nuevo. Si persiste, actualiza WebView/Chrome.",
      isSsl: true,
    };
  }
  if (/dns|host.*lookup|unable to resolve|err_name_not_resolved|net::err_name_not_resolved/i.test(desc)) {
    return { userMessage: "No se pudo resolver el servidor. Revisa tu red.", isSsl: false };
  }
  if (/timeout|timed out|err_timed_out|net::err_timed_out/i.test(desc) || code === -8) {
    return { userMessage: "La conexión tardó demasiado.", isSsl: false };
  }
  if (typeof statusCode === "number") {
    if (statusCode >= 500) {
      return { userMessage: `Servidor no disponible (${statusCode}).`, isSsl: false };
    }
    if (statusCode >= 400) {
      return { userMessage: `Servidor no disponible (${statusCode}).`, isSsl: false };
    }
  }
  if (/connection|network|failed to connect|err_connection|net::err_connection/i.test(desc)) {
    return { userMessage: "No se pudo conectar. Revisa tu red.", isSsl: false };
  }
  return {
    userMessage:
      "No se pudo cargar la página. Revisa tu conexión e intenta de nuevo.",
    isSsl: false,
  };
}

function isLikelyTransientError(
  errorDetail: WebViewErrorDetail | null,
  snapshot: ConnectivitySnapshot
): boolean {
  if (!errorDetail) return false;
  if (snapshot.isConnected === false || snapshot.isInternetReachable === false) return false;
  if (errorDetail.isSsl) return false;

  if (errorDetail.source === "onRenderProcessGone" || errorDetail.source === "onContentProcessDidTerminate") {
    return true;
  }
  if (errorDetail.source === "load_timeout") return true;
  if (typeof errorDetail.statusCode === "number") {
    return errorDetail.statusCode >= 500;
  }

  const desc = String(errorDetail.description ?? "").toLowerCase();
  return (
    /timeout|timed out|err_timed_out|net::err_timed_out/.test(desc) ||
    /connection|network|failed to connect|err_connection|err_name_not_resolved|dns/.test(desc)
  );
}

function buildErrorUiModel(
  errorDetail: WebViewErrorDetail | null,
  snapshot: ConnectivitySnapshot,
  opts?: { androidOfflineNetCopyOk?: boolean }
): ErrorUiModel {
  const appearsOffline = snapshot.isConnected === false || snapshot.isInternetReachable === false;
  const android = Platform.OS === "android";
  const offlineCopyOk = !appearsOffline || !android || opts?.androidOfflineNetCopyOk;

  if (appearsOffline && offlineCopyOk) {
    return {
      category: "network",
      title: "Sin conexión a internet",
      message: "Tu dispositivo parece estar sin internet. Verifica tu red y vuelve a intentar.",
    };
  }

  if (errorDetail?.isSsl) {
    return {
      category: "ssl",
      title: "Problema de seguridad (SSL)",
      message:
        "No se pudo validar una conexión segura. Intenta de nuevo y, si persiste, actualiza Android System WebView/Chrome.",
    };
  }

  if (errorDetail?.source === "onRenderProcessGone" || errorDetail?.source === "onContentProcessDidTerminate") {
    return {
      category: "renderer",
      title: "El contenido se cerró inesperadamente",
      message: "WebView se reinició. Puedes reintentar la carga o abrir la página en tu navegador.",
    };
  }

  if (errorDetail?.source === "load_timeout") {
    return {
      category: "timeout",
      title: "La carga tardó demasiado",
      message: "La página tardó más de lo esperado en responder. Reintenta la carga.",
    };
  }

  if (typeof errorDetail?.statusCode === "number") {
    if (errorDetail.statusCode >= 500) {
      return {
        category: "backend",
        title: "Servidor temporalmente no disponible",
        message: `El servidor respondió con error (${errorDetail.statusCode}). Intenta de nuevo en unos momentos.`,
      };
    }
    if (errorDetail.statusCode >= 400) {
      return {
        category: "backend",
        title: "No se pudo abrir esta página",
        message: `El servidor devolvió ${errorDetail.statusCode}. Reintenta o abre en navegador para descartar un bloqueo local.`,
      };
    }
  }

  return {
    category: "unknown",
    title: "No se pudo cargar la página",
    message:
      errorDetail?.userMessage ??
      "Puede ser un problema de red, DNS o WebView. Intenta de nuevo o abre en navegador.",
  };
}

function detectLoadPathKind(url: string): LoadPathKind | null {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return null;

  let normalized = rawUrl.toLowerCase();
  try {
    const parsed = new URL(rawUrl);
    normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`.toLowerCase();
  } catch {
    // Keep raw lowercased URL when parsing fails.
  }

  const isExplore =
    /\/explore(?:[/?#]|$)/.test(normalized) ||
    /[?&#]tab=explore(?:[&#]|$)/.test(normalized) ||
    /\/social(?:[/?#]|$)/.test(normalized);
  if (isExplore) return "explore";

  const isDetail =
    /\/social\/fecha\/[^/?#]+/.test(normalized) ||
    /\/clase\/[^/?#]+\/[^/?#]+/.test(normalized) ||
    /\/(academia|maestro|organizer|u|marca)\/[^/?#]+/.test(normalized);
  if (isDetail) return "detail";

  return null;
}

export default function WebAppScreen() {
  const [loading, setLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [webViewImportError, setWebViewImportError] = React.useState<string | null>(null);
  const [webViewModule, setWebViewModule] = React.useState<any>(null);
  const [nativeAuthInProgress, setNativeAuthInProgress] = React.useState(false);
  const [nativeAuthError, setNativeAuthError] = React.useState<string | null>(null);
  const [lastWebViewError, setLastWebViewError] = React.useState<WebViewErrorDetail | null>(null);
  const webviewRef = React.useRef<any>(null);
  const insets = useSafeAreaInsets();
  const loadWatchdogRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadStartTimeRef = React.useRef<number>(0);
  const readyReceivedRef = React.useRef(false);
  const [webViewProgress, setWebViewProgress] = React.useState(0);
  const progressMarksRef = React.useRef<{ p25?: boolean; p50?: boolean; p75?: boolean; p100?: boolean }>({});
  const [debugOpen, setDebugOpen] = React.useState(false);
  const [canGoBackInWebView, setCanGoBackInWebView] = React.useState(false);
  const networkSnapshotRef = React.useRef<ConnectivitySnapshot>(
    createInitialConnectivitySnapshot("netinfo_not_initialized")
  );
  const healthcheckRunningRef = React.useRef(false);
  const healthcheckLastRunAtRef = React.useRef(0);
  const autoRetryAttemptedRef = React.useRef(false);
  const autoRetryLastAtRef = React.useRef(0);
  const autoRetryTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoRetryState, setAutoRetryState] = React.useState<"idle" | "scheduled" | "running" | "done">("idle");
  const pathLoadSeqRef = React.useRef<{ explore: number; detail: number }>({ explore: 0, detail: 0 });
  const pendingPathLoadRef = React.useRef<PendingPathLoad | null>(null);
  const [offlineSinceAt, setOfflineSinceAt] = React.useState<number | null>(null);
  const [slowLoadHint, setSlowLoadHint] = React.useState(false);
  const [androidOfflineNetCopyOk, setAndroidOfflineNetCopyOk] = React.useState(() => Platform.OS !== "android");
  const onErrorDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowLoadHintTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const shellReadyReceivedRef = React.useRef(false);
  const splashHiddenRef = React.useRef(false);
  const { reportWebViewInitialLoadComplete } = useInitialAppShell();
  const initialDocumentLoadReportedRef = React.useRef(false);

  const logReadyPhase = React.useCallback((phase: "READY_SHELL" | "READY", elapsedMs: number, msg: any) => {
    if (typeof console?.log === "function") {
      console.log(`[PERF] ${phase.toLowerCase()}: ${elapsedMs.toFixed(2)}ms`);
    }

    const marks = msg?.marks;
    const appStart = typeof marks?.app_start === "number" ? marks.app_start : undefined;
    const shellReady = typeof marks?.web_ready_shell === "number" ? marks.web_ready_shell : undefined;
    const ready = typeof marks?.web_ready === "number" ? marks.web_ready : undefined;

    if (typeof appStart === "number" && typeof shellReady === "number" && typeof console?.log === "function") {
      console.log(`[PERF] js_start_to_ready_shell: ${(shellReady - appStart).toFixed(2)}ms`);
    }
    if (phase === "READY" && typeof appStart === "number" && typeof ready === "number" && typeof console?.log === "function") {
      console.log(`[PERF] js_start_to_ready: ${(ready - appStart).toFixed(2)}ms`);
    }
  }, []);

  const hideNativeSplash = React.useCallback((reason: string) => {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    if (typeof console?.log === "function") {
      console.log(`[PERF] native_splash_hide: ${reason}`);
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        SplashScreen.hideAsync().catch(() => {});
      });
    });
  }, []);

  const getNetworkSnapshot = React.useCallback((): ConnectivitySnapshot => {
    return { ...networkSnapshotRef.current };
  }, []);

  React.useEffect(() => {
    if (hasError || webViewImportError) {
      hideNativeSplash("error");
    }
  }, [hasError, hideNativeSplash, webViewImportError]);

  React.useEffect(() => {
    const splashTimeout = setTimeout(() => {
      if (!splashHiddenRef.current) {
        console.warn("[splash] timeout - hiding native splash for safety");
        hideNativeSplash("timeout");
      }
    }, SPLASH_MAX_DURATION_MS);

    return () => clearTimeout(splashTimeout);
  }, [hideNativeSplash]);

  const logDiagnosticEvent = React.useCallback(
    (event: string, payload: Record<string, unknown> = {}) => {
      if (Platform.OS !== "android" || typeof console?.log !== "function") return;
      if (event === "load_phase" || event === "error_deferred") {
        let allowVerbose = typeof __DEV__ !== "undefined" && __DEV__;
        if (!allowVerbose) {
          try {
            allowVerbose = getRuntimeConfig().debug.showConfigDebug;
          } catch {
            allowVerbose = false;
          }
        }
        if (!allowVerbose) return;
      }
      const structured = {
        source: "webview",
        event,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        network: getNetworkSnapshot(),
        ...payload,
      };
      console.log("[WEBVIEW_DIAG]", JSON.stringify(structured));
    },
    [getNetworkSnapshot]
  );

  const triggerLightHealthcheck = React.useCallback(
    async (reason: string, context: Record<string, unknown> = {}) => {
      if (Platform.OS !== "android") return;
      if (healthcheckRunningRef.current) {
        logDiagnosticEvent("healthcheck_skipped_running", { reason, ...context });
        return;
      }
      const now = Date.now();
      if (now - healthcheckLastRunAtRef.current < 5_000) {
        logDiagnosticEvent("healthcheck_skipped_cooldown", { reason, ...context });
        return;
      }

      healthcheckRunningRef.current = true;
      healthcheckLastRunAtRef.current = now;
      try {
        const cfg = getRuntimeConfig();
        const result = await runLightweightHealthcheck({
          webUrl: WEB_APP_URL,
          supabaseUrl: cfg.supabase.url,
          supabaseAnonKey: cfg.supabase.anonKey,
          timeoutMs: ANDROID_HEALTHCHECK_TIMEOUT_MS,
          reason,
        });
        logDiagnosticEvent("healthcheck_result", {
          reason,
          ...context,
          healthcheck: result,
        });
      } catch (error) {
        logDiagnosticEvent("healthcheck_failed", {
          reason,
          ...context,
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        healthcheckRunningRef.current = false;
      }
    },
    [logDiagnosticEvent]
  );

  const clearLoadWatchdog = React.useCallback(() => {
    if (loadWatchdogRef.current) {
      clearTimeout(loadWatchdogRef.current);
      loadWatchdogRef.current = null;
    }
  }, []);

  const clearAutoRetryTimer = React.useCallback(() => {
    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
      autoRetryTimeoutRef.current = null;
    }
  }, []);

  const resetAutoRetryGuard = React.useCallback(() => {
    autoRetryAttemptedRef.current = false;
    autoRetryLastAtRef.current = 0;
    setAutoRetryState("idle");
    clearAutoRetryTimer();
  }, [clearAutoRetryTimer]);

  const clearOnErrorDebounce = React.useCallback(() => {
    if (onErrorDebounceRef.current) {
      clearTimeout(onErrorDebounceRef.current);
      onErrorDebounceRef.current = null;
    }
  }, []);

  const clearSlowLoadHintTimer = React.useCallback(() => {
    if (slowLoadHintTimerRef.current) {
      clearTimeout(slowLoadHintTimerRef.current);
      slowLoadHintTimerRef.current = null;
    }
  }, []);

  const applyWebViewError = React.useCallback(
    (detail: WebViewErrorDetail, confirmReason: "immediate" | "debounced" | "timeout") => {
      logDiagnosticEvent("error_confirmed", {
        confirmReason,
        source: detail.source,
        code: detail.code,
        statusCode: detail.statusCode,
      });
      setLastWebViewError(detail);
      clearLoadWatchdog();
      clearOnErrorDebounce();
      clearSlowLoadHintTimer();
      setSlowLoadHint(false);
      setLoading(false);
      setHasError(true);
      const hcReason =
        detail.source === "load_timeout"
          ? "load_timeout"
          : detail.source === "onHttpError"
            ? "webview_onHttpError"
            : detail.source === "onRenderProcessGone"
              ? "webview_render_process_gone"
              : detail.source === "onContentProcessDidTerminate"
                ? "webview_content_process_terminated"
                : confirmReason === "debounced"
                  ? "webview_onError_debounced"
                  : "webview_onError";
      void triggerLightHealthcheck(hcReason, {
        confirmReason,
        source: detail.source,
      });
    },
    [clearLoadWatchdog, clearOnErrorDebounce, clearSlowLoadHintTimer, logDiagnosticEvent, triggerLightHealthcheck]
  );

  const armLoadWatchdog = React.useCallback(() => {
    clearLoadWatchdog();
    loadWatchdogRef.current = setTimeout(() => {
      logWebViewError("onError", {
        source: "load_timeout",
        timeoutMs: LOAD_TIMEOUT_MS,
        message: "onLoadEnd/READY did not fire within timeout",
      });
      logDiagnosticEvent("load_timeout", {
        timeoutMs: LOAD_TIMEOUT_MS,
      });
      applyWebViewError(
        {
          source: "load_timeout",
          userMessage: "La conexión tardó demasiado.",
          description: `Timeout ${LOAD_TIMEOUT_MS / 1000}s`,
        },
        "timeout"
      );
      loadWatchdogRef.current = null;
    }, LOAD_TIMEOUT_MS);
  }, [applyWebViewError, clearLoadWatchdog, logDiagnosticEvent]);

  const mapIncomingUrlToWebUrl = React.useCallback((incomingUrl: string): string | null => {
    try {
      // Custom scheme deep link: auth, evento, clase
      if (incomingUrl.startsWith("dondebailarmx://")) {
        const u = new URL(incomingUrl);
        const host = (u.host || "").toLowerCase();
        const path = (u.pathname || "").replace(/^\/+/, "") || "";
        const qs = u.search || "";
        const hash = u.hash || "";

        // dondebailarmx://evento/:id -> canonical web /social/fecha/:id
        if (host === "evento" && path) {
          const id = path.split("/")[0];
          if (id) {
            const mappedUrl = `${WEB_APP_URL}/social/fecha/${id}${qs}${hash}`;
            logWebAppLinking("map_success", { incomingUrl, host, path, mappedUrl });
            return mappedUrl;
          }
        }
        // dondebailarmx://clase/:type/:id -> canonical web /clase/:type/:id
        if (host === "clase" && path) {
          const parts = path.split("/").filter(Boolean);
          if (parts.length >= 2) {
            const [type, id] = parts;
            if ((type === "teacher" || type === "academy") && id) {
              const mappedUrl = `${WEB_APP_URL}/clase/${type}/${id}${qs}${hash}`;
              logWebAppLinking("map_success", { incomingUrl, host, path, mappedUrl });
              return mappedUrl;
            }
          }
          logWebAppLinking("map_rejected", {
            incomingUrl,
            host,
            path,
            reason: "invalid_clase_path",
          });
          return null;
        }
        // Perfiles -> canonical web paths
        if (host === "academia" && path) {
          const id = path.split("/")[0];
          if (id) {
            const mappedUrl = `${WEB_APP_URL}/academia/${id}${qs}${hash}`;
            logWebAppLinking("map_success", { incomingUrl, host, path, mappedUrl });
            return mappedUrl;
          }
        }
        if (host === "maestro" && path) {
          const id = path.split("/")[0];
          if (id) {
            const mappedUrl = `${WEB_APP_URL}/maestro/${id}${qs}${hash}`;
            logWebAppLinking("map_success", { incomingUrl, host, path, mappedUrl });
            return mappedUrl;
          }
        }
        if (host === "organizer" && path) {
          const id = path.split("/")[0];
          if (id) {
            const mappedUrl = `${WEB_APP_URL}/organizer/${id}${qs}${hash}`;
            logWebAppLinking("map_success", { incomingUrl, host, path, mappedUrl });
            return mappedUrl;
          }
        }
        if (host === "u" && path) {
          const id = path.split("/")[0];
          if (id) {
            const mappedUrl = `${WEB_APP_URL}/u/${id}${qs}${hash}`;
            logWebAppLinking("map_success", { incomingUrl, host, path, mappedUrl });
            return mappedUrl;
          }
        }
        if (host === "marca" && path) {
          const id = path.split("/")[0];
          if (id) {
            const mappedUrl = `${WEB_APP_URL}/marca/${id}${qs}${hash}`;
            logWebAppLinking("map_success", { incomingUrl, host, path, mappedUrl });
            return mappedUrl;
          }
        }

        // Auth callback (e.g. dondebailarmx://auth/callback?code=...)
        if (host === "auth") {
          const hostSlash = u.host ? `/${u.host}` : "";
          const mappedPath = `${hostSlash}${u.pathname || ""}` || "/auth/callback";
          const mappedUrl = `${WEB_APP_URL}${mappedPath}${qs}${hash}`;
          logWebAppLinking("map_success", { incomingUrl, host, path, mappedUrl });
          return mappedUrl;
        }
        logWebAppLinking("map_rejected", {
          incomingUrl,
          host,
          path,
          reason: "unsupported_custom_scheme_host",
        });
        return null;
      }

      // Universal/App link to our domain should stay in WebView
      if (
        incomingUrl.startsWith("https://dondebailar.com.mx") ||
        incomingUrl.startsWith("https://www.dondebailar.com.mx")
      ) {
        logWebAppLinking("map_success", {
          incomingUrl,
          host: "https",
          path: incomingUrl,
          mappedUrl: incomingUrl,
        });
        return incomingUrl;
      }

      logWebAppLinking("map_rejected", {
        incomingUrl,
        reason: "unsupported_url",
      });
      return null;
    } catch (e) {
      console.warn("[WebAppScreen] Failed to map incoming URL:", incomingUrl, e);
      logWebAppLinking("map_error", {
        incomingUrl,
        error: e instanceof Error ? e.message : String(e),
      });
      return null;
    }
  }, []);

  const navigateWebView = React.useCallback(
    (targetUrl: string) => {
      logWebAppLinking("navigate_webview", { targetUrl });
      // Prefer request URL change through WebView ref when possible.
      // Fallback is to inject JS, which works even when ref APIs differ by platform.
      try {
        webviewRef.current?.stopLoading?.();
      } catch {
        // ignore
      }

      try {
        webviewRef.current?.injectJavaScript?.(
          `window.location.href = ${JSON.stringify(targetUrl)}; true;`
        );
      } catch (e) {
        console.warn("[WebAppScreen] Failed to inject navigation JS:", e);
      }
    },
    []
  );

  const handleIncomingUrl = React.useCallback(
    (incomingUrl: string) => {
      logWebAppLinking("incoming_url", { incomingUrl });
      const webUrl = mapIncomingUrlToWebUrl(incomingUrl);
      if (!webUrl) {
        logWebAppLinking("incoming_url_ignored", {
          incomingUrl,
          reason: "map_returned_null",
        });
        return;
      }
      console.log("[WebAppScreen] Handling deep link -> WebView:", webUrl);
      navigateWebView(webUrl);
    },
    [mapIncomingUrlToWebUrl, navigateWebView]
  );

  const loadWebViewModule = React.useCallback(() => {
    try {
      // Lazy require so a missing native module does not hard-crash during import.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("react-native-webview");
      setWebViewImportError(null);
      setWebViewModule(mod);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[WebAppScreen] Failed to load react-native-webview:", e);
      setWebViewImportError(msg);
      setWebViewModule(null);
      setLoading(false);
      setHasError(true);
    }
  }, []);

  React.useEffect(() => {
    loadWebViewModule();
  }, [loadWebViewModule]);

  React.useEffect(() => {
    return () => {
      clearLoadWatchdog();
      clearAutoRetryTimer();
      clearOnErrorDebounce();
      clearSlowLoadHintTimer();
    };
  }, [clearAutoRetryTimer, clearLoadWatchdog, clearOnErrorDebounce, clearSlowLoadHintTimer]);

  React.useEffect(() => {
    if (Platform.OS !== "android") {
      setAndroidOfflineNetCopyOk(true);
      return;
    }
    const snap = networkSnapshotRef.current;
    const disc = snap.isConnected === false || snap.isInternetReachable === false;
    if (!disc || !offlineSinceAt) {
      setAndroidOfflineNetCopyOk(false);
      return;
    }
    const elapsed = Date.now() - offlineSinceAt;
    if (elapsed >= ANDROID_OFFLINE_CONFIRM_MS) {
      setAndroidOfflineNetCopyOk(true);
      return;
    }
    setAndroidOfflineNetCopyOk(false);
    const t = setTimeout(() => {
      const s2 = networkSnapshotRef.current;
      const still = s2.isConnected === false || s2.isInternetReachable === false;
      if (still) setAndroidOfflineNetCopyOk(true);
    }, ANDROID_OFFLINE_CONFIRM_MS - elapsed);
    return () => clearTimeout(t);
  }, [offlineSinceAt]);

  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (canGoBackInWebView) {
        webviewRef.current?.goBack?.();
        return true;
      }
      // Keep existing app behavior at root: consume back press.
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [canGoBackInWebView]);

  React.useEffect(() => {
    if (Platform.OS !== "android") return;

    const session = startNetworkDiagnostics({
      onSnapshot: (snapshot) => {
        networkSnapshotRef.current = snapshot;
        const disc = snapshot.isConnected === false || snapshot.isInternetReachable === false;
        setOfflineSinceAt((prev) => {
          if (!disc) return null;
          return prev ?? Date.now();
        });
      },
      onEvent: (event) => {
        if (event.event === "state_change" || event.event === "fetch_failed" || event.event === "module_missing") {
          logDiagnosticEvent(`network_${event.event}`, {
            networkEvent: event,
          });
        }
      },
    });

    networkSnapshotRef.current = session.getSnapshot();

    return () => {
      session.stop();
    };
  }, [logDiagnosticEvent]);

  React.useEffect(() => {
    // Handle cold start URL
    Linking.getInitialURL()
      .then((url) => {
        logWebAppLinking("initial_url", { url: url ?? null });
        if (url) handleIncomingUrl(url);
      })
      .catch((error) => {
        logWebAppLinking("initial_url_error", {
          error: error instanceof Error ? error.message : String(error),
        });
      });

    const sub = Linking.addEventListener("url", (event) => {
      logWebAppLinking("url_event", { url: event?.url ?? null });
      if (event?.url) handleIncomingUrl(event.url);
    });

    return () => {
      // RN >= 0.65 returns subscription with remove()
      // @ts-ignore
      sub?.remove?.();
    };
  }, [handleIncomingUrl]);

  const getGoogleIosClientId = React.useCallback((): string => {
    // ✅ Runtime-only: no process.env. Source of truth is Constants.extra (via runtimeConfig).
    const cfg = getRuntimeConfig();
    return String(cfg.google.iosClientId ?? "");
  }, []);

  const getGoogleWebClientId = React.useCallback((): string => {
    const cfg = getRuntimeConfig();
    return String(cfg.google.webClientId ?? "");
  }, []);

  const shouldGoogleSignInDebug = React.useCallback((): boolean => {
    const cfg = getRuntimeConfig();
    return cfg.debug.googleDebug;
  }, []);

  const mask = React.useCallback((v: string) => {
    const t = String(v ?? "").trim();
    if (!t) return "(empty)";
    if (t.length <= 10) return `${t.slice(0, 2)}...${t.slice(-2)}`;
    return `${t.slice(0, 6)}...${t.slice(-6)}`;
  }, []);

  const injectWebAuthError = React.useCallback((message: string) => {
    const js = `
      try {
        window.dispatchEvent(new CustomEvent('baileapp:native-auth-error', { detail: { message: ${JSON.stringify(
          message
        )} } }));
      } catch (e) {}
      true;
    `;
    try {
      webviewRef.current?.injectJavaScript?.(js);
    } catch {
      // ignore
    }
  }, []);

  const injectWebSetSession = React.useCallback((tokens: { access_token: string; refresh_token: string }) => {
    const js = `
      (async function() {
        try {
          if (window.__BAILEAPP_SET_SUPABASE_SESSION) {
            await window.__BAILEAPP_SET_SUPABASE_SESSION(${JSON.stringify(tokens)});
          } else {
            window.dispatchEvent(new CustomEvent('baileapp:native-auth-error', { detail: { message: 'No se pudo aplicar sesión en la web (bridge no disponible).' } }));
          }
        } catch (e) {
          window.dispatchEvent(new CustomEvent('baileapp:native-auth-error', { detail: { message: 'Error aplicando sesión en la web.' } }));
        }
      })();
      true;
    `;
    try {
      webviewRef.current?.injectJavaScript?.(js);
    } catch {
      // ignore
    }
  }, []);

  const injectWebCalendarResult = React.useCallback((result: { ok: boolean; code?: string; message: string; requestId?: string }) => {
    const js = `
      try {
        window.dispatchEvent(new CustomEvent('baileapp:add-to-calendar-result', {
          detail: ${JSON.stringify(result)}
        }));
      } catch (e) {}
      true;
    `;
    try {
      webviewRef.current?.injectJavaScript?.(js);
    } catch {
      // ignore
    }
  }, []);

  const handleWebMessage = React.useCallback(
    async (event: any) => {
      const raw = event?.nativeEvent?.data;
      if (!raw) return;
      
      if (shouldAuthDebug()) {
        logHost("onMessage raw", { rawLength: raw?.length, rawPreview: String(raw).slice(0, 100) });
      }
      
      let msg: any = null;
      try {
        msg = JSON.parse(raw);
      } catch {
        if (shouldAuthDebug()) {
          logHost("onMessage parse failed", { raw });
        }
        return;
      }

      if (msg?.type === "READY_SHELL") {
        if (!shellReadyReceivedRef.current) {
          shellReadyReceivedRef.current = true;
          logReadyPhase("READY_SHELL", Date.now() - loadStartTimeRef.current, msg);
          hideNativeSplash("ready_shell");
        }
        return;
      }

      // Handshake READY: web indica que primera pantalla útil está lista; medir TTI
      if (msg?.type === "READY") {
        if (!readyReceivedRef.current) {
          readyReceivedRef.current = true;
          const elapsed = Date.now() - loadStartTimeRef.current;
          logReadyPhase("READY", elapsed, msg);
          markPerformance("webview_ready");
          PerformanceLogger.mark("web_ready");
          PerformanceLogger.measure("app_start_to_web_ready", "app_start", "web_ready");
          if (typeof __DEV__ !== "undefined" && __DEV__) {
            try {
              PerformanceLogger.flush();
            } catch {}
          }
          clearLoadWatchdog();
          resetAutoRetryGuard();
          clearSlowLoadHintTimer();
          setSlowLoadHint(false);
          clearOnErrorDebounce();
          setLoading(false);
          hideNativeSplash("ready");
        }
        return;
      }

      if (nativeAuthInProgress) return;

      if (msg?.type === "NATIVE_AUTH_APPLE") {
        setNativeAuthInProgress(true);
        setNativeAuthError(null);
        try {
          const tokens = await AuthCoordinator.signInWithApple();
          injectWebSetSession(tokens);
        } catch (e: any) {
          const message = e?.message || "Error al iniciar sesión con Apple.";
          setNativeAuthError(message);
          injectWebAuthError(message);
        } finally {
          setNativeAuthInProgress(false);
        }
      }

      if (msg?.type === "NATIVE_AUTH_GOOGLE") {
        setNativeAuthInProgress(true);
        setNativeAuthError(null);
        try {
          const requestId = String(msg?.requestId || "");
          logHost("action=NATIVE_AUTH_GOOGLE", { requestId, platform: Platform.OS });
          
          const clientId = getGoogleIosClientId();
          const webClientId = getGoogleWebClientId();

          if (__DEV__ || shouldGoogleSignInDebug()) {
            // eslint-disable-next-line no-console
            console.log("[WebAppScreen] NATIVE_AUTH_GOOGLE", {
              platform: Platform.OS,
              requestId: requestId || "(none)",
              iosClientId: mask(clientId),
              webClientId: mask(webClientId),
              iosClientIdEmpty: !String(clientId || "").trim(),
              webClientIdEmpty: !String(webClientId || "").trim(),
              note:
                Platform.OS === "ios" && !String(clientId || "").trim()
                  ? "iosClientId missing in JS; relying on Info.plist fallback"
                  : undefined,
            });
          }
          
          logHost("calling native GoogleSignIn", {
            requestId,
            iosClientId: mask(clientId),
            webClientId: mask(webClientId),
            iosClientIdEmpty: !String(clientId || "").trim(),
            webClientIdEmpty: !String(webClientId || "").trim(),
          });
          
          // Self-check: falla rápido con mensaje accionable si falta config (evita "contacta a soporte" genérico).
          assertGoogleAuthConfig({ getIosClientId: getGoogleIosClientId, getWebClientId: getGoogleWebClientId });

          const tokens = await AuthCoordinator.signInWithGoogle(String(clientId || ""), requestId, String(webClientId || ""));
          injectWebSetSession(tokens);
        } catch (e: any) {
          // Normalizar mensajes de error para mejor UX
          const currentPlatform = Platform.OS;
          const requestId = String(msg?.requestId || (e as any)?.requestId || "");
          const rawMessage = String(e?.message ?? e ?? "Error al iniciar sesión con Google.");
          const rawCode = String(e?.code ?? "");
          const rawStatus = String((e as any)?.status ?? (e as any)?.statusCode ?? "");
          const rawName = String((e as any)?.name ?? "");

          if (__DEV__) {
            try {
              // eslint-disable-next-line no-console
              console.log("[WebAppScreen] Google native auth error (raw)", {
                platform: currentPlatform,
                requestId,
                code: rawCode || "(none)",
                status: rawStatus || "(none)",
                name: rawName || "(none)",
                message: rawMessage,
                keys: e && typeof e === "object" ? Object.keys(e) : [],
              });
            } catch {}
          }

          // Derivar code si el bridge no lo provee (común en algunos builds/bridges)
          const derivedCode = (() => {
            if (rawCode) return rawCode;
            if (/network\s+request\s+failed/i.test(rawMessage) || /No hay conexión/i.test(rawMessage) || /fetch\s+failed/i.test(rawMessage)) return "NETWORK_ERROR";
            if (/audience/i.test(rawMessage) || /invalid.*jwt/i.test(rawMessage) || /bad.*jwt/i.test(rawMessage)) return "invalid_jwt";
            if (/GIDServerClientID/i.test(rawMessage) || /web client id/i.test(rawMessage)) return "GOOGLE_MISSING_WEB_CLIENT_ID";
            if (/url scheme/i.test(rawMessage) || /CFBundleURLSchemes/i.test(rawMessage) || /com\.googleusercontent\.apps/i.test(rawMessage)) return "GOOGLE_MISSING_URL_SCHEME";
            if (/idtoken/i.test(rawMessage) || /id token/i.test(rawMessage)) return "GOOGLE_MISSING_ID_TOKEN";
            if (/client id/i.test(rawMessage)) return "GOOGLE_MISSING_CLIENT_ID";
            if (/nonce/i.test(rawMessage) && /mismatch/i.test(rawMessage)) return "NONCE_MISMATCH";
            // Fallbacks last (so they don't mask the real semantic error)
            if (rawStatus) return `HTTP_${rawStatus}`;
            if (rawName) return rawName;
            return "";
          })();

          let message = rawMessage;

          // Nunca mostrar "contacta a soporte" genérico; siempre dar causa accionable.
          const isGenericSupport = /contacta\s*(al?)?\s*soporte|contacte\s*(al?)?\s*soporte/i.test(message);
          if (isGenericSupport) {
            message = "";
          }

          // Mensajes accionables por código o por texto del error (usar rawMessage si message se vació por genérico).
          const text = message || rawMessage;
          if (derivedCode === "GOOGLE_MISSING_CLIENT_ID" || /client id|clientid|GIDClientID/i.test(text) || (/no está configurado|not configured|falta.*client id/i.test(text) && !/web client|GIDServerClientID/i.test(text))) {
            message =
              "Google Sign-In no está configurado: falta el iOS Client ID. Configura EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID en .env y en EAS/Xcode Cloud, o GIDClientID en Info.plist.";
          } else if (derivedCode === "GOOGLE_MISSING_WEB_CLIENT_ID" || /GIDServerClientID|web client id/i.test(text) || /no está configurado.*supabase|falta.*web client/i.test(text)) {
            message =
              "Google Sign-In no está configurado para Supabase: falta el Web Client ID. Añade GIDServerClientID en Info.plist o EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.";
          } else if (derivedCode === "GOOGLE_IOS_CLIENT_ID_IS_WEB") {
            message =
              "Google Sign-In mal configurado: no uses el Web Client ID como iOS Client ID. En Google Cloud usa el cliente tipo iOS para GIDClientID.";
          } else if (derivedCode === "GOOGLE_MISSING_URL_SCHEME" || /url scheme|CFBundleURLSchemes|com\.googleusercontent\.apps/i.test(text)) {
            message =
              "Google Sign-In no puede regresar a la app: añade el scheme com.googleusercontent.apps.XXX a CFBundleURLSchemes en Info.plist.";
          } else if (derivedCode === "GOOGLE_NO_PRESENTING_VC" || /ViewController|iPad/i.test(text)) {
            message = "No se pudo mostrar la pantalla de Google. Intenta cerrar y reabrir la app.";
          } else if (derivedCode === "GOOGLE_CANCELED" || /cancelado/i.test(text)) {
            message = "Inicio de sesión cancelado.";
          } else if (derivedCode === "GOOGLE_MISSING_ID_TOKEN" || /idtoken|id token/i.test(text)) {
            message = "Google no devolvió credenciales (idToken). Verifica que el Client ID sea el de iOS y que el bundle id sea correcto.";
          } else if (derivedCode === "NETWORK_ERROR") {
            message =
              "No hay conexión o el servidor no responde. Revisa tu red e intenta de nuevo.";
          } else if (derivedCode === "NONCE_MISMATCH") {
            message =
              "Error de validación al iniciar sesión con Google. Intenta de nuevo.";
          } else if (
            derivedCode === "invalid_jwt" ||
            derivedCode === "bad_jwt" ||
            /audience/i.test(text) ||
            /invalid.*jwt/i.test(text)
          ) {
            message =
              "Supabase rechazó el token de Google (audience/JWT). Verifica que en Supabase el Provider de Google use el Web Client ID y que en Xcode Cloud esté EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.";
          }

          if (!message) message = rawMessage;
          const isUnhelpful =
            !rawMessage ||
            rawMessage === "Error" ||
            rawMessage === "AuthApiError" ||
            rawMessage === "Bad Request" ||
            rawMessage === "Request failed with status code 400";
          if (isUnhelpful) {
            if (rawStatus && (derivedCode.startsWith("HTTP_") || /Auth/i.test(rawName))) {
              message = "Error al iniciar sesión: Supabase rechazó la solicitud. Intenta de nuevo.";
            } else if (!message || isGenericSupport) {
              message =
                "Error al iniciar sesión con Google. Revisa GIDClientID, GIDServerClientID y CFBundleURLSchemes en Info.plist o las variables EXPO_PUBLIC_GOOGLE_* en EAS/Xcode Cloud.";
            }
          }

          // Fallback final: si el mensaje sigue siendo genérico, dar instrucciones accionables (nunca solo "contacta a soporte").
          if (!message || isGenericSupport || /contacta\s*(al?)?\s*soporte|contacte\s*(al?)?\s*soporte/i.test(message)) {
            message =
              "Error de configuración de Google Sign-In. Revisa GIDClientID y GIDServerClientID en Info.plist o EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID y EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en EAS/Xcode Cloud.";
          }

          if (requestId || derivedCode || rawStatus) {
            const suffix = [
              `platform: ${currentPlatform}`,
              derivedCode ? `code: ${derivedCode}` : null,
              rawStatus ? `status: ${rawStatus}` : null,
              requestId ? `req: ${requestId}` : null,
            ].filter(Boolean).join(", ");
            message = `${message} (${suffix})`;
          }
          
          setNativeAuthError(message);
          injectWebAuthError(message);
        } finally {
          setNativeAuthInProgress(false);
        }
      }

      if (msg?.type === "NATIVE_SIGN_OUT") {
        setNativeAuthInProgress(true);
        setNativeAuthError(null);
        try {
          await AuthCoordinator.signOut();
        } catch (e: any) {
          const message = e?.message || "No se pudo cerrar sesión.";
          setNativeAuthError(message);
          injectWebAuthError(message);
        } finally {
          setNativeAuthInProgress(false);
        }
      }

      if (msg?.type === "ADD_TO_CALENDAR") {
        const addReqId = String(msg?.requestId || "");
        const addPayload: AddToCalendarPayload = {
          title: String(msg?.payload?.title ?? ""),
          start: String(msg?.payload?.start ?? ""),
          end: String(msg?.payload?.end ?? ""),
          location: msg?.payload?.location ? String(msg.payload.location) : undefined,
          description: msg?.payload?.description ? String(msg.payload.description) : undefined,
          eventLink: msg?.payload?.eventLink ? String(msg.payload.eventLink) : undefined,
        };
        try {
          const result = await addToCalendar(addPayload);
          injectWebCalendarResult({
            ok: result.ok,
            code: result.ok ? undefined : result.code,
            message: result.message,
            requestId: addReqId,
          });
        } catch (e: any) {
          injectWebCalendarResult({
            ok: false,
            code: "CREATE_FAILED",
            message: e?.message || "Error al agregar al calendario.",
            requestId: addReqId,
          });
        }
      }

      if (msg?.type === "ADD_TO_CALENDAR_FALLBACK_GOOGLE") {
        const payload: AddToCalendarPayload = {
          title: String(msg?.payload?.title ?? ""),
          start: String(msg?.payload?.start ?? ""),
          end: String(msg?.payload?.end ?? ""),
          location: msg?.payload?.location ? String(msg.payload.location) : undefined,
          description: msg?.payload?.description ? String(msg.payload.description) : undefined,
          eventLink: msg?.payload?.eventLink ? String(msg.payload.eventLink) : undefined,
        };
        openGoogleCalendarTemplateFallback(payload);
      }

      if (msg?.type === "OPEN_SETTINGS") {
        ExpoLinking.openSettings().catch((err) => {
          console.warn("[WebAppScreen] No se pudo abrir configuración:", err);
        });
      }
    },
    [
      clearLoadWatchdog,
      clearOnErrorDebounce,
      clearSlowLoadHintTimer,
      getGoogleIosClientId,
      getGoogleWebClientId,
      injectWebAuthError,
      injectWebSetSession,
      injectWebCalendarResult,
      nativeAuthInProgress,
      resetAutoRetryGuard,
    ]
  );

  const retryLoad = React.useCallback(
    (mode: "manual" | "auto_once") => {
      clearOnErrorDebounce();
      clearSlowLoadHintTimer();
      setSlowLoadHint(false);
      setHasError(false);
      setLastWebViewError(null);
      setLoading(true);
      void triggerLightHealthcheck(mode === "manual" ? "manual_retry" : "auto_retry_once", {
        retryMode: mode,
      });
      if (webViewImportError || !webViewModule) {
        loadWebViewModule();
        return;
      }
      webviewRef.current?.reload?.();
    },
    [clearOnErrorDebounce, clearSlowLoadHintTimer, loadWebViewModule, triggerLightHealthcheck, webViewImportError, webViewModule]
  );

  const handleReload = React.useCallback(() => {
    clearOnErrorDebounce();
    clearSlowLoadHintTimer();
    setSlowLoadHint(false);
    clearAutoRetryTimer();
    setAutoRetryState("done");
    setHasError(false);
    setLastWebViewError(null);
    setLoading(true);
    void triggerLightHealthcheck("manual_retry", {
      lastKnownError: lastWebViewError?.description ?? lastWebViewError?.userMessage ?? null,
    });
    if (webViewImportError || !webViewModule) {
      loadWebViewModule();
      return;
    }
    webviewRef.current?.reload?.();
  }, [
    clearAutoRetryTimer,
    clearOnErrorDebounce,
    clearSlowLoadHintTimer,
    lastWebViewError,
    loadWebViewModule,
    triggerLightHealthcheck,
    webViewImportError,
    webViewModule,
  ]);

  React.useEffect(() => {
    if (!hasError || !lastWebViewError) return;
    if (autoRetryAttemptedRef.current) return;

    const currentSnapshot = getNetworkSnapshot();
    if (!isLikelyTransientError(lastWebViewError, currentSnapshot)) return;
    const now = Date.now();
    if (now - autoRetryLastAtRef.current < 3_000) return;

    autoRetryAttemptedRef.current = true;
    autoRetryLastAtRef.current = now;
    setAutoRetryState("scheduled");
    logDiagnosticEvent("auto_retry_scheduled", {
      reason: lastWebViewError.source ?? "unknown",
      retryAttempt: 1,
      network: currentSnapshot,
    });
    clearAutoRetryTimer();
    autoRetryTimeoutRef.current = setTimeout(() => {
      setAutoRetryState("running");
      logDiagnosticEvent("auto_retry_start", {
        reason: lastWebViewError.source ?? "unknown",
        retryAttempt: 1,
      });
      retryLoad("auto_once");
      setAutoRetryState("done");
      autoRetryTimeoutRef.current = null;
    }, 1200);

    return () => {
      clearAutoRetryTimer();
    };
  }, [clearAutoRetryTimer, getNetworkSnapshot, hasError, lastWebViewError, logDiagnosticEvent, retryLoad]);

  const errorUi = React.useMemo(() => {
    return buildErrorUiModel(lastWebViewError, getNetworkSnapshot(), {
      androidOfflineNetCopyOk,
    });
  }, [androidOfflineNetCopyOk, getNetworkSnapshot, lastWebViewError]);

  const connectivityHint = React.useMemo(() => {
    const snapshot = getNetworkSnapshot();
    const disc = snapshot.isInternetReachable === false || snapshot.isConnected === false;
    if (disc && Platform.OS === "android" && !androidOfflineNetCopyOk) {
      return "Conectividad: comprobando…";
    }
    if (snapshot.isInternetReachable === false || snapshot.isConnected === false) {
      return "Conectividad: sin internet";
    }
    if (snapshot.isInternetReachable === true) {
      return `Conectividad: online (${snapshot.type || "unknown"})`;
    }
    if (snapshot.available) {
      return `Conectividad: verificando (${snapshot.type || "unknown"})`;
    }
    return "Conectividad: no disponible";
  }, [androidOfflineNetCopyOk, getNetworkSnapshot]);

  const openInBrowser = React.useCallback(() => {
    Linking.openURL(WEB_APP_URL).catch((err) => {
      console.warn("[WebAppScreen] No se pudo abrir en navegador:", err);
    });
  }, []);

  const copyPerfToClipboard = React.useCallback(async () => {
    const snap = PerformanceLogger.snapshot();
    const text = JSON.stringify(
      {
        url: WEB_APP_URL,
        progress: webViewProgress,
        loading,
        hasError,
        lastWebViewError,
        perf: snap,
      },
      null,
      2
    );
    try {
      // Optional dependency; if not installed, fallback to console.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Clipboard = require("expo-clipboard");
      if (Clipboard?.setStringAsync) {
        await Clipboard.setStringAsync(text);
        console.log("[PERF] copied perf snapshot to clipboard");
        return;
      }
    } catch {
      // ignore
    }
    console.log("[PERF] perf snapshot (clipboard not available):\n", text);
  }, [webViewProgress, loading, hasError, lastWebViewError]);

  const perfKeyTimes = React.useMemo(() => {
    const { marks } = PerformanceLogger.snapshot();
    const get = (label: string) => marks.find((m) => m.label === label)?.relMs;
    const start = get("webview_load_start");
    const ready = get("web_ready");
    const end = get("webview_load_end");
    return {
      start,
      ready,
      end,
      startToReady: start !== undefined && ready !== undefined ? ready - start : undefined,
      startToEnd: start !== undefined && end !== undefined ? end - start : undefined,
    };
  }, [webViewProgress, loading, hasError, lastWebViewError]);

  if (webViewImportError) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "ios" ? insets.top + 4 : 0 }]}>
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>WebView no disponible</Text>
          <Text style={styles.errorText}>
            Esta versión de la app no pudo cargar el módulo nativo de WebView.
          </Text>
          <Text style={[styles.errorText, { fontFamily: "monospace", fontSize: 12 }]}>
            {webViewImportError}
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleReload}>
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const WebView = webViewModule?.WebView;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { flex: 1 }]}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === "ios" ? insets.top + 4 : 0,
            flex: 1,
          },
        ]}
      >
        {WebView ? (
          <WebView
            ref={webviewRef}
            source={{ uri: WEB_APP_URL }}
            style={styles.webview}
            originWhitelist={["*"]}
            onMessage={handleWebMessage}
            scalesPageToFit={false}
            setBuiltInZoomControls={false}
            setDisplayZoomControls={false}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
          userAgent={
            Platform.OS === "android"
              ? `DondeBailarApp/${Constants.expoConfig?.version ?? "1.0"} Android WebView`
              : undefined
          }
          onLoadStart={(e: any) => {
            setHasError(false);
            setLastWebViewError(null);
            clearOnErrorDebounce();
            clearSlowLoadHintTimer();
            setSlowLoadHint(false);
            setLoading(true);
            loadStartTimeRef.current = Date.now();
            const slowAfterMs = Platform.select({
              android: ANDROID_LOAD_SLOW_HINT_MS,
              ios: IOS_LOAD_SLOW_HINT_MS,
              default: IOS_LOAD_SLOW_HINT_MS,
            });
            if (slowAfterMs < 600_000) {
              slowLoadHintTimerRef.current = setTimeout(() => {
                slowLoadHintTimerRef.current = null;
                setSlowLoadHint(true);
                logDiagnosticEvent("load_phase", {
                  phase: "slow",
                  elapsedMs: Date.now() - loadStartTimeRef.current,
                  reason: "elapsed_after_onLoadStart",
                });
              }, slowAfterMs);
            }
            armLoadWatchdog();
            readyReceivedRef.current = false;
            setWebViewProgress(0);
            progressMarksRef.current = {};
            markPerformance("webview_load_start");
            PerformanceLogger.mark("webview_load_start");
            const currentUrl = String(e?.nativeEvent?.url ?? WEB_APP_URL);
            const pathKind = detectLoadPathKind(currentUrl);
            if (pathKind) {
              pathLoadSeqRef.current[pathKind] += 1;
              const seq = pathLoadSeqRef.current[pathKind];
              const startLabel = `${pathKind}_load_start_${seq}`;
              const endLabel = `${pathKind}_load_end_${seq}`;
              const metricName = `${pathKind}_load_duration_${seq}`;
              pendingPathLoadRef.current = {
                kind: pathKind,
                startLabel,
                endLabel,
                metricName,
                startedAtMs: Date.now(),
                url: currentUrl,
              };
              markPerformance(startLabel);
              PerformanceLogger.mark(startLabel);
              logDiagnosticEvent("load_path_start", {
                kind: pathKind,
                seq,
                url: currentUrl,
              });
            } else {
              pendingPathLoadRef.current = null;
            }
            logDiagnosticEvent("onLoadStart", {
              url: currentUrl,
              navigationType: e?.nativeEvent?.navigationType ?? "unknown",
            });
            logDiagnosticEvent("load_phase", {
              phase: "loading",
              elapsedMs: 0,
              reason: "onLoadStart",
            });
          }}
          onLoadProgress={(e: { nativeEvent: { progress: number } }) => {
            const progress = Math.max(0, Math.min(1, e.nativeEvent.progress || 0));
            setWebViewProgress(progress);
            const pct = Math.round(progress * 100);
            if (pct >= 25 && !progressMarksRef.current.p25) {
              progressMarksRef.current.p25 = true;
              PerformanceLogger.mark("webview_progress_25");
            }
            if (pct >= 50 && !progressMarksRef.current.p50) {
              progressMarksRef.current.p50 = true;
              PerformanceLogger.mark("webview_progress_50");
            }
            if (pct >= 75 && !progressMarksRef.current.p75) {
              progressMarksRef.current.p75 = true;
              PerformanceLogger.mark("webview_progress_75");
            }
            if (pct >= 100 && !progressMarksRef.current.p100) {
              progressMarksRef.current.p100 = true;
              markPerformance("webview_load_progress_100");
              PerformanceLogger.mark("webview_progress_100");
            }
          }}
          onLoadEnd={(e: any) => {
            clearOnErrorDebounce();
            clearSlowLoadHintTimer();
            setSlowLoadHint(false);
            clearLoadWatchdog();
            resetAutoRetryGuard();
            const elapsed = Date.now() - loadStartTimeRef.current;
            if (typeof console?.log === "function") {
              console.log(`[PERF] webview_load_end: ${elapsed.toFixed(2)}ms`);
            }
            markPerformance("webview_load_end");
            PerformanceLogger.mark("webview_load_end");
            const pendingPathLoad = pendingPathLoadRef.current;
            const currentUrl = String(e?.nativeEvent?.url ?? "");
            if (pendingPathLoad) {
              const endedAtMs = Date.now();
              const durationMs = endedAtMs - pendingPathLoad.startedAtMs;
              markPerformance(pendingPathLoad.endLabel);
              PerformanceLogger.mark(pendingPathLoad.endLabel);
              PerformanceLogger.measure(
                pendingPathLoad.metricName,
                pendingPathLoad.startLabel,
                pendingPathLoad.endLabel
              );
              if (typeof console?.log === "function") {
                console.log(
                  `[PERF] ${pendingPathLoad.kind}_load_duration: ${durationMs.toFixed(2)}ms`
                );
              }
              logDiagnosticEvent("load_path_end", {
                kind: pendingPathLoad.kind,
                metricName: pendingPathLoad.metricName,
                durationMs,
                startUrl: pendingPathLoad.url,
                endUrl: currentUrl,
              });
              pendingPathLoadRef.current = null;
            }
            setLoading(false);
            logDiagnosticEvent("onLoadEnd", {
              elapsedMs: elapsed,
              url: currentUrl,
              title: e?.nativeEvent?.title ?? "",
            });
            if (!initialDocumentLoadReportedRef.current) {
              initialDocumentLoadReportedRef.current = true;
              reportWebViewInitialLoadComplete();
            }
          }}
          onNavigationStateChange={(state: any) => {
            setCanGoBackInWebView(Boolean(state?.canGoBack));
            logDiagnosticEvent("onNavigationStateChange", {
              url: state?.url ?? "",
              title: state?.title ?? "",
              loading: Boolean(state?.loading),
              canGoBack: Boolean(state?.canGoBack),
              canGoForward: Boolean(state?.canGoForward),
            });
          }}
          onError={(e: any) => {
            const ev = e?.nativeEvent ?? {};
            const code = ev.code;
            const description = ev.description ?? ev.message ?? "";
            const url = ev.url ?? "";
            const canGoBack = ev.canGoBack;
            const canGoForward = ev.canGoForward;
            logWebViewError("onError", {
              code,
              description,
              url,
              canGoBack,
              canGoForward,
            });
            logDiagnosticEvent("onError", {
              code,
              description,
              url,
              canGoBack,
              canGoForward,
            });
            const { userMessage, isSsl } = classifyWebViewError(code, description, undefined);
            const detail: WebViewErrorDetail = {
              source: "onError",
              code,
              description,
              url,
              canGoBack,
              canGoForward,
              isSsl,
              userMessage,
            };

            if (Platform.OS !== "android" || isSsl) {
              applyWebViewError(detail, "immediate");
              return;
            }

            clearOnErrorDebounce();
            logDiagnosticEvent("error_deferred", {
              code,
              description,
              url,
              debounceMs: ANDROID_ON_ERROR_DEBOUNCE_MS,
            });
            onErrorDebounceRef.current = setTimeout(() => {
              onErrorDebounceRef.current = null;
              applyWebViewError(detail, "debounced");
            }, ANDROID_ON_ERROR_DEBOUNCE_MS);
          }}
          onHttpError={(e: any) => {
            const ev = e?.nativeEvent ?? {};
            const statusCode = ev.statusCode;
            const description = ev.description ?? "";
            const url = ev.url ?? ev.target ?? "";
            logWebViewError("onHttpError", {
              statusCode,
              description,
              url,
            });
            logDiagnosticEvent("onHttpError", {
              statusCode,
              description,
              url,
            });
            if (typeof statusCode !== "number" || statusCode < 400) return;

            if (
              Platform.OS === "android" &&
              statusCode >= 400 &&
              statusCode < 500 &&
              !isLikelyDocumentNavigationHttpUrl(String(url))
            ) {
              logDiagnosticEvent("onHttpError_ignored_subresource", {
                statusCode,
                url,
              });
              return;
            }

            const { userMessage, isSsl } = classifyWebViewError(undefined, description, statusCode);
            const detail: WebViewErrorDetail = {
              source: "onHttpError",
              statusCode,
              description: String(description),
              url: String(url),
              isSsl,
              userMessage,
            };
            applyWebViewError(detail, "immediate");
          }}
          onRenderProcessGone={
            Platform.OS === "android"
              ? (e: any) => {
                  const ev = e?.nativeEvent ?? {};
                  logWebViewError("onRenderProcessGone", {
                    didCrash: ev.didCrash,
                    rendererPriorityAtExit: ev.rendererPriorityAtExit,
                  });
                  logDiagnosticEvent("onRenderProcessGone", {
                    didCrash: Boolean(ev.didCrash),
                    rendererPriorityAtExit: ev.rendererPriorityAtExit ?? "unknown",
                  });
                  applyWebViewError(
                    {
                      source: "onRenderProcessGone",
                      userMessage:
                        "El contenido se cerró inesperadamente. Revisa tu conexión y reintenta.",
                    },
                    "immediate"
                  );
                }
              : undefined
          }
          onContentProcessDidTerminate={
            Platform.OS === "ios"
              ? () => {
                  logWebViewError("onContentProcessDidTerminate", {});
                  logDiagnosticEvent("onContentProcessDidTerminate");
                  applyWebViewError(
                    {
                      source: "onContentProcessDidTerminate",
                      userMessage:
                        "El contenido se cerró inesperadamente. Revisa tu conexión y reintenta.",
                    },
                    "immediate"
                  );
                }
              : undefined
          }
          // Permitir JS y almacenamiento para que la web funcione igual que en el navegador
          javaScriptEnabled
          domStorageEnabled
          // iOS (WKWebView): helps when the embedded web requests camera/mic (iOS 15+ API)
          // This is especially important on iPad where media/capture permission flows can behave differently.
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          // Keep WKWebView media behavior closer to Safari
          allowsInlineMediaPlayback
          // Habilitar cookies compartidas para mejor funcionamiento de autenticación (Supabase, Google, etc.)
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          // Android: habilitar caché mejora mucho la velocidad percibida del WebView (login y navegación)
          // iOS: mantener comportamiento actual (WKWebView suele cachear de forma segura).
          cacheEnabled={Platform.OS === "android"}
          // @ts-ignore - prop solo aplica a Android en react-native-webview
          cacheMode={Platform.OS === "android" ? "LOAD_DEFAULT" : undefined}
          // En Android: permitir contenido mixto (por si hay recursos http)
          mixedContentMode="always"
          // Evitar que target="_blank" intente abrir una nueva "ventana" nativa
          setSupportMultipleWindows={false}
          // Inyectar JavaScript para forzar que window.open y redirecciones OAuth se mantengan en el WebView
          injectedJavaScript={`
            (function() {
              const isOAuthLike = (url) => {
                try {
                  if (!url) return false;
                  const s = String(url);
                  return (
                    s.includes('supabase.co/auth/v1/') ||
                    s.includes('appleid.apple.com') ||
                    s.includes('idmsa.apple.com') ||
                    s.includes('accounts.google.com') ||
                    s.includes('google.com/o/oauth2') ||
                    s.includes('oauth2.googleapis.com') ||
                    s.includes('dondebailar.com.mx')
                  );
                } catch (e) {
                  return false;
                }
              };

              // Forzar que window.open abra en la misma pestaña
              const originalOpen = window.open;
              window.open = function(url, target, features) {
                // Si es una URL de OAuth o del mismo dominio, redirigir en la misma pestaña
                if (isOAuthLike(url)) {
                  window.location.href = url;
                  return null;
                }
                // Para otras URLs, usar el comportamiento original
                return originalOpen.call(window, url, target, features);
              };
              
              // Interceptar redirecciones de OAuth que puedan usar location.replace
              const originalReplace = window.location.replace;
              window.location.replace = function(url) {
                // Si es una URL de OAuth, permitir la redirección
                if (isOAuthLike(url)) {
                  window.location.href = url;
                } else {
                  originalReplace.call(window.location, url);
                }
              };

              // Algunos flows usan location.assign
              const originalAssign = window.location.assign;
              window.location.assign = function(url) {
                if (isOAuthLike(url)) {
                  window.location.href = url;
                } else {
                  originalAssign.call(window.location, url);
                }
              };
            })();
          `}
          // Control de navegación:
          // - Dentro del WebView: sólo nuestro dominio
          // - Fuera: redes, maps, calendarios (Apple Calendar), etc. con Linking
          onShouldStartLoadWithRequest={(request: any) => {
            const url = request.url;

            // Intercept auth deep links so they don't kick user to browser
            if (url.startsWith("dondebailarmx://")) {
              logWebAppLinking("webview_custom_scheme_intercept", { url });
              handleIncomingUrl(url);
              // Navigation cancelled: make sure we don't leave native loader stuck.
              clearLoadWatchdog();
              setLoading(false);
              return false;
            }

            const isSameDomain =
              url.startsWith("https://dondebailar.com.mx") ||
              url.startsWith("https://www.dondebailar.com.mx");

            // Permitir URLs de OAuth de Supabase dentro del WebView
            const isSupabaseOAuth =
              url.includes("supabase.co/auth/v1/authorize") ||
              url.includes("supabase.co/auth/v1/callback") ||
              url.includes("supabase.co/auth/v1/verify");

            // Permitir URLs de OAuth de Apple dentro del WebView
            const isAppleOAuth =
              url.includes("appleid.apple.com") ||
              url.includes("idmsa.apple.com") ||
              url.includes("/auth/authorize") && url.includes("apple");

            // Detectar navegación a Google OAuth / cuentas (suele abrirse durante el flow)
            const isGoogleOAuth =
              url.includes("accounts.google.com") ||
              url.includes("google.com/o/oauth2") ||
              url.includes("oauth2.googleapis.com");

            // Detectar enlaces de calendario (.ics o protocolos webcal/calshow)
            const isCalendarLink =
              url.endsWith(".ics") || url.startsWith("webcal:") || url.startsWith("calshow:");

            // Para calendario, siempre pedimos al sistema que lo maneje (Apple Calendar)
            if (isCalendarLink) {
              Linking.openURL(url).catch((err) => {
                console.warn("No se pudo abrir el calendario:", err);
              });
              // Navigation cancelled: make sure we don't leave native loader stuck.
              clearLoadWatchdog();
              setLoading(false);
              return false;
            }

            // Permitir navegación dentro del mismo dominio
            if (isSameDomain) {
              return true;
            }

            // OAuth: abrir sesión de autenticación in-app (no navegador externo “normal”)
            if (isSupabaseOAuth || isAppleOAuth || isGoogleOAuth) {
              // iOS: for App Review compliance we keep auth in-app (native buttons).
              // Android: allow web OAuth inside the WebView (no native modules yet).
              if (Platform.OS === "android") {
                return true;
              } else {
                const msg =
                  "En iOS, inicia sesión con los botones nativos de Apple/Google dentro de la app. En Android este flujo usa OAuth web.";
                setNativeAuthError(msg);
                injectWebAuthError(msg);
                // Navigation cancelled: make sure we don't leave native loader stuck.
                clearLoadWatchdog();
                setLoading(false);
                return false;
              }
            }

            // Protocolos y enlaces externos (redes sociales, maps, mail, tel, etc.)
            const isExternalSupportedProtocol =
              url.startsWith("http://") ||
              url.startsWith("https://") ||
              url.startsWith("mailto:") ||
              url.startsWith("tel:") ||
              url.startsWith("geo:") ||
              url.startsWith("whatsapp:") ||
              url.startsWith("maps:") ||
              url.startsWith("sms:");

            if (isExternalSupportedProtocol) {
              Linking.openURL(url).catch((err) => {
                console.warn("No se pudo abrir la URL externa:", err);
              });
              // Navigation cancelled: make sure we don't leave native loader stuck.
              clearLoadWatchdog();
              setLoading(false);
              return false;
            }

            // Cualquier otra cosa la bloqueamos por seguridad
            clearLoadWatchdog();
            setLoading(false);
            return false;
          }}
          allowsBackForwardNavigationGestures
        />
        ) : (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}

        {slowLoadHint && loading && !hasError && Platform.OS === "android" && (
          <View style={styles.slowHintBanner} pointerEvents="none" accessibilityLiveRegion="polite">
            <Text style={styles.slowHintText}>Cargando… esto puede tardar un poco</Text>
          </View>
        )}

        {__DEV__ && (
          <View pointerEvents="box-none" style={styles.perfOverlayWrap}>
            <TouchableOpacity
              style={styles.perfPill}
              onPress={() => setDebugOpen((v) => !v)}
              accessibilityLabel="Toggle performance overlay"
            >
              <Text style={styles.perfPillText}>PERF</Text>
            </TouchableOpacity>
            {debugOpen && (
              <View style={styles.perfPanel} pointerEvents="auto">
                <Text style={styles.perfTitle}>Performance (DEV)</Text>
                <Text style={styles.perfLine}>url: {WEB_APP_URL}</Text>
                <Text style={styles.perfLine}>progress: {Math.round(webViewProgress * 100)}%</Text>
                <Text style={styles.perfLine}>loading: {String(loading)}  error: {String(hasError)}</Text>
                {perfKeyTimes.startToReady !== undefined ? (
                  <Text style={styles.perfLine}>start→ready: {perfKeyTimes.startToReady.toFixed(0)}ms</Text>
                ) : null}
                {perfKeyTimes.startToEnd !== undefined ? (
                  <Text style={styles.perfLine}>start→end: {perfKeyTimes.startToEnd.toFixed(0)}ms</Text>
                ) : null}
                {lastWebViewError ? (
                  <Text style={styles.perfLine}>
                    err: code={String(lastWebViewError.code ?? "—")} status={String(lastWebViewError.statusCode ?? "—")}
                  </Text>
                ) : null}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={[styles.button, { paddingVertical: 8 }]} onPress={copyPerfToClipboard}>
                    <Text style={styles.buttonText}>Copiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.buttonSecondary, styles.button, { paddingVertical: 8 }]} onPress={() => PerformanceLogger.flush()}>
                    <Text style={styles.buttonText}>Log</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {nativeAuthInProgress && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={{ color: "#fff", marginTop: 12, fontWeight: "600" }}>
              Conectando…
            </Text>
          </View>
        )}

        {nativeAuthError && !nativeAuthInProgress && (
          <View style={styles.authErrorOverlay}>
            <Text style={styles.errorTitle}>No se pudo iniciar sesión</Text>
            <Text style={styles.errorText}>{nativeAuthError}</Text>
            <TouchableOpacity style={styles.button} onPress={() => setNativeAuthError(null)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>{errorUi.title}</Text>
            <Text style={styles.errorText}>{errorUi.message}</Text>
            <Text style={styles.errorMetaText}>{connectivityHint}</Text>
            {autoRetryState === "scheduled" || autoRetryState === "running" ? (
              <Text style={styles.errorMetaText}>Reintento automático en curso (1 de 1).</Text>
            ) : autoRetryAttemptedRef.current ? (
              <Text style={styles.errorMetaText}>Ya se realizó un reintento automático.</Text>
            ) : null}
            {__DEV__ && lastWebViewError && (
              <View style={styles.errorCodeBox}>
                <Text style={styles.errorCodeLabel}>[DEV] Código / descripción:</Text>
                <Text style={styles.errorCodeText}>
                  code={String(lastWebViewError.code ?? "—")}
                  {"  "}
                  statusCode={String(lastWebViewError.statusCode ?? "—")}
                </Text>
                <Text style={styles.errorCodeText} numberOfLines={3}>
                  {lastWebViewError.description || "—"}
                </Text>
                {lastWebViewError.url ? (
                  <Text style={styles.errorCodeText} numberOfLines={2}>
                    url={lastWebViewError.url}
                  </Text>
                ) : null}
              </View>
            )}
            <View style={styles.errorButtonsRow}>
              <TouchableOpacity style={styles.button} onPress={handleReload}>
                <Text style={styles.buttonText}>Reintentar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={openInBrowser}
              >
                <Text style={styles.buttonText}>Abrir en navegador</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Mismo color que la navbar de la web para la pantalla de carga inicial.
    backgroundColor: NAVBAR_TEAL,
  },
  webview: {
    flex: 1,
    // En Android a veces ayuda a evitar espacios raros
    marginTop: Platform.OS === "android" ? 0 : 0,
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: NAVBAR_TEAL,
  },
  slowHintBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
  },
  slowHintText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  authErrorOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: "rgba(0,0,0,0.92)",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  errorTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    color: "#ddd",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  errorMetaText: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#f093fb",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
  },
  errorCodeBox: {
    alignSelf: "stretch",
    marginTop: 12,
    marginBottom: 16,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  errorCodeLabel: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  errorCodeText: {
    color: "#e5e7eb",
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 2,
  },
  errorButtonsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  buttonSecondary: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  perfOverlayWrap: {
    position: "absolute",
    top: Platform.OS === "ios" ? 8 : 10,
    right: 10,
    zIndex: 9999,
    alignItems: "flex-end",
  },
  perfPill: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  perfPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  perfPanel: {
    marginTop: 10,
    width: 320,
    maxWidth: 340,
    backgroundColor: "rgba(0,0,0,0.78)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    padding: 12,
  },
  perfTitle: {
    color: "#fff",
    fontWeight: "800",
    marginBottom: 8,
  },
  perfLine: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});

