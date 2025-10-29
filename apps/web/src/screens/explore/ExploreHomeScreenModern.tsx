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
import ClassCard from "../../components/explore/cards/ClassCard";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";

function Section({ title, toAll, children }: { title: string; toAll: string; children: React.ReactNode }) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="section-container"
      style={{ 
        marginBottom: '4rem',
        position: 'relative'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        padding: '0 0.5rem',
        position: 'relative'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          position: 'relative'
        }}>
          {/* Icono circular destacado */}
          <div style={{ 
            width: 56, 
            height: 56, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2))',
            border: '2px solid rgba(240, 147, 251, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: '0 4px 16px rgba(240, 147, 251, 0.25)',
            backdropFilter: 'blur(10px)'
          }}>
            {title.includes('Sociales') ? '📆' : 
             title.includes('Clases') ? '🎓' : 
             title.includes('Academias') ? '🏫' : 
             title.includes('Organizadores') ? '👤' : 
             title.includes('Maestros') ? '🎓' : 
             title.includes('Marcas') ? '🏷️' : '✨'}
          </div>
          <div>
            <h2 style={{ 
              fontSize: '1.875rem', 
              fontWeight: 800,
              margin: 0,
              marginBottom: '0.25rem',
              background: 'linear-gradient(135deg, #f093fb, #FFD166)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2
            }}>
              {title}
            </h2>
            <div style={{
              width: 60,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)',
              opacity: 0.8
            }} />
          </div>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

export default function ExploreHomeScreen() {
  const navigate = useNavigate();
  const { filters, set } = useExploreFilters();
  const selectedType = filters.type;

  const { data: fechas, isLoading: fechasLoading } = useExploreQuery({ 
    type: 'fechas', 
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

  // Construir clases desde academias y maestros (todas las páginas disponibles)
  const classesList = React.useMemo(() => {
    const dayNames = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const allA = (academias?.pages || []).flatMap(p => p?.data || []);
    const allM = (maestros?.pages || []).flatMap(p => p?.data || []);

    const mapClase = (owner: any, c: any, ownerType: 'academy'|'teacher') => ({
      titulo: c?.titulo,
      fecha: c?.fecha,
      diasSemana: c?.diasSemana || (typeof c?.diaSemana === 'number' ? [dayNames[c.diaSemana] || ''] : undefined),
      inicio: c?.inicio,
      fin: c?.fin,
      ubicacion: c?.ubicacion || owner?.ubicaciones?.[0]?.nombre || owner?.ciudad || owner?.direccion || '',
      ownerType,
      ownerId: owner?.id,
      ownerName: owner?.nombre_publico
    });

    const fromAcademies = allA.flatMap((ac: any) => (Array.isArray(ac?.cronograma) ? ac.cronograma.map((c: any) => mapClase(ac, c, 'academy')) : []));
    const fromTeachers = allM.flatMap((tc: any) => (Array.isArray(tc?.cronograma) ? tc.cronograma.map((c: any) => mapClase(tc, c, 'teacher')) : []));

    const merged = [...fromAcademies, ...fromTeachers].filter(x => x && (x.titulo || x.fecha || (x.diasSemana && x.diasSemana[0])));
    return merged.slice(0, 12);
  }, [academias, maestros]);

  const handleFilterChange = (newFilters: typeof filters) => {
    set(newFilters);
  };

  return (
    <>
      <style>{`
        .explore-container { min-height: 100vh; background: #0b0d10; color: ${colors.gray[50]}; }
        .filters { padding: ${spacing[6]}; }
        .card-skeleton { height: 260px; border-radius: 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: grid; place-items: center; color: ${colors.gray[400]}; }
        .cards-grid { 
          display: grid; 
          grid-template-columns: 1fr; 
          gap: 1.5rem;
          padding: 1rem 0;
        }
        @media (min-width: 768px) {
          .cards-grid { 
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
            padding: 1.5rem 0;
          }
        }
        .wrap { max-width: 1280px; margin: 0 auto; padding: 0 ${spacing[6]} ${spacing[10]}; }
        .section-container {
          margin-bottom: 4rem;
          position: relative;
        }
        @media (max-width: 768px) {
          .cards-grid {
            gap: 1.25rem !important;
            padding: 0.75rem 0 !important;
          }
          .wrap {
            padding: 0 1rem 2rem !important;
          }
          .section-container {
            margin-bottom: 2.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .cards-grid {
            gap: 1rem !important;
            padding: 0.5rem 0 !important;
          }
          .wrap {
            padding: 0 0.75rem 1.5rem !important;
          }
          .section-container h2 {
            font-size: 1.5rem !important;
          }
          .section-container > div > div:first-child > div:first-child {
            width: 48px !important;
            height: 48px !important;
            font-size: 1.25rem !important;
          }
        }
      `}</style>

      <div className="explore-container">
        {/* Hero removido para una vista más directa al contenido */}

        <div className="wrap">
          <FilterBar filters={filters} onFiltersChange={handleFilterChange} />

          {selectedType === 'fechas' && (
          <Section title="Próximos Sociales" toAll="/explore/list?type=fechas">
            {fechasLoading ? (
              <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : fechas && fechas.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={fechas.pages[0].data}
                renderItem={(fechaEvento: any, idx: number) => (
                  <motion.div 
                    key={fechaEvento.id ?? idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    whileHover={{ y: -4, scale: 1.02 }} 
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 16, 
                      padding: 0,
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <EventCard item={fechaEvento} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>
          )}

          <Section title="Encuentra tus clases" toAll="/explore/list?type=maestros">
            {(() => {
              const loading = academiasLoading || maestrosLoading;
              if (loading) return <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>;
              if (!classesList.length) return <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Aún no hay clases</div>;
              return (
                <HorizontalSlider
                  items={classesList}
                  renderItem={(clase: any, idx: number) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      whileHover={{ y: -4, scale: 1.02 }} 
                      style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        borderRadius: 16, 
                        padding: 0,
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <ClassCard item={clase} />
                    </motion.div>
                  )}
                />
              );
            })()}
          </Section>

       

          {selectedType === 'sociales' && (
          <Section title="Sociales" toAll="/explore/list?type=sociales">
            {/* Usa el mismo hook pero con type 'sociales' */}
            {(() => {
              const { data, isLoading } = useExploreQuery({ type: 'sociales' as any, q: filters.q, ritmos: filters.ritmos, zonas: filters.zonas, pageSize: 8 });
              if (isLoading) return <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>;
              const list = data?.pages?.[0]?.data || [];
              return list.length ? (
                <HorizontalSlider
                  items={list}
                  renderItem={(social: any, idx: number) => (
                    <motion.div 
                      key={social.id ?? idx} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      whileHover={{ y: -4, scale: 1.02 }} 
                      style={{ 
                        background: 'rgba(255,255,255,0.04)', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        borderRadius: 16, 
                        padding: 0,
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <OrganizerCard item={{ id: social.organizer_id, nombre_publico: social.nombre, bio: social.descripcion }} />
                    </motion.div>
                  )}
                />
              ) : (<div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>);
            })()}
          </Section>
          )}

          {selectedType === 'academias' && (
          <Section title="Academias" toAll="/explore/list?type=academias">
            {academiasLoading ? (
              <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : academias && academias.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={academias.pages[0].data}
                renderItem={(academia: any, idx: number) => (
                  <motion.div 
                    key={academia.id ?? idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    whileHover={{ y: -4, scale: 1.02 }} 
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 16, 
                      padding: 0,
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <AcademyCard item={academia} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>
          )}

          {selectedType === 'organizadores' && (
          <Section title="Organizadores" toAll="/explore/list?type=organizadores">
            {organizadoresLoading ? (
              <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : organizadores && organizadores.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={organizadores.pages[0].data}
                renderItem={(organizador: any, idx: number) => (
                  <motion.div 
                    key={organizador.id ?? idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    whileHover={{ y: -4, scale: 1.02 }} 
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 16, 
                      padding: 0,
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <OrganizerCard item={organizador} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>
          )}

          {selectedType === 'maestros' && (
          <Section title="Maestros" toAll="/explore/list?type=maestros">
            {maestrosLoading ? (
              <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : maestros && maestros.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={maestros.pages[0].data}
                renderItem={(maestro: any, idx: number) => (
                  <motion.div 
                    key={maestro.id ?? idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    whileHover={{ y: -4, scale: 1.02 }} 
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 16, 
                      padding: 0,
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <TeacherCard item={maestro} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>
          )}

          {selectedType === 'marcas' && (
          <Section title="Marcas" toAll="/explore/list?type=marcas">
            {marcasLoading ? (
              <div className="cards-grid">{[...Array(6)].map((_, i) => <div key={i} className="card-skeleton">Cargando…</div>)}</div>
            ) : marcas && marcas.pages?.[0]?.data?.length > 0 ? (
              <HorizontalSlider
                items={marcas.pages[0].data}
                renderItem={(brand: any, idx: number) => (
                  <motion.div 
                    key={brand.id ?? idx} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    whileHover={{ y: -4, scale: 1.02 }} 
                    style={{ 
                      background: 'rgba(255,255,255,0.04)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 16, 
                      padding: 0,
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <BrandCard item={brand} />
                  </motion.div>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: spacing[10], color: colors.gray[300] }}>Sin resultados</div>
            )}
          </Section>
          )}
        </div>
      </div>
    </>
  );
}
