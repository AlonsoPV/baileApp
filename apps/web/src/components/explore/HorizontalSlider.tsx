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
    <div style={{ position: 'relative', overflow: 'hidden' }} className="slider-container">
      {/* Left Arrow */}
      <button
        aria-label="Anterior"
        onClick={() => scrollBy(-320)}
        className="slider-nav-btn slider-nav-left"
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
        className="slider-scroll-container"
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
            className="slider-item"
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
        className="slider-nav-btn slider-nav-right"
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
        .slider-container {
          overflow: hidden;
          width: 100%;
        }
        .slider-scroll-container::-webkit-scrollbar {
          display: none;
        }
        /* Desktop: Mostrar 3 tarjetas completas + inicio de la siguiente (≈100px visible de la 4ta) */
        .slider-container {
          max-width: calc(280px * 3 + 16px * 2 + 100px);
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          /* Tablet: Mostrar 2 tarjetas completas + inicio de la siguiente */
          .slider-container {
            max-width: calc(280px * 2 + 16px * 1 + 80px);
          }
          .slider-nav-btn {
            width: 40px !important;
            height: 40px !important;
            font-size: 18px !important;
          }
          .slider-nav-left {
            left: 4px !important;
          }
          .slider-nav-right {
            right: 4px !important;
          }
          .slider-scroll-container {
            padding: 8px 44px !important;
          }
        }
        @media (max-width: 480px) {
          /* Mobile: Mostrar 1 tarjeta completa + inicio de la siguiente (≈60px visible de la 2da) */
          .slider-container {
            max-width: calc(280px * 1 + 60px);
          }
          .slider-nav-btn {
            width: 36px !important;
            height: 36px !important;
            font-size: 16px !important;
          }
          .slider-nav-left {
            left: 2px !important;
          }
          .slider-nav-right {
            right: 2px !important;
          }
          .slider-scroll-container {
            padding: 8px 40px !important;
          }
        }
      `}</style>
    </div>
  );
}


