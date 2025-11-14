import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useExploreFilters } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import EventCard from "../../components/explore/cards/EventCard";
import OrganizerCard from "../../components/explore/cards/OrganizerCard";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import FilterBar, { FilterState } from "../../components/FilterBar";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

function Section({ title, toAll, children }: { title: string; toAll: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{title}</h2>
        <Link
          to={toAll}
          style={{
            fontSize: '0.875rem',
            color: '#f093fb',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          Ver todo →
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function ExploreHomeScreen() {
  const navigate = useNavigate();
  const { set } = useExploreFilters();

  // Estado de filtros
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    perfiles: [],
    ritmos: [],
    zonas: [],
    fechaDesde: undefined,
    fechaHasta: undefined
  });

  // Determinar rango de fechas para eventos
  const getDateRange = () => {
    if (filters.fechaDesde || filters.fechaHasta) {
      return {
        dateFrom: filters.fechaDesde,
        dateTo: filters.fechaHasta
      };
    }
    // Por defecto: próximos 30 días
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    return {
      dateFrom: start.toISOString().slice(0, 10),
      dateTo: end.toISOString().slice(0, 10)
    };
  };

  const dateRange = getDateRange();

  // Próximos eventos (filtrados)
  const eventsQuery = useExploreQuery({
    type: "eventos",
    q: filters.search,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    pageSize: 6
  });

  // Organizadores destacados (filtrados)
  const orgQuery = useExploreQuery({
    type: "organizadores",
    q: filters.search,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 6
  });

  // Maestros recientes (filtrados)
  const teachQuery = useExploreQuery({
    type: "maestros",
    q: filters.search,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 6
  });

  // Determinar qué secciones mostrar según los filtros de perfil
  const showEvents = filters.perfiles.length === 0 || filters.perfiles.includes('eventos');
  const showOrganizers = filters.perfiles.length === 0 || filters.perfiles.includes('organizadores');
  const showTeachers = filters.perfiles.length === 0 || filters.perfiles.includes('maestros');

  const handleNavigateToAll = (type: string) => {
    set({ type: type as any });
    navigate('/explore/list');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light
    }}>
      {/* Barra de Filtros */}
      <FilterBar 
        filters={filters} 
        onFiltersChange={setFilters}
      />

      <div style={{ padding: '1.5rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🔍 Explora Dónde Bailar
            </h1>
            <p style={{
              fontSize: '1.125rem',
              opacity: 0.8,
              maxWidth: '42rem',
              margin: '0 auto'
            }}>
              Descubre eventos, organizadores, bailarines y más en tu comunidad
            </p>
          </motion.div>

        {/* Sección: Próximos Eventos */}
        {showEvents && (
          <Section title="📅 Próximos Eventos" toAll="/explore/list">
            {eventsQuery.isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                Cargando eventos...
              </div>
            ) : (eventsQuery.data?.pages?.[0]?.data || []).length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                opacity: 0.6,
                background: 'rgba(38, 38, 38, 0.6)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                No se encontraron eventos con estos filtros
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {(eventsQuery.data?.pages?.[0]?.data || []).map((e: any, i: number) => (
                  <EventCard key={e.id ?? i} item={e} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Sección: Organizadores Destacados */}
        {showOrganizers && (
          <Section title="🎤 Organizadores Destacados" toAll="/explore/list">
            {orgQuery.isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                Cargando organizadores...
              </div>
            ) : (orgQuery.data?.pages?.[0]?.data || []).length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                opacity: 0.6,
                background: 'rgba(38, 38, 38, 0.6)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                No se encontraron organizadores con estos filtros
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {(orgQuery.data?.pages?.[0]?.data || []).map((o: any, i: number) => (
                  <OrganizerCard key={o.id ?? i} item={o} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Sección: Nuevos Maestros */}
        {showTeachers && (
          <Section title="🎓 Nuevos Maestros" toAll="/explore/list">
            {teachQuery.isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                Cargando maestros...
              </div>
            ) : teachQuery.data?.pages?.[0]?.data?.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                opacity: 0.6,
                background: 'rgba(38, 38, 38, 0.6)',
                borderRadius: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                Próximamente: Perfiles de maestros
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {(teachQuery.data?.pages?.[0]?.data || []).map((t: any, i: number) => (
                  <TeacherCard key={t.id ?? i} item={t} />
                ))}
              </div>
            )}
          </Section>
        )}

        </div>
      </div>
    </div>
  );
}
