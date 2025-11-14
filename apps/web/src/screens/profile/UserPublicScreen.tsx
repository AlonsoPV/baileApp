import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTags } from "../../hooks/useTags";
import { useAuth } from '@/contexts/AuthProvider';
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import EventCard from "../../components/explore/cards/EventCard";
import { supabase } from "../../lib/supabase";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";
import RitmosChips from "../../components/RitmosChips";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import { BioSection } from "../../components/profile/BioSection";
import { useFollowStatus } from "../../hooks/useFollowStatus";
import { useFollowerCounts } from "../../hooks/useFollowerCounts";
import { useFollowLists } from "../../hooks/useFollowLists";
import { useZonaCatalogGroups, ZonaGroupInfo } from '@/hooks/useZonaCatalogGroups';

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
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: allTags } = useTags();
  const [copied, setCopied] = useState(false);
  const [expandedZonaGroups, setExpandedZonaGroups] = useState<Record<string, boolean>>({});

  // Fetch public user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-public', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Usar vista pública para mejor seguridad (solo perfiles completos)
      const { data, error } = await supabase
        .from('v_user_public')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Fetch RSVPs for this user
  const { data: rsvpEvents } = useQuery({
    queryKey: ['user-rsvps', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_rsvp')
        .select(`*, events_date!inner(*, events_parent!inner(*, profiles_organizer!inner(*)))`)
        .eq('user_id', userId)
        .eq('status', 'interesado');
      if (error) throw error;
      return data || [];
    }
  });

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const resolveSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
      }
    };

    resolveSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const safeMedia = profile?.media || [];

  // Helper to convert Supabase storage paths to public URLs
  const toSupabasePublicUrl = (maybePath?: string): string | undefined => {
    if (!maybePath) return undefined;
    const v = String(maybePath).trim();
    if (/^https?:\/\//i.test(v) || v.startsWith('data:') || v.startsWith('/')) return v;
    const slash = v.indexOf('/');
    if (slash > 0) {
      const bucket = v.slice(0, slash);
      const path = v.slice(slash + 1);
      try {
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      } catch {
        return v;
      }
    }
    return v;
  };

  // Get avatar URL (prioritize p1 media slot for consistency)
  const avatarUrl = (() => {
    const p1 = getMediaBySlot(safeMedia as any, 'p1');
    if (p1?.url) return p1.url; // Ya viene como URL pública
    if (profile?.avatar_url) return toSupabasePublicUrl(profile.avatar_url);
    const avatar = getMediaBySlot(safeMedia as any, 'avatar');
    if (avatar?.url) return avatar.url;
    return undefined;
  })();

  // Get tag names from IDs
  const getRitmoNombres = () => {
    if (!allTags || !profile?.ritmos) return [];
    const ritmos = profile.ritmos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
    return ritmos;
  };

  const { groups: rawZonaGroups } = useZonaCatalogGroups(allTags);
  const zonaGroups = React.useMemo(() => {
    if (!profile?.zonas || !rawZonaGroups.length) return [];
    return rawZonaGroups
      .map(group => {
        const items = group.items.filter(item => profile.zonas.includes(item.id));
        return items.length ? { ...group, items } : null;
      })
      .filter(Boolean) as ZonaGroupInfo[];
  }, [rawZonaGroups, profile?.zonas]);

  const toggleZonaGroup = (groupId: string) => {
    setExpandedZonaGroups(prev => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? false),
    }));
  };

  // Get photos for carousel
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(safeMedia as any, slot))
    .filter(item => item && item.kind === 'photo')
    .map(item => item!.url);

  const profileUserId = profile?.user_id || profile?.id;
  const { counts, setCounts, refetch: refetchCounts } = useFollowerCounts(profileUserId);
  const { isFollowing, toggleFollow, loading: followLoading } = useFollowStatus(profileUserId);
  const isOwnProfile = session?.user?.id && profileUserId === session.user.id;
  const showFollowButton = !!session && !isOwnProfile && !!profileUserId;
  const { following, followers, refetch: refetchLists } = useFollowLists(profileUserId);
  const [networkTab, setNetworkTab] = useState<"following" | "followers">("followers");
  const networkList = networkTab === "following" ? following : followers;
  const networkIsEmpty = networkList.length === 0;
  const goToProfile = (id?: string) => {
    if (id) navigate(`/u/${id}`);
  };

  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>❌</div>
          <p>Perfil no encontrado</p>
        </div>
      </div>
    );
  }

  const handleShareProfile = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      const title = profile?.display_name || 'Perfil';
      const text = `Mira el perfil de ${profile?.display_name || 'usuario'}`;
      const navAny = (navigator as any);
      
      // Intentar usar Web Share API (móvil)
      if (navAny && typeof navAny.share === 'function') {
        try {
          await navAny.share({ title, text, url });
        } catch (shareError: any) {
          // Si el usuario cancela el share, no hacer nada
          if (shareError.name === 'AbortError') return;
          // Si falla, intentar copiar al portapapeles
          throw shareError;
        }
      } else {
        // Fallback: Copiar al portapapeles (escritorio)
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } else {
          // Fallback antiguo para navegadores sin clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = url;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      // Mostrar mensaje de error al usuario
      alert('No se pudo copiar el enlace. Intenta copiar la URL manualmente desde la barra de direcciones.');
    }
  };

  const handleToggleFollow = async () => {
    const result = await toggleFollow();
    if (result?.requiresAuth) {
      navigate('/auth/login');
      return;
    }

    // Refrescar contadores y listas después de seguir/dejar de seguir
    if (typeof result?.following === 'boolean') {
      // Actualización optimista local
      setCounts((prev) => ({
        following: prev.following,
        followers: Math.max(
          0,
          prev.followers + (result.following ? 1 : -1)
        ),
      }));
      
      // Refrescar datos desde el servidor después de un breve delay
      setTimeout(() => {
        refetchCounts();
        refetchLists();
      }, 500);
    }
  };

  return (
    <>
      <style>{`
        .profile-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        @media (max-width: 768px) {
          .page-shell { padding-top: 64px; }
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
            font-size: 2.6rem !important;
            line-height: 1.2 !important;
          }
          .banner-avatar {
            width: 200px !important;
            height: 200px !important;
          }
          .banner-avatar-fallback {
            font-size: 4.25rem !important;
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
            font-size: 2.1rem !important;
          }
          .banner-avatar {
            width: 170px !important;
            height: 170px !important;
          }
          .banner-avatar-fallback {
            font-size: 4rem !important;
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
      <div className="page-shell" style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: colors.darkBase,
        color: colors.light,
      }}>
        {/* Public view: toggle removed */}

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
            onClick={handleShareProfile}
            style={{
              position: 'absolute', top: 12, right: 12,
              width: 36, height: 36,
              display: 'grid', placeItems: 'center',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff', borderRadius: 999,
              backdropFilter: 'blur(8px)', cursor: 'pointer'
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
                fontSize: 12, fontWeight: 700
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
                {avatarUrl ? (
                  <ImageWithFallback
                    src={avatarUrl}
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

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <span
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  Sigues {counts.following}
                </span>
                <span
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  Seguidores {counts.followers}
                </span>

                {showFollowButton && (
                  <button
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    style={{
                      padding: '0.55rem 1.4rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(255,255,255,0.25)',
                      background: isFollowing
                        ? 'rgba(34, 197, 94, 0.25)'
                        : 'linear-gradient(135deg, rgba(59,130,246,0.65), rgba(147,51,234,0.65))',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: followLoading ? 'progress' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 8px 18px rgba(0,0,0,0.2)',
                      opacity: followLoading ? 0.7 : 1
                    }}
                  >
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </button>
                )}
              </div>

              {/* Chips de usuario */}
              <div
                id="user-profile-tags"
                data-baile-id="user-profile-tags"
                data-test-id="user-profile-tags"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                {(() => {
                  const slugs = normalizeRitmosToSlugs(profile, allTags);
                  return slugs.length > 0 ? (
                    <RitmosChips selected={slugs} onChange={() => {}} readOnly />
                  ) : null;
                })()}
                {zonaGroups.length > 0 && (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {zonaGroups.map((group) => {
                        const hasSelection = group.items.some(({ id }) => profile?.zonas?.includes(id));
                        const expanded = expandedZonaGroups[group.id] ?? false;
                        return (
                          <Chip
                            key={group.id}
                            label={`${group.label} ${expanded ? '▾' : '▸'}`}
                            icon="📍"
                            variant="custom"
                            active={expanded || hasSelection}
                            onClick={() => toggleZonaGroup(group.id)}
                            style={{
                              alignSelf: 'flex-start',
                              width: 'fit-content',
                              minWidth: 'auto',
                              justifyContent: 'center',
                              paddingInline: '1rem',
                              background: (expanded || hasSelection)
                                ? 'rgba(76,173,255,0.18)'
                                : 'rgba(255,255,255,0.05)',
                              border: (expanded || hasSelection)
                                ? '1px solid rgba(76,173,255,0.6)'
                                : '1px solid rgba(255,255,255,0.15)',
                              borderRadius: 999,
                            }}
                          />
                        );
                      })}
                    </div>
                    {zonaGroups.map((group) => {
                      const expanded = expandedZonaGroups[group.id];
                      if (!expanded) return null;
                      return (
                        <div
                          key={`zona-readonly-${group.id}`}
                          style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '0.5rem' }}
                        >
                          {group.items.map((chip) => (
                            <Chip
                              key={`z-${chip.id}`}
                              label={chip.label}
                              icon="📍"
                              variant="zona"
                              active={profile?.zonas?.includes(chip.id)}
                              style={{
                                background: profile?.zonas?.includes(chip.id)
                                  ? 'rgba(76,173,255,0.18)'
                                  : 'rgba(255,255,255,0.06)',
                                border: profile?.zonas?.includes(chip.id)
                                  ? '1.5px solid rgba(76,173,255,0.6)'
                                  : '1.5px solid rgba(255,255,255,0.25)',
                                color: '#fff',
                                fontWeight: 700,
                              }}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </>
                )}
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

          {/* Biografía y Redes Sociales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <BioSection 
              bio={profile?.bio}
              redes={profile?.redes_sociales || (profile?.respuestas as any)?.redes}
            />
          </motion.div>

          {/* Comunidad (pública) debajo de Bio */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-container"
            style={{ textAlign: 'left', marginTop: '1.25rem' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}
            >
              <h3 className="section-title" style={{ marginBottom: 0 }}>Comunidad</h3>
          <div
            style={{
              display: 'inline-flex',
              gap: '12px',
              background: 'rgba(30,30,35,0.6)',
              padding: '10px 12px',
              borderRadius: '28px',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 12px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)'
            }}
          >
                <button
                  onClick={() => setNetworkTab('followers')}
                  style={{
                border: networkTab === 'followers' ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '22px',
                padding: '0.65rem 1.35rem',
                background: networkTab === 'followers'
                  ? 'linear-gradient(135deg, rgba(82,144,250,0.95), rgba(174,94,255,0.95))'
                  : 'linear-gradient(135deg, rgba(40,40,48,0.7), rgba(30,30,40,0.7))',
                color: '#fff',
                fontWeight: 800,
                letterSpacing: 0.3,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: networkTab === 'followers'
                  ? '0 12px 28px rgba(82,144,250,0.35), inset 0 1px 0 rgba(255,255,255,0.22)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.08)',
                transform: networkTab === 'followers' ? 'translateY(-1px)' : 'translateY(0)'
                  }}
                >
                  <span style={{ opacity: 0.9, marginRight: 6 }}>★</span> Seguidores {counts.followers}
                </button>
                <button
                  onClick={() => setNetworkTab('following')}
                  style={{
                border: networkTab === 'following' ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '22px',
                padding: '0.65rem 1.35rem',
                background: networkTab === 'following'
                  ? 'linear-gradient(135deg, rgba(82,144,250,0.95), rgba(174,94,255,0.95))'
                  : 'linear-gradient(135deg, rgba(40,40,48,0.7), rgba(30,30,40,0.7))',
                color: '#fff',
                fontWeight: 800,
                letterSpacing: 0.3,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: networkTab === 'following'
                  ? '0 12px 28px rgba(82,144,250,0.35), inset 0 1px 0 rgba(255,255,255,0.22)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.08)',
                transform: networkTab === 'following' ? 'translateY(-1px)' : 'translateY(0)'
                  }}
                >
                  <span style={{ opacity: 0.9, marginRight: 6 }}>➜</span> Sigues {counts.following}
                </button>
              </div>
            </div>

            {networkIsEmpty ? (
              <div
                style={{
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.7)'
                }}
              >
                {networkTab === 'following'
                  ? `${profile.display_name || 'Este usuario'} aún no sigue a nadie.`
                  : `${profile.display_name || 'Este usuario'} todavía no tiene seguidores.`}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {/* Custom scrollbar styles */}
                <style>{`
                  .community-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,.25) transparent;
                    mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
                    -webkit-mask-image: linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
                  }
                  .community-scroll::-webkit-scrollbar { height: 8px; }
                  .community-scroll::-webkit-scrollbar-track { background: transparent; }
                  .community-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,.22);
                    border-radius: 999px;
                  }
                  .community-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,.35);
                  }
                `}</style>
                <div
                  className="community-scroll"
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {networkList.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => goToProfile(person.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.9rem',
                        padding: '0.9rem 1.1rem',
                        minWidth: '220px',
                        borderRadius: '18px',
                        border: '1px solid rgba(255,255,255,0.14)',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                        backdropFilter: 'blur(8px)',
                        cursor: 'pointer',
                        boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        scrollSnapAlign: 'start'
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 14px 28px rgba(0,0,0,0.28)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 24px rgba(0,0,0,0.22)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <ImageWithFallback
                          src={person.avatar_url || ''}
                          alt={person.display_name || 'Perfil'}
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid rgba(255,255,255,0.22)'
                          }}
                        />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
                            {person.display_name}
                          </div>
                        </div>
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.25rem' }}>›</span>
                    </button>
                  ))}
                </div>
                {/* Edge fades */}
                <div aria-hidden style={{ pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to right, rgba(18,18,18,1), rgba(18,18,18,0))' }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to left, rgba(18,18,18,1), rgba(18,18,18,0))' }} />
                </div>
              </div>
            )}
          </motion.section>

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
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '1.05rem',
                  lineHeight: '1.7',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: '400'
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
              <h3 className="section-title">¿Qué es lo que más te gusta bailar?</h3>
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '1.05rem',
                  lineHeight: '1.7',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: '400'
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
