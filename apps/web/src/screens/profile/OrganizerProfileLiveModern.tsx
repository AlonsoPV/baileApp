import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useEventParentsByOrganizer, useEventDatesByOrganizer } from "../../hooks/useEventParentsByOrganizer";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";

// Componente FAQ Accordion Moderno
const FAQAccordion: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{
        borderRadius: borderRadius.xl,
        border: `1px solid ${colors.glass.medium}`,
        overflow: 'hidden',
        transition: transitions.normal
      }}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: spacing[5],
          background: 'transparent',
          border: 'none',
          color: '#126E9E',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          textAlign: 'left',
          transition: transitions.normal
        }}
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.primary[500]
          }}
        >
          ▼
        </motion.span>
      </motion.button>
      
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: `0 ${spacing[5]} ${spacing[5]} ${spacing[5]}`,
          borderTop: `1px solid ${colors.glass.medium}`,
          background: colors.glass.light
        }}>
          <p style={{
            lineHeight: typography.lineHeight.relaxed,
            opacity: 0.9,
            fontSize: typography.fontSize.base,
            margin: 0,
            color: colors.gray[100]
          }}>
            {answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

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
          color: '#126E9E',
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
                color: '#126E9E',
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
                color: '#126E9E',
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
                color: '#126E9E',
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

export function OrganizerProfileLive() {
  const navigate = useNavigate();
  const { data: org, isLoading } = useMyOrganizer();
  const { data: parents } = useEventParentsByOrganizer(org?.id);
  const { data: eventDates } = useEventDatesByOrganizer(org?.id);
  const { media } = useOrganizerMedia();
  const { data: allTags } = useTags();

  // Obtener fotos del carrusel usando los media slots
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(media as any, slot)?.url)
    .filter(Boolean) as string[];

  // Obtener videos
  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(media as any, slot)?.url)
    .filter(Boolean) as string[];

  // Get tag names from IDs
  const getRitmoNombres = () => {
    if (!allTags || !(org as any)?.estilos) return [];
    return (org as any).estilos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !(org as any)?.zonas) return [];
    return (org as any).zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  if (isLoading) {
    return (
      <div style={{
        padding: spacing[12],
        textAlign: 'center',
        color: colors.gray[50],
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
        <p style={{ fontSize: typography.fontSize.lg }}>Cargando organizador...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{
        padding: spacing[12],
        textAlign: 'center',
        color: colors.gray[50],
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>❌</div>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
          No tienes perfil de organizador
        </h2>
        <p style={{ marginBottom: spacing[6], opacity: 0.7, fontSize: typography.fontSize.lg }}>
          Crea uno para organizar eventos
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile/organizer/edit')}
          style={{
            padding: `${spacing[4]} ${spacing[7]}`,
            borderRadius: borderRadius.full,
            border: 'none',
            background: colors.gradients.primary,
            color: '#126E9E',
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.bold,
            cursor: 'pointer',
            boxShadow: colors.shadows.glow,
            transition: transitions.normal
          }}
        >
          🎤 Crear Organizador
        </motion.button>
      </div>
    );
  }

  // Preparar items de "Fechas" (fechas publicadas)
  const getUpcomingDates = () => {
    const upcomingItems: any[] = [];
    
    eventDates?.forEach((date, index) => {
      const fechaNombre = (date as any).nombre || `Fecha ${fmtDate(date.fecha)}`;
      
      const horaFormateada = date.hora_inicio && date.hora_fin 
        ? `${date.hora_inicio} - ${date.hora_fin}`
        : date.hora_inicio || '';

      const item = {
        nombre: fechaNombre,
        date: fmtDate(date.fecha),
        time: horaFormateada,
        place: date.lugar || date.ciudad || '',
        href: `/social/fecha/${date.id}`,
        cover: Array.isArray(date.media) && date.media.length > 0 
          ? (date.media[0] as any)?.url || date.media[0]
          : undefined,
      };
      
      upcomingItems.push(item);
    });

    return upcomingItems;
  };

  const inviteItems = getUpcomingDates();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: ${typography.fontFamily.primary};
        }
        
        .org-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .org-banner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }
        
        .org-banner-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 3rem;
          align-items: center;
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
        
        @media (max-width: 768px) {
          .org-container {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          .org-banner {
            border-radius: 0 !important;
            padding: 2rem 1rem !important;
            margin: 1rem auto 0 auto !important;
          }
          .org-banner-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
            justify-items: center !important;
            text-align: center !important;
          }
          .org-banner-avatar {
            width: 180px !important;
            height: 180px !important;
          }
          .org-banner-avatar-fallback {
            font-size: 4rem !important;
          }
          .org-banner h1 {
            font-size: 2.5rem !important;
            line-height: 1.2 !important;
          }
          .org-banner .org-chips {
            justify-content: center !important;
            margin-bottom: 1rem !important;
          }
          .glass-card {
            margin-bottom: 1.5rem !important;
            padding: 1.5rem !important;
          }
          .glass-card h3 {
            font-size: 1.5rem !important;
          }
          .glass-card p {
            font-size: 1rem !important;
          }
          .carousel-main {
            aspect-ratio: 16/9 !important;
            max-width: 100% !important;
          }
          .carousel-thumbnails {
            gap: 0.5rem !important;
            margin-top: 1rem !important;
          }
          .carousel-thumbnail {
            width: 50px !important;
            height: 50px !important;
          }
          .carousel-nav-btn {
            width: 40px !important;
            height: 40px !important;
            font-size: 1rem !important;
          }
          .carousel-counter {
            font-size: 0.8rem !important;
            padding: 0.25rem 0.75rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .org-banner {
            padding: 1.5rem 1rem !important;
          }
          .org-banner-avatar {
            width: 150px !important;
            height: 150px !important;
          }
          .org-banner-avatar-fallback {
            font-size: 3rem !important;
          }
          .org-banner h1 {
            font-size: 2rem !important;
          }
          .glass-card {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
          }
          .glass-card h3 {
            font-size: 1.25rem !important;
          }
          .carousel-thumbnail {
            width: 40px !important;
            height: 40px !important;
          }
          .carousel-nav-btn {
            width: 36px !important;
            height: 36px !important;
          }
        }
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        color: colors.gray[50],
        width: '100%',
        position: 'relative'
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

        {/* Profile Toolbar - Toggle y Edición */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: spacing[4],
          position: 'relative',
          zIndex: 1
        }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="organizer"
          />
        </div>

        {/* Banner Principal */}
        <motion.div 
          id="organizer-banner"
          data-test-id="organizer-banner"
          className="org-banner" 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: 'relative',
            background: `linear-gradient(135deg, ${colors.dark[500]} 0%, ${colors.dark[400]} 100%)`,
            overflow: 'hidden',
            borderRadius: borderRadius['2xl'],
            padding: spacing[12],
            margin: `${spacing[20]} auto 0 auto`,
            maxWidth: '900px',
            width: '100%',
            border: `1px solid ${colors.glass.medium}`,
            boxShadow: colors.shadows.glass,
            zIndex: 1
          }}
        >
          <div className="org-banner-grid">
            {/* Columna 1: Logo del Organizador */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div 
                id="organizer-avatar"
                data-test-id="organizer-avatar"
                className="org-banner-avatar" 
                style={{
                  width: '250px',
                  height: '250px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `4px solid ${colors.glass.strong}`,
                  boxShadow: `${colors.shadows.glow}, 0 20px 40px rgba(0, 0, 0, 0.3)`,
                  background: colors.gradients.primary,
                  position: 'relative'
                }}
              >
                {getMediaBySlot(media as any, 'cover')?.url || getMediaBySlot(media as any, 'p1')?.url ? (
                  <img
                    src={getMediaBySlot(media as any, 'cover')?.url || getMediaBySlot(media as any, 'p1')?.url || ''}
                    alt="Logo del organizador"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="org-banner-avatar-fallback" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6rem',
                    fontWeight: typography.fontWeight.black,
                    color: colors.gray[50]
                  }}>
                    {org.nombre_publico?.[0]?.toUpperCase() || '🎤'}
                  </div>
                )}
                
                {/* Efecto de brillo */}
                <div className="shimmer-effect" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%'
                }} />
              </div>
            </motion.div>

            {/* Columna 2: Nombre, Chips y Estado */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[6],
                justifyContent: 'center'
              }}
            >
              <h1 
                id="organizer-name"
                data-test-id="organizer-name"
                className="gradient-text"
                style={{
                  fontSize: typography.fontSize['5xl'],
                  fontWeight: typography.fontWeight.black,
                  margin: 0,
                  lineHeight: typography.lineHeight.tight,
                  textShadow: `0 4px 20px ${colors.primary[500]}40`
                }}
              >
                {org.nombre_publico}
              </h1>

              {/* Chips de ritmos y zonas */}
              <div 
                id="organizer-chips"
                data-test-id="organizer-chips"
                style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: spacing[2],
                  marginBottom: spacing[2]
                }}
              >
                {getRitmoNombres().map((nombre) => (
                  <Chip 
                    key={`r-${nombre}`} 
                    label={nombre} 
                    icon="🎵" 
                    variant="ritmo" 
                  />
                ))}
                {getZonaNombres().map((nombre) => (
                  <Chip 
                    key={`z-${nombre}`} 
                    label={nombre} 
                    icon="📍" 
                    variant="zona" 
                  />
                ))}
              </div>

              {/* Estado del organizador */}
              <div style={{ display: 'flex', gap: spacing[2] }}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  style={{
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: borderRadius.full,
                    background: org.estado_aprobacion === 'aprobado' 
                      ? `linear-gradient(135deg, ${colors.success}cc, ${colors.success}99)` 
                      : colors.gradients.secondary,
                    border: `2px solid ${org.estado_aprobacion === 'aprobado' ? colors.success : colors.secondary[500]}`,
                    color: '#126E9E',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    backdropFilter: 'blur(10px)',
                    boxShadow: org.estado_aprobacion === 'aprobado' 
                      ? `0 4px 16px ${colors.success}66` 
                      : `0 4px 16px ${colors.secondary[500]}66`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {org.estado_aprobacion === 'aprobado' ? '✅' : '⏳'} {org.estado_aprobacion}
                </motion.span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div className="org-container" style={{ 
          padding: spacing[8],
          position: 'relative',
          zIndex: 1,
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Biografía */}
          {org.bio && (
            <motion.section
              id="organizer-bio"
              data-test-id="organizer-bio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[6],
                borderRadius: borderRadius['2xl']
              }}
            >
              <h3 style={{ 
                fontSize: typography.fontSize['2xl'], 
                marginBottom: spacing[4], 
                fontWeight: typography.fontWeight.bold,
                color: '#0277BD'
              }}>
                💬 Sobre nosotros
              </h3>
              <p style={{ 
                lineHeight: typography.lineHeight.relaxed, 
                opacity: 0.9, 
                fontSize: typography.fontSize.lg,
                color: '#0277BD'
              }}>
                {org.bio}
              </p>
            </motion.section>
          )}

          {/* Redes Sociales */}
          <div
            id="organizer-social-media"
            data-test-id="organizer-social-media"
          >
            <SocialMediaSection 
              respuestas={(org as any)?.respuestas}
              redes_sociales={(org as any)?.redes_sociales}
              title=" Sociales"
              availablePlatforms={['instagram', 'facebook', 'whatsapp']}
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                background: colors.gradients.glass,
                borderRadius: borderRadius['2xl'],
                border: `1px solid ${colors.glass.medium}`,
                boxShadow: colors.shadows.glass
              }}
            />
          </div>

          {/* Maestros Invitados */}
          <div
            id="organizer-invited-masters"
            data-test-id="organizer-invited-masters"
          >
            <InvitedMastersSection 
              masters={[]} // TODO: Conectar con datos reales en el siguiente sprint
              title="🎭 Maestros Invitados"
              showTitle={true}
              isEditable={false}
            />
          </div>

          {/* Próximas Fechas del Organizador */}
          {inviteItems.length > 0 && (
            <motion.section
              id="organizer-upcoming-dates"
              data-test-id="organizer-upcoming-dates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
                  📅
                </div>
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.bold,
                    margin: 0,
                    color: '#0277BD'
                  }}>
                    Próximas Fechas
                  </h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: '#0277BD'
                  }}>
                    {inviteItems.length} fecha{inviteItems.length !== 1 ? 's' : ''} programada{inviteItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Cards de fechas */}
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: spacing[4]
              }}>
                {inviteItems.map((ev, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -4,
                      boxShadow: colors.shadows.lg
                    }}
                    onClick={() => navigate(ev.href)}
                    className="glass-card"
                    style={{
                      padding: spacing[6],
                      borderRadius: borderRadius.xl,
                      cursor: 'pointer',
                      transition: transitions.normal
                    }}
                  >
                    <h4 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      marginBottom: spacing[3],
                      color: '#0277BD'
                    }}>
                      {ev.nombre}
                    </h4>
                    <p style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.primary[500],
                      fontWeight: typography.fontWeight.medium,
                      marginBottom: spacing[2]
                    }}>
                      📅 {ev.date}
                    </p>
                    {ev.time && (
                      <p style={{
                        fontSize: typography.fontSize.sm,
                        color: '#0277BD',
                        marginBottom: spacing[2]
                      }}>
                        🕐 {ev.time}
                      </p>
                    )}
                    {ev.place && (
                      <p style={{
                        fontSize: typography.fontSize.sm,
                        color: '#0277BD'
                      }}>
                        📍 {ev.place}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Mis Sociales */}
          {parents && parents.length > 0 && (
            <motion.section
              id="organizer-social-events"
              data-test-id="organizer-social-events"
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
                  🎭
                </div>
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.bold,
                    margin: 0,
                    color: '#0277BD'
                  }}>
                    Mis Sociales
                  </h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: '#0277BD'
                  }}>
                    {parents.length} social{parents.length !== 1 ? 'es' : ''} organizado{parents.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: spacing[4] }}>
                {parents.map((parent) => (
                  <motion.div
                    key={parent.id}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -4,
                      boxShadow: colors.shadows.lg
                    }}
                    onClick={() => navigate(`/social/${parent.id}`)}
                    className="glass-card"
                    style={{
                      padding: spacing[6],
                      borderRadius: borderRadius.xl,
                      cursor: 'pointer',
                      transition: transitions.normal
                    }}
                  >
                    <h4 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      marginBottom: spacing[2],
                      color: '#0277BD'
                    }}>
                      {parent.nombre}
                    </h4>
                    {parent.descripcion && (
                      <p style={{
                        fontSize: typography.fontSize.sm,
                        color: '#0277BD',
                        marginBottom: spacing[3]
                      }}>
                        {parent.descripcion}
                      </p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/social/${parent.id}`);
                      }}
                      style={{
                        padding: `${spacing[3]} ${spacing[6]}`,
                        background: colors.gradients.secondary,
                        border: 'none',
                        borderRadius: borderRadius.lg,
                        color: '#0277BD',
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: 'pointer',
                        transition: transitions.normal,
                        boxShadow: `0 4px 16px ${colors.secondary[500]}40`
                      }}
                    >
                      📅 Ver próximas fechas
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Galería de Fotos del Organizador */}
          {carouselPhotos.length > 0 && (
            <motion.section
              id="organizer-profile-photo-gallery"
              data-test-id="organizer-profile-photo-gallery"
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
                    color: '#0277BD'
                  }}>
                    Galería de Fotos
                  </h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: '#0277BD'
                  }}>
                    {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            
              <CarouselComponent photos={carouselPhotos} />
            </motion.section>
          )}

          {/* Sección de Videos del Organizador */}
          {videos.length > 0 && (
            <motion.section
              id="organizer-profile-video-gallery"
              data-test-id="organizer-profile-video-gallery"
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
                  background: colors.gradients.deep,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: `0 8px 24px ${colors.deep[500]}40`
                }}>
                  🎥
                </div>
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.bold,
                    margin: 0,
                    color: '#0277BD'
                  }}>
                    Videos del Organizador
                  </h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: '#0277BD'
                  }}>
                    {videos.length} video{videos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: spacing[6]
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
                      boxShadow: colors.shadows.lg
                    }}
                    style={{
                      aspectRatio: '16/9',
                      borderRadius: borderRadius.xl,
                      overflow: 'hidden',
                      border: `2px solid ${colors.glass.medium}`,
                      cursor: 'pointer',
                      transition: transitions.normal,
                      position: 'relative',
                      background: colors.dark[400],
                      boxShadow: colors.shadows.md
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
                      top: spacing[4],
                      right: spacing[4],
                      background: colors.glass.darker,
                      color: '#126E9E',
                      padding: `${spacing[2]} ${spacing[4]}`,
                      borderRadius: borderRadius.lg,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      boxShadow: colors.shadows.md,
                      backdropFilter: 'blur(10px)'
                    }}>
                      🎥 Video {index + 1}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Información para Asistentes - FAQ */}
          {((org as any)?.respuestas?.musica_tocaran || (org as any)?.respuestas?.hay_estacionamiento) && (
            <motion.section
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
                  background: colors.gradients.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: `0 8px 24px ${colors.secondary[500]}40`
                }}>
                  ❓
                </div>
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.bold,
                    margin: 0,
                    color: '#0277BD'
                  }}>
                    Información para Asistentes
                  </h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: '#0277BD'
                  }}>
                    Preguntas frecuentes
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                {/* FAQ Item: Música */}
                {(org as any)?.respuestas?.musica_tocaran && (
                  <FAQAccordion
                    question="🎵 ¿Qué música tocarán?"
                    answer={(org as any)?.respuestas?.musica_tocaran}
                  />
                )}
                
                {/* FAQ Item: Estacionamiento */}
                {(org as any)?.respuestas?.hay_estacionamiento && (
                  <FAQAccordion
                    question="🅿️ ¿Hay estacionamiento?"
                    answer={(org as any)?.respuestas?.hay_estacionamiento}
                  />
                )}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
}

