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
import EventCard from "../../components/explore/cards/EventCard";
import { supabase } from "../../lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";
import RitmosChips from "../../components/RitmosChips";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";

// Componente de Carrusel
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
    <div
      id="user-profile-carousel"
      data-baile-id="user-profile-carousel"
      data-test-id="user-profile-carousel"
      className="carousel-container"
    >
      {/* Carrusel Principal */}
      <div
        id="user-profile-carousel-main"
        data-baile-id="user-profile-carousel-main"
        data-test-id="user-profile-carousel-main"
        className="carousel-main"
      >
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
        <div className="carousel-counter">
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Botones de navegación */}
        {photos.length > 1 && (
          <>
            <button
              id="user-profile-carousel-prev"
              data-baile-id="user-profile-carousel-prev"
              data-test-id="user-profile-carousel-prev"
              onClick={prevPhoto}
              className="carousel-nav-btn carousel-nav-prev"
            >
              ‹
            </button>
            <button
              id="user-profile-carousel-next"
              data-baile-id="user-profile-carousel-next"
              data-test-id="user-profile-carousel-next"
              onClick={nextPhoto}
              className="carousel-nav-btn carousel-nav-next"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {photos.length > 1 && (
        <div
          id="user-profile-carousel-thumbnails"
          data-baile-id="user-profile-carousel-thumbnails"
          data-test-id="user-profile-carousel-thumbnails"
          className="carousel-thumbnails"
        >
          {photos.map((photo, index) => (
            <motion.button
              key={index}
              id={`user-profile-carousel-thumbnail-${index}`}
              data-baile-id={`user-profile-carousel-thumbnail-${index}`}
              data-test-id={`user-profile-carousel-thumbnail-${index}`}
              onClick={() => goToPhoto(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`carousel-thumbnail ${currentIndex === index ? 'active' : ''}`}
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

// Usar el nuevo sistema de colores importado

export const UserProfileLive: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, updateProfileFields } = useUserProfile();
  const { data: allTags } = useTags();
  const { media, addMedia, removeMedia } = useUserMedia();
  const [copied, setCopied] = useState(false);

  // Estados para carga de media
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Fallback para cuando no hay perfil
  const safeMedia = media || [];
  const { data: rsvpEvents } = useUserRSVPEvents('interesado');

  // Debug logs
  React.useEffect(() => {
    console.log('[UserProfileLive] Profile data:', profile);
    console.log('[UserProfileLive] Redes Sociales:', profile?.redes_sociales);
    console.log('[UserProfileLive] Respuestas.redes:', profile?.respuestas?.redes);
    console.log('[UserProfileLive] RSVP Events:', rsvpEvents);
    console.log('[UserProfileLive] Media:', media);

    // Log específico para redes sociales
    if (profile?.redes_sociales) {
      console.log('[UserProfileLive] Instagram:', profile.redes_sociales.instagram);
      console.log('[UserProfileLive] TikTok:', profile.redes_sociales.tiktok);
      console.log('[UserProfileLive] YouTube:', profile.redes_sociales.youtube);
      console.log('[UserProfileLive] Facebook:', profile.redes_sociales.facebook);
      console.log('[UserProfileLive] WhatsApp:', profile.redes_sociales.whatsapp);
    }
  }, [profile, rsvpEvents, media]);

  // Get tag names from IDs
  const getRitmoNombres = () => {
    console.log('[UserProfileLive] getRitmoNombres - allTags:', allTags);
    console.log('[UserProfileLive] getRitmoNombres - profile.ritmos:', profile?.ritmos);
    if (!allTags || !profile?.ritmos) return [];
    const ritmos = profile.ritmos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
    console.log('[UserProfileLive] getRitmoNombres - resultado:', ritmos);
    return ritmos;
  };

  const getZonaNombres = () => {
    console.log('[UserProfileLive] getZonaNombres - allTags:', allTags);
    console.log('[UserProfileLive] getZonaNombres - profile.zonas:', profile?.zonas);
    if (!allTags || !profile?.zonas) return [];
    const zonas = profile.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
    console.log('[UserProfileLive] getZonaNombres - resultado:', zonas);
    return zonas;
  };

  // Upload cover photo
  const handleCoverUpload = async (file: File) => {
    if (!user) return;
    setUploadingCover(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `user-covers/${user.id}/cover.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(path);

      await updateProfileFields({
        respuestas: {
          ...profile?.respuestas,
          cover_url: publicUrl.publicUrl
        }
      });
    } catch (error) {
      console.error('Error uploading cover:', error);
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload photo to slot
  const handlePhotoUpload = async (file: File, slot: string) => {
    if (!user) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `user-media/${user.id}/${slot}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(path);

      // Usar addMedia para agregar nuevo media
      await addMedia.mutateAsync(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Upload video to slot
  const handleVideoUpload = async (file: File, slot: string) => {
    if (!user) return;
    setUploadingVideo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `user-media/${user.id}/${slot}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('media').getPublicUrl(path);

      // Usar addMedia para agregar nuevo media
      await addMedia.mutateAsync(file);
    } catch (error) {
      console.error('Error uploading video:', error);
    } finally {
      setUploadingVideo(false);
    }
  };

  // Get photos for carousel
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(safeMedia as any, slot))
    .filter(item => item && item.kind === 'photo')
    .map(item => item!.url);

  return (
    <>
      <style>{`
        .profile-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .profile-banner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .banner-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 3rem;
          align-items: center;
        }
        .question-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: center;
        }
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .section-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 1rem 0;
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .carousel-container {
          position: relative;
          max-width: 1000px;
          margin: 0 auto;
        }
        .carousel-main {
          position: relative;
          aspect-ratio: 4 / 5;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(0, 0, 0, 0.2);
          max-height: 480px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .carousel-thumbnails {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .carousel-thumbnail {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          background: transparent;
          padding: 0;
          transition: all 0.2s;
        }
        .carousel-thumbnail.active {
          border: 3px solid #E53935;
        }
        .carousel-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.25rem;
          transition: all 0.2s;
        }
        .carousel-nav-btn:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: translateY(-50%) scale(1.1);
        }
        .carousel-nav-prev {
          left: 1rem;
        }
        .carousel-nav-next {
          right: 1rem;
        }
        .carousel-counter {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
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
          .profile-container {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          .profile-banner {
            border-radius: 0 !important;
            padding: 1.5rem 1rem !important;
            margin: 0 !important;
          }
          .banner-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            justify-items: center !important;
            text-align: center !important;
          }
          .banner-grid h1 {
            font-size: 2rem !important;
            line-height: 1.2 !important;
          }
          .banner-avatar {
            width: 150px !important;
            height: 150px !important;
          }
          .banner-avatar-fallback {
            font-size: 3.5rem !important;
          }
          .question-section {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .question-section h3 {
            font-size: 1.1rem !important;
            margin-bottom: 0.75rem !important;
          }
          .events-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .carousel-container {
            max-width: 100% !important;
            padding: 0 1rem !important;
          }
          .carousel-main {
            max-height: 400px !important;
            aspect-ratio: 3 / 4 !important;
          }
          .carousel-thumbnails {
            gap: 0.25rem !important;
            margin-top: 0.75rem !important;
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
          .carousel-nav-prev {
            left: 0.5rem !important;
          }
          .carousel-nav-next {
            right: 0.5rem !important;
          }
          .carousel-counter {
            top: 0.5rem !important;
            right: 0.5rem !important;
            padding: 0.25rem 0.75rem !important;
            font-size: 0.75rem !important;
          }
          .section-title {
            font-size: 1.25rem !important;
            margin-bottom: 1rem !important;
          }
          .section-content {
            padding: 1rem !important;
          }
          .bio-section {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          .events-section {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          .gallery-section {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          .glass-card-container {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            border-radius: 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          .banner-grid h1 {
            font-size: 1.75rem !important;
          }
          .banner-avatar {
            width: 120px !important;
            height: 120px !important;
          }
          .banner-avatar-fallback {
            font-size: 3rem !important;
          }
          .carousel-main {
            max-height: 350px !important;
          }
          .carousel-thumbnail {
            width: 45px !important;
            height: 45px !important;
          }
          .carousel-nav-btn {
            width: 36px !important;
            height: 36px !important;
            font-size: 0.9rem !important;
          }
          .section-title {
            font-size: 1.1rem !important;
          }
          .glass-card-container {
            padding: 0.75rem !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: colors.darkBase,
        color: colors.light,
      }}>
        {/* Profile Toolbar - Toggle y Edición (Fixed) */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="user"
          />
        </div>

        {/* Banner Principal */}
        <div
          id="user-profile-banner"
          data-baile-id="user-profile-banner"
          data-test-id="user-profile-banner"
          className="profile-banner glass-card-container"
          style={{
            position: 'relative',
            margin: '0 auto',
            overflow: 'hidden'
          }}
        >
          {/* Botón discreto para compartir */}
          <button
            aria-label="Compartir perfil"
            title="Compartir"
            onClick={() => {
              try {
                const url = typeof window !== 'undefined' ? window.location.href : '';
                const title = profile?.display_name || 'Perfil';
                const text = `Mira el perfil de ${profile?.display_name || 'usuario'}`;
                const navAny = (navigator as any);
                if (navAny && typeof navAny.share === 'function') {
                  navAny.share({ title, text, url }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(url)
                    .then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    })
                    .catch(() => {});
                }
              } catch {}
            }}
            style={{
              position: 'absolute', top: 12, right: 12,
              width: 36, height: 36,
              display: 'grid', placeItems: 'center',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff', borderRadius: 999,
              backdropFilter: 'blur(8px)', cursor: 'pointer',
              zIndex: 10
            }}
          >
            📤
          </button>
          {copied && (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: 'absolute', top: 14, right: 56,
                padding: '4px 8px', borderRadius: 8,
                background: 'rgba(0,0,0,0.6)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                fontSize: 12, fontWeight: 700,
                zIndex: 10
              }}
            >
              Copiado
            </div>
          )}
          <div
            id="user-profile-banner-grid"
            data-baile-id="user-profile-banner-grid"
            data-test-id="user-profile-banner-grid"
            className="banner-grid"
          >
            {/* Columna 1: Avatar Grande */}
            <div
              id="user-profile-banner-avatar-container"
              data-baile-id="user-profile-banner-avatar-container"
              data-test-id="user-profile-banner-avatar-container"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div
                id="user-profile-banner-avatar"
                data-baile-id="user-profile-banner-avatar"
                data-test-id="user-profile-banner-avatar"
                className="banner-avatar"
                style={{
                  width: '250px',
                  height: '250px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '6px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
                  background: colors.gradients.primary
                }}
              >
                {getMediaBySlot(safeMedia as any, 'p1')?.url ? (
                  <ImageWithFallback
                    src={getMediaBySlot(safeMedia as any, 'p1')!.url}
                    alt="Avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="banner-avatar-fallback" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6rem',
                    fontWeight: '700',
                    color: 'white'
                  }}>
                    {profile?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
            </div>

            {/* Columna 2: Nombre y Chips */}
            <div
              id="user-profile-banner-info"
              data-baile-id="user-profile-banner-info"
              data-test-id="user-profile-banner-info"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                justifyContent: 'center'
              }}
            >
              <h1
                id="user-profile-display-name"
                data-baile-id="user-profile-display-name"
                data-test-id="user-profile-display-name"
                style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  margin: 0,
                  color: colors.light,
                  lineHeight: '1.2'
                }}
              >
                {profile?.display_name || 'Usuario'}
              </h1>

              {/* Chips de usuario */}
              <div
                id="user-profile-tags"
                data-baile-id="user-profile-tags"
                data-test-id="user-profile-tags"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
              >
                {(() => {
                  const slugs = normalizeRitmosToSlugs(profile, allTags);
                  return slugs.length > 0 ? (
                    <RitmosChips selected={slugs} onChange={() => {}} readOnly />
                  ) : null;
                })()}
                {getZonaNombres().map((nombre) => (
                  <Chip
                    key={`z-${nombre}`}
                    label={nombre}
                    icon="📍"
                    variant="zona"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div
          id="user-profile-main-content"
          data-baile-id="user-profile-main-content"
          data-test-id="user-profile-main-content"
          className="profile-container"
          style={{
            padding: '2rem',
            margin: '0 auto'
          }}
        >

          {/* Biografía */}
          {profile?.bio && (
          <motion.section
            id="user-profile-bio"
            data-baile-id="user-profile-bio"
            data-test-id="user-profile-bio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bio-section glass-card-container"
          >
              <h3 className="section-title">
                💬 Sobre mí
              </h3>
              <p style={{ lineHeight: 1.6, opacity: 0.9, fontSize: '1rem' }}>
                {profile.bio}
              </p>
            </motion.section>
          )}

          {/* Redes Sociales */}
          <div >
            <SocialMediaSection
              respuestas={profile?.respuestas}
              availablePlatforms={['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp']}
            />
          </div>

          {/* Sección 1: Foto - Pregunta */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="section-content glass-card-container"
          >
            <div className="question-section">
              {/* Foto */}
              <div style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain', // 🔹 se ve completa
                objectPosition: 'center',
                transition: 'transform 0.3s ease',
              }}>
                {getMediaBySlot(safeMedia as any, 'p2') ? (
                  <ImageWithFallback
                    src={getMediaBySlot(safeMedia as any, 'p2')!.url}
                    alt="Foto personal"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.875rem'
                  }}>
                    📷 Sin foto
                  </div>
                )}
              </div>

              {/* Pregunta */}
              <div>
              <h3 className="section-title">💡 Dime un dato curioso de ti</h3>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: colors.light
                }}>
                  {profile?.respuestas?.dato_curioso || "Aún no has compartido un dato curioso sobre ti. ¡Cuéntanos algo interesante!"}
                </div>
              </div>
            </div>
          </motion.section>

          {/* Sección 2: Pregunta - Foto */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="section-content glass-card-container"
          >
            <div className="question-section">
              {/* Pregunta */}
              <div>
              <h3 className="section-title">💃 ¿Qué es lo que más te gusta bailar?</h3>
                <div style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: colors.light
                }}>
                  {profile?.respuestas?.gusta_bailar || "Aún no has compartido qué te gusta bailar. ¡Cuéntanos tu estilo favorito!"}
                </div>
              </div>

              {/* Foto */}
              <div style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain', // 🔹 se ve completa
                objectPosition: 'center',
                transition: 'transform 0.3s ease',
              }}>
                {getMediaBySlot(safeMedia as any, 'p3') ? (
                  <ImageWithFallback
                    src={getMediaBySlot(safeMedia as any, 'p3')!.url}
                    alt="Foto de baile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.875rem'
                  }}>
                    📷 Sin foto
                  </div>
                )}
              </div>
            </div>
          </motion.section>


          {/* Eventos de Interés */}
          <motion.section
            id="user-profile-interested-events"
            data-baile-id="user-profile-interested-events"
            data-test-id="user-profile-interested-events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="events-section glass-card-container"
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 className="section-title">
                ✨ Eventos de Interés
              </h3>
              {rsvpEvents && rsvpEvents.length > 0 && (
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  {rsvpEvents.length} evento{rsvpEvents.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {rsvpEvents && rsvpEvents.length > 0 ? (
              <div className="events-grid">
                {rsvpEvents.map((rsvp: any, index: number) => {
                  const evento = rsvp.events_date;
                  if (!evento) return null;
                  return (
                    <motion.div key={rsvp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                      <EventCard item={evento} />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(255, 255, 255, 0.2)'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  color: colors.light
                }}>
                  Sin eventos de interés por ahora
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  opacity: 0.7,
                  marginBottom: '1.5rem',
                  color: colors.light
                }}>
                  Explora eventos y marca los que te interesen para verlos aquí
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/explore')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🔍 Explorar Eventos
                </motion.button>
              </motion.div>
            )}
          </motion.section>

          {/* Slot para Foto Principal */}
          {getMediaBySlot(safeMedia as any, 'p1') && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain', // 🔹 se ve completa
                objectPosition: 'center',
                transition: 'transform 0.3s ease',
              }}>
                <ImageWithFallback
                  src={getMediaBySlot(safeMedia as any, 'p1')!.url}
                  alt="Foto principal"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            </motion.section>
          )}

          {/* Slot Video */}
          {getMediaBySlot(safeMedia as any, 'v1') && (
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
                display: 'flex',
                justifyContent: 'center'
              }}
            ><h3 className="section-title">🎥 Video Principal</h3>
              <div style={{
                width: '100%',
                maxWidth: '600px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.1)',

              }}>   
                <video
                  src={getMediaBySlot(safeMedia as any, 'v1')!.url}
                  controls
                  style={{
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '4 / 5',
                    display: 'block',
                    objectFit: 'contain',
                    objectPosition: 'center',
                  }}
                />
              </div>
            </motion.section>
          )}

          {/* Galería de Fotos Mejorada */}
          {carouselPhotos.length > 0 && (
            <motion.section
              id="user-profile-photo-gallery"
              data-baile-id="user-profile-photo-gallery"
              data-test-id="user-profile-photo-gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="gallery-section glass-card-container"
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <h3 className="section-title">
                  📷 Galería de Fotos
                </h3>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light
                }}>
                  {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                </div>
              </div>

              <CarouselComponent photos={carouselPhotos} />
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
};
