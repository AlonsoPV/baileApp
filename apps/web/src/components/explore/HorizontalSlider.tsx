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
      {/* Left Arrow */}
      <button
        aria-label="Anterior"
        onClick={() => scrollBy(-320)}
        style={{
          position: 'absolute', 
          left: -8, 
          top: '50%', 
          transform: 'translateY(-50%)',
          zIndex: 10, 
          background: 'rgba(0,0,0,0.8)', 
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#F5F5F5', 
          borderRadius: '50%', 
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '18px',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.9)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
      >
        ←
      </button>

      {/* Scrollable Container */}
      <div
        ref={ref}
        style={{
          display: 'flex',
          gap: '16px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          padding: '8px 48px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {items.map((it, i) => (
          <div 
            key={i} 
            style={{ 
              scrollSnapAlign: 'start',
              flexShrink: 0,
              width: '280px'
            }}
          >
            {renderItem(it, i)}
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        aria-label="Siguiente"
        onClick={() => scrollBy(320)}
        style={{
          position: 'absolute', 
          right: -8, 
          top: '50%', 
          transform: 'translateY(-50%)',
          zIndex: 10, 
          background: 'rgba(0,0,0,0.8)', 
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#F5F5F5', 
          borderRadius: '50%', 
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '18px',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.9)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
      >
        →
      </button>

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}


