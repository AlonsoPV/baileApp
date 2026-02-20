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
  /** Si true, en escritorio deshabilita scroll por wheel/trackpad y drag con mouse (solo quedan flechas/botones) */
  disableDesktopScroll?: boolean;
  /** Si false, no se muestran los botones Anterior/Siguiente (por defecto true) */
  showNavButtons?: boolean;
};

export default function HorizontalSlider<T>({
  items,
  renderItem,
  gap = 16,
  scrollStep = 0.85,
  className,
  style,
  autoColumns,
  disableDesktopScroll = false,
  showNavButtons = true,
}: Props<T>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  // Cache geometry to avoid forced reflow in hot paths (wheel/drag).
  const layoutRef = useRef<{ clientWidth: number; maxScrollLeft: number }>({
    clientWidth: 0,
    maxScrollLeft: 0,
  });
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const isPointerCapturedRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const suppressClickUntilRef = useRef(0);

  const canScroll = useMemo(() => (items?.length ?? 0) > 0, [items]);
  const isDesktop =
    typeof window !== "undefined" ? window.matchMedia("(min-width: 769px)").matches : false;
  const allowUserScroll = !(disableDesktopScroll && isDesktop);

  const updateLayoutMetrics = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    // These reads can force layout; do them rarely (resize / items change) rather than on every wheel.
    const clientWidth = el.clientWidth;
    const maxScrollLeft = Math.max(0, el.scrollWidth - clientWidth);
    layoutRef.current.clientWidth = clientWidth;
    layoutRef.current.maxScrollLeft = maxScrollLeft;
  }, []);

  useEffect(() => {
    updateLayoutMetrics();
    const el = viewportRef.current;
    if (!el) return;

    // ResizeObserver is the cheapest way to keep the cached values fresh.
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        updateLayoutMetrics();
      });
      ro.observe(el);
      // Observe first child (grid) too: content size changes can affect scrollWidth.
      if (el.firstElementChild) {
        ro.observe(el.firstElementChild as Element);
      }
    }

    const onWinResize = () => updateLayoutMetrics();
    window.addEventListener("resize", onWinResize, { passive: true } as any);

    return () => {
      window.removeEventListener("resize", onWinResize as any);
      ro?.disconnect();
    };
    // Include inputs that can change scrollWidth (items/gap/autoColumns).
  }, [items?.length, gap, autoColumns, updateLayoutMetrics]);

  // Wheel/trackpad: attach NON-passive listener so preventDefault works (React onWheel can be passive)
  const handleWheelNative = useCallback((e: WheelEvent) => {
    const el = viewportRef.current;
    if (!el) return;

    const maxScrollLeft = layoutRef.current.maxScrollLeft || Math.max(0, el.scrollWidth - el.clientWidth);
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
    if (!allowUserScroll) return;
    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelNative as any);
    };
  }, [handleWheelNative, allowUserScroll]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;

    // Touch should use native overflow scrolling (better momentum); mouse/pen uses drag-to-scroll.
    if (e.pointerType === "touch") return;
    if (!allowUserScroll) return;

    isDraggingRef.current = false;
    isPointerDownRef.current = true;
    pointerIdRef.current = e.pointerId;
    isPointerCapturedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = el.scrollLeft;
    // Important: DO NOT setPointerCapture on pointerdown.
    // If we capture immediately, clicks on <a>/<Link> inside cards can stop navigating on desktop.
    // We'll only capture after we detect an actual drag (see onPointerMove).
  }, [allowUserScroll]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    if (!el) return;
    if (e.pointerType === "touch") return;
    if (!allowUserScroll) return;
    // Only allow drag-to-scroll while the pointer is actually down (mouse button pressed / captured).
    // Without this guard, simple mouse moves over the slider can be interpreted as a drag and suppress clicks.
    if (!isPointerDownRef.current) return;
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
    // `buttons` is reliable for mouse; if no button is pressed, don't treat it as a drag.
    // (Some browsers can still deliver pointermove after capture; pointerup will reset the flag.)
    if (typeof (e as any).buttons === 'number' && (e as any).buttons === 0) return;

    const dx = e.clientX - dragStartXRef.current;
    if (!isDraggingRef.current && Math.abs(dx) >= 8) {
      isDraggingRef.current = true;
      // Capture only once we are sure it's a drag.
      if (!isPointerCapturedRef.current) {
        try {
          (e.currentTarget as any).setPointerCapture?.(e.pointerId);
          isPointerCapturedRef.current = true;
        } catch {
          // ignore
        }
      }
    }
    if (isDraggingRef.current) {
      // Prevent text selection while dragging
      e.preventDefault();
      el.scrollLeft = dragStartScrollLeftRef.current - dx;
    }
  }, [allowUserScroll]);

  const endPointerDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    if (isDraggingRef.current) {
      // Suppress click right after drag to avoid accidental navigation
      suppressClickUntilRef.current = Date.now() + 300;
    }
    isDraggingRef.current = false;
    isPointerDownRef.current = false;
    pointerIdRef.current = null;
    isPointerCapturedRef.current = false;
    dragStartXRef.current = 0;
    dragStartScrollLeftRef.current = 0;
    // Only release if we captured during drag (safe no-op otherwise).
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
    const width = layoutRef.current.clientWidth || el.clientWidth;
    const amount = width * scrollStep * dir;
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
          /* Android: overflow-x: scroll asegura que el scroll horizontal esté habilitado (auto puede no activarse) */
          overflowX: allowUserScroll ? "scroll" : "hidden",
          overflowY: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          width: "100%",
          padding: "0.5rem 12px",
          // Optimizaciones de scroll para móvil
          WebkitOverflowScrolling: "touch",
          scrollBehavior: isScrolling ? "auto" : "smooth",
          overscrollBehaviorX: "contain",
          // Fix Android: permitir que el scroll vertical se propague al contenedor padre
          overscrollBehaviorY: "auto",
          // Better "slide" feel on mobile (snap to cards)
          scrollSnapType: "x proximity",
          scrollPadding: "0 12px",
          // ⚠️ Importante: NO aplicar transform al contenedor scrolleable.
          // En iOS/Safari, transform en un elemento con overflow puede romper el scroll/inercia.
          transform: "none",
          WebkitTransform: "none",
          willChange: isScrolling ? "scroll-position" : "auto",
          // Touch: pan-x prioriza scroll horizontal en el slider; pan-y permite scroll vertical en contenido interno
          touchAction: "pan-x pan-y",
          // Mouse drag UX
          cursor: allowUserScroll ? "grab" : "default",
          userSelect: allowUserScroll ? "none" : "auto",
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

          /* Fix Android: permitir que el scroll vertical se propague desde las cards */
          .horizontal-scroll > * {
            /* Asegurar que las cards no bloqueen el scroll vertical */
            touch-action: auto;
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

      {/* Botones de navegación debajo del viewport - Ocultos en móvil o si showNavButtons=false */}
      {showNavButtons && canScroll && (
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
              color: "rgba(0, 0, 0, 0.7)",
              display: "grid",
              placeItems: "center",
              cursor: canScroll ? "pointer" : "not-allowed",
              opacity: canScroll ? 1 : 0.4,
              backdropFilter: "blur(10px)",
              fontSize: "1.1rem",
              fontWeight: 700,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "none"
            }}
            onMouseEnter={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(240, 147, 251, 0.15)";
                e.currentTarget.style.borderColor = "rgba(240, 147, 251, 0.5)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
            onMouseLeave={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(240, 147, 251, 0.08)";
                e.currentTarget.style.borderColor = "rgba(240, 147, 251, 0.3)";
                e.currentTarget.style.boxShadow = "none";
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
              color: "rgba(0, 0, 0, 0.7)",
              display: "grid",
              placeItems: "center",
              cursor: canScroll ? "pointer" : "not-allowed",
              opacity: canScroll ? 1 : 0.4,
              backdropFilter: "blur(10px)",
              fontSize: "1.1rem",
              fontWeight: 700,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "none"
            }}
            onMouseEnter={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(240, 147, 251, 0.15)";
                e.currentTarget.style.borderColor = "rgba(240, 147, 251, 0.5)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
            onMouseLeave={(e) => {
              if (canScroll) {
                e.currentTarget.style.background = "rgba(240, 147, 251, 0.08)";
                e.currentTarget.style.borderColor = "rgba(240, 147, 251, 0.3)";
                e.currentTarget.style.boxShadow = "none";
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
