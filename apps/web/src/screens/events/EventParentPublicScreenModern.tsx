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

// Componente de Carrusel Moderno
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
        borderRadius: borderRadius['2xl'],
        overflow: 'hidden',
        border: `2px solid ${colors.glass.medium}`,
        background: colors.dark[400],
        boxShadow: colors.shadows.glass
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
          top: spacing[4],
          right: spacing[4],
          background: colors.glass.darker,
          color: colors.gray[50],
          padding: `${spacing[2]} ${spacing[4]}`,
          borderRadius: borderRadius.full,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          backdropFilter: 'blur(10px)'
        }}>
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Botones de navegación */}
        {photos.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevPhoto}
              style={{
                position: 'absolute',
                left: spacing[4],
                top: '50%',
                transform: 'translateY(-50%)',
                background: colors.glass.darker,
                color: colors.gray[50],
                border: 'none',
                borderRadius: borderRadius.full,
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: typography.fontSize.xl,
                transition: transitions.normal,
                backdropFilter: 'blur(10px)'
              }}
            >
              ‹
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextPhoto}
              style={{
                position: 'absolute',
                right: spacing[4],
                top: '50%',
                transform: 'translateY(-50%)',
                background: colors.glass.darker,
                color: colors.gray[50],
                border: 'none',
                borderRadius: borderRadius.full,
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: typography.fontSize.xl,
                transition: transitions.normal,
                backdropFilter: 'blur(10px)'
              }}
            >
              ›
            </motion.button>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {photos.length > 1 && (
        <div style={{
          display: 'flex',
          gap: spacing[2],
          marginTop: spacing[4],
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {photos.map((photo, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goToPhoto(index)}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: borderRadius.lg,
                overflow: 'hidden',
                border: currentIndex === index 
                  ? `3px solid ${colors.primary[500]}` 
                  : `2px solid ${colors.glass.medium}`,
                cursor: 'pointer',
                background: 'transparent',
                padding: 0,
                transition: transitions.normal
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
            background: colors.glass.darker,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing[8]
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: borderRadius['2xl'],
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
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'absolute',
                top: spacing[4],
                right: spacing[4],
                background: colors.glass.darker,
                color: colors.gray[50],
                border: 'none',
                borderRadius: borderRadius.full,
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                backdropFilter: 'blur(10px)'
              }}
            >
              ×
            </motion.button>
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

  if (!parent) {
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

  // Obtener fotos del carrusel
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(parent.media as any, slot)?.url)
    .filter(Boolean) as string[];

  // Obtener videos
  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(parent.media as any, slot)?.url)
    .filter(Boolean) as string[];

  // Obtener nombres de ritmos y zonas
  const getRitmoNombres = () => {
    if (!ritmos || !parent.estilos) return [];
    return parent.estilos
      .map(id => ritmos.find(ritmo => ritmo.id === id))
      .filter(Boolean)
      .map(ritmo => ritmo!.nombre);
  };

  const getZonaNombres = () => {
    if (!zonas || !parent.zonas) return [];
    return parent.zonas
      .map(id => zonas.find(zona => zona.id === id))
      .filter(Boolean)
      .map(zona => zona!.nombre);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: ${typography.fontFamily.primary};
        }
        
        .social-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, ${colors.dark[500]} 0%, ${colors.dark[400]} 100%);
        }
        
        .social-hero::before {
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
          className="social-hero"
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
            background: colors.gradients.secondary,
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
              {parent.nombre}
            </h1>
            
            {parent.biografia && (
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
                {parent.biografia}
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
              {isOwner && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/social/${parent.id}/edit`)}
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
                  ✏️ Editar Social
                </motion.button>
              )}
              
              <ShareButton 
                url={window.location.href}
                title={parent.nombre}
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

          {/* Descripción */}
          {parent.descripcion && (
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
              <h3 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[4],
                color: colors.gray[50],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2]
              }}>
                📝 Descripción
              </h3>
              <p style={{
                lineHeight: typography.lineHeight.relaxed,
                fontSize: typography.fontSize.lg,
                color: colors.gray[100]
              }}>
                {parent.descripcion}
              </p>
            </motion.div>
          )}

          {/* FAQ */}
          {parent.faq && Array.isArray(parent.faq) && parent.faq.length > 0 && (
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
                marginBottom: spacing[6],
                color: colors.gray[50],
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2]
              }}>
                ❓ Preguntas Frecuentes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                {parent.faq.map((faq: any, index: number) => (
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
                      {faq.pregunta}
                    </h4>
                    <p style={{
                      fontSize: typography.fontSize.base,
                      color: colors.gray[200],
                      lineHeight: typography.lineHeight.relaxed
                    }}>
                      {faq.respuesta}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Galería de Fotos */}
          {carouselPhotos.length > 0 && (
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
                  📷
                </div>
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.bold,
                    margin: 0,
                    color: colors.gray[50]
                  }}>
                    Galería de Fotos
                  </h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: colors.gray[300]
                  }}>
                    {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            
              <CarouselComponent photos={carouselPhotos} />
            </motion.div>
          )}

          {/* Próximas Fechas */}
          {dates && dates.length > 0 && (
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
                  background: colors.gradients.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: `0 8px 24px ${colors.secondary[500]}40`
                }}>
                  📅
                </div>
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.bold,
                    margin: 0,
                    color: colors.gray[50]
                  }}>
                    Próximas Fechas
                  </h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: colors.gray[300]
                  }}>
                    {dates.length} fecha{dates.length !== 1 ? 's' : ''} programada{dates.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: spacing[6]
              }}>
                {dates.map((date: any, index: number) => (
                  <motion.div
                    key={date.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -4,
                      boxShadow: colors.shadows.lg
                    }}
                    onClick={() => navigate(`/social/fecha/${date.id}`)}
                    style={{
                      padding: spacing[6],
                      background: colors.gradients.glass,
                      borderRadius: borderRadius.xl,
                      border: `1px solid ${colors.glass.medium}`,
                      cursor: 'pointer',
                      transition: transitions.normal,
                      boxShadow: colors.shadows.md
                    }}
                  >
                    <h4 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      marginBottom: spacing[3],
                      color: colors.gray[50]
                    }}>
                      {date.nombre || 'Fecha del evento'}
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing[2]
                    }}>
                      <p style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.primary[500],
                        fontWeight: typography.fontWeight.medium
                      }}>
                        📅 {new Date(date.fecha).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {date.hora_inicio && (
                        <p style={{
                          fontSize: typography.fontSize.sm,
                          color: colors.gray[300]
                        }}>
                          🕐 {date.hora_inicio}{date.hora_fin ? ` - ${date.hora_fin}` : ''}
                        </p>
                      )}
                      {date.lugar && (
                        <p style={{
                          fontSize: typography.fontSize.sm,
                          color: colors.gray[300]
                        }}>
                          📍 {date.lugar}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

