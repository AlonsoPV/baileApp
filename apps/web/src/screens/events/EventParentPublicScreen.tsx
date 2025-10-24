import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEventParent } from "../../hooks/useEventParent";
import { useEventDatesByParent } from "../../hooks/useEventDate";
import { useTags } from "../../hooks/useTags";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { motion } from "framer-motion";
import ShareButton from "../../components/events/ShareButton";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function EventParentPublicScreen() {
  const { parentId } = useParams<{ parentId: string }>();
  const navigate = useNavigate();
  const parentIdNum = parentId ? parseInt(parentId) : undefined;
  
  const { data: parent, isLoading } = useEventParent(parentIdNum);
  const { data: dates } = useEventDatesByParent(parentIdNum);
  const { data: ritmos } = useTags('ritmo');
  const { data: zonas } = useTags('zona');
  const { data: organizer } = useMyOrganizer();
  
  // Verificar si el usuario es el dueño del social
  const isOwner = organizer?.id === parent?.organizer_id;

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
          <p>Cargando social...</p>
        </div>
      </div>
    );
  }

  if (!parent) {
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
            Social no encontrado
          </h2>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>
            El social que buscas no existe o no está disponible
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
                {parent.nombre}
              </h1>
              
              {parent.biografia && (
                <p style={{
                  fontSize: '1.2rem',
                  color: colors.light,
                  opacity: 0.9,
                  lineHeight: 1.6,
                  marginBottom: '20px',
                }}>
                  {parent.biografia}
                </p>
              )}

              {parent.descripcion && (
                <p style={{
                  fontSize: '1rem',
                  color: colors.light,
                  opacity: 0.8,
                  lineHeight: 1.5,
                }}>
                  {parent.descripcion}
                </p>
              )}
            </div>

            <div style={{ marginLeft: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              {isOwner && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/social/${parentId}/edit`)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '25px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                    color: colors.light,
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  ✏️ Editar Social
                </motion.button>
              )}
              
              <ShareButton
                url={window.location.href}
                title={parent.nombre}
                text={`¡Mira este social: ${parent.nombre}!`}
              />
            </div>
          </div>

          {/* Chips de Ritmos y Zonas */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
            {parent.estilos?.map((ritmoId: number) => (
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
            
            {parent.zonas?.map((zonaId: number) => (
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

          {/* Sede General */}
          {parent.sede_general && (
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
                📍 Sede General
              </h3>
              <p style={{
                fontSize: '1rem',
                color: colors.light,
                opacity: 0.9,
                margin: 0,
              }}>
                {parent.sede_general}
              </p>
            </div>
          )}
        </div>

        {/* FAQ Section */}
        {parent.faq && parent.faq.length > 0 && (
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
              ❓ Preguntas Frecuentes
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {parent.faq.map((faq: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    padding: '16px',
                    background: `${colors.dark}44`,
                    borderRadius: '12px',
                    border: `1px solid ${colors.light}22`,
                  }}
                >
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: colors.light,
                    marginBottom: '8px',
                  }}>
                    {faq.q}
                  </h4>
                  <p style={{
                    fontSize: '1rem',
                    color: colors.light,
                    opacity: 0.8,
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    {faq.a}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Fechas Section */}
        <div style={{
          background: `${colors.dark}66`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          border: `1px solid ${colors.light}22`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '600',
              color: colors.light,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              📅 Fechas Disponibles
            </h2>
            
            <button
              onClick={() => navigate(`/social/${parentId}/fecha/nueva`)}
              style={{
                padding: '12px 20px',
                borderRadius: '25px',
                border: 'none',
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ➕ Agregar Fecha
            </button>
          </div>

          {dates && dates.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {dates.map((date: any) => (
                <motion.div
                  key={date.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => navigate(`/social/fecha/${date.id}`)}
                  style={{
                    padding: '20px',
                    background: `${colors.dark}44`,
                    borderRadius: '12px',
                    border: `1px solid ${colors.light}22`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.3rem',
                        fontWeight: '600',
                        color: colors.light,
                        marginBottom: '8px',
                      }}>
                        {date.nombre || `Fecha: ${formatDate(date.fecha)}`}
                      </h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <span style={{
                          fontSize: '1rem',
                          color: colors.light,
                          opacity: 0.8,
                        }}>
                          📅 {formatDate(date.fecha)}
                        </span>
                        
                        {date.hora_inicio && (
                          <span style={{
                            fontSize: '1rem',
                            color: colors.light,
                            opacity: 0.8,
                          }}>
                            🕐 {date.hora_inicio} - {date.hora_fin || 'Sin hora fin'}
                          </span>
                        )}
                      </div>

                      {date.lugar && (
                        <p style={{
                          fontSize: '1rem',
                          color: colors.light,
                          opacity: 0.9,
                          marginBottom: '8px',
                        }}>
                          📍 {date.lugar}
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
                    </div>

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
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: colors.light,
              opacity: 0.6,
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
              <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
                No hay fechas programadas aún
              </p>
              <p style={{ fontSize: '0.9rem' }}>
                Haz clic en "Agregar Fecha" para crear la primera
              </p>
            </div>
          )}
        </div>

        {/* Media Section */}
        {parent.media && parent.media.length > 0 && (
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
              {parent.media.map((media: any, index: number) => (
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