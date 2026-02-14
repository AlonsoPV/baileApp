/**
 * Panel de preview responsive (solo en dev).
 * Muestra el breakpoint actual para validar 360, 390, 414, 768, 1024, 1280, 1440px.
 */
import React, { useState, useEffect } from "react";

const BREAKPOINTS = [
  { name: "small", max: 360 },
  { name: "mobile", max: 480 },
  { name: "tablet", max: 768 },
  { name: "desktop", max: 1024 },
  { name: "large", max: 1280 },
  { name: "xl", max: 1440 },
  { name: "ultra", max: 99999 },
] as const;

function getBreakpoint(width: number): string {
  for (const bp of BREAKPOINTS) {
    if (width <= bp.max) return `${bp.name} (≤${bp.max}px)`;
  }
  return "ultra-wide";
}

export function ResponsivePreview() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Toggle responsive preview"
        onClick={() => setVisible((v) => !v)}
        style={{
          position: "fixed",
          bottom: "80px",
          right: "12px",
          zIndex: 9998,
          padding: "6px 10px",
          fontSize: "11px",
          fontWeight: 700,
          background: "rgba(39, 126, 146, 0.9)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        {visible ? "Ocultar" : "Breakpoint"}
      </button>
      {visible && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "80px",
            right: "12px",
            zIndex: 9999,
            padding: "10px 14px",
            fontSize: "12px",
            fontFamily: "monospace",
            background: "rgba(26, 26, 46, 0.95)",
            color: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>
            {width} × {typeof window !== "undefined" ? window.innerHeight : 0}
          </div>
          <div style={{ color: "rgba(255,255,255,0.9)" }}>
            {getBreakpoint(width)}
          </div>
          <div style={{ marginTop: "6px", fontSize: "10px", opacity: 0.8 }}>
            360 · 480 · 768 · 1024 · 1280 · 1440
          </div>
        </div>
      )}
    </>
  );
}
