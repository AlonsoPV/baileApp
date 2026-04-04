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
}: Props<T>) {
  const loader = React.useRef<HTMLDivElement | null>(null);

  const items = React.useMemo(
    () => (query.data?.pages || []).flatMap((p) => p.data),
    [query.data?.pages]
  );
  const hasMore = !!query.hasNextPage;

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
      <div style={GRID_STYLE}>
        {items.map((it, i) => (
          <div key={resolveItemKey(it, i)}>
            {renderItem(it, i)}
          </div>
        ))}
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

