import React from "react";

export type RouteLoadingLayout = "fullscreen" | "appContent";

/**
 * Fallback de Suspense alineado al layout real para reducir CLS:
 * - appContent: dentro de AppShell (solo área scroll; ya existe navbar/footer).
 * - fullscreen: auth, landing, open links, etc.
 */
export function RouteLoadingFallback({ layout = "fullscreen" }: { layout?: RouteLoadingLayout }) {
  if (layout === "appContent") {
    return (
      <div
        className="route-fallback route-fallback--inset"
        style={{
          boxSizing: "border-box",
          width: "100%",
          padding: "0.75rem",
          background: "#0b0d10",
        }}
      >
        <style>{`
          .route-fallback--inset {
            min-height: calc(100vh - var(--app-navbar-offset) - 80px);
            min-height: calc(100dvh - var(--app-navbar-offset) - 80px);
          }
          @keyframes route-fallback-pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.88; }
          }
          .route-fallback__chip {
            height: 36px;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            animation: route-fallback-pulse 1.2s ease-in-out infinite;
          }
          .route-fallback__card {
            border-radius: 20px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.08);
            overflow: hidden;
            animation: route-fallback-pulse 1.2s ease-in-out infinite;
          }
          .route-fallback__card-media {
            aspect-ratio: 4 / 5.2;
            background: rgba(255,255,255,0.05);
          }
          .route-fallback__card-body {
            padding: 12px;
            display: grid;
            gap: 8px;
          }
          .route-fallback__line {
            height: 12px;
            border-radius: 6px;
            background: rgba(255,255,255,0.08);
          }
        `}</style>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <div className="route-fallback__chip" style={{ width: 100 }} />
          <div className="route-fallback__chip" style={{ width: 120 }} />
          <div className="route-fallback__chip" style={{ width: 90 }} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "1rem",
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="route-fallback__card"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="route-fallback__card-media" />
              <div className="route-fallback__card-body">
                <div className="route-fallback__line" style={{ width: "88%" }} />
                <div className="route-fallback__line" style={{ width: "55%" }} />
                <div className="route-fallback__line" style={{ width: "70%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="route-fallback route-fallback--fullscreen"
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: "#0b0d10",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .route-fallback__visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .route-fallback-fs-panel {
          width: 100%;
          max-width: 420px;
          padding: 1.5rem;
          border-radius: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .route-fallback-fs-bar {
          height: 14px;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          margin-bottom: 1rem;
        }
        .route-fallback-fs-bar--short { width: 55%; }
        .route-fallback-fs-field {
          height: 48px;
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          margin-bottom: 12px;
        }
      `}</style>
      <div className="route-fallback-fs-panel" aria-hidden>
        <div className="route-fallback-fs-bar route-fallback-fs-bar--short" />
        <div className="route-fallback-fs-bar" style={{ width: "100%" }} />
        <div style={{ height: 20 }} />
        <div className="route-fallback-fs-field" />
        <div className="route-fallback-fs-field" />
        <div className="route-fallback-fs-field" style={{ height: 44, maxWidth: "45%", marginTop: 8 }} />
      </div>
      <span className="route-fallback__visually-hidden">Cargando…</span>
    </div>
  );
}
