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
          background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.9), rgba(245, 87, 108, 0.9))', 
          border: '2px solid rgba(255,255,255,0.3)',
          color: '#FFFFFF', 
          borderRadius: '50%', 
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          fontWeight: 'bold',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 6px 20px rgba(240, 147, 251, 0.4), 0 0 0 0 rgba(240, 147, 251, 0.2)',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240, 147, 251, 1), rgba(245, 87, 108, 1))';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(240, 147, 251, 0.6), 0 0 0 4px rgba(240, 147, 251, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240, 147, 251, 0.9), rgba(245, 87, 108, 0.9))';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 147, 251, 0.4), 0 0 0 0 rgba(240, 147, 251, 0.2)';
        }}
      >
        ‹
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
          background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.9), rgba(245, 87, 108, 0.9))', 
          border: '2px solid rgba(255,255,255,0.3)',
          color: '#FFFFFF', 
          borderRadius: '50%', 
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '20px',
          fontWeight: 'bold',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 6px 20px rgba(240, 147, 251, 0.4), 0 0 0 0 rgba(240, 147, 251, 0.2)',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240, 147, 251, 1), rgba(245, 87, 108, 1))';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
          e.currentTarget.style.boxShadow = '0 8px 28px rgba(240, 147, 251, 0.6), 0 0 0 4px rgba(240, 147, 251, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240, 147, 251, 0.9), rgba(245, 87, 108, 0.9))';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(240, 147, 251, 0.4), 0 0 0 0 rgba(240, 147, 251, 0.2)';
        }}
      >
        ›
      </button>

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 768px) {
          button[aria-label="Anterior"],
          button[aria-label="Siguiente"] {
            width: 40px !important;
            height: 40px !important;
            font-size: 18px !important;
            left: 4px !important;
          }
          button[aria-label="Siguiente"] {
            right: 4px !important;
            left: auto !important;
          }
        }
        @media (max-width: 480px) {
          button[aria-label="Anterior"],
          button[aria-label="Siguiente"] {
            width: 36px !important;
            height: 36px !important;
            font-size: 16px !important;
            left: 2px !important;
          }
          button[aria-label="Siguiente"] {
            right: 2px !important;
            left: auto !important;
          }
        }
      `}</style>
    </div>
  );
}


