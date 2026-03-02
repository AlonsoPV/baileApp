import React from "react";

export function LoadMoreCard({
  onClick,
  loading,
  title = "Cargar más",
  subtitle = "Ver más sociales",
}: {
  onClick: () => void;
  loading: boolean;
  title?: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="card load-more-card"
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        borderRadius: 22,
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "radial-gradient(120% 120% at 0% 0%, rgba(168,85,247,0.22) 0%, rgba(168,85,247,0.08) 36%, rgba(255,255,255,0.02) 100%), linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        color: "#fff",
        cursor: loading ? "wait" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        boxShadow: "0 16px 36px rgba(0, 0, 0, 0.45)",
        transition: "transform .18s ease, border-color .18s ease, background .18s ease",
      }}
      aria-label={title}
    >
      <div
        style={{
          textAlign: "center",
          opacity: loading ? 0.9 : 1,
          width: "100%",
          maxWidth: 280,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.16)",
            marginBottom: 4,
            fontSize: 28,
          }}
          aria-hidden
        >
          {loading ? "⏳" : "➕"}
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            lineHeight: 1.15,
            fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          {loading ? "Cargando..." : title}
        </div>
        <div
          style={{
            fontSize: 13,
            opacity: 0.8,
            lineHeight: 1.35,
            fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          {subtitle}
        </div>
      </div>
    </button>
  );
}

