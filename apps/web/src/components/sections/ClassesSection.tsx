import React from 'react';
import { useExploreQuery } from '../../hooks/useExploreQuery';
import { GridSkeleton } from '../skeletons/GridSkeleton';
import ClassCard from '../explore/cards/ClassCard';
import HorizontalSlider from '../explore/HorizontalSlider';
import { motion } from 'framer-motion';
import type { ExploreFilters } from '../../state/exploreFilters';
import { useSmartLoading } from '../../hooks/useSmartLoading';
import { RefreshingIndicator } from '../loading/RefreshingIndicator';

interface ClassesSectionProps {
  filters: ExploreFilters;
  q?: string;
  enabled?: boolean;
  renderAs?: 'grid' | 'slider';
  maxItems?: number;
}

/**
 * Componente wrapper para sección de clases
 * Nota: Las clases se obtienen de academias y maestros
 */
function ClassesSectionContent({ filters, q, enabled = true, renderAs = 'slider', maxItems }: ClassesSectionProps) {
  // Obtener academias y maestros para construir clases
  const academiasQuery = useExploreQuery({
    type: 'academias',
    q: q || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: maxItems || 12,
    enabled,
  });

  const maestrosQuery = useExploreQuery({
    type: 'maestros',
    q: q || undefined,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: maxItems || 12,
    enabled,
  });

  const { isFirstLoad: academiasFirstLoad, isRefetching: academiasRefetching } = useSmartLoading({
    data: academiasQuery.data,
    isLoading: academiasQuery.isLoading,
    isFetching: academiasQuery.isFetching,
    error: academiasQuery.error,
  } as any);

  const { isFirstLoad: maestrosFirstLoad, isRefetching: maestrosRefetching } = useSmartLoading({
    data: maestrosQuery.data,
    isLoading: maestrosQuery.isLoading,
    isFetching: maestrosQuery.isFetching,
    error: maestrosQuery.error,
  } as any);

  // ✅ TODOS LOS HOOKS DEBEN IR ANTES DE CUALQUIER EARLY RETURN
  const academiasData = React.useMemo(() => {
    if (!academiasQuery.data?.pages) return [];
    return academiasQuery.data.pages.flatMap(page => page.data || []);
  }, [academiasQuery.data]);

  const maestrosData = React.useMemo(() => {
    if (!maestrosQuery.data?.pages) return [];
    return maestrosQuery.data.pages.flatMap(page => page.data || []);
  }, [maestrosQuery.data]);

  // Construir lista de clases desde academias y maestros
  // Esto es una simplificación - en producción deberías tener un endpoint específico para clases
  const classesList = React.useMemo(() => {
    const classes: any[] = [];
    
    // Agregar clases de academias (si tienen clases)
    academiasData.forEach((academia: any) => {
      if (academia.clases && Array.isArray(academia.clases)) {
        academia.clases.forEach((clase: any) => {
          classes.push({
            ...clase,
            ownerType: 'academy',
            ownerId: academia.id,
            ownerName: academia.nombre_publico || academia.nombre,
          });
        });
      }
    });

    // Agregar clases de maestros (si tienen clases)
    maestrosData.forEach((maestro: any) => {
      if (maestro.clases && Array.isArray(maestro.clases)) {
        maestro.clases.forEach((clase: any) => {
          classes.push({
            ...clase,
            ownerType: 'teacher',
            ownerId: maestro.id,
            ownerName: maestro.nombre_publico || maestro.nombre,
          });
        });
      }
    });

    return classes;
  }, [academiasData, maestrosData]);

  const itemsToShow = React.useMemo(() => {
    return maxItems ? classesList.slice(0, maxItems) : classesList;
  }, [classesList, maxItems]);

  // First load: mostrar skeleton (DESPUÉS de todos los hooks)
  if (academiasFirstLoad || maestrosFirstLoad) {
    return <GridSkeleton count={6} columns={{ mobile: 1, tablet: 2, desktop: 3 }} />;
  }

  if (classesList.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.6 }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📚</div>
        <div style={{ fontSize: '0.9rem' }}>No hay clases disponibles</div>
      </div>
    );
  }

  if (renderAs === 'grid') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {itemsToShow.map((clase: any, idx: number) => (
          <motion.div
            key={`${clase.ownerType}-${clase.ownerId}-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <ClassCard item={clase} priority={idx === 0} />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <>
      <RefreshingIndicator isFetching={academiasRefetching || maestrosRefetching} />
      <HorizontalSlider
        items={itemsToShow}
        renderItem={(item: any, idx: number) => (
          <motion.div
            key={`${item.ownerType}-${item.ownerId}-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <ClassCard item={item} priority={idx === 0} />
          </motion.div>
        )}
      />
    </>
  );
}

/**
 * Componente wrapper - usa loading inteligente
 */
export function ClassesSection(props: ClassesSectionProps) {
  if (!props.enabled) {
    return null;
  }

  return <ClassesSectionContent {...props} />;
}

export default ClassesSection;

