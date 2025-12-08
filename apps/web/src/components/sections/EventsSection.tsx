import React, { Suspense } from 'react';
import { useExploreQuery } from '../../hooks/useExploreQuery';
import { GridSkeleton } from '../skeletons/GridSkeleton';
import EventCard from '../explore/cards/EventCard';
import HorizontalSlider from '../explore/HorizontalSlider';
import { motion } from 'framer-motion';
import type { ExploreFilters } from '../../state/exploreFilters';
import { useSmartLoading } from '../../hooks/useSmartLoading';
import { RefreshingIndicator } from '../loading/RefreshingIndicator';

interface EventsSectionProps {
  filters: ExploreFilters;
  q?: string;
  enabled?: boolean;
  renderAs?: 'grid' | 'slider';
  maxItems?: number;
}

/**
 * Componente wrapper para sección de eventos con Suspense
 * Usa React Query con loading inteligente (skeleton en first load, indicador en refetch)
 */
function EventsSectionContent({ filters, q, enabled = true, renderAs = 'slider', maxItems }: EventsSectionProps) {
  const fechasQuery = useExploreQuery({
    type: 'fechas',
    q: q || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    pageSize: maxItems || 12,
    enabled,
  });

  const { isFirstLoad, isRefetching } = useSmartLoading({
    data: fechasQuery.data,
    isLoading: fechasQuery.isLoading,
    isFetching: fechasQuery.isFetching,
    error: fechasQuery.error,
  } as any);

  // ✅ TODOS LOS HOOKS DEBEN IR ANTES DE CUALQUIER EARLY RETURN
  const fechasData = React.useMemo(() => {
    if (!fechasQuery.data?.pages) return [];
    return fechasQuery.data.pages.flatMap(page => page.data || []);
  }, [fechasQuery.data]);

  const itemsToShow = React.useMemo(() => {
    return maxItems ? fechasData.slice(0, maxItems) : fechasData;
  }, [fechasData, maxItems]);

  // First load: mostrar skeleton (DESPUÉS de todos los hooks)
  if (isFirstLoad) {
    return <GridSkeleton count={6} columns={{ mobile: 1, tablet: 2, desktop: 3 }} />;
  }

  if (fechasData.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
        <div style={{ fontSize: '0.9rem' }}>No hay eventos disponibles</div>
      </div>
    );
  }

  if (renderAs === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {itemsToShow.map((fecha: any, idx: number) => (
          <motion.div
            key={fecha.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <EventCard item={fecha} />
          </motion.div>
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
          <motion.div
            key={item.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <EventCard item={item} />
          </motion.div>
        )}
      />
    </>
  );
}

/**
 * Componente wrapper - usa loading inteligente en lugar de Suspense
 * (useInfiniteQuery no soporta Suspense directamente)
 */
export function EventsSection(props: EventsSectionProps) {
  if (!props.enabled) {
    return null;
  }

  // Para infinite queries, usamos loading inteligente en lugar de Suspense
  return <EventsSectionContent {...props} />;
}

export default EventsSection;

