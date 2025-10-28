import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useExploreFilters } from "../../state/exploreFilters";
import { useExploreQuery } from "../../hooks/useExploreQuery";
import EventCard from "../../components/explore/cards/EventCard";
import OrganizerCard from "../../components/explore/cards/OrganizerCard";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import AcademyCard from "../../components/explore/cards/AcademyCard";
import HorizontalSlider from "../../components/explore/HorizontalSlider";
import FilterBar from "../../components/FilterBar";
import BrandCard from "../../components/explore/cards/BrandCard";
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
  const { filters, set } = useExploreFilters();

  const { data: fechas, isLoading: fechasLoading } = useExploreQuery({ 
    type: 'fechas', 
    q: filters.q, 
    ritmos: filters.ritmos, 
    zonas: filters.zonas, 
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    pageSize: 6 
  });

  const { data: eventos, isLoading: eventosLoading } = useExploreQuery({ 
    type: 'eventos', 
    q: filters.q, 
    ritmos: filters.ritmos, 
    zonas: filters.zonas, 
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    pageSize: 6 
  });
  
  const { data: organizadores, isLoading: organizadoresLoading } = useExploreQuery({ 
    type: 'organizadores', 
    q: filters.q, 
    ritmos: filters.ritmos, 
    zonas: filters.zonas, 
    pageSize: 4 
  });
  
  const { data: maestros, isLoading: maestrosLoading } = useExploreQuery({
    type: 'maestros',
    q: filters.q,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 4
  });

  const { data: academias, isLoading: academiasLoading } = useExploreQuery({
    type: 'academias',
    q: filters.q,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 4
  });

  const { data: marcas, isLoading: marcasLoading } = useExploreQuery({
    type: 'marcas',
    q: filters.q,
    ritmos: filters.ritmos,
    zonas: filters.zonas,
    pageSize: 4
  });

  const handleFilterChange = (newFilters: typeof filters) => {
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

          <Section title="Fechas" toAll="/explore/list?type=fechas">
            {fechasLoading ? (
              <div className="grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : fechas && fechas.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={fechas.pages[0].data}
                renderItem={(fechaEvento: any, idx: number) => (
                  <motion.div key={fechaEvento.id ?? idx} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                    <EventCard item={fechaEvento} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>

          <Section title="Eventos" toAll="/explore/list?type=eventos">
            {eventosLoading ? (
              <div className="grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : eventos && eventos.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={eventos.pages[0].data}
                renderItem={(evento: any, idx: number) => (
                  <motion.div key={evento.id ?? idx} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                    <EventCard item={evento} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>

          <Section title="Sociales" toAll="/explore/list?type=sociales">
            {/* Usa el mismo hook pero con type 'sociales' */}
            {(() => {
              const { data, isLoading } = useExploreQuery({ type: 'sociales' as any, q: filters.q, ritmos: filters.ritmos, zonas: filters.zonas, pageSize: 8 });
              if (isLoading) return <div className="grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>;
              const list = data?.pages?.[0]?.data || [];
              return list.length ? (
                <HorizontalSlider
                  items={list}
                  renderItem={(social: any, idx: number) => (
                    <motion.div key={social.id ?? idx} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
                      {/* Reutilizar OrganizerCard a falta de SocialCard propia */}
                      <OrganizerCard item={{ id: social.organizer_id, nombre_publico: social.nombre, bio: social.descripcion }} />
                    </motion.div>
                  )}
                />
              ) : (<div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>);
            })()}
          </Section>

          <Section title="Academias" toAll="/explore/list?type=academias">
            {academiasLoading ? (
              <div className="grid">{[...Array(4)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : academias && academias.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={academias.pages[0].data}
                renderItem={(academia: any, idx: number) => (
                  <motion.div key={academia.id ?? idx} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                    <AcademyCard item={academia} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>

          <Section title="Organizadores" toAll="/explore/list?type=organizadores">
            {organizadoresLoading ? (
              <div className="grid">{[...Array(4)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : organizadores && organizadores.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={organizadores.pages[0].data}
                renderItem={(organizador: any, idx: number) => (
                  <motion.div key={organizador.id ?? idx} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                    <OrganizerCard item={organizador} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>

          <Section title="Maestros" toAll="/explore/list?type=maestros">
            {maestrosLoading ? (
              <div className="grid">{[...Array(4)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : maestros && maestros.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={maestros.pages[0].data}
                renderItem={(maestro: any, idx: number) => (
                  <motion.div key={maestro.id ?? idx} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                    <TeacherCard item={maestro} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>

          <Section title="Marcas" toAll="/explore/list?type=marcas">
            {marcasLoading ? (
              <div className="grid">{[...Array(4)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : marcas && marcas.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={marcas.pages[0].data}
                renderItem={(brand: any, idx: number) => (
                  <motion.div key={brand.id ?? idx} whileHover={{ y: -2, scale: 1.01 }} transition={{ duration: 0.15 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 }}>
                    <BrandCard item={brand} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
