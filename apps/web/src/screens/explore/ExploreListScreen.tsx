import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useExploreFilters } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import FilterChips from "../../components/explore/FilterChips";
import InfiniteGrid from "../../components/explore/InfiniteGrid";
import EventCard from "../../components/explore/cards/EventCard";
import OrganizerCard from "../../components/explore/cards/OrganizerCard";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import AcademyCard from "../../components/explore/cards/AcademyCard";
import BrandCard from "../../components/explore/cards/BrandCard";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";
import SeoHead from "@/components/SeoHead";

type InfiniteData<T> = { pages: { data: T[]; count: number; nextPage?: number }[]; pageParams: number[] };

const colors = {
  dark: '#0b0d10',
  panel: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  light: '#F5F5F5',
  gray300: '#D1D5DB',
};

const typeLabels: Record<string, string> = {
  fechas: 'Sociales',
  clases: 'Clases',
  academias: 'Academias',
  maestros: 'Maestros',
  usuarios: 'Con quien bailar',
  marcas: 'Marcas',
};

const typeIcons: Record<string, string> = {
  fechas: '📆',
  clases: '🎓',
  academias: '🏫',
  maestros: '🎓',
  usuarios: '🧍',
  marcas: '🏷️',
};

export default function ExploreListScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { filters, set } = useExploreFilters();
  const currentLabel = typeLabels[filters.type] || 'Resultados';
  const seoTitle = `${currentLabel} | Dónde Bailar`;
  const seoDescription = `Explora ${currentLabel.toLowerCase()} de baile con filtros por ritmos, zonas y fechas en Dónde Bailar.`;
  
  // Update filters based on URL parameters
  React.useEffect(() => {
    const type = searchParams.get('type');
    if (type && type !== filters.type) {
      set({ type: type as any });
    }
  }, [searchParams, filters.type, set]);
  
  const query = useExploreQuery(filters);
  const typedQuery = query as unknown as UseInfiniteQueryResult<InfiniteData<any>, Error>;

  const totalCount = query.data?.pages[0]?.count || 0;

  const renderItem = (item: any, i: number) => {
    let CardComponent;
    let key;

    switch (filters.type) {
      case "fechas":
        CardComponent = EventCard;
        key = item.id ?? i;
        break;
      case "organizadores":
        CardComponent = OrganizerCard;
        key = item.id ?? i;
        break;
      case "maestros":
        CardComponent = TeacherCard;
        key = item.id ?? i;
        break;
      case "academias":
        CardComponent = AcademyCard;
        key = item.id ?? i;
        break;
      case "marcas":
        CardComponent = BrandCard;
        key = item.id ?? i;
        break;
      case "sociales":
        CardComponent = OrganizerCard; // Reutilizar OrganizerCard para sociales
        key = item.id ?? i;
        break;
      case "usuarios":
        CardComponent = TeacherCard; // Reutilizar TeacherCard para usuarios
        key = item.user_id ?? i;
        break;
      default:
        CardComponent = EventCard;
        key = item.id ?? i;
    }

    return <CardComponent key={key} item={item} />;
  };

  return (
    <>
      <SeoHead section="explore-list" title={seoTitle} description={seoDescription} />
      <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      paddingBottom: '2rem'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: '🏠' },
            { label: 'Explorar', href: '/explore', icon: '🔍' },
            { label: typeLabels[filters.type] || 'Resultados', icon: typeIcons[filters.type] || '📋' },
          ]}
        />
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {typeIcons[filters.type]} {typeLabels[filters.type]}
          </h1>
          <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{query.isLoading ? 'Cargando...' : `${totalCount} resultados encontrados`}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: '1.5rem' }}>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 16, padding: '0.75rem 1rem' }}>
            <FilterChips />
          </div>
        </motion.div>

        {query.isLoading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: colors.gray300 }}>Cargando resultados…</div>
        )}

        {!query.isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <InfiniteGrid query={typedQuery} renderItem={renderItem} emptyText="No se encontraron resultados. Intenta ajustar los filtros." />
          </motion.div>
        )}
      </div>
      </div>
    </>
  );
}
