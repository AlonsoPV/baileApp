import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEventParent } from "../../hooks/useEventParent";
import { useEventDatesByParent } from "../../hooks/useEventDate";
import { useTags } from "../../hooks/useTags";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { motion } from "framer-motion";
import ShareButton from "../../components/events/ShareButton";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";

// Componente de Carrusel (copiado del OrganizerProfileLive)
const CarouselComponent: React.FC<{ photos: string[] }> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
  };

  if (photos.length === 0) return null;

  return (
    <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Carrusel Principal */}
      <div style={{
        position: 'relative',
        aspectRatio: '16/9',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(0, 0, 0, 0.1)'
      }}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        >
          <ImageWithFallback
            src={photos[currentIndex]}
            alt={`Foto ${currentIndex + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer'
            }}
            onClick={() => setIsFullscreen(true)}
          />
        </motion.div>

        {/* Contador de fotos */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Botones de navegación */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.25rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ‹
            </button>
            <button
              onClick={nextPhoto}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.25rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {photos.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {photos.map((photo, index) => (
            <motion.button
              key={index}
              onClick={() => goToPhoto(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: currentIndex === index ? '3px solid #E53935' : '2px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                background: 'transparent',
                padding: 0,
                transition: 'all 0.2s'
              }}
            >
              <ImageWithFallback
                src={photo}
                alt={`Miniatura ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </motion.button>
          ))}
        </div>
      )}

      {/* Modal de pantalla completa */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <ImageWithFallback
              src={photos[currentIndex]}
              alt={`Foto ${currentIndex + 1} - Pantalla completa`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
            
            {/* Botón de cerrar */}
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
        background: `linear-gradient(135deg, ${colors.darkBase}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
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
          background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.1), rgba(30, 136, 229, 0.1))',
          borderRadius: '50%',
          animation: 'float 3s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1), rgba(255, 140, 66, 0.1))',
          borderRadius: '50%',
          animation: 'float 4s ease-in-out infinite reverse'
        }} />
        
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ fontSize: '3rem', marginBottom: '1rem' }}
          >
            ⏳
          </motion.div>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Cargando social...</p>
        </div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.darkBase}, #1a1a1a)`,
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
        
        .social-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
        }
        
        .social-hero::before {
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
        background: `linear-gradient(135deg, ${colors.darkBase}, #0f0f23, #1a1a2e)`,
        color: colors.light,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Hero Section */}
        <motion.div
          className="social-hero"
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
              {parent.nombre}
            </h1>
            
            {parent.biografia && (
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
                {parent.biografia}
              </motion.p>
            )}
          </motion.div>
        </motion.div>

        {/* Contenido Principal */}
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
              📋 Información del Social
            </h2>
            <p style={{
              textAlign: 'center',
              opacity: 0.8,
              fontSize: '1rem',
              margin: 0
            }}>
              Toda la información que necesitas saber sobre este social
            </p>
          </motion.div>

          {/* Header Mejorado */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.darkBase}cc, ${colors.darkBase}88)`,
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
            background: `${colors.darkBase}66`,
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
                    background: `${colors.darkBase}44`,
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
          background: `${colors.darkBase}66`,
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
            <div style={{ 
              display: 'grid', 
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))'
            }}>
              {dates.map((date: any, index: number) => (
                <motion.div
                  key={date.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.03, 
                    y: -8,
                    boxShadow: '0 16px 40px rgba(30, 136, 229, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}
                  onClick={() => navigate(`/social/fecha/${date.id}`)}
                  style={{
                    padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    borderRadius: '20px',
                    border: '2px solid rgba(30, 136, 229, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(30, 136, 229, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Efecto de brillo en hover */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    transition: 'left 0.6s ease',
                    zIndex: 1
                  }} />
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    {/* Header con icono y nombre */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
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
                        📅
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '1.4rem',
                          fontWeight: '800',
                          color: colors.light,
                          margin: 0,
                          background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {date.nombre || `Fecha: ${formatDate(date.fecha)}`}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Información de la fecha */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '0.75rem 1rem',
                        background: 'rgba(30, 136, 229, 0.1)',
                        borderRadius: '12px',
                        border: '1px solid rgba(30, 136, 229, 0.2)'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>📅</span>
                        <span style={{ 
                          fontSize: '1rem', 
                          color: colors.blue,
                          fontWeight: '700' 
                        }}>
                          {formatDate(date.fecha)}
                        </span>
                      </div>
                      
                      {date.hora_inicio && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '0.75rem 1rem',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          <span style={{ fontSize: '1.2rem' }}>🕐</span>
                          <span style={{ 
                            fontSize: '1rem', 
                            color: colors.light,
                            fontWeight: '700' 
                          }}>
                            {date.hora_inicio} - {date.hora_fin || 'Sin hora fin'}
                          </span>
                        </div>
                      )}

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

        {/* Galería de Fotos del Social */}
        {(() => {
          // Obtener fotos del carrusel usando los media slots
          const carouselPhotos = PHOTO_SLOTS
            .map(slot => getMediaBySlot(parent.media as any, slot)?.url)
            .filter(Boolean) as string[];

          return carouselPhotos.length > 0 && (
            <motion.section
              id="social-photo-gallery"
              data-test-id="social-photo-gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                marginBottom: '2rem',
                padding: '2.5rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '24px',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)'
                  }}>
                    📷
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.75rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      margin: 0,
                      lineHeight: 1.2
                    }}>
                      Galería de Fotos
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      opacity: 0.8,
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      Fotos del social
                    </p>
                  </div>
                  <div style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, rgba(229, 57, 53, 0.2), rgba(251, 140, 0, 0.2))',
                    borderRadius: '25px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: colors.light,
                    border: '1px solid rgba(229, 57, 53, 0.3)',
                    boxShadow: '0 4px 16px rgba(229, 57, 53, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                  </div>
                </div>
              
                <CarouselComponent photos={carouselPhotos} />
              </div>
            </motion.section>
          );
        })()}

        {/* Sección de Videos del Social */}
        {(() => {
          // Obtener videos
          const videos = VIDEO_SLOTS
            .map(slot => getMediaBySlot(parent.media as any, slot)?.url)
            .filter(Boolean) as string[];

          return videos.length > 0 && (
            <motion.section
              id="social-video-gallery"
              data-test-id="social-video-gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{
                marginBottom: '2rem',
                padding: '2.5rem',
                background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1) 0%, rgba(0, 188, 212, 0.05) 50%, rgba(255, 255, 255, 0.08) 100%)',
                borderRadius: '24px',
                border: '2px solid rgba(30, 136, 229, 0.2)',
                boxShadow: '0 12px 40px rgba(30, 136, 229, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 8px 24px rgba(30, 136, 229, 0.4)'
                  }}>
                    🎥
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.75rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #1E88E5 0%, #00BCD4 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      margin: 0,
                      lineHeight: 1.2
                    }}>
                      Videos del Social
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      opacity: 0.8,
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      Videos promocionales y demostraciones
                    </p>
                  </div>
                  <div style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.2), rgba(0, 188, 212, 0.2))',
                    borderRadius: '25px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: colors.light,
                    border: '1px solid rgba(30, 136, 229, 0.3)',
                    boxShadow: '0 4px 16px rgba(30, 136, 229, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {videos.length} video{videos.length !== 1 ? 's' : ''}
                  </div>
                </div>
              
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: '2rem',
                  maxWidth: '1200px',
                  margin: '0 auto'
                }}>
                  {videos.map((video, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{
                        scale: 1.05,
                        y: -8,
                        boxShadow: '0 16px 40px rgba(30, 136, 229, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3)'
                      }}
                      style={{
                        aspectRatio: '16/9',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        border: '2px solid rgba(30, 136, 229, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        background: 'rgba(0, 0, 0, 0.1)',
                        boxShadow: '0 8px 32px rgba(30, 136, 229, 0.2), 0 4px 16px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <video
                        src={video}
                        controls
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.9), rgba(0, 188, 212, 0.9))',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        boxShadow: '0 4px 16px rgba(30, 136, 229, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}>
                        🎥 Video {index + 1}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          );
        })()}
      </div>
    </div>
    </>
  );
}