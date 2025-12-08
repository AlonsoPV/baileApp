import React from 'react';
import { CardSkeleton } from './CardSkeleton';

interface GridSkeletonProps {
  count?: number;
  columns?: number | { mobile?: number; tablet?: number; desktop?: number };
  className?: string;
  gap?: string;
}

/**
 * Skeleton para grids de tarjetas (eventos, clases, academias)
 * Responsive y mantiene el layout estable
 */
export function GridSkeleton({
  count = 6,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  className = '',
  gap = '1.5rem',
}: GridSkeletonProps) {
  const columnsValue = typeof columns === 'number' ? columns : columns.desktop || 3;
  const mobileColumns = typeof columns === 'number' ? 1 : columns.mobile || 1;
  const tabletColumns = typeof columns === 'number' ? 2 : columns.tablet || 2;

  return (
    <div
      className={`grid-skeleton ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnsValue}, 1fr)`,
        gap,
      }}
    >
      <style>{`
        .grid-skeleton {
          width: 100%;
        }
        
        @media (max-width: 768px) {
          .grid-skeleton {
            grid-template-columns: repeat(${tabletColumns}, 1fr) !important;
            gap: 1rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .grid-skeleton {
            grid-template-columns: repeat(${mobileColumns}, 1fr) !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
      <CardSkeleton count={count} />
    </div>
  );
}

export default GridSkeleton;

