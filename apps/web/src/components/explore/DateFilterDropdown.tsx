/**
 * Dropdown de fechas para Explore: rangos rápidos (Hoy, Esta semana, etc.) + fecha a determinar (Desde/Hasta).
 */
import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DatePreset } from "@/state/exploreFilters";

const PANEL_STYLE_BASE: React.CSSProperties = {
  position: "fixed",
  zIndex: 9999,
  background: "linear-gradient(180deg, #141922 0%, #0f1218 100%)",
  border: "1px solid rgba(41, 127, 150, 0.25)",
  borderRadius: 16,
  padding: "1rem",
  boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
  color: "#f5f5ff",
  fontSize: 14,
  overflow: "visible",
  boxSizing: "border-box",
};

const DATE_PRESETS: { id: DatePreset; labelKey: string }[] = [
  { id: "todos", labelKey: "all" },
  { id: "hoy", labelKey: "today" },
  { id: "semana", labelKey: "this_week" },
];

export type DateFilterDropdownProps = {
  dateFrom: string | undefined;
  dateTo: string | undefined;
  datePreset?: DatePreset;
  onApply: (from: string | undefined, to: string | undefined) => void;
  onPresetSelect?: (preset: DatePreset) => void;
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
  datePreset,
  onApply,
  onPresetSelect,
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
  const PANEL_ESTIMATED_HEIGHT = 280;

  useEffect(() => {
    if (!open || !anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;
    const isNarrow = vw < 400;
    const viewportMargin = isNarrow ? 12 : 8;
    const panelMinWidth = isNarrow ? 260 : 280;
    const panelMaxWidth = Math.min(360, vw - 2 * viewportMargin);
    const panelWidth = Math.max(panelMinWidth, Math.min(panelMaxWidth, rect.width * 1.1));

    const maxLeft = vw - panelWidth - viewportMargin;
    const left = Math.max(viewportMargin, Math.min(rect.left, maxLeft));

    const spaceBelow = vh - rect.bottom - GAP - viewportMargin;
    const spaceAbove = rect.top - GAP - viewportMargin;
    const showAbove = spaceBelow < PANEL_ESTIMATED_HEIGHT && spaceAbove > spaceBelow;

    const top = showAbove
      ? Math.max(viewportMargin, rect.top - PANEL_ESTIMATED_HEIGHT - GAP)
      : rect.bottom + GAP;
    const maxHeight = showAbove
      ? rect.top - GAP - viewportMargin
      : vh - (rect.bottom + GAP) - viewportMargin;

    setPanelStyle({
      ...PANEL_STYLE_BASE,
      top,
      left,
      width: panelWidth,
      minWidth: panelMinWidth,
      maxWidth: vw - 2 * viewportMargin,
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

  const handlePreset = (preset: DatePreset) => {
    onPresetSelect?.(preset);
    onClose();
  };

  if (!open) return null;

  const body = (
    <div ref={panelRef} style={panelStyle} className="date-filter-dropdown" role="dialog" aria-label={t("dates")}>
      <div className="date-filter-dropdown__presets">
        <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          {t("date_quick_range")}
        </span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {DATE_PRESETS.map((p) => {
            const active = datePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-selected={active}
                onClick={() => handlePreset(p.id)}
                style={{
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${active ? "rgba(41, 127, 150, 0.7)" : "rgba(255,255,255,0.15)"}`,
                  background: active ? "rgba(41, 127, 150, 0.28)" : "rgba(255,255,255,0.05)",
                  color: active ? "#99e5ff" : "rgba(255,255,255,0.88)",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                }}
              >
                {t(p.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="date-filter-dropdown__custom" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 14, paddingTop: 14 }}>
        <span style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
          {t("date_to_determine")}
        </span>
        <div className="date-filter-dropdown__range" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
              {t("from")}
            </label>
            <input
              type="date"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "#f5f5ff",
                fontSize: 14,
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
              {t("to")}
            </label>
            <input
              type="date"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "#f5f5ff",
                fontSize: 14,
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "rgba(255,255,255,0.9)",
              borderRadius: 12,
              cursor: "pointer",
            }}
          >
            {t("clear") || "Limpiar"}
          </button>
          <button
            type="button"
            onClick={handleApply}
            style={{
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              background: "linear-gradient(135deg, #297F96, #1e5f72)",
              color: "#fff",
              borderRadius: 12,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(41, 127, 150, 0.35)",
            }}
          >
            {t("apply")}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(body, document.body) : null;
}
