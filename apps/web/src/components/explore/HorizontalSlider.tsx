// components/explore/HorizontalSlider.tsx
/**
 * HorizontalSlider optimizado para scroll fluido en mobile
 * 
 * Optimizaciones implementadas:
 * - Detección de scroll activo para desactivar animaciones pesadas
 * - Aceleración de hardware con translateZ(0) y will-change
 * - CSS contain para limitar repaints durante scroll
 * - Reducción de scroll-behavior durante scroll activo
 * - Optimizaciones específicas para mobile (touch-action, overscroll-behavior)
 */
import React, { useRef, useMemo, useState, useCallback, useEffect } from "react";
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
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const canScroll = useMemo(() => (items?.length ?? 0) > 0, [items]);

  // Detectar cuando el scroll está activo para desactivar animaciones pesadas
  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  const scrollByAmount = useCallback((dir: 1 | -1) => {
    const el = viewportRef.current;
    if (!el) return;
    const amount = el.clientWidth * scrollStep * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, [scrollStep]);

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
        className={`horizontal-scroll ${isScrolling ? 'scrolling' : ''}`}
        style={{
          position: "relative",
          overflowX: "auto",
          overflowY: "visible",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          width: "100%",
          padding: "0.5rem 0",
          // Optimizaciones de scroll para móvil
          WebkitOverflowScrolling: "touch",
          scrollBehavior: isScrolling ? "auto" : "smooth",
          overscrollBehaviorX: "contain",
          // Aceleración de hardware
          transform: "translateZ(0)",
          willChange: isScrolling ? "scroll-position" : "auto",
          // Touch actions
          // Permitir scroll vertical del contenedor padre aunque el gesto inicie aquí,
          // manteniendo swipe horizontal dentro del slider.
          touchAction: "pan-x pan-y",
          // Mejorar rendimiento en mobile
          WebkitTransform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden"
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
            gap,
            // Optimizaciones de rendimiento durante scroll
            willChange: isScrolling ? "transform" : "auto",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            perspective: "1000px",
            WebkitPerspective: "1000px"
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
            
            /* Optimizaciones de rendimiento para cards durante scroll */
            .horizontal-slider-grid > * {
              contain: layout style paint;
              transform: translateZ(0);
              will-change: auto;
            }
            
            /* Reducir animaciones durante scroll activo */
            .horizontal-scroll.scrolling .horizontal-slider-grid > * {
              transition: none !important;
            }
          `}</style>
          {items?.map((it, idx) => renderItem(it, idx))}
        </div>
      </div>

      {/* Botones de navegación debajo del viewport - Ocultos en móvil */}
      {canScroll && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            width: "100%"
          }}
          className="horizontal-slider-buttons"
        >
          <style>{`
            /* Ocultar botones en móvil */
            @media (max-width: 768px) {
              .horizontal-slider-buttons {
                display: none !important;
              }
            }
          `}</style>
          <motion.button
            type="button"
            aria-label="Anterior"
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollByAmount(-1)}
            disabled={!canScroll}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "1px solid rgba(240, 147, 251, 0.3)",
              background: "rgba(240, 147, 251, 0.08)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: canScroll ? "pointer" : "not-allowed",
              opacity: canScroll ? 1 : 0.4,
              backdropFilter: "blur(10px)",
              fontSize: "1.1rem",
              fontWeight: 700,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 2px 8px rgba(240, 147, 251, 0.15)"
            }}
            onMouseEnter={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(240, 147, 251, 0.15)";
                e.currentTarget.style.borderColor = "rgba(240, 147, 251, 0.5)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(240, 147, 251, 0.25)";
              }
            }}
            onMouseLeave={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(240, 147, 251, 0.08)";
                e.currentTarget.style.borderColor = "rgba(240, 147, 251, 0.3)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(240, 147, 251, 0.15)";
              }
            }}
          >
            ◀
          </motion.button>

          <motion.button
            type="button"
            aria-label="Siguiente"
            whileHover={{ scale: 1.05, x: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollByAmount(1)}
            disabled={!canScroll}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "1px solid rgba(240, 147, 251, 0.3)",
              background: "rgba(240, 147, 251, 0.08)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: canScroll ? "pointer" : "not-allowed",
              opacity: canScroll ? 1 : 0.4,
              backdropFilter: "blur(10px)",
              fontSize: "1.1rem",
              fontWeight: 700,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 2px 8px rgba(240, 147, 251, 0.15)"
            }}
            onMouseEnter={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(240, 147, 251, 0.15)";
                e.currentTarget.style.borderColor = "rgba(240, 147, 251, 0.5)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(240, 147, 251, 0.25)";
              }
            }}
            onMouseLeave={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(240, 147, 251, 0.08)";
                e.currentTarget.style.borderColor = "rgba(240, 147, 251, 0.3)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(240, 147, 251, 0.15)";
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
