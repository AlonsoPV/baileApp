import React from "react";

type Props<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyText?: string;
};

export default function HorizontalSlider<T>({ items, renderItem, emptyText = "Sin resultados" }: Props<T>) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const scrollBy = (delta: number) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>{emptyText}</div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        aria-label="Anterior"
        onClick={() => scrollBy(-400)}
        style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 2, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#F5F5F5', borderRadius: 12, padding: '8px 10px', cursor: 'pointer'
        }}
      >
        ←
      </button>

      <div
        ref={ref}
        style={{
          display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'minmax(280px, 1fr)', gap: '12px',
          overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '2px 40px', scrollbarWidth: 'none'
        }}
      >
        {items.map((it, i) => (
          <div key={i} style={{ scrollSnapAlign: 'start' }}>
            {renderItem(it, i)}
          </div>
        ))}
      </div>

      <button
        aria-label="Siguiente"
        onClick={() => scrollBy(400)}
        style={{
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 2, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#F5F5F5', borderRadius: 12, padding: '8px 10px', cursor: 'pointer'
        }}
      >
        →
      </button>
    </div>
  );
}


