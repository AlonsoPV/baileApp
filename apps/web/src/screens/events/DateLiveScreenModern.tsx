import React from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEventDate } from "../../hooks/useEventDate";
import { useEventParent } from "../../hooks/useEventParent";
import { useAuth } from "../../hooks/useAuth";
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import { Chip } from "../../components/profile/Chip";
import ShareLink from '../../components/ShareLink';
import ImageWithFallback from "../../components/ImageWithFallback";
import RSVPButtons from "../../components/rsvp/RSVPButtons";
import { useEventRSVP } from "../../hooks/useRSVP";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";

export function DateLiveScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dateId = parseInt(id || '0');
  
  const { data: date, isLoading, error } = useEventDate(dateId);
  const { data: social } = useEventParent(date?.parent_id);
  const { data: allTags } = useTags();
  const { userStatus, stats, toggleInterested, isUpdating } = useEventRSVP(dateId);
  
  // Verificar si el usuario puede editar esta fecha
  const canEdit = social?.organizer_id && user?.id && 
    social.organizer_id === parseInt(user.id);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.gray[50],
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Efectos de fondo animados */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: colors.gradients.primary,
          borderRadius: '50%',
          opacity: 0.1,
          animation: 'float 3s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '60px',
          height: '60px',
          background: colors.gradients.secondary,
          borderRadius: '50%',
          opacity: 0.15,
          animation: 'float 4s ease-in-out infinite reverse'
        }} />
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
          <p style={{ fontSize: typography.fontSize.lg }}>Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !date) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.gray[50],
        padding: spacing[8]
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>❌</div>
          <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
            Evento no encontrado
          </h2>
          <p style={{ marginBottom: spacing[6], opacity: 0.7, fontSize: typography.fontSize.lg }}>
            El evento que buscas no existe o ha sido eliminado
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/explore')}
            style={{
              padding: `${spacing[4]} ${spacing[7]}`,
              borderRadius: borderRadius.full,
              border: 'none',
              background: colors.gradients.primary,
              color: colors.gray[50],
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              cursor: 'pointer',
              boxShadow: colors.shadows.glow,
              transition: transitions.normal
            }}
          >
            🔍 Explorar Eventos
          </motion.button>
        </div>
      </div>
    );
  }

  // Obtener nombres de ritmos y zonas
  const getRitmoNombres = () => {
    if (!allTags || !date.estilos) return [];
    return date.estilos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !date.zonas) return [];
    return date.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: ${typography.fontFamily.primary};
        }
        
        .date-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, ${colors.dark[500]} 0%, ${colors.dark[400]} 100%);
        }
        
        .date-hero::before {
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
          className="date-hero"
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
              {date.nombre || social?.nombre || 'Evento'}
            </h1>
            
            {date.biografia && (
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
                {date.biografia}
              </motion.p>
            )}

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
              {canEdit && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/social/fecha/${date.id}/edit`)}
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
                  ✏️ Editar Fecha
                </motion.button>
              )}
              
              <ShareLink 
                url={window.location.href}
                title={date.nombre || social?.nombre || 'Evento'}
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
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Contenido Principal */}
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: spacing[8],
          position: 'relative',
          zIndex: 1
        }}>
          {/* Información del Evento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
            style={{
              marginBottom: spacing[8],
              padding: spacing[8],
              borderRadius: borderRadius['2xl']
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: spacing[6]
            }}>
              {/* Fecha y Horario */}
              <div>
                <h3 style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  marginBottom: spacing[3],
                  color: colors.gray[50],
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2]
                }}>
                  📅 Fecha y Horario
                </h3>
                <div style={{
                  padding: spacing[4],
                  background: colors.gradients.primary,
                  borderRadius: borderRadius.lg,
                  boxShadow: colors.shadows.md
                }}>
                  <p style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.gray[50],
                    margin: 0,
                    marginBottom: spacing[2]
                  }}>
                    {new Date(date.fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  {date.hora_inicio && (
                    <p style={{
                      fontSize: typography.fontSize.base,
                      color: colors.gray[100],
                      margin: 0
                    }}>
                      🕐 {date.hora_inicio}{date.hora_fin ? ` - ${date.hora_fin}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Ubicación */}
              {(date.lugar || date.ciudad) && (
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    marginBottom: spacing[3],
                    color: colors.gray[50],
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2]
                  }}>
                    📍 Ubicación
                  </h3>
                  <div style={{
                    padding: spacing[4],
                    background: colors.gradients.secondary,
                    borderRadius: borderRadius.lg,
                    boxShadow: colors.shadows.md
                  }}>
                    {date.lugar && (
                      <p style={{
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.bold,
                        color: colors.gray[50],
                        margin: 0,
                        marginBottom: spacing[1]
                      }}>
                        {date.lugar}
                      </p>
                    )}
                    {date.ciudad && (
                      <p style={{
                        fontSize: typography.fontSize.base,
                        color: colors.gray[100],
                        margin: 0
                      }}>
                        🏙️ {date.ciudad}
                      </p>
                    )}
                    {date.direccion && (
                      <p style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.gray[200],
                        margin: 0,
                        marginTop: spacing[2]
                      }}>
                        📍 {date.direccion}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Ritmos y Zonas */}
          {(getRitmoNombres().length > 0 || getZonaNombres().length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: spacing[6]
              }}>
                {/* Ritmos */}
                {getRitmoNombres().length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      marginBottom: spacing[3],
                      color: colors.gray[50],
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2]
                    }}>
                      🎵 Ritmos
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                      {getRitmoNombres().map((ritmo) => (
                        <span
                          key={ritmo}
                          style={{
                            padding: `${spacing[2]} ${spacing[3]}`,
                            background: colors.gradients.primary,
                            borderRadius: borderRadius.full,
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.medium,
                            color: colors.gray[50],
                            boxShadow: colors.shadows.md
                          }}
                        >
                          {ritmo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zonas */}
                {getZonaNombres().length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      marginBottom: spacing[3],
                      color: colors.gray[50],
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[2]
                    }}>
                      📍 Zonas
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                      {getZonaNombres().map((zona) => (
                        <span
                          key={zona}
                          style={{
                            padding: `${spacing[2]} ${spacing[3]}`,
                            background: colors.gradients.secondary,
                            borderRadius: borderRadius.full,
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.medium,
                            color: colors.gray[50],
                            boxShadow: colors.shadows.md
                          }}
                        >
                          {zona}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Requisitos */}
          {date.requisitos && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <h3 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[4],
                color: colors.gray[50],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2]
              }}>
                📋 Requisitos
              </h3>
              <p style={{
                lineHeight: typography.lineHeight.relaxed,
                fontSize: typography.fontSize.lg,
                color: colors.gray[100]
              }}>
                {date.requisitos}
              </p>
            </motion.div>
          )}

          {/* Referencias */}
          {date.referencias && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <h3 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[4],
                color: colors.gray[50],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2]
              }}>
                🗺️ Referencias
              </h3>
              <p style={{
                lineHeight: typography.lineHeight.relaxed,
                fontSize: typography.fontSize.lg,
                color: colors.gray[100]
              }}>
                {date.referencias}
              </p>
            </motion.div>
          )}

          {/* Cronograma */}
          {date.cronograma && Array.isArray(date.cronograma) && date.cronograma.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <h3 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[6],
                color: colors.gray[50],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2]
              }}>
                ⏰ Cronograma
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                {date.cronograma.map((item: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      padding: spacing[5],
                      background: colors.glass.light,
                      borderRadius: borderRadius.xl,
                      border: `1px solid ${colors.glass.medium}`
                    }}
                  >
                    <h4 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      marginBottom: spacing[2],
                      color: colors.gray[50]
                    }}>
                      {item.inicio && `🕐 ${item.inicio}${item.fin ? ` - ${item.fin}` : ''} - `}{item.titulo}
                    </h4>
                    {item.nivel && (
                      <p style={{
                        fontSize: typography.fontSize.base,
                        color: colors.primary[500],
                        fontWeight: typography.fontWeight.medium,
                        marginBottom: spacing[1]
                      }}>
                        📊 Nivel: {item.nivel}
                      </p>
                    )}
                    {item.tipo && (
                      <p style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.gray[300],
                        textTransform: 'capitalize'
                      }}>
                        🏷️ Tipo: {item.tipo}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Costos */}
          {date.costos && Array.isArray(date.costos) && date.costos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <h3 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[6],
                color: colors.gray[50],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2]
              }}>
                💰 Costos
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                {date.costos.map((costo: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      padding: spacing[5],
                      background: colors.gradients.secondary,
                      borderRadius: borderRadius.xl,
                      boxShadow: colors.shadows.md
                    }}
                  >
                    <h4 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      marginBottom: spacing[2],
                      color: colors.gray[50]
                    }}>
                      {costo.titulo}
                    </h4>
                    <p style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.gray[50],
                      margin: 0
                    }}>
                      ${costo.precio}
                    </p>
                    {costo.descripcion && (
                      <p style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.gray[200],
                        margin: 0,
                        marginTop: spacing[2]
                      }}>
                        {costo.descripcion}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* RSVP Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass-card"
            style={{
              marginBottom: spacing[8],
              padding: spacing[8],
              borderRadius: borderRadius['2xl']
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[4],
              marginBottom: spacing[6]
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: colors.gradients.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: typography.fontSize['2xl'],
                boxShadow: colors.shadows.glow
              }}>
                👥
              </div>
              <div>
                <h3 style={{
                  fontSize: typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.bold,
                  margin: 0,
                  color: colors.gray[50]
                }}>
                  ¿Te interesa este evento?
                </h3>
                <p style={{
                  fontSize: typography.fontSize.sm,
                  opacity: 0.8,
                  margin: 0,
                  color: colors.gray[300]
                }}>
                  Únete a la comunidad de baile
                </p>
              </div>
            </div>
            
            <RSVPButtons 
              currentStatus={userStatus}
              onStatusChange={toggleInterested}
              disabled={isUpdating}
            />
            
            {/* Estadísticas RSVP */}
            {stats && (
              <div style={{
                marginTop: spacing[6],
                padding: spacing[4],
                background: colors.glass.light,
                borderRadius: borderRadius.lg,
                border: `1px solid ${colors.glass.medium}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: typography.fontSize.sm, 
                    opacity: 0.8,
                    color: colors.gray[200]
                  }}>
                    👀 {stats.interesado} interesado{stats.interesado !== 1 ? 's' : ''}
                  </span>
                  <span style={{ 
                    fontSize: typography.fontSize.sm, 
                    opacity: 0.8,
                    color: colors.gray[200]
                  }}>
                    👥 {stats.total} persona{stats.total !== 1 ? 's' : ''} en total
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Navegación Rápida */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="glass-card"
            style={{
              marginBottom: spacing[8],
              padding: spacing[8],
              borderRadius: borderRadius['2xl']
            }}
          >
            <h3 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing[6],
              color: colors.gray[50],
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2]
            }}>
              🚀 Acciones Rápidas
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: spacing[4]
            }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/social/${social?.id}`)}
                style={{
                  padding: spacing[6],
                  background: colors.gradients.secondary,
                  borderRadius: borderRadius.xl,
                  border: 'none',
                  color: colors.gray[50],
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: transitions.normal,
                  boxShadow: colors.shadows.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2]
                }}
              >
                🎭 Ver Social Completo
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.open(window.location.href, '_blank')}
                style={{
                  padding: spacing[6],
                  background: colors.gradients.deep,
                  borderRadius: borderRadius.xl,
                  border: 'none',
                  color: colors.gray[50],
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: transitions.normal,
                  boxShadow: colors.shadows.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2]
                }}
              >
                📤 Compartir Evento
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
