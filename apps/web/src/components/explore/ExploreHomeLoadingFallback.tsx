import React from "react";

/**
 * Fallback mientras carga el chunk de ExploreHomeScreenModern.
 * Incluye el mismo patrón de título hero que la pantalla real para mejorar LCP / CLS
 * y texto coherente con el idioma por defecto del sitio (es).
 */
export function ExploreHomeLoadingFallback() {
  return (
    <div
      className="route-fallback route-fallback--explore-lcp"
      style={{
        boxSizing: "border-box",
        width: "100%",
        padding: "0.75rem",
        background: "#0b0d10",
      }}
    >
      <section
        className="section-container explore-lcp-shell"
        aria-labelledby="explore-lcp-heading"
        data-testid="explore-lcp-fallback"
      >
        <div className="section-container__main">
          <div
            className="section-header section-header--hero explore-section-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              position: "relative",
              paddingTop: 10,
              paddingBottom: 12,
              marginBottom: 8,
            }}
          >
            <h2
              id="explore-lcp-heading"
              className="section-title section-title--hero"
              style={{
                margin: 0,
                fontSize: "clamp(1.25rem, 5vw, 1.5rem)",
                fontWeight: 800,
                color: "#f4f4f5",
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              Sociales
            </h2>
          </div>
          <div
            aria-hidden
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
                style={{
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  animation: "route-fallback-pulse 1.2s ease-in-out infinite",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div
                  style={{
                    aspectRatio: "4 / 5.2",
                    background: "rgba(255,255,255,0.05)",
                  }}
                />
                <div style={{ padding: 12, display: "grid", gap: 8 }}>
                  <div
                    style={{
                      height: 12,
                      borderRadius: 6,
                      width: "88%",
                      background: "rgba(255,255,255,0.08)",
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      borderRadius: 6,
                      width: "55%",
                      background: "rgba(255,255,255,0.08)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <style>{`
        @keyframes route-fallback-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.88; }
        }
        .route-fallback--explore-lcp {
          min-height: calc(100vh - var(--app-navbar-offset) - 80px);
          min-height: calc(100dvh - var(--app-navbar-offset) - 80px);
        }
      `}</style>
    </div>
  );
}
