import React from 'react';

interface CardSkeletonProps {
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Skeleton para tarjetas de eventos/clases/academias
 * Mantiene el layout estable mientras carga
 */
export function CardSkeleton({ count = 1, className = '', style }: CardSkeletonProps) {
  if (count === 1) {
    return (
      <div
        className={`card-skeleton ${className}`}
        style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          minHeight: '200px',
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
      >
        {/* Efecto de shimmer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        
        {/* Contenido del skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          {/* Imagen placeholder */}
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}
          />
          
          {/* Título */}
          <div
            style={{
              height: '20px',
              width: '70%',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          />
          
          {/* Subtítulo */}
          <div
            style={{
              height: '16px',
              width: '50%',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.06)',
            }}
          />
          
          {/* Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <div
              style={{
                height: '24px',
                width: '60px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
              }}
            />
            <div
              style={{
                height: '24px',
                width: '80px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
              }}
            />
          </div>
        </div>
        
        <style>{`
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <CardSkeleton key={i} count={1} className={className} style={style} />
      ))}
    </>
  );
}

export default CardSkeleton;

