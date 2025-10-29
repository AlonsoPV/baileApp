import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useTags } from "../../hooks/useTags";
import { useUserMedia } from "../../hooks/useUserMedia";
import { useUserRSVPEvents } from "../../hooks/useRSVP";
import { useAuth } from '@/contexts/AuthProvider';
import ProfileToolbar from "../../components/profile/ProfileToolbar";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
      {/* Carruse Principal */}
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

export const UserProfileLive: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfileFields } = useUserProfile();
  const { data: allTags } = useTags();
  const { media, addMedia, removeMedia } = useUserMedia();
  
  // Estados para carga de media
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  // Fallback para cuando no hay perfil
  const safeMedia = media || [];
  const { data: rsvpEvents } = useUserRSVPEvents('interesado');

  // Get tag names from IDs
  const getRitmoNombres = () => {
    if (!allTags || !profile?.ritmos) return [];
    return profile.ritmos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !profile?.zonas) return [];
    return profile.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  // Get photos for carousel
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(safeMedia as any, slot))
    .filter(item => item && item.kind === 'photo')
    .map(item => item!.url);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: ${typography.fontFamily.primary};
        }
        
        .user-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .user-banner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }
        
        .user-banner-grid {
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
        
        .glass-card-container {
          opacity: 1;
          margin-bottom: 2rem;
          padding: 2rem;
          text-align: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px;
          backdrop-filter: blur(10px);
          transform: none;
        }
        
        @media (max-width: 768px) {
          .user-container {
            max-width: 100% !important;
          }
          .user-banner {
            border-radius: 0 !important;
            padding: 2rem 1rem !important;
          }
          .user-banner-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
            justify-items: center !important;
            text-align: center !important;
          }
          .user-banner-avatar {
            width: 180px !important;
            height: 180px !important;
          }
          .user-banner-avatar-fallback {
            font-size: 4rem !important;
          }
          .glass-card-container {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            border-radius: 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          .glass-card-container {
            padding: 0.75rem !important;
            border-radius: 12px !important;
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
        <div className="user-container" style={{
          padding: spacing[4],
          position: 'relative',
          zIndex: 1
        }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="user"
          />
        </div>

        {/* Banner Principal */}
        <motion.div 
          id="user-banner"
          data-test-id="user-banner"
          className="user-banner" 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: 'relative',
            background: `linear-gradient(135deg, ${colors.dark[500]} 0%, ${colors.dark[400]} 100%)`,
            overflow: 'hidden',
            borderRadius: borderRadius['2xl'],
            padding: spacing[12],
            margin: spacing[4],
            border: `1px solid ${colors.glass.medium}`,
            boxShadow: colors.shadows.glass,
            zIndex: 1
          }}
        >
          <div className="user-banner-grid">
            {/* Columna 1: Avatar del Usuario */}
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
                id="user-avatar"
                data-test-id="user-avatar"
                className="user-banner-avatar" 
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
                {(getMediaBySlot(safeMedia as any, 'cover')?.url || getMediaBySlot(safeMedia as any, 'p1')?.url) ? (
                  <img
                    src={getMediaBySlot(safeMedia as any, 'cover')?.url || getMediaBySlot(safeMedia as any, 'p1')?.url || ''}
                    alt="Avatar del usuario"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="user-banner-avatar-fallback" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6rem',
                    fontWeight: typography.fontWeight.black,
                    color: colors.gray[50]
                  }}>
                    {profile?.display_name?.[0]?.toUpperCase() || '👤'}
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
                id="user-name"
                data-test-id="user-name"
                className="gradient-text"
                style={{
                  fontSize: typography.fontSize['5xl'],
                  fontWeight: typography.fontWeight.black,
                  margin: 0,
                  lineHeight: typography.lineHeight.tight,
                  textShadow: `0 4px 20px ${colors.primary[500]}40`
                }}
              >
                {profile?.display_name || 'Usuario'}
              </h1>

              {/* Chips de ritmos y zonas */}
              <div 
                id="user-chips"
                data-test-id="user-chips"
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

              {/* Estado del perfil */}
              <div style={{ display: 'flex', gap: spacing[2] }}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  style={{
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: borderRadius.full,
                    background: profile?.display_name 
                      ? `linear-gradient(135deg, ${colors.success}cc, ${colors.success}99)` 
                      : colors.gradients.secondary,
                    border: `2px solid ${profile?.display_name ? colors.success : colors.secondary[500]}`,
                    color: colors.gray[50],
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    backdropFilter: 'blur(10px)',
                    boxShadow: profile?.display_name 
                      ? `0 4px 16px ${colors.success}66` 
                      : `0 4px 16px ${colors.secondary[500]}66`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {profile?.display_name ? '✅' : '⏳'} {profile?.display_name ? 'Configurado' : 'Sin configurar'}
                </motion.span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div className="user-container" style={{ 
        
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        
        }}>
          {/* Biografía */}
          {profile?.bio && (
            <motion.section
              id="user-bio"
              data-test-id="user-bio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card-container"
            >
              <h3 style={{ 
                fontSize: typography.fontSize['2xl'], 
                marginBottom: spacing[4], 
                fontWeight: typography.fontWeight.bold,
                color: colors.gray[50]
              }}>
                💬 Sobre mí
              </h3>
              <p style={{ 
                lineHeight: typography.lineHeight.relaxed, 
                opacity: 0.9, 
                fontSize: typography.fontSize.lg,
                color: colors.gray[100]
              }}>
                {profile.bio}
              </p>
            </motion.section>
          )}

          {/* Redes Sociales */}
          <div
            id="user-social-media"
            data-test-id="user-social-media"
            className="glass-card-container"
          >
            <SocialMediaSection 
              respuestas={profile?.respuestas}
              redes_sociales={profile?.redes_sociales}
              title="Redes Sociales"
              availablePlatforms={['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp']}
            />
          </div>

          {/* Galería de Fotos */}
          {carouselPhotos.length > 0 && (
            <motion.section
              id="user-profile-photo-gallery"
              data-test-id="user-profile-photo-gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card-container"
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
            </motion.section>
          )}

          {/* Eventos de Interés */}
          {rsvpEvents && rsvpEvents.length > 0 && (
            <motion.section
              id="user-interested-events"
              data-test-id="user-interested-events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card-container"
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
                  ✨
                </div>
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.bold,
                    margin: 0,
                    color: colors.gray[50]
                  }}>
                    Eventos de Interés
                  </h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: colors.gray[300]
                  }}>
                    {rsvpEvents.length} evento{rsvpEvents.length !== 1 ? 's' : ''} que te interesan
                  </p>
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: spacing[4]
              }}>
                {rsvpEvents.map((event: any, index: number) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -4,
                      boxShadow: colors.shadows.lg
                    }}
                    onClick={() => navigate(`/social/fecha/${event.id}`)}
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
                      marginBottom: spacing[2],
                      color: colors.gray[50]
                    }}>
                      {event.nombre || 'Evento'}
                    </h4>
                    <p style={{
                      fontSize: typography.fontSize.sm,
                      opacity: 0.8,
                      color: colors.gray[300],
                      marginBottom: spacing[3]
                    }}>
                      {event.lugar && `📍 ${event.lugar}`}
                    </p>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.primary[500],
                      fontWeight: typography.fontWeight.medium
                    }}>
                      {event.fecha && format(new Date(event.fecha), 'PPP', { locale: es })}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
};
