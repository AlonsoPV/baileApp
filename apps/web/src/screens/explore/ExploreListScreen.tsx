import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useExploreFilters } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import FilterChips from "../../components/explore/FilterChips";
import InfiniteGrid from "../../components/explore/InfiniteGrid";
import EventCard from "../../components/explore/cards/EventCard";
import OrganizerCard from "../../components/explore/cards/OrganizerCard";
import TeacherCard from "../../components/explore/cards/TeacherCard";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

const typeLabels: Record<string, string> = {
  eventos: 'Eventos',
  organizadores: 'Organizadores',
  usuarios: 'Bailarines',
  maestros: 'Maestros',
  academias: 'Academias',
  marcas: 'Marcas',
};

const typeIcons: Record<string, string> = {
  eventos: '📅',
  organizadores: '🎤',
  usuarios: '💃',
  maestros: '🎓',
  academias: '🏫',
  marcas: '🏷️',
};

export default function ExploreListScreen() {
  const navigate = useNavigate();
  const { filters } = useExploreFilters();
  const query = useExploreQuery(filters);

  const totalCount = query.data?.pages[0]?.count || 0;

  const renderItem = (item: any, i: number) => {
    // Seleccionar card según tipo
    // Las cards ya tienen navegación integrada con LiveLink
    let CardComponent;
    let key;

    switch (filters.type) {
      case "eventos":
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
        CardComponent = TeacherCard; // reutilizar por ahora
        key = item.id ?? i;
        break;
      case "marcas":
        CardComponent = OrganizerCard; // reutilizar por ahora
        key = item.id ?? i;
        break;
      case "usuarios":
        CardComponent = TeacherCard; // reutilizar por ahora
        key = item.user_id ?? i;
        break;
      default:
        CardComponent = EventCard;
        key = item.id ?? i;
    }

    return <CardComponent key={key} item={item} />;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      paddingBottom: '2rem'
    }}>
      {/* Breadcrumbs */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: '🏠' },
            { label: 'Explorar', href: '/explore', icon: '🔍' },
            { label: typeLabels[filters.type] || 'Resultados', icon: typeIcons[filters.type] || '📋' },
          ]}
        />
      </div>

      {/* Header */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '0.5rem'
          }}>
            {typeIcons[filters.type]} {typeLabels[filters.type]}
          </h1>
          <p style={{
            fontSize: '0.875rem',
            opacity: 0.7
          }}>
            {query.isLoading ? 'Cargando...' : `${totalCount} resultados encontrados`}
          </p>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: '1.5rem' }}
        >
          <FilterChips />
        </motion.div>

        {/* Loading State */}
        {query.isLoading && (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 255, 255, 0.2)',
              borderTop: '3px solid #FF3D57',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <div>Cargando resultados...</div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Results Grid with Infinite Scroll */}
        {!query.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <InfiniteGrid
              query={query}
              renderItem={renderItem}
              emptyText="No se encontraron resultados. Intenta ajustar los filtros."
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
