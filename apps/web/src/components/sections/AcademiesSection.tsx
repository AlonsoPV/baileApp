import React from 'react';
import { useExploreQuery } from '../../hooks/useExploreQuery';
import { GridSkeleton } from '../skeletons/GridSkeleton';
import AcademyCard from '../explore/cards/AcademyCard';
import HorizontalSlider from '../explore/HorizontalSlider';
import type { ExploreFilters } from '../../state/exploreFilters';
import { useSmartLoading } from '../../hooks/useSmartLoading';
import { RefreshingIndicator } from '../loading/RefreshingIndicator';

interface AcademiesSectionProps {
  filters: ExploreFilters;
  q?: string;
  enabled?: boolean;
  renderAs?: 'grid' | 'slider';
  maxItems?: number;
}

/**
 * Componente wrapper para sección de academias con loading inteligente
 */
function AcademiesSectionContent({ filters, q, enabled = true, renderAs = 'slider', maxItems }: AcademiesSectionProps) {
  const academiasQuery = useExploreQuery({
    type: 'academias',
    q: q || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: maxItems || 12,
    enabled,
  });

  const { isFirstLoad, isRefetching } = useSmartLoading({
    data: academiasQuery.data,
    isLoading: academiasQuery.isLoading,
    isFetching: academiasQuery.isFetching,
    error: academiasQuery.error,
  } as any);

  // ✅ TODOS LOS HOOKS DEBEN IR ANTES DE CUALQUIER EARLY RETURN
  const academiasData = React.useMemo(() => {
    if (!academiasQuery.data?.pages) return [];
    return academiasQuery.data.pages.flatMap(page => page.data || []);
  }, [academiasQuery.data]);

  const itemsToShow = React.useMemo(() => {
    return maxItems ? academiasData.slice(0, maxItems) : academiasData;
  }, [academiasData, maxItems]);

  // First load: mostrar skeleton (DESPUÉS de todos los hooks)
  if (isFirstLoad) {
    return <GridSkeleton count={6} columns={{ mobile: 1, tablet: 2, desktop: 3 }} />;
  }

  if (academiasData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏫</div>
        <div style={{ fontSize: '0.9rem' }}>No hay academias disponibles</div>
      </div>
    );
  }

  if (renderAs === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {itemsToShow.map((academia: any, idx: number) => (
          <div key={academia.id || idx}>
            <AcademyCard item={academia} priority={idx === 0} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <RefreshingIndicator isFetching={isRefetching} />
      <HorizontalSlider
        items={itemsToShow}
        renderItem={(item: any, idx: number) => (
          <div key={item.id || idx}>
            <AcademyCard item={item} priority={idx === 0} />
          </div>
        )}
      />
    </>
  );
}

/**
 * Componente wrapper - usa loading inteligente
 */
export function AcademiesSection(props: AcademiesSectionProps) {
  if (!props.enabled) {
    return null;
  }

  return <AcademiesSectionContent {...props} />;
}

export default AcademiesSection;

