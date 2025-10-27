import React from "react";
import { UseInfiniteQueryResult } from "@tanstack/react-query";

type InfiniteData<T> = {
  pages: { data: T[]; count: number; nextPage?: number }[];
  pageParams: number[];
};

type Props<T> = {
  query: UseInfiniteQueryResult<InfiniteData<T>, Error>;
  renderItem: (item: T, i: number) => React.ReactNode;
  emptyText?: string;
};

export default function InfiniteGrid<T>({ query, renderItem, emptyText = "Sin resultados" }: Props<T>) {
  const loader = React.useRef<HTMLDivElement | null>(null);

  const items = (query.data?.pages || []).flatMap(p => p.data);
  const hasMore = !!(query.hasNextPage);

  React.useEffect(() => {
    if (!loader.current || !hasMore || query.isFetchingNextPage) return;
    
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        console.log('[InfiniteGrid] Loading more items...');
        query.fetchNextPage();
      }
    }, { rootMargin: "300px" });
    
    io.observe(loader.current);
    return () => io.disconnect();
  }, [hasMore, query.isFetchingNextPage]);

  if (!query.isLoading && items.length === 0) {
    return (
      <div style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        opacity: 0.6
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <div style={{ fontSize: '0.875rem' }}>{emptyText}</div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem'
      }}>
        {items.map((it, i) => (
          <div key={i}>
            {renderItem(it, i)}
          </div>
        ))}
      </div>
      
      <div
        ref={loader}
        style={{
          height: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '1rem'
        }}
      >
        {query.isFetchingNextPage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            opacity: 0.7
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderTop: '2px solid #FF3D57',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
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

