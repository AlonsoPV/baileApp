import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { ToastProvider } from './components/Toast';
import App from './App';
import './index.css';
// ✅ Inicializar i18n ANTES de renderizar la app
import './i18n';
import { installNativeAuthBridge } from "./native/nativeAuthBridge";
import { mark } from "./utils/performanceLogger";
import { startScrollLockWatchdog } from "./utils/scrollLockWatchdog";
import { isNativeApp } from "./utils/isNativeApp";

function DeferredVercelSignals({ enabled }: { enabled: boolean }) {
  const [signals, setSignals] = React.useState<{
    SpeedInsights?: React.ComponentType;
    Analytics?: React.ComponentType;
  } | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const loadSignals = () => {
      void Promise.all([
        import("@vercel/speed-insights/react"),
        import("@vercel/analytics/react"),
      ]).then(([speedInsights, analytics]) => {
        if (cancelled) return;
        setSignals({
          SpeedInsights: speedInsights.SpeedInsights,
          Analytics: analytics.Analytics,
        });
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(loadSignals, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(loadSignals, 800);
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (idleId != null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [enabled]);

  if (!enabled || !signals) return null;

  const SpeedInsightsComponent = signals.SpeedInsights;
  const AnalyticsComponent = signals.Analytics;

  return (
    <>
      {SpeedInsightsComponent ? <SpeedInsightsComponent /> : null}
      {AnalyticsComponent ? <AnalyticsComponent /> : null}
    </>
  );
}

// Medición de carga (hitos en memoria + postMessage WebView; sin logs en consola)
try { performance?.mark?.("web_boot_start"); } catch {}
mark("app_start");

// Dev: collector histórico (perfReport / perfExport); ya no depende de logs [PERF] en consola
if (import.meta.env?.DEV) {
  import("./dev/perfCollector");
  import("./dev/runPerfScenarios").then((m) => m.installPerfScenarioRunners());
}

// Normalizar URLs con dobles barras ANTES de que React Router las procese
if (window.location.pathname.includes('//')) {
  const normalizedPath = window.location.pathname.replace(/\/+/g, '/');
  const normalizedUrl = normalizedPath + window.location.search + window.location.hash;
  window.history.replaceState({}, '', normalizedUrl);
}

// ✅ Install WebView <-> Native auth bridge (no browser OAuth)
installNativeAuthBridge();
if (import.meta.env.DEV) startScrollLockWatchdog();

const hostWindow = typeof window !== "undefined" ? (window as any) : undefined;
const isEmbeddedWebView = !!hostWindow?.ReactNativeWebView;
const canLoadVercelSignals = !isEmbeddedWebView;

if (hostWindow) {
  hostWindow.__baileappPerf = hostWindow.__baileappPerf ?? {};
  if (typeof hostWindow.__baileappPerf.jsStart !== "number") {
    hostWindow.__baileappPerf.jsStart = Date.now();
  }
}

// Keep public deep-link screens out of the main web bundle, but warm them early in native/WebView
// to reduce the chance of route-chunk fetch failures after boot.
if (typeof window !== "undefined" && isNativeApp(window.location.search)) {
  void import("./screens/explore/ExploreHomeScreenModern");
  void import("./screens/events/EventDatePublicScreen");
  void import("./screens/events/OrganizerPublicScreen");
  void import("./screens/classes/ClassPublicScreen");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
            <DeferredVercelSignals enabled={canLoadVercelSignals} />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
      {/* React Query Devtools - Solo en desarrollo - Debe estar dentro de QueryClientProvider */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>,
);
