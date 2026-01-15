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
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const suppressClickUntilRef = useRef(0);

  const canScroll = useMemo(() => (items?.length ?? 0) > 0, [items]);

  // Wheel/trackpad: attach NON-passive listener so preventDefault works (React onWheel can be passive)
  const handleWheelNative = useCallback((e: WheelEvent) => {
    const el = viewportRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    if (maxScrollLeft <= 0) return;

    // Prefer horizontal intent; fall back to vertical delta (trackpads often report deltaY)
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!delta) return;

    const next = el.scrollLeft + delta;

    // If we are already at an edge in that direction, allow page scroll.
    if (delta < 0 && el.scrollLeft <= 0) return;
    if (delta > 0 && el.scrollLeft >= maxScrollLeft) return;

    // Keep scroll inside slider and prevent vertical page scroll while pointer is over slider.
    e.preventDefault();
    el.scrollLeft = Math.max(0, Math.min(maxScrollLeft, next));
  }, []);

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

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    // Must be non-passive so we can preventDefault and keep scroll in the slider.
    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelNative as any);
    };
  }, [handleWheelNative]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;

    // Touch should use native overflow scrolling (better momentum); mouse/pen uses drag-to-scroll.
    if (e.pointerType === "touch") return;

    isDraggingRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = el.scrollLeft;
    try {
      (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;
    if (e.pointerType === "touch") return;
    if (dragStartXRef.current === 0 && dragStartScrollLeftRef.current === 0 && el.scrollLeft === 0) {
      // not started
    }

    const dx = e.clientX - dragStartXRef.current;
    if (!isDraggingRef.current && Math.abs(dx) >= 6) {
      isDraggingRef.current = true;
    }
    if (isDraggingRef.current) {
      // Prevent text selection while dragging
      e.preventDefault();
      el.scrollLeft = dragStartScrollLeftRef.current - dx;
    }
  }, []);

  const endPointerDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (isDraggingRef.current) {
      // Suppress click right after drag to avoid accidental navigation
      suppressClickUntilRef.current = Date.now() + 300;
    }
    isDraggingRef.current = false;
    dragStartXRef.current = 0;
    dragStartScrollLeftRef.current = 0;
    try {
      (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  }, []);

  const onClickCapture = useCallback((e: React.SyntheticEvent) => {
    if (Date.now() < suppressClickUntilRef.current) {
      e.preventDefault();
      // @ts-ignore
      e.stopPropagation?.();
    }
  }, []);

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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
        onPointerLeave={endPointerDrag}
        onClickCapture={onClickCapture}
        style={{
          position: "relative",
          overflowX: "auto",
          overflowY: "visible",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          width: "100%",
          padding: "0.5rem 12px",
          // Optimizaciones de scroll para móvil
          WebkitOverflowScrolling: "touch",
          scrollBehavior: isScrolling ? "auto" : "smooth",
          overscrollBehaviorX: "contain",
          // Better "slide" feel on mobile (snap to cards)
          scrollSnapType: "x proximity",
          scrollPadding: "0 12px",
          // ⚠️ Importante: NO aplicar transform al contenedor scrolleable.
          // En iOS/Safari, transform en un elemento con overflow puede romper el scroll/inercia.
          transform: "none",
          WebkitTransform: "none",
          willChange: isScrolling ? "scroll-position" : "auto",
          // Touch actions
          // Permitir scroll vertical del contenedor padre aunque el gesto inicie aquí,
          // manteniendo swipe horizontal dentro del slider.
          touchAction: "pan-x pan-y",
          // Mouse drag UX
          cursor: "grab",
          userSelect: "none",
          // Mejorar rendimiento en mobile (sin tocar transform)
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden"
        }}
      >
        {/* Oculta scrollbar nativo en webkit */}
        <style>{`
          .horizontal-scroll::-webkit-scrollbar { display: none; }

          /* Snap strongly on mobile for a consistent "slide" gesture */
          @media (max-width: 768px) {
            .horizontal-scroll {
              scroll-snap-type: x mandatory;
            }
          }
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
              scroll-snap-align: start;
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
