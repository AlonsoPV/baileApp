/**
 * Dropdown de fechas para Explore: solo rango personalizado (Desde/Hasta) con resumen en el botón.
 */
import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const PANEL_STYLE_BASE: React.CSSProperties = {
  position: "fixed",
  zIndex: 9999,
  minWidth: 280,
  background: "#101119",
  border: "1px solid #262a36",
  borderRadius: 12,
  padding: "0.75rem",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  color: "#f5f5ff",
  fontSize: 14,
  overflow: "auto",
};

export type DateFilterDropdownProps = {
  dateFrom: string | undefined;
  dateTo: string | undefined;
  onApply: (from: string | undefined, to: string | undefined) => void;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  summaryText: string;
  t: (key: string) => string;
};

export function DateFilterDropdown({
  dateFrom,
  dateTo,
  onApply,
  anchorEl,
  open,
  onClose,
  triggerRef,
  summaryText,
  t,
}: DateFilterDropdownProps) {
  const [rangeFrom, setRangeFrom] = useState(dateFrom ?? "");
  const [rangeTo, setRangeTo] = useState(dateTo ?? "");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setRangeFrom(dateFrom ?? "");
      setRangeTo(dateTo ?? "");
    }
  }, [open, dateFrom, dateTo]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        anchorEl?.contains(target) ||
        triggerRef?.current?.contains(target)
      )
        return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick, true);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handleClick, true);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [open, onClose, anchorEl, triggerRef]);

  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>(PANEL_STYLE_BASE);
  const GAP = 6;
  const PANEL_MIN_WIDTH = 280;
  const PANEL_ESTIMATED_HEIGHT = 220;
  const VIEWPORT_MARGIN = 8;

  useEffect(() => {
    if (!open || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;

    const maxLeft = vw - PANEL_MIN_WIDTH - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, maxLeft));

    const spaceBelow = vh - rect.bottom - GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - GAP - VIEWPORT_MARGIN;
    const showAbove = spaceBelow < PANEL_ESTIMATED_HEIGHT && spaceAbove > spaceBelow;

    const top = showAbove
      ? Math.max(VIEWPORT_MARGIN, rect.top - PANEL_ESTIMATED_HEIGHT - GAP)
      : rect.bottom + GAP;
    const maxHeight = showAbove
      ? rect.top - GAP - VIEWPORT_MARGIN
      : vh - (rect.bottom + GAP) - VIEWPORT_MARGIN;

    setPanelStyle({
      ...PANEL_STYLE_BASE,
      top,
      left,
      maxHeight: Math.max(120, maxHeight),
    });
  }, [open, anchorEl]);

  const handleApply = () => {
    onApply(rangeFrom || undefined, rangeTo || undefined);
    onClose();
  };

  const handleClear = () => {
    onApply(undefined, undefined);
    onClose();
  };

  if (!open) return null;

  const body = (
    <div ref={panelRef} style={panelStyle} className="date-filter-dropdown" role="dialog" aria-label="Fechas">
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          Desde
        </label>
        <input
          type="date"
          value={rangeFrom}
          onChange={(e) => setRangeFrom(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 8,
            border: "1px solid #343947",
            background: "#181b26",
            color: "#f5f5ff",
          }}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          Hasta
        </label>
        <input
          type="date"
          value={rangeTo}
          onChange={(e) => setRangeTo(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 8,
            border: "1px solid #343947",
            background: "#181b26",
            color: "#f5f5ff",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleClear}
          style={{
            padding: "6px 12px",
            fontSize: 13,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "rgba(255,255,255,0.9)",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {t("clear") || "Limpiar"}
        </button>
        <button
          type="button"
          onClick={handleApply}
          style={{
            padding: "6px 14px",
            fontSize: 13,
            border: "none",
            background: "linear-gradient(135deg, #FF6A1A, #E94E1B)",
            color: "#fff",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {t("apply") || "Aplicar"}
        </button>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(body, document.body) : null;
}
