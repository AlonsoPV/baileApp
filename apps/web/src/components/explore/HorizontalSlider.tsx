// components/explore/HorizontalSlider.tsx
import React, { useRef, useMemo } from "react";
import { motion } from "framer-motion";

type Props<T = any> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;            // px entre cards
  scrollStep?: number;     // 0..1 del ancho visible a desplazar por click
  className?: string;
  style?: React.CSSProperties;
  autoColumns?: string | number | null; // permite sobreescribir grid-auto-columns
};

export default function HorizontalSlider<T>({
  items,
  renderItem,
  gap = 16,
  scrollStep = 0.85,
  className,
  style,
  autoColumns
}: Props<T>) {
  const viewportRef = useRef<HTMLDivElement>(null);

  const canScroll = useMemo(() => (items?.length ?? 0) > 0, [items]);

  const scrollByAmount = (dir: 1 | -1) => {
    const el = viewportRef.current;
    if (!el) return;
    const amount = el.clientWidth * scrollStep * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        ...style
      }}
    >
      {/* Viewport central */}
      <div
        ref={viewportRef}
        style={{
          position: "relative",
          overflowX: "auto",
          overflowY: "visible",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          width: "100%",
          padding: "0.5rem 0"
        }}
      >
        {/* Oculta scrollbar nativo en webkit */}
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        <div
          className="horizontal-slider-grid"
          style={{
            display: "grid",
            gridAutoFlow: "column",
            // Fijar ancho de card para que no se estiren cuando hay <= 3
            ...(autoColumns === undefined
              ? { gridAutoColumns: "280px" }
              : autoColumns === null
              ? {}
              : { gridAutoColumns: autoColumns as any }),
            gap
          }}
        >
          <style>{`
            /* Mobile: 1 tarjeta completa por sección */
            @media (max-width: 768px) {
              .horizontal-slider-grid {
                grid-auto-columns: calc(100vw - 120px) !important;
              }
            }
            
            @media (max-width: 480px) {
              .horizontal-slider-grid {
                grid-auto-columns: calc(100vw - 100px) !important;
              }
            }
          `}</style>
          {items?.map((it, idx) => renderItem(it, idx))}
        </div>
      </div>

      {/* Botones de navegación debajo del viewport */}
      {canScroll && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            width: "100%"
          }}
        >
          <motion.button
            type="button"
            aria-label="Anterior"
            whileTap={{ scale: 0.96 }}
            onClick={() => scrollByAmount(-1)}
            disabled={!canScroll}
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: canScroll ? "pointer" : "not-allowed",
              opacity: canScroll ? 1 : 0.4,
              backdropFilter: "blur(8px)",
              fontSize: "1.25rem",
              fontWeight: 700,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
              }
            }}
            onMouseLeave={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }
            }}
          >
            ◀
          </motion.button>

          <motion.button
            type="button"
            aria-label="Siguiente"
            whileTap={{ scale: 0.96 }}
            onClick={() => scrollByAmount(1)}
            disabled={!canScroll}
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: canScroll ? "pointer" : "not-allowed",
              opacity: canScroll ? 1 : 0.4,
              backdropFilter: "blur(8px)",
              fontSize: "1.25rem",
              fontWeight: 700,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
              }
            }}
            onMouseLeave={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }
            }}
          >
            ▶
          </motion.button>
        </div>
      )}
    </div>
  );
}
