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
        minHeight: 420,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
        color: "#fff",
        cursor: loading ? "wait" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      aria-label={title}
    >
      <div style={{ textAlign: "center", opacity: loading ? 0.85 : 1 }}>
        <div style={{ fontSize: 30, marginBottom: 8 }} aria-hidden>
          {loading ? "⏳" : "➕"}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{loading ? "Cargando..." : title}</div>
        <div style={{ fontSize: 13, marginTop: 6, opacity: 0.75 }}>{subtitle}</div>
      </div>
    </button>
  );
}

