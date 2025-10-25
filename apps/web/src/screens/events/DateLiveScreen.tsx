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

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function DateLiveScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dateId = parseInt(id || '0');
  
  // Debug logs
  console.log('[DateLiveScreen] URL id:', id);
  console.log('[DateLiveScreen] Parsed dateId:', dateId);
  
  const { data: date, isLoading, error } = useEventDate(dateId);
  const { data: social } = useEventParent(date?.parent_id);
  const { data: allTags } = useTags();
  const { userStatus, stats, toggleInterested, isUpdating } = useEventRSVP(dateId);
  
  // Debug logs
  console.log('[DateLiveScreen] Date data:', date);
  console.log('[DateLiveScreen] Is loading:', isLoading);
  console.log('[DateLiveScreen] Error:', error);
  console.log('[DateLiveScreen] User RSVP status:', userStatus);
  console.log('[DateLiveScreen] RSVP stats:', stats);
  console.log('[DateLiveScreen] Is updating:', isUpdating);
  
  // Verificar si el usuario puede editar esta fecha
  const canEdit = social?.organizer_id && user?.id && 
    social.organizer_id === parseInt(user.id);

  // Get tag names from IDs
  const getRitmoNombres = () => {
    if (!allTags || !date?.estilos) return [];
    return date.estilos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!date || !social) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Fecha no encontrada</h1>
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
            La fecha que buscas no existe o ha sido eliminada
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Volver al inicio
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .event-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
        }
        
        .event-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(255, 61, 87, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(30, 136, 229, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 140, 66, 0.05) 0%, transparent 50%);
          animation: float 6s ease-in-out infinite;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .shimmer-effect {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #0f0f23, #1a1a2e)`,
        color: colors.light,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Hero Section */}
        <motion.div
          className="event-hero"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            padding: '4rem 2rem',
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
            background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.2), rgba(255, 140, 66, 0.2))',
            borderRadius: '50%',
            animation: 'float 4s ease-in-out infinite',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }} />
          
          <div style={{
            position: 'absolute',
            top: '30%',
            right: '15%',
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.2), rgba(0, 188, 212, 0.2))',
            borderRadius: '50%',
            animation: 'float 3s ease-in-out infinite reverse',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }} />
          
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '20%',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, rgba(255, 209, 102, 0.1), rgba(255, 140, 66, 0.1))',
            borderRadius: '50%',
            animation: 'float 5s ease-in-out infinite',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }} />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            style={{ position: 'relative', zIndex: 2 }}
          >
            <h1 style={{
              fontSize: '4rem',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #FF3D57 0%, #1E88E5 50%, #FF8C42 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1.5rem',
              textShadow: '0 4px 20px rgba(255, 61, 87, 0.3)',
              letterSpacing: '-0.02em'
            }}>
              {date.nombre || social.nombre}
            </h1>
            
            {date.biografia && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                style={{
                  fontSize: '1.3rem',
                  opacity: 0.9,
                  maxWidth: '700px',
                  margin: '0 auto 2.5rem',
                  lineHeight: 1.7,
                  fontWeight: '400',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {date.biografia}
              </motion.p>
            )}

            {/* Botones de acción mejorados */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              style={{
                display: 'flex',
                gap: '1.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: '2rem'
              }}
            >
              {canEdit && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/social/fecha/${dateId}/edit`)}
                  style={{
                    padding: '16px 32px',
                    borderRadius: '25px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #1E88E5, #FF3D57)',
                    color: colors.light,
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(30, 136, 229, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 2 }}>✏️ Editar Fecha</span>
                  <div className="shimmer-effect" style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    zIndex: 1
                  }} />
                </motion.button>
              )}
              
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <ShareLink url={window.location.href} />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Contenido Principal - Diseño Estructurado */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 4rem' }}>
          {/* Navegación de Secciones */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              marginBottom: '3rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: colors.light,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #FF3D57, #1E88E5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📋 Información del Evento
            </h2>
            <p style={{
              textAlign: 'center',
              opacity: 0.8,
              fontSize: '1rem',
              margin: 0
            }}>
              Toda la información que necesitas saber sobre este evento
            </p>
          </motion.div>

          {/* Información de la Fecha - Diseño Mejorado */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2.5rem',
              marginBottom: '4rem',
            }}
          >
            {/* Fecha y Horario - Tarjeta Mejorada */}
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass-card"
              style={{
                padding: '2.5rem',
                borderRadius: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Efecto de brillo */}
              <div className="shimmer-effect" style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                zIndex: 1
              }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF3D57, #FF8C42)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 8px 24px rgba(255, 61, 87, 0.4)'
                  }}>
                    📅
                  </div>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    margin: 0, 
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #FF3D57, #FF8C42)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    📅 Fecha y Horario
                  </h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.1), rgba(255, 140, 66, 0.1))',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 61, 87, 0.2)'
                  }}>
                    <p style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: '700',
                      margin: 0,
                      color: colors.light,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      📅 {fmtDate(date.fecha)}
                    </p>
                  </div>
                  
                  {date.hora_inicio && date.hora_fin && (
                    <div style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1), rgba(0, 188, 212, 0.1))',
                      borderRadius: '16px',
                      border: '1px solid rgba(30, 136, 229, 0.2)'
                    }}>
                      <p style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: '600',
                        margin: 0,
                        color: colors.light,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🕐 {fmtTime(date.hora_inicio)} - {fmtTime(date.hora_fin)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Ubicación - Tarjeta Mejorada */}
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass-card"
              style={{
                padding: '2.5rem',
                borderRadius: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Efecto de brillo */}
              <div className="shimmer-effect" style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                zIndex: 1
              }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 8px 24px rgba(30, 136, 229, 0.4)'
                  }}>
                    📍
                  </div>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    margin: 0, 
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    📍 Ubicación
                  </h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {date.lugar && (
                    <div style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1), rgba(0, 188, 212, 0.1))',
                      borderRadius: '16px',
                      border: '1px solid rgba(30, 136, 229, 0.2)'
                    }}>
                      <p style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '700',
                        margin: 0,
                        color: colors.light,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🏢 {date.lugar}
                      </p>
                    </div>
                  )}
                  
                  {date.direccion && (
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <p style={{ 
                        fontSize: '1rem', 
                        fontWeight: '500',
                        margin: 0,
                        color: colors.light,
                        opacity: 0.9,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        📍 {date.direccion}
                      </p>
                    </div>
                  )}
                  
                  {date.ciudad && (
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <p style={{ 
                        fontSize: '1rem', 
                        fontWeight: '500',
                        margin: 0,
                        color: colors.light,
                        opacity: 0.9,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        🏙️ {date.ciudad}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

          {/* Ritmos */}
          {getRitmoNombres().length > 0 && (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
                🎵 Ritmos
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {getRitmoNombres().map((ritmo, index) => (
                  <Chip key={index} label={ritmo} />
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Requisitos */}
        {date.requisitos && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              📋 Requisitos
            </h3>
            <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
              {date.requisitos}
            </p>
          </motion.section>
        )}

        {/* Referencias */}
        {date.referencias && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              📍 Referencias
            </h3>
            <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
              {date.referencias}
            </p>
          </motion.section>
        )}

        {/* Cronograma */}
        {date.cronograma && Array.isArray(date.cronograma) && date.cronograma.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              ⏰ Cronograma
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {date.cronograma.map((item: any, index: number) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: colors.light,
                  }}>
                    {item.hora && `🕐 ${item.hora} - `}{item.actividad}
                  </h4>
                  {item.descripcion && (
                    <p style={{
                      fontSize: '0.9rem',
                      opacity: 0.8,
                      lineHeight: 1.4,
                    }}>
                      {item.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Costos */}
        {date.costos && Array.isArray(date.costos) && date.costos.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              💰 Costos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {date.costos.map((costo: any, index: number) => (
                <div key={index} style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}>
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: colors.light,
                  }}>
                    {costo.tipo && `${costo.tipo} - `}${costo.precio}
                  </h4>
                  {costo.descripcion && (
                    <p style={{
                      fontSize: '0.9rem',
                      opacity: 0.8,
                      lineHeight: 1.4,
                    }}>
                      {costo.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

          {/* Navegación Rápida */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              marginBottom: '3rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: colors.light,
              textAlign: 'center'
            }}>
              🚀 Acciones Rápidas
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/social/${social.id}`)}
                style={{
                  padding: '1rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.2), rgba(255, 140, 66, 0.2))',
                  border: '2px solid rgba(255, 61, 87, 0.3)',
                  borderRadius: '15px',
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 24px rgba(255, 61, 87, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                🎭 Ver Social Completo
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: date.nombre || social.nombre,
                      text: date.biografia || social.biografia,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('¡Enlace copiado al portapapeles!');
                  }
                }}
                style={{
                  padding: '1rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.2), rgba(0, 188, 212, 0.2))',
                  border: '2px solid rgba(30, 136, 229, 0.3)',
                  borderRadius: '15px',
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 24px rgba(30, 136, 229, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                📤 Compartir Evento
              </motion.button>
            </div>
          </motion.div>

          {/* RSVP - Sección Mejorada */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="glass-card"
            style={{
              marginBottom: '3rem',
              padding: '3rem',
              borderRadius: '28px',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.1) 0%, rgba(30, 136, 229, 0.1) 50%, rgba(255, 140, 66, 0.1) 100%)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Efecto de brillo */}
            <div className="shimmer-effect" style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              zIndex: 1
            }} />
            
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              {/* Header con icono animado */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF3D57, #1E88E5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 12px 40px rgba(255, 61, 87, 0.4)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              >
                🎫
              </motion.div>
              
              <h3 style={{ 
                fontSize: '2rem', 
                marginBottom: '1.5rem', 
                fontWeight: '800',
                background: 'linear-gradient(135deg, #FF3D57, #1E88E5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 auto 1.5rem'
              }}>
                Confirmar Asistencia
              </h3>
              
              <p style={{
                fontSize: '1.1rem',
                opacity: 0.8,
                marginBottom: '2rem',
                maxWidth: '500px',
                margin: '0 auto 2rem',
                lineHeight: 1.6
              }}>
                ¿Te interesa asistir a este evento? ¡Confirma tu interés!
              </p>
              
              {/* Botón RSVP Mejorado */}
              <div style={{ marginBottom: '2rem' }}>
                <RSVPButtons 
                  currentStatus={userStatus}
                  onStatusChange={toggleInterested}
                  disabled={isUpdating}
                />
              </div>
              
              {/* Estadísticas RSVP Mejoradas */}
              {stats && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  style={{
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.2), rgba(255, 140, 66, 0.2))',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 61, 87, 0.3)'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👀</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: colors.light }}>
                        {stats.interesado}
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                        Interesado{stats.interesado !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.2), rgba(0, 188, 212, 0.2))',
                      borderRadius: '16px',
                      border: '1px solid rgba(30, 136, 229, 0.3)'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: colors.light }}>
                        {stats.total}
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                        Persona{stats.total !== 1 ? 's' : ''} en total
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>

        {/* Media */}
        {date.media && Array.isArray(date.media) && date.media.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              📸 Galería
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}>
              {date.media.map((url: string, index: number) => (
                <ImageWithFallback
                  key={index}
                  src={url}
                  alt={`Media ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Link al Social */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
            🎭 Parte del Social
          </h3>
          <p style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
            Esta fecha es parte del social "{social.nombre}"
          </p>
          <Link
            to={`/social/${social.id}`}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Ver Social Completo
          </Link>
        </motion.div>
      </div>
    </div>
    </>
  );
}
