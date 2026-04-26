import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = { hasError: boolean; error?: Error };

const ROUTE_LOAD_RETRY_KEY_PREFIX = "baileapp:route-load-retry:";
let routeLoadRetryAttemptedInMemory = false;

function isLikelyLazyRouteLoadError(error?: Error): boolean {
  const text = `${error?.name ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return (
    text.includes("failed to fetch dynamically imported module") ||
    text.includes("importing a module script failed") ||
    text.includes("chunkloaderror") ||
    text.includes("loading chunk") ||
    text.includes("error loading dynamically imported module")
  );
}

function getRouteLoadRetryKey(): string {
  if (typeof window === "undefined") return ROUTE_LOAD_RETRY_KEY_PREFIX;
  return `${ROUTE_LOAD_RETRY_KEY_PREFIX}${window.location.pathname}${window.location.search}`;
}

/**
 * Error boundary para errores al cargar rutas lazy (ej. red caída, dev server apagado).
 * Muestra un mensaje claro en lugar de romper toda la app.
 */
export class RouteLoadErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RouteLoadErrorBoundary] Failed to load route:", error?.message, info?.componentStack);
    if (typeof window === "undefined" || !isLikelyLazyRouteLoadError(error)) return;

    const retryKey = getRouteLoadRetryKey();
    try {
      if (window.sessionStorage.getItem(retryKey) === "1") return;
      window.sessionStorage.setItem(retryKey, "1");
    } catch {
      if (routeLoadRetryAttemptedInMemory) return;
      routeLoadRetryAttemptedInMemory = true;
    }

    window.setTimeout(() => {
      window.location.reload();
    }, 150);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            color: "#f5f5f5",
            background: "linear-gradient(180deg, #0f0f14 0%, #1a1a24 100%)",
          }}
        >
          <p style={{ marginBottom: 16, fontSize: "1.1rem" }}>
            No se pudo cargar la pantalla.
          </p>
          <p style={{ marginBottom: 24, opacity: 0.8, fontSize: "0.95rem" }}>
            Comprueba tu conexión o que el servidor de desarrollo esté en marcha y recarga.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg, #277e92, #2d9cdb)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
