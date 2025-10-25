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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ marginBottom: spacing[8] }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[6],
        padding: `0 ${spacing[4]}`
      }}>
        <h2 style={{ 
          fontSize: typography.fontSize['2xl'], 
          fontWeight: typography.fontWeight.bold,
          color: colors.gray[50],
          margin: 0
        }}>
          {title}
        </h2>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to={toAll}
            style={{
              fontSize: typography.fontSize.base,
              color: colors.primary[500],
              textDecoration: 'none',
              fontWeight: typography.fontWeight.semibold,
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: borderRadius.lg,
              background: colors.glass.light,
              border: `1px solid ${colors.glass.medium}`,
              transition: transitions.normal,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[1]
            }}
          >
            Ver todo →
          </Link>
        </motion.div>
      </div>
      {children}
    </motion.section>
  );
}

export default function ExploreHomeScreen() {
  const navigate = useNavigate();
  const { set } = useExploreFilters();

  // Estados para los filtros
  const [filters, setFilters] = useState<FilterState>({
    tipo: 'eventos',
    ritmo: null,
    zona: null,
    fecha: null,
    precio: null,
    nivel: null
  });

  // Queries para obtener datos
  const { data: eventos, isLoading: eventosLoading } = useExploreQuery('eventos', {
    limit: 6,
    ...(filters.ritmo && { ritmo: filters.ritmo }),
    ...(filters.zona && { zona: filters.zona }),
    ...(filters.fecha && { fecha: filters.fecha }),
    ...(filters.precio && { precio: filters.precio }),
    ...(filters.nivel && { nivel: filters.nivel })
  });

  const { data: organizadores, isLoading: organizadoresLoading } = useExploreQuery('organizadores', {
    limit: 4,
    ...(filters.ritmo && { ritmo: filters.ritmo }),
    ...(filters.zona && { zona: filters.zona })
  });

  const { data: maestros, isLoading: maestrosLoading } = useExploreQuery('maestros', {
    limit: 4,
    ...(filters.ritmo && { ritmo: filters.ritmo }),
    ...(filters.zona && { zona: filters.zona })
  });

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    set(newFilters);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: ${typography.fontFamily.primary};
        }
        
        .explore-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, ${colors.dark[500]} 0%, ${colors.dark[400]} 100%);
        }
        
        .explore-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, ${colors.primary[500]}20 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${colors.secondary[500]}20 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, ${colors.accent[500]}10 0%, transparent 50%);
          animation: float 6s ease-in-out infinite;
        }
        
        .glass-card {
          background: ${colors.glass.light};
          backdrop-filter: blur(20px);
          border: 1px solid ${colors.glass.medium};
          box-shadow: ${colors.shadows.glass};
        }
        
        .gradient-text {
          background: ${colors.gradients.primary};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .floating-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .shimmer-effect {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        .explore-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: ${spacing[6]};
          padding: 0 ${spacing[4]};
        }
        
        .explore-grid-large {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: ${spacing[6]};
          padding: 0 ${spacing[4]};
        }
        
        @media (max-width: 768px) {
          .explore-grid {
            grid-template-columns: 1fr;
            gap: ${spacing[4]};
          }
          
          .explore-grid-large {
            grid-template-columns: 1fr;
            gap: ${spacing[4]};
          }
        }
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        color: colors.gray[50],
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Elementos flotantes de fondo */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '100px',
          height: '100px',
          background: colors.gradients.primary,
          borderRadius: '50%',
          opacity: 0.1,
          animation: 'float 8s ease-in-out infinite',
          zIndex: 0
        }} />
        
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '60px',
          height: '60px',
          background: colors.gradients.secondary,
          borderRadius: '50%',
          opacity: 0.15,
          animation: 'float 6s ease-in-out infinite reverse',
          zIndex: 0
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: '80px',
          height: '80px',
          background: colors.gradients.deep,
          borderRadius: '50%',
          opacity: 0.1,
          animation: 'float 7s ease-in-out infinite',
          zIndex: 0
        }} />

        {/* Hero Section */}
        <motion.div
          className="explore-hero"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            padding: spacing[16],
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Floating Elements */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '60px',
            height: '60px',
            background: colors.gradients.primary,
            borderRadius: '50%',
            animation: 'float 4s ease-in-out infinite',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${colors.glass.medium}`
          }} />
          
          <div style={{
            position: 'absolute',
            top: '30%',
            right: '15%',
            width: '40px',
            height: '40px',
            background: colors.gradients.secondary,
            borderRadius: '50%',
            animation: 'float 3s ease-in-out infinite reverse',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${colors.glass.medium}`
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '20%',
            width: '80px',
            height: '80px',
            background: colors.gradients.accent,
            borderRadius: '50%',
            animation: 'float 5s ease-in-out infinite',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${colors.glass.medium}`
          }} />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{ position: 'relative', zIndex: 2 }}
          >
            <h1 style={{
              fontSize: typography.fontSize['6xl'],
              fontWeight: typography.fontWeight.black,
              background: colors.gradients.primary,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: spacing[6],
              textShadow: `0 4px 20px ${colors.primary[500]}40`,
              letterSpacing: '-0.02em'
            }}>
              Explora el Baile
            </h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{
                fontSize: typography.fontSize.xl,
                opacity: 0.9,
                maxWidth: '700px',
                margin: `0 auto ${spacing[10]}`,
                lineHeight: typography.lineHeight.relaxed,
                fontWeight: typography.fontWeight.medium,
                color: colors.gray[100]
              }}
            >
              Descubre eventos, organizadores y maestros en tu ciudad. 
              Conecta con la comunidad de baile y vive la pasión del ritmo.
            </motion.p>

            {/* Botones de acción */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              style={{
                display: 'flex',
                gap: spacing[4],
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/explore/eventos')}
                style={{
                  padding: `${spacing[4]} ${spacing[8]}`,
                  borderRadius: borderRadius.full,
                  border: 'none',
                  background: colors.gradients.primary,
                  color: colors.gray[50],
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  cursor: 'pointer',
                  boxShadow: colors.shadows.glow,
                  transition: transitions.normal,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2]
                }}
              >
                🎭 Ver Eventos
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/explore/organizadores')}
                style={{
                  padding: `${spacing[4]} ${spacing[8]}`,
                  borderRadius: borderRadius.full,
                  border: 'none',
                  background: colors.gradients.secondary,
                  color: colors.gray[50],
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  cursor: 'pointer',
                  boxShadow: colors.shadows.glow,
                  transition: transitions.normal,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2]
                }}
              >
                🎤 Organizadores
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/explore/maestros')}
                style={{
                  padding: `${spacing[4]} ${spacing[8]}`,
                  borderRadius: borderRadius.full,
                  border: 'none',
                  background: colors.gradients.deep,
                  color: colors.gray[50],
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  cursor: 'pointer',
                  boxShadow: colors.shadows.glow,
                  transition: transitions.normal,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2]
                }}
              >
                👨‍🏫 Maestros
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: `0 ${spacing[8]} ${spacing[8]}`,
            position: 'relative',
            zIndex: 1
          }}
        >
          <div className="glass-card" style={{
            padding: spacing[6],
            borderRadius: borderRadius['2xl']
          }}>
            <FilterBar
              filters={filters}
              onFiltersChange={handleFilterChange}
            />
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: `0 ${spacing[8]} ${spacing[8]}`,
          position: 'relative',
          zIndex: 1
        }}>
          {/* Eventos Destacados */}
          <Section title="🎭 Eventos Destacados" toAll="/explore/eventos">
            {eventosLoading ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: spacing[6],
                padding: `0 ${spacing[4]}`
              }}>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card"
                    style={{
                      height: '300px',
                      borderRadius: borderRadius.xl,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.gray[300]
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[2] }}>⏳</div>
                      <p>Cargando...</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : eventos && eventos.length > 0 ? (
              <div className="explore-grid">
                {eventos.map((evento: any, index: number) => (
                  <motion.div
                    key={evento.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <EventCard evento={evento} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: spacing[12],
                color: colors.gray[300]
              }}>
                <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>🎭</div>
                <h3 style={{ fontSize: typography.fontSize.xl, marginBottom: spacing[2] }}>
                  No hay eventos disponibles
                </h3>
                <p>Intenta ajustar los filtros para encontrar más eventos</p>
              </div>
            )}
          </Section>

          {/* Organizadores Destacados */}
          <Section title="🎤 Organizadores Destacados" toAll="/explore/organizadores">
            {organizadoresLoading ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: spacing[6],
                padding: `0 ${spacing[4]}`
              }}>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card"
                    style={{
                      height: '250px',
                      borderRadius: borderRadius.xl,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.gray[300]
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[2] }}>⏳</div>
                      <p>Cargando...</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : organizadores && organizadores.length > 0 ? (
              <div className="explore-grid">
                {organizadores.map((organizador: any, index: number) => (
                  <motion.div
                    key={organizador.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <OrganizerCard organizador={organizador} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: spacing[12],
                color: colors.gray[300]
              }}>
                <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>🎤</div>
                <h3 style={{ fontSize: typography.fontSize.xl, marginBottom: spacing[2] }}>
                  No hay organizadores disponibles
                </h3>
                <p>Intenta ajustar los filtros para encontrar más organizadores</p>
              </div>
            )}
          </Section>

          {/* Maestros Destacados */}
          <Section title="👨‍🏫 Maestros Destacados" toAll="/explore/maestros">
            {maestrosLoading ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: spacing[6],
                padding: `0 ${spacing[4]}`
              }}>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card"
                    style={{
                      height: '250px',
                      borderRadius: borderRadius.xl,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.gray[300]
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[2] }}>⏳</div>
                      <p>Cargando...</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : maestros && maestros.length > 0 ? (
              <div className="explore-grid">
                {maestros.map((maestro: any, index: number) => (
                  <motion.div
                    key={maestro.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <TeacherCard maestro={maestro} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: spacing[12],
                color: colors.gray[300]
              }}>
                <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>👨‍🏫</div>
                <h3 style={{ fontSize: typography.fontSize.xl, marginBottom: spacing[2] }}>
                  No hay maestros disponibles
                </h3>
                <p>Intenta ajustar los filtros para encontrar más maestros</p>
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
