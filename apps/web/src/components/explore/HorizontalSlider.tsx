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
 * - Touch: scroll horizontal funciona aunque el gesto empiece sobre una card (tap vs scroll con umbral 8px)
 *
 * QA manual (ExploreHomeScreenModern, Android / touch):
 * - [ ] Swipe horizontal iniciando sobre una card: se mueve el carrusel
 * - [ ] Swipe horizontal iniciando en el espacio entre cards: se mueve el carrusel
 * - [ ] Tap rápido en card: abre detalle (onPress/navegación)
 * - [ ] Arrastre vertical (incluso sobre la zona del carrusel): scroll vertical de la página fluido
 * - [ ] Arrastre diagonal: si predomina horizontal (|dx|>=|dy|) scroll horizontal; si predomina vertical, scroll vertical
 * iOS: comprobar que el comportamiento no empeore.
 */
import React, { useRef, useMemo, useState, useCallback, useEffect } from "react";

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
  /** 'overlay' = botones superpuestos a los lados; 'bottom' = fila inferior dedicada (mejor UX en mobile) */
  navPosition?: 'overlay' | 'bottom';
  /** Alto fijo de cada item en mobile (hero cards). Si > 0, los items tendrán esta altura. */
  itemHeight?: number;
  /** Ancho fijo de cada item en mobile (hero cards). Si > 0, se usa como gridAutoColumns. */
  itemWidth?: number;
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
  navPosition = 'overlay',
  itemHeight,
  itemWidth,
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
  // Touch scroll-from-card (Android): capture touch so viewport can scroll when user drags on a card
  const touchIdRef = useRef<number | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartScrollLeftRef = useRef(0);
  const touchScrollingRef = useRef(false);
  const TOUCH_SLOP = 8;

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

  // Touch: allow horizontal scroll when gesture starts on a card (Android). Use capture + non-passive so we can preventDefault.
  const onTouchStartCapture = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!viewportRef.current || !allowUserScroll || e.touches.length !== 1) return;
    const t = e.touches[0];
    touchIdRef.current = t.identifier;
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
    touchStartScrollLeftRef.current = viewportRef.current.scrollLeft;
    touchScrollingRef.current = false;
  }, [allowUserScroll]);

  const onTouchEndCapture = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      if (touchScrollingRef.current) {
        suppressClickUntilRef.current = Date.now() + 300;
      }
      touchIdRef.current = null;
      touchScrollingRef.current = false;
    }
  }, []);

  const onTouchCancelCapture = useCallback(() => {
    touchIdRef.current = null;
    touchScrollingRef.current = false;
  }, []);

  // touchmove must be non-passive to call preventDefault; attach natively in capture phase
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !allowUserScroll) return;

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const id = touchIdRef.current;
      if (id === null) return;
      const t = Array.from(e.touches).find((x) => x.identifier === id);
      if (!t) return;

      const dx = t.clientX - touchStartXRef.current;
      const dy = t.clientY - touchStartYRef.current;

      if (!touchScrollingRef.current) {
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);
        /* Solo tratar como scroll horizontal si claramente predomina (adx > ady).
         * Si ady >= adx, permitir scroll vertical de la página en Android WebView. */
        if (adx >= TOUCH_SLOP && adx > ady) {
          touchScrollingRef.current = true;
        }
      }
      if (touchScrollingRef.current) {
        e.preventDefault();
        const maxScrollLeft = layoutRef.current.maxScrollLeft ?? Math.max(0, el.scrollWidth - el.clientWidth);
        el.scrollLeft = Math.max(0, Math.min(maxScrollLeft, touchStartScrollLeftRef.current - dx));
      }
    };

    el.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    return () => el.removeEventListener("touchmove", onTouchMove, { capture: true } as any);
  }, [allowUserScroll]);

  const scrollByAmount = useCallback((dir: 1 | -1) => {
    const el = viewportRef.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>("[data-carousel-item]");
    const step = first ? (first.offsetWidth + gap) : Math.round((layoutRef.current.clientWidth || el.clientWidth) * 0.9);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, [scrollStep, gap]);

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const updateArrows = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateArrows) : null;
    if (ro) ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro?.disconnect();
    };
  }, [updateArrows, items?.length]);

  const navButtonBottomStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    fontSize: 22,
    fontWeight: 700,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transition: "all 0.2s ease",
    border: "none",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
  };
  const navButtonBottomActive: React.CSSProperties = {
    background: "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%)",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(168, 85, 247, 0.4), 0 2px 8px rgba(0,0,0,0.2)",
  };
  const navButtonBottomDisabled: React.CSSProperties = {
    background: "rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.35)",
    cursor: "not-allowed",
    boxShadow: "none",
  };

  const ArrowLeft = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
  const ArrowRight = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );

  const navButtons = showNavButtons && canScroll && (
    <>
      <button
        type="button"
        aria-label="Anterior"
        onClick={() => scrollByAmount(-1)}
        disabled={!canLeft}
        style={{
          pointerEvents: "auto",
          position: navPosition === "overlay" ? "absolute" : undefined,
          left: navPosition === "overlay" ? 8 : undefined,
          top: navPosition === "overlay" ? "50%" : undefined,
          transform: navPosition === "overlay" ? "translateY(-50%)" : undefined,
          right: undefined,
          width: 42,
          height: 42,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(15,15,18,0.55)",
          backdropFilter: "blur(10px)",
          display: "grid",
          placeItems: "center",
          cursor: canLeft ? "pointer" : "not-allowed",
          opacity: canLeft ? 1 : 0.35,
          color: "rgba(255,255,255,0.9)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <ArrowLeft />
      </button>
      <button
        type="button"
        aria-label="Siguiente"
        onClick={() => scrollByAmount(1)}
        disabled={!canRight}
        style={{
          pointerEvents: "auto",
          position: navPosition === "overlay" ? "absolute" : undefined,
          right: navPosition === "overlay" ? 8 : undefined,
          left: navPosition === "overlay" ? undefined : undefined,
          top: navPosition === "overlay" ? "50%" : undefined,
          transform: navPosition === "overlay" ? "translateY(-50%)" : undefined,
          width: 42,
          height: 42,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(15,15,18,0.55)",
          backdropFilter: "blur(10px)",
          display: "grid",
          placeItems: "center",
          cursor: canRight ? "pointer" : "not-allowed",
          opacity: canRight ? 1 : 0.35,
          color: "rgba(255,255,255,0.9)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <ArrowRight />
      </button>
    </>
  );

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: navPosition === "bottom" ? 12 : 16,
        flex: navPosition === "bottom" ? 1 : undefined,
        minHeight: navPosition === "bottom" ? 0 : undefined,
        ...style
      }}
    >
      {/* Overlay de botones (solo cuando navPosition === 'overlay') */}
      {navPosition === "overlay" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
          }}
          aria-hidden
        >
          {navButtons}
        </div>
      )}

      {/* Viewport central */}
      <div
        ref={viewportRef}
        className={`horizontal-scroll ${isScrolling ? 'scrolling' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
        onPointerLeave={endPointerDrag}
        onTouchStartCapture={onTouchStartCapture}
        onTouchEndCapture={onTouchEndCapture}
        onTouchCancelCapture={onTouchCancelCapture}
        onClickCapture={onClickCapture}
        style={{
          position: "relative",
          flex: navPosition === "bottom" ? 1 : undefined,
          minHeight: navPosition === "bottom" ? 0 : undefined,
          overflowX: allowUserScroll ? "auto" : "hidden",
          overflowY: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          width: "100%",
          padding: 0,
          // Optimizaciones de scroll para móvil
          WebkitOverflowScrolling: "touch",
          scrollBehavior: isScrolling ? "auto" : "smooth",
          overscrollBehaviorX: "contain",
          overscrollBehaviorY: "auto",
          scrollSnapType: "x mandatory",
          scrollPadding: 0,
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
        <style>{`
          .horizontal-scroll::-webkit-scrollbar { display: none; }
          .horizontal-scroll > * { touch-action: auto; }
          @media (max-width: 768px) {
            .horizontal-slider-grid:not(.horizontal-slider-grid--hero) {
              grid-auto-columns: min(86vw, 360px) !important;
            }
          }
          @media (min-width: 769px) {
            .horizontal-slider-grid:not(.horizontal-slider-grid--hero) {
              grid-auto-columns: min(320px, 24vw) !important;
            }
          }
          .horizontal-slider-grid > * {
            contain: layout style paint;
            transform: translateZ(0);
            will-change: auto;
            scroll-snap-align: start;
            padding: 12px 0;
          }
          .horizontal-slider-grid--hero > * {
            height: 100%;
            min-height: 0;
            padding: 12px 0;
            margin: 2px 0;
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }
          .horizontal-slider-grid--hero > * > * {
            flex: 1;
            min-height: 0;
            width: 100%;
            align-self: stretch;
          }
          /* Contenido de cards (EventCard, ClassCard, etc.) debe llenar todo el espacio en hero */
          .horizontal-slider-grid--hero .event-card-mobile,
          .horizontal-slider-grid--hero .card,
          .horizontal-slider-grid--hero .explore-card,
          .horizontal-slider-grid--hero .explore-card-mobile,
          .horizontal-slider-grid--hero .class-card,
          .horizontal-slider-grid--hero .class-card-mobile,
          .horizontal-slider-grid--hero .social-card-mobile {
            height: 100% !important;
            max-height: none !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .horizontal-slider-grid--hero .media,
          .horizontal-slider-grid--hero .explore-card-media,
          .horizontal-slider-grid--hero .class-card-media {
            flex: 1 !important;
            min-height: 0 !important;
            aspect-ratio: auto !important;
          }
          .horizontal-scroll.scrolling .horizontal-slider-grid > * { transition: none !important; }
          .horizontal-slider-nav-row button:not(:disabled):hover {
            transform: scale(1.05);
            box-shadow: 0 6px 24px rgba(168, 85, 247, 0.5) !important;
          }
          .horizontal-slider-nav-row button:not(:disabled):active {
            transform: scale(0.98);
          }
        `}</style>
        <div
          className={`horizontal-slider-grid ${itemWidth && itemWidth > 0 ? 'horizontal-slider-grid--hero' : ''}`}
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoRows: itemHeight && itemHeight > 0 ? `minmax(${itemHeight}px, 1fr)` : undefined,
            ...(itemWidth && itemWidth > 0
              ? { gridAutoColumns: `${itemWidth}px` }
              : autoColumns === undefined
              ? { gridAutoColumns: "min(320px, 24vw)" }
              : autoColumns === null
              ? {}
              : { gridAutoColumns: autoColumns as any }),
            gap,
            willChange: isScrolling ? "transform" : "auto",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            perspective: "1000px",
            WebkitPerspective: "1000px"
          }}
        >
          {items?.map((it, idx) => (
            <div key={(it as any)?.id ?? idx} data-carousel-item style={{ minWidth: 0 }}>
              {renderItem(it, idx)}
            </div>
          ))}
        </div>
      </div>

      {/* Fila inferior de navegación (navPosition === 'bottom') */}
      {navPosition === "bottom" && showNavButtons && canScroll && (
        <div
          className="horizontal-slider-nav-row"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            flexShrink: 0,
            width: itemWidth && itemWidth > 0 ? itemWidth : 295,
            maxWidth: "100%",
            boxSizing: "border-box",
            backdropFilter: "blur(12px)",
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollByAmount(-1)}
            disabled={!canLeft}
            style={{
              ...navButtonBottomStyle,
              ...(canLeft ? navButtonBottomActive : navButtonBottomDisabled),
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => scrollByAmount(1)}
            disabled={!canRight}
            style={{
              ...navButtonBottomStyle,
              ...(canRight ? navButtonBottomActive : navButtonBottomDisabled),
            }}
          >
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
