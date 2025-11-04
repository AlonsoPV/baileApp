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
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        alignItems: "center",
        gap: 12,
        // Asegura que las flechas estén FUERA visualmente
        // y no se encimen a las cards
        ...style
      }}
    >
      {/* Flecha izquierda (fuera del contenedor) */}
      <motion.button
        type="button"
        aria-label="Anterior"
        whileTap={{ scale: 0.96 }}
        onClick={() => scrollByAmount(-1)}
        disabled={!canScroll}
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.06)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          cursor: canScroll ? "pointer" : "not-allowed",
          opacity: canScroll ? 1 : 0.4,
          // separa visualmente la flecha del carrusel
          marginRight: 6,
          backdropFilter: "blur(6px)"
        }}
      >
        ◀
      </motion.button>

      {/* Viewport central */}
      <div
        ref={viewportRef}
        style={{
          position: "relative",
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingBottom: 4
        }}
      >
        {/* Oculta scrollbar nativo en webkit */}
        <style>{`
          div::-webkit-scrollbar { display: none; }
          @media (max-width: 768px) {
            .hs-hide-arrows-on-mobile { display: none !important; }
          }
        `}</style>

        <div
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
          {items?.map((it, idx) => renderItem(it, idx))}
        </div>
      </div>

      {/* Flecha derecha (fuera del contenedor) */}
      <motion.button
        type="button"
        aria-label="Siguiente"
        whileTap={{ scale: 0.96 }}
        onClick={() => scrollByAmount(1)}
        disabled={!canScroll}
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.06)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          cursor: canScroll ? "pointer" : "not-allowed",
          opacity: canScroll ? 1 : 0.4,
          marginLeft: 6,
          backdropFilter: "blur(6px)"
        }}
      >
        ▶
      </motion.button>
    </div>
  );
}
