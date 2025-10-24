import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEventDate } from "../../hooks/useEventDate";
import { useEventParent } from "../../hooks/useEventParent";
import { useTags } from "../../hooks/useTags";
import { motion } from "framer-motion";
import ShareButton from "../../components/events/ShareButton";
import RSVPButtons from "../../components/rsvp/RSVPButtons";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function EventDatePublicScreen() {
  const { dateId } = useParams<{ dateId: string }>();
  const navigate = useNavigate();
  const dateIdNum = dateId ? parseInt(dateId) : undefined;
  
  const { data: date, isLoading } = useEventDate(dateIdNum);
  const { data: parent } = useEventParent(date?.parent_id);
  const { data: ritmos } = useTags('ritmo');
  const { data: zonas } = useTags('zona');

  const [rsvpStatus, setRsvpStatus] = React.useState<'voy' | 'interesado' | 'no_voy' | null>(null);

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
        <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Cargando fecha...</p>
        </div>
      </div>
    );
  }

  if (!date) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            Fecha no encontrada
          </h2>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>
            La fecha que buscas no existe o no está disponible
          </p>
          <button
            onClick={() => navigate('/explore')}
            style={{
              padding: '14px 28px',
              borderRadius: '50px',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            🔍 Explorar Eventos
          </button>
        </div>
      </div>
    );
  }

  const getRitmoName = (id: number) => {
    return ritmos?.find(r => r.id === id)?.nombre || `Ritmo ${id}`;
  };

  const getZonaName = (id: number) => {
    return zonas?.find(z => z.id === id)?.nombre || `Zona ${id}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
      padding: '24px 0',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.dark}cc, ${colors.dark}88)`,
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          border: `1px solid ${colors.light}22`,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <button
                  onClick={() => navigate(`/social/${date.parent_id}`)}
          style={{
                    padding: '8px 12px',
            borderRadius: '20px',
                    border: `1px solid ${colors.light}33`,
            background: 'transparent',
            color: colors.light,
                    fontSize: '0.9rem',
            cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ← Volver al Social
                </button>
                
                <div style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: date.estado_publicacion === 'publicado' 
                    ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
                    : `${colors.light}33`,
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                }}>
                  {date.estado_publicacion === 'publicado' ? '🌐 Público' : '📝 Borrador'}
                </div>
              </div>

        <h1 style={{ 
                fontSize: '3rem',
                fontWeight: '700',
                background: `linear-gradient(135deg, ${colors.coral}, ${colors.blue})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '16px',
          lineHeight: 1.2,
        }}>
                {date.nombre || `Fecha: ${formatDate(date.fecha)}`}
        </h1>

              {date.biografia && (
                <p style={{
                  fontSize: '1.2rem',
                  color: colors.light,
                  opacity: 0.9,
                  lineHeight: 1.6,
                  marginBottom: '20px',
                }}>
                  {date.biografia}
                </p>
              )}

              {/* Fecha y Hora */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '1.1rem',
                  color: colors.light,
                  fontWeight: '600',
                }}>
                  📅 {formatDate(date.fecha)}
                </div>
                
                {date.hora_inicio && (
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
                    fontSize: '1.1rem',
                    color: colors.light,
                    fontWeight: '600',
                  }}>
                    🕐 {formatTime(date.hora_inicio)}
                    {date.hora_fin && ` - ${formatTime(date.hora_fin)}`}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginLeft: '24px' }}>
              <ShareButton
                url={window.location.href}
                title={date.nombre || `Fecha: ${formatDate(date.fecha)}`}
                text={`¡Mira esta fecha: ${date.nombre || formatDate(date.fecha)}!`}
              />
            </div>
          </div>

          {/* Chips de Ritmos y Zonas */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
            {date.estilos?.map((ritmoId: number) => (
              <motion.span
                key={ritmoId}
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                }}
              >
                🎵 {getRitmoName(ritmoId)}
              </motion.span>
            ))}
            
            {date.zonas?.map((zonaId: number) => (
              <motion.span
                key={zonaId}
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: '600',
                }}
              >
                📍 {getZonaName(zonaId)}
              </motion.span>
            ))}
        </div>

        {/* Ubicación */}
          {(date.lugar || date.direccion || date.ciudad) && (
          <div style={{
              padding: '16px',
              background: `${colors.light}11`,
              borderRadius: '12px',
              border: `1px solid ${colors.light}22`,
              marginBottom: '20px',
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: colors.light,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
                📍 Ubicación
              </h3>
              
              {date.lugar && (
                <p style={{
                  fontSize: '1rem',
                  color: colors.light,
                  opacity: 0.9,
                  marginBottom: '4px',
                  fontWeight: '600',
                }}>
                  {date.lugar}
                </p>
              )}
              
              {date.direccion && (
                <p style={{
                  fontSize: '0.9rem',
                  color: colors.light,
                  opacity: 0.8,
                  marginBottom: '4px',
                }}>
                  {date.direccion}
                </p>
              )}
              
              {date.ciudad && (
                <p style={{
                  fontSize: '0.9rem',
                  color: colors.light,
                  opacity: 0.7,
                }}>
                  {date.ciudad}
                </p>
              )}

              {date.referencias && (
                <p style={{
                  fontSize: '0.9rem',
                  color: colors.light,
                  opacity: 0.8,
                  marginTop: '8px',
                  fontStyle: 'italic',
                }}>
                  💡 {date.referencias}
                </p>
              )}
          </div>
        )}

          {/* Requisitos */}
          {date.requisitos && (
        <div style={{
              padding: '16px',
              background: `${colors.light}11`,
              borderRadius: '12px',
              border: `1px solid ${colors.light}22`,
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: colors.light,
                marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
                gap: '8px',
              }}>
                📋 Requisitos
              </h3>
              <p style={{
                fontSize: '1rem',
                color: colors.light,
                opacity: 0.9,
                lineHeight: 1.5,
                margin: 0,
              }}>
                {date.requisitos}
              </p>
            </div>
          )}
        </div>

        {/* Cronograma */}
        {date.cronograma && date.cronograma.length > 0 && (
          <div style={{
            background: `${colors.dark}66`,
              borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            border: `1px solid ${colors.light}22`,
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: colors.light,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              📅 Cronograma
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {date.cronograma.map((item: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    padding: '20px',
                    background: `${colors.dark}44`,
                    borderRadius: '12px',
                    border: `1px solid ${colors.light}22`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{
                    fontSize: '1.5rem',
                    minWidth: '40px',
                  }}>
                    {item.tipo === 'clase' ? '📚' : item.tipo === 'show' ? '🎭' : '📋'}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: colors.light,
                      marginBottom: '4px',
                    }}>
                      {item.titulo}
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{
                        fontSize: '1rem',
                        color: colors.light,
                        opacity: 0.8,
                      }}>
                        🕐 {item.inicio} - {item.fin}
            </span>

                      {item.nivel && (
            <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          background: `${colors.light}33`,
              color: colors.light,
                          fontSize: '0.8rem',
              fontWeight: '600',
            }}>
                          {item.nivel}
            </span>
          )}
        </div>
      </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Costos */}
        {date.costos && date.costos.length > 0 && (
          <div style={{
            background: `${colors.dark}66`,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            border: `1px solid ${colors.light}22`,
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: colors.light,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              💰 Costos y Promociones
          </h2>
          
            <div style={{ display: 'grid', gap: '16px' }}>
              {date.costos.map((costo: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
              style={{
                    padding: '20px',
                    background: `${colors.dark}44`,
                    borderRadius: '12px',
                    border: `1px solid ${colors.light}22`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: '600',
                      color: colors.light,
                      marginBottom: '4px',
                    }}>
                      {costo.nombre}
                    </h3>
                    
                    {costo.regla && (
                      <p style={{
                        fontSize: '0.9rem',
                        color: colors.light,
                        opacity: 0.8,
                        margin: 0,
                      }}>
                        {costo.regla}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '1.5rem',
                    }}>
                      {costo.tipo === 'preventa' ? '🎫' : costo.tipo === 'taquilla' ? '💰' : '🎁'}
                    </span>
                    
                    <span style={{
                      fontSize: '1.3rem',
                fontWeight: '700',
                color: colors.light,
                    }}>
                      {costo.precio !== undefined && costo.precio !== null 
                        ? `$${costo.precio.toLocaleString()}`
                        : 'Gratis'
                      }
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* RSVP Section */}
        <div style={{
          background: `${colors.dark}66`,
          borderRadius: '16px',
            padding: '24px',
          marginBottom: '32px',
          border: `1px solid ${colors.light}22`,
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: '600',
            color: colors.light,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🎯 ¿Vas a asistir?
          </h2>
          
          <RSVPButtons
            currentStatus={rsvpStatus}
            onStatusChange={setRsvpStatus}
          />
        </div>

        {/* Media Section */}
        {date.media && date.media.length > 0 && (
          <div style={{
            background: `${colors.dark}66`,
            borderRadius: '16px',
            padding: '24px',
            border: `1px solid ${colors.light}22`,
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: colors.light,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              📸 Galería
          </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}>
              {date.media.map((media: any, index: number) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
        style={{
                    aspectRatio: '1',
                    background: `${colors.dark}44`,
                    borderRadius: '12px',
          border: `1px solid ${colors.light}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={`Media ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: colors.light,
                      opacity: 0.7,
                    }}>
                      <div style={{ fontSize: '2rem' }}>🎥</div>
                      <span style={{ fontSize: '0.9rem' }}>Video</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
        </div>
    </div>
  );
}