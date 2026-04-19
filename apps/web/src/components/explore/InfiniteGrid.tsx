import React from "react";
import { UseInfiniteQueryResult } from "@tanstack/react-query";

type InfiniteData<T> = {
  pages: { data: T[]; count: number; nextPage?: number }[];
  pageParams: number[];
};

type Props<T> = {
  query: UseInfiniteQueryResult<InfiniteData<T>, Error>;
  renderItem: (item: T, i: number) => React.ReactNode;
  getItemKey?: (item: T, i: number) => React.Key;
  emptyText?: string;
  minColumnWidth?: number;
  estimatedItemHeight?: number;
  overscanRows?: number;
  virtualizationThreshold?: number;
};

const EMPTY_STATE_STYLE: React.CSSProperties = {
  padding: "3rem 1.5rem",
  textAlign: "center",
  opacity: 0.6,
};

const GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "1rem",
};

const LOADER_WRAPPER_STYLE: React.CSSProperties = {
  height: "3rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "1rem",
};

const LOADING_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  fontSize: "0.875rem",
  opacity: 0.7,
};

const SPINNER_STYLE: React.CSSProperties = {
  width: "16px",
  height: "16px",
  border: "2px solid rgba(255, 255, 255, 0.2)",
  borderTop: "2px solid #FF3D57",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

export default function InfiniteGrid<T>({
  query,
  renderItem,
  getItemKey,
  emptyText = "Sin resultados",
  minColumnWidth = 280,
  estimatedItemHeight = 420,
  overscanRows = 2,
  virtualizationThreshold = 24,
}: Props<T>) {
  const loader = React.useRef<HTMLDivElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const [viewportState, setViewportState] = React.useState(() => ({
    width: 0,
    viewportTop: 0,
    viewportHeight: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  const items = React.useMemo(
    () => (query.data?.pages || []).flatMap((p) => p.data),
    [query.data?.pages]
  );
  const hasMore = !!query.hasNextPage;
  const gapPx = 16;
  const shouldVirtualize = items.length >= virtualizationThreshold;

  const resolveItemKey = React.useCallback(
    (item: T, i: number) => {
      if (getItemKey) return getItemKey(item, i);
      if (item && typeof item === "object" && "id" in (item as object)) {
        const maybeId = (item as { id?: React.Key }).id;
        if (maybeId !== undefined && maybeId !== null && maybeId !== "") return maybeId;
      }
      return i;
    },
    [getItemKey]
  );

  React.useEffect(() => {
    if (!loader.current || !hasMore || query.isFetchingNextPage) return;

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        void query.fetchNextPage();
      }
    }, { rootMargin: "300px" });

    io.observe(loader.current);
    return () => io.disconnect();
  }, [hasMore, query.isFetchingNextPage, query.fetchNextPage]);

  React.useEffect(() => {
    if (!shouldVirtualize || typeof window === "undefined") return;

    const measure = () => {
      rafRef.current = null;
      const rect = gridRef.current?.getBoundingClientRect();
      const width = gridRef.current?.clientWidth ?? rect?.width ?? 0;
      const viewportTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      setViewportState((prev) => {
        if (
          prev.width === width &&
          prev.viewportTop === viewportTop &&
          prev.viewportHeight === viewportHeight
        ) {
          return prev;
        }
        return { width, viewportTop, viewportHeight };
      });
    };

    const scheduleMeasure = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    window.addEventListener("resize", scheduleMeasure, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && gridRef.current) {
      ro = new ResizeObserver(scheduleMeasure);
      ro.observe(gridRef.current);
    }

    return () => {
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      ro?.disconnect();
    };
  }, [shouldVirtualize]);

  const virtualWindow = React.useMemo(() => {
    if (!shouldVirtualize) {
      return {
        startIndex: 0,
        endIndex: items.length,
        padTop: 0,
        padBottom: 0,
      };
    }

    const width = viewportState.width || 1;
    const columnCount = Math.max(1, Math.floor((width + gapPx) / (minColumnWidth + gapPx)));
    const totalRows = Math.ceil(items.length / columnCount);
    const gridTop = (gridRef.current?.getBoundingClientRect().top ?? 0) + viewportState.viewportTop;
    const relativeTop = Math.max(0, viewportState.viewportTop - gridTop);
    const visibleStartRow = Math.max(0, Math.floor(relativeTop / estimatedItemHeight) - overscanRows);
    const visibleEndRow = Math.min(
      totalRows,
      Math.ceil((relativeTop + viewportState.viewportHeight) / estimatedItemHeight) + overscanRows
    );
    const startIndex = visibleStartRow * columnCount;
    const endIndex = Math.min(items.length, visibleEndRow * columnCount);
    const padTop = visibleStartRow * estimatedItemHeight;
    const padBottom = Math.max(0, (totalRows - visibleEndRow) * estimatedItemHeight);

    return { startIndex, endIndex, padTop, padBottom };
  }, [
    shouldVirtualize,
    viewportState.width,
    viewportState.viewportTop,
    viewportState.viewportHeight,
    items.length,
    minColumnWidth,
    estimatedItemHeight,
    overscanRows,
  ]);

  const visibleItems = React.useMemo(
    () => items.slice(virtualWindow.startIndex, virtualWindow.endIndex),
    [items, virtualWindow.startIndex, virtualWindow.endIndex]
  );

  if (!query.isLoading && items.length === 0) {
    return (
      <div style={EMPTY_STATE_STYLE}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <div style={{ fontSize: "0.875rem" }}>{emptyText}</div>
      </div>
    );
  }

  return (
    <>
      <div ref={gridRef} style={GRID_STYLE}>
        {shouldVirtualize && virtualWindow.padTop > 0 ? (
          <div style={{ gridColumn: "1 / -1", height: virtualWindow.padTop }} aria-hidden />
        ) : null}
        {visibleItems.map((it, i) => {
          const absoluteIndex = virtualWindow.startIndex + i;
          return (
          <div
            key={resolveItemKey(it, absoluteIndex)}
            style={{ contentVisibility: "auto", containIntrinsicSize: `${estimatedItemHeight}px` }}
          >
            {renderItem(it, absoluteIndex)}
          </div>
        )})}
        {shouldVirtualize && virtualWindow.padBottom > 0 ? (
          <div style={{ gridColumn: "1 / -1", height: virtualWindow.padBottom }} aria-hidden />
        ) : null}
      </div>

      <div
        ref={loader}
        style={LOADER_WRAPPER_STYLE}
      >
        {query.isFetchingNextPage && (
          <div style={LOADING_ROW_STYLE}>
            <div style={SPINNER_STYLE} />
            Cargando más…
          </div>
        )}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}

