import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useExploreFilters } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import EventCard from "../../components/explore/cards/EventCard";
import OrganizerCard from "../../components/explore/cards/OrganizerCard";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import FilterBar, { FilterState } from "../../components/FilterBar";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";

function Section({ title, toAll, children }: { title: string; toAll: string; children: React.ReactNode }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ marginBottom: spacing[8] }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[4],
        padding: `0 ${spacing[2]}`
      }}>
        <h2 style={{ 
          fontSize: typography.fontSize['xl'], 
          fontWeight: typography.fontWeight.bold,
          color: colors.gray[50],
          margin: 0
        }}>
          {title}
        </h2>
        <Link
          to={toAll}
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.gray[200],
            textDecoration: 'none',
            fontWeight: typography.fontWeight.medium,
            padding: `${spacing[1]} ${spacing[3]}`,
            borderRadius: borderRadius.lg,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid rgba(255,255,255,0.08)`,
            transition: transitions.fast
          }}
        >
          Ver todo →
        </Link>
      </div>
      {children}
    </motion.section>
  );
}

export default function ExploreHomeScreen() {
  const navigate = useNavigate();
  const { set } = useExploreFilters();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    perfiles: ['eventos'],
    ritmos: [],
    zonas: []
  });

  const { data: eventos, isLoading: eventosLoading } = useExploreQuery({ type: 'eventos', q: filters.search, ritmos: filters.ritmos, zonas: filters.zonas, pageSize: 6 });
  const { data: organizadores, isLoading: organizadoresLoading } = useExploreQuery({ type: 'organizadores', q: filters.search, ritmos: filters.ritmos, zonas: filters.zonas, pageSize: 4 });
  const { data: maestros, isLoading: maestrosLoading } = useExploreQuery({ type: 'maestros', q: filters.search, ritmos: filters.ritmos, zonas: filters.zonas, pageSize: 4 });

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    set(newFilters);
  };

  return (
    <>
      <style>{`
        .explore-container { min-height: 100vh; background: #0b0d10; color: ${colors.gray[50]}; }
        .filters { padding: ${spacing[6]}; }
        .card-skeleton { height: 260px; border-radius: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: grid; place-items: center; color: ${colors.gray[400]}; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: ${spacing[5]}; }
        .wrap { max-width: 1280px; margin: 0 auto; padding: 0 ${spacing[6]} ${spacing[10]}; }
        .panel { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: ${spacing[5]}; }
      `}</style>

      <div className="explore-container">
        {/* Hero removido para una vista más directa al contenido */}

        <div className="wrap">
          <div className="panel" style={{ margin: `${spacing[6]} 0` }}>
            <FilterBar filters={filters} onFiltersChange={handleFilterChange} />
          </div>

          <Section title="Eventos" toAll="/explore/eventos">
            {eventosLoading ? (
              <div className="grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : eventos && eventos.pages?.[0]?.data?.length > 0 ? (
              <div className="grid">
                {eventos.pages[0].data.map((evento: any, idx: number) => (
                  <motion.div key={evento.id ?? idx} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                    <EventCard item={evento} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>

          <Section title="Organizadores" toAll="/explore/organizadores">
            {organizadoresLoading ? (
              <div className="grid">{[...Array(4)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : organizadores && organizadores.pages?.[0]?.data?.length > 0 ? (
              <div className="grid">
                {organizadores.pages[0].data.map((organizador: any, idx: number) => (
                  <motion.div key={organizador.id ?? idx} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                    <OrganizerCard item={organizador} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>

          <Section title="Maestros" toAll="/explore/maestros">
            {maestrosLoading ? (
              <div className="grid">{[...Array(4)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : maestros && maestros.pages?.[0]?.data?.length > 0 ? (
              <div className="grid">
                {maestros.pages[0].data.map((maestro: any, idx: number) => (
                  <motion.div key={maestro.id ?? idx} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                    <TeacherCard item={maestro} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
