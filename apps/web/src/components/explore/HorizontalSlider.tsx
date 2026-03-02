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
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Cache geometry to avoid forced reflow in hot paths (wheel/drag).
  const layoutRef = useRef<{ clientWidth: number; maxScrollLeft: number }>({
    clientWidth: 0,
    maxScrollLeft: 0,
  });
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const navSettleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const isPointerCapturedRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);
  const suppressClickUntilRef = useRef(0);

  const canScroll = useMemo(() => (items?.length ?? 0) > 0, [items]);
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0));
  const isDesktop =
    typeof window !== "undefined" ? window.matchMedia("(min-width: 769px)").matches : false;
  const allowUserScroll = !(disableDesktopScroll && isDesktop);
  const enableMouseDrag = allowUserScroll && !isTouchDevice;

  const updateLayoutMetrics = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // These reads can force layout; do them rarely (resize / items change) rather than on every wheel.
    const clientWidth = el.clientWidth;
    const maxScrollLeft = Math.max(0, el.scrollWidth - clientWidth);
    layoutRef.current.clientWidth = clientWidth;
    layoutRef.current.maxScrollLeft = maxScrollLeft;
  }, []);

  useEffect(() => {
    updateLayoutMetrics();
    const el = scrollerRef.current;
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
    const el = scrollerRef.current;
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

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const getCarouselItems = useCallback((scroller: HTMLElement) => {
    return Array.from(scroller.querySelectorAll<HTMLElement>("[data-carousel-item]"));
  }, []);

  const getScrollPaddingLeftPx = useCallback((el: HTMLElement) => {
    const cs = getComputedStyle(el);
    const raw = cs.scrollPaddingLeft || "0";
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const getNearestItemIndex = useCallback((scroller: HTMLElement) => {
    const nodes = getCarouselItems(scroller);
    if (!nodes.length) return -1;
    const paddingLeft = getScrollPaddingLeftPx(scroller);
    const targetLeft = scroller.scrollLeft + paddingLeft;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < nodes.length; i += 1) {
      const distance = Math.abs(nodes[i].offsetLeft - targetLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }
    return nearestIndex;
  }, [getCarouselItems, getScrollPaddingLeftPx]);

  const updateNavState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const itemNodes = getCarouselItems(el);
    // En móviles/tabs, el slider puede medir 0 en primer render.
    // Si hay más de 1 item, mantenemos "Siguiente" habilitado de forma provisional.
    if (el.clientWidth <= 0 || el.scrollWidth <= 0 || itemNodes.length === 0) {
      setCanLeft(false);
      setCanRight((items?.length ?? 0) > 1);
      return;
    }
    const nearestIndex = getNearestItemIndex(el);
    const nextCanLeft = nearestIndex > 0;
    const nextCanRight = nearestIndex >= 0 && nearestIndex < itemNodes.length - 1;
    if (nearestIndex >= 0) setActiveIndex(nearestIndex);
    setCanLeft(nextCanLeft);
    setCanRight(nextCanRight);
  }, [getCarouselItems, getNearestItemIndex, items?.length]);

  const scheduleNavStateUpdate = useCallback(() => {
    if (navSettleTimeoutRef.current) {
      clearTimeout(navSettleTimeoutRef.current);
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateLayoutMetrics();
        updateNavState();
      });
    });
    navSettleTimeoutRef.current = setTimeout(() => {
      updateLayoutMetrics();
      updateNavState();
    }, 140);
  }, [updateLayoutMetrics, updateNavState]);

  // Detectar scroll activo + actualizar navegación con rAF (evita jank en móviles).
  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      updateNavState();
    });
  }, [updateNavState]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          updateLayoutMetrics();
          updateNavState();
        })
      : null;
    if (ro) {
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);
    }

    updateNavState();
    scheduleNavStateUpdate();

    return () => {
      el.removeEventListener("scroll", handleScroll);
      ro?.disconnect();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
      if (navSettleTimeoutRef.current) {
        clearTimeout(navSettleTimeoutRef.current);
      }
    };
  }, [handleScroll, updateLayoutMetrics, updateNavState, scheduleNavStateUpdate, items?.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Must be non-passive so we can preventDefault and keep scroll in the slider.
    if (!allowUserScroll) return;
    el.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheelNative as any);
    };
  }, [handleWheelNative, allowUserScroll]);

  // Touch fallback (Android/WebView/desktop emulation): if native horizontal scroll
  // doesn't move, drive scrollLeft manually while preserving vertical page scroll.
  useEffect(() => {
    if (!allowUserScroll) return;
    const el = scrollerRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let lastY = 0;
    let startScrollLeft = 0;
    let startIndex = 0;
    let axisLock: "x" | "y" | null = null;
    let totalDx = 0;
    let verticalScrollHosts: Array<HTMLElement | Window> = [];

    const findVerticalScrollHost = (node: HTMLElement | null): HTMLElement | null => {
      let cur: HTMLElement | null = node?.parentElement ?? null;
      while (cur) {
        const cs = getComputedStyle(cur);
        const canScrollY = /(auto|scroll|overlay)/.test(cs.overflowY);
        if (canScrollY && cur.scrollHeight > cur.clientHeight + 1) return cur;
        cur = cur.parentElement;
      }
      return null;
    };

    const collectVerticalScrollHosts = (node: HTMLElement | null): Array<HTMLElement | Window> => {
      const hosts: Array<HTMLElement | Window> = [];
      const seen = new Set<any>();
      const pushUnique = (h: HTMLElement | Window | null | undefined) => {
        if (!h || seen.has(h)) return;
        seen.add(h);
        hosts.push(h);
      };

      // 1) Nearest scrollable ancestor
      pushUnique(findVerticalScrollHost(node));
      // 2) App shell scroll container (known host in this app)
      pushUnique(document.querySelector(".app-shell-content") as HTMLElement | null);
      // 3) Document scrolling element fallback
      pushUnique((document.scrollingElement as HTMLElement | null) ?? document.documentElement);
      // 4) Window as final fallback
      pushUnique(window);
      return hosts;
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches?.[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      lastY = t.clientY;
      startScrollLeft = el.scrollLeft;
      startIndex = Math.max(0, getNearestItemIndex(el));
      axisLock = null;
      totalDx = 0;
      verticalScrollHosts = collectVerticalScrollHosts(el);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches?.[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      totalDx = dx;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (!axisLock) {
        if (absDx < 8 && absDy < 8) return;

        // Priorizar vertical para no bloquear scroll de página por ruido horizontal.
        const horizontalDominant = absDx > 18 && absDx > absDy * 1.8;
        const verticalDominant = absDy > 8 && absDy > absDx * 1.05;

        if (horizontalDominant) {
          axisLock = "x";
        } else if (verticalDominant) {
          axisLock = "y";
        } else {
          // Gesto ambiguo: esperar siguiente frame para decidir.
          return;
        }
      }

      if (axisLock === "x") {
        // Si el gesto muta a vertical tras iniciar, ceder inmediatamente al scroll de página.
        if (absDy > absDx * 1.15) {
          axisLock = "y";
          return;
        }

        const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
        const next = startScrollLeft - dx;
        const clamped = Math.max(0, Math.min(maxScrollLeft, next));
        const atLeftEdgeGoingRight = el.scrollLeft <= 0 && dx > 0;
        const atRightEdgeGoingLeft = el.scrollLeft >= maxScrollLeft && dx < 0;

        // Si estamos en borde y el gesto "empuja fuera" del carrusel, ceder al scroll vertical de página.
        if (atLeftEdgeGoingRight || atRightEdgeGoingLeft) {
          axisLock = "y";
          return;
        }

        // Keep horizontal gesture in the carousel.
        e.preventDefault();
        el.scrollLeft = clamped;
      }
      if (axisLock === "y") {
        // Fallback: force vertical page scroll even when inner card libs capture gestures.
        const deltaY = t.clientY - lastY;
        lastY = t.clientY;
        if (Math.abs(deltaY) > 0.5) {
          e.preventDefault();
          let moved = false;
          let movedHost: string | null = null;
          for (const host of verticalScrollHosts) {
            if (host === window) {
              const before = window.scrollY;
              window.scrollBy({ top: -deltaY, left: 0, behavior: "auto" });
              const after = window.scrollY;
              if (after !== before) {
                moved = true;
                movedHost = "window";
                break;
              }
              continue;
            }

            const elHost = host as HTMLElement;
            const before = elHost.scrollTop;
            elHost.scrollTop -= deltaY;
            const after = elHost.scrollTop;
            if (after !== before) {
              moved = true;
              movedHost = elHost.className || elHost.tagName.toLowerCase();
              break;
            }
          }

          // Last resort
          if (!moved) {
            window.scrollBy({ top: -deltaY, left: 0, behavior: "auto" });
          }
        }
      }
    };

    const onTouchEnd = () => {
      if (axisLock === "x") {
        const nodes = getCarouselItems(el);
        if (nodes.length > 0) {
          const swipeThreshold = 28;
          let targetIndex = getNearestItemIndex(el);
          if (Math.abs(totalDx) >= swipeThreshold) {
            targetIndex = Math.max(
              0,
              Math.min(nodes.length - 1, startIndex + (totalDx < 0 ? 1 : -1)),
            );
          }
          const targetLeft = Math.max(0, nodes[targetIndex].offsetLeft - getScrollPaddingLeftPx(el));
          el.scrollTo({ left: targetLeft, behavior: "smooth" });
          setActiveIndex(targetIndex);
          scheduleNavStateUpdate();
        }
      }
      axisLock = null;
      verticalScrollHosts = [];
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [allowUserScroll, getCarouselItems, getNearestItemIndex, getScrollPaddingLeftPx, items?.length, scheduleNavStateUpdate]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (!allowUserScroll) return;
    if (e.pointerType !== "mouse") return;

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
    const el = scrollerRef.current;
    if (!el) return;
    if (!allowUserScroll) return;
    if (e.pointerType !== "mouse") return;
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
    if (e.pointerType !== "mouse") return;
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

  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() < suppressClickUntilRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const getGapPx = useCallback((el: HTMLElement) => {
    const cs = getComputedStyle(el);
    const raw = cs.columnGap || cs.gap || "0";
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const getScrollStep = useCallback((scroller: HTMLElement) => {
    const item = scroller.querySelector<HTMLElement>("[data-carousel-item]");
    const gapValue = getGapPx(scroller);
    if (item) return item.offsetWidth + gapValue;
    return Math.round(scroller.clientWidth * 0.9);
  }, [getGapPx]);

  const scrollByCard = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const itemNodes = getCarouselItems(el);
    const currentIndex = getNearestItemIndex(el);
    const scrollPaddingLeft = getScrollPaddingLeftPx(el);
    const step = getScrollStep(el);
    const before = el.scrollLeft;
    if (itemNodes.length > 0 && currentIndex >= 0) {
      const nextIndex = Math.max(0, Math.min(itemNodes.length - 1, currentIndex + dir));
      const targetLeft = Math.max(0, itemNodes[nextIndex].offsetLeft - scrollPaddingLeft);
      el.scrollTo({ left: targetLeft, behavior: "smooth" });
    } else {
      el.scrollBy({ left: dir * step, behavior: "smooth" });
    }
    scheduleNavStateUpdate();
  }, [getCarouselItems, getNearestItemIndex, getScrollPaddingLeftPx, getScrollStep, scheduleNavStateUpdate]);

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
        onClick={() => scrollByCard(-1)}
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
        onClick={() => scrollByCard(1)}
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
        width: "100%",
        maxWidth: "100vw",
        minWidth: 0,
        gap: navPosition === "bottom" ? 12 : 16,
        flex: navPosition === "bottom" ? 1 : undefined,
        minHeight: navPosition === "bottom" ? 0 : undefined,
        overflow: "hidden",
        ...style
      }}
    >
      {/* Overlay de botones (solo cuando navPosition === 'overlay') */}
      {navPosition === "overlay" && (
        <div
          className="carousel-nav-overlay horizontal-slider-nav-overlay"
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
        ref={scrollerRef}
        className={`horizontal-scroll horizontal-carousel horizontal-slider-scroller ${isScrolling ? 'scrolling' : ''}`}
        {...(enableMouseDrag
          ? {
              onPointerDown,
              onPointerMove,
              onPointerUp: endPointerDrag,
              onPointerCancel: endPointerDrag,
              onPointerLeave: endPointerDrag,
              onClickCapture,
            }
          : {})}
        style={{
          position: "relative",
          flex: navPosition === "bottom" ? 1 : undefined,
          minHeight: navPosition === "bottom" ? 0 : undefined,
          minWidth: 0,
          overflowX: allowUserScroll ? "auto" : "hidden",
          overflowY: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          width: "100%",
          maxWidth: "100%",
          padding: 0,
          // Optimizaciones de scroll para móvil
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          overscrollBehaviorX: "contain",
          overscrollBehaviorY: "auto",
          scrollSnapType: "x mandatory",
          scrollPadding: navPosition === "overlay" ? "0 56px" : 0,
          scrollPaddingLeft: navPosition === "overlay" ? 56 : 0,
          scrollPaddingRight: navPosition === "overlay" ? 56 : 0,
          scrollbarGutter: "stable",
          // ⚠️ Importante: NO aplicar transform al contenedor scrolleable.
          // En iOS/Safari, transform en un elemento con overflow puede romper el scroll/inercia.
          transform: "none",
          WebkitTransform: "none",
          willChange: isScrolling ? "scroll-position" : "auto",
          // Priorizar scroll vertical del contenedor padre; horizontal se maneja por fallback touch.
          touchAction: "pan-y",
          // Mouse drag UX
          cursor: enableMouseDrag ? "grab" : "default",
          userSelect: enableMouseDrag ? "none" : "auto",
          // Mejorar rendimiento en mobile (sin tocar transform)
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden"
        }}
      >
        <style>{`
          /* Android/iOS: scroll vertical siempre funciona; horizontal fluido con inercia */
          .horizontal-scroll,
          .horizontal-slider,
          .explore-slider {
            touch-action: pan-y;
            overscroll-behavior-x: contain;
            -webkit-overflow-scrolling: touch;
          }
          .horizontal-slider-scroller {
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-x: contain;
            touch-action: pan-y;
          }
          .horizontal-scroll {
            overflow-x: auto;
            overflow-y: hidden;
            scroll-behavior: smooth;
          }
          .horizontal-slider-nav-overlay { pointer-events: none; }
          .horizontal-slider-nav-overlay .horizontal-slider-nav-row { pointer-events: auto; }
          .horizontal-slider-nav-overlay button { pointer-events: auto; }
          .horizontal-scroll::-webkit-scrollbar { display: none; }
          .horizontal-scroll > * { touch-action: auto; overscroll-behavior-y: auto; }
          @media (max-width: 768px) {
            .horizontal-scroll,
            .horizontal-slider,
            .explore-slider {
              transform: none !important;
              -webkit-transform: none !important;
            }
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
            scroll-snap-stop: always;
            padding: 12px 0;
          }
          .horizontal-slider-item {
            scroll-snap-align: start;
            scroll-snap-stop: always;
            opacity: 0.72;
            transform: scale(0.965);
            transition: transform 220ms ease, opacity 220ms ease, filter 220ms ease;
            filter: saturate(0.92);
          }
          .horizontal-slider-item.is-active {
            opacity: 1;
            transform: scale(1);
            filter: saturate(1);
          }
          .horizontal-slider-item,
          .horizontal-slider-item * {
            touch-action: pan-y;
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
            willChange: enableMouseDrag && isScrolling ? "transform" : "auto",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            perspective: "1000px",
            WebkitPerspective: "1000px"
          }}
        >
          {items?.map((it, idx) => (
            <div key={(it as any)?.id ?? idx} data-carousel-item className={`horizontal-slider-item${idx === activeIndex ? " is-active" : ""}`} style={{ minWidth: 0 }}>
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
            onClick={() => scrollByCard(-1)}
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
            onClick={() => scrollByCard(1)}
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
