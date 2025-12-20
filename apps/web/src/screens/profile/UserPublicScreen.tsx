import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTags } from "../../hooks/useTags";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import EventCard from "../../components/explore/cards/EventCard";
import { supabase } from "../../lib/supabase";
import { colors } from "../../theme/colors";
import RitmosChips from "../../components/RitmosChips";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import { BioSection } from "../../components/profile/BioSection";
import { useFollowStatus } from "../../hooks/useFollowStatus";
import { useFollowerCounts } from "../../hooks/useFollowerCounts";
import { useFollowLists } from "../../hooks/useFollowLists";
import ZonaGroupedChips from '../../components/profile/ZonaGroupedChips';
import HorizontalSlider from "../../components/explore/HorizontalSlider";
import { useTranslation } from "react-i18next";

const STYLES = `
  .profile-container {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }
  @media (max-width: 768px) {
    .page-shell { padding-top: 0; }
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
  .events-section {
    width: 100%;
  }
  .events-section > div:first-child {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .profile-banner h2,
  .profile-banner h3,
  .profile-container h2,
  .profile-container h3 {
    color: #fff;
    text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
  }
  .section-title {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0 0 1rem 0;
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
    height: 350px;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.2);
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .carousel-main img {
    object-fit: contain !important;
    object-position: center !important;
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
  .carousel-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
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
  
  @media (max-width: 1024px) {
    .events-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
      gap: 1.25rem !important;
    }
  }
  @media (max-width: 768px) {
    .profile-container {
      max-width: 100% !important;
      padding: 0rem !important;
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
    .events-section > div:first-child {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.75rem !important;
    }
    .events-section > div:first-child > div:last-child {
      align-self: flex-start !important;
    }
    .carousel-container {
      max-width: 100% !important;
      padding: 0 1rem !important;
    }
    .carousel-main {
      height: 350px !important;
    }
    .carousel-main img {
      object-fit: contain !important;
      object-position: center !important;
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
    .question-section video {
      min-height: 350px !important;
      object-fit: contain !important;
    }
    .question-section > div:last-child {
      min-height: 350px !important;
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
      height: 350px !important;
    }
    .carousel-main img {
      object-fit: contain !important;
      object-position: center !important;
    }
    .question-section video {
      min-height: 350px !important;
      object-fit: contain !important;
    }
    .question-section > div:last-child {
      min-height: 350px !important;
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
    .events-grid {
      gap: 0.75rem !important;
    }
    .events-section > div:first-child {
      margin-bottom: 1rem !important;
    }
  }

  /* Ajustes finos solo para pantallas muy pequeñas (móviles ≤ 430px) */
  @media (max-width: 430px) {
    .profile-container {
      padding: 0 1rem !important;
    }
    .profile-banner {
      max-width: 100% !important;
    }
    .banner-grid h1 {
      font-size: 1.9rem !important;
      line-height: 1.2 !important;
    }
    .banner-avatar {
      width: 150px !important;
      height: 150px !important;
    }
    .section-title {
      font-size: 1rem !important;
      margin-bottom: 0.75rem !important;
    }
    .question-section {
      gap: 0.75rem !important;
    }
    .glass-card-container {
      padding: 0.75rem 0.9rem !important;
      margin-bottom: 0.85rem !important;
      border-radius: 12px !important;
    }
    .events-section {
      padding: 0.85rem !important;
    }
    .events-section .section-title {
      font-size: 1rem !important;
    }
    .events-grid {
      gap: 0.7rem !important;
    }
    .events-section > div:first-child {
      margin-bottom: 0.9rem !important;
    }
    /* Botones dentro de Eventos de Interés más compactos y sin pegarse a los bordes */
    .events-section button {
      padding: 0.6rem 1.1rem !important;
      border-radius: 10px !important;
      font-size: 0.85rem !important;
    }
  }
`;

const CarouselComponent = React.memo<{ photos: string[] }>(({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goToPhoto = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const handleFullscreenOpen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const handleFullscreenClose = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  if (photos.length === 0) return null;

  const hasMultiplePhotos = photos.length > 1;

  return (
    <div
      id="user-profile-carousel"
      data-baile-id="user-profile-carousel"
      data-test-id="user-profile-carousel"
      className="carousel-container"
    >
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
              objectFit: 'contain',
              objectPosition: 'center',
              cursor: 'pointer'
            }}
            onClick={handleFullscreenOpen}
          />
        </motion.div>

        <div className="carousel-counter">
          {currentIndex + 1} / {photos.length}
        </div>

        {hasMultiplePhotos && (
          <>
            <button
              id="user-profile-carousel-prev"
              data-baile-id="user-profile-carousel-prev"
              data-test-id="user-profile-carousel-prev"
              onClick={prevPhoto}
              className="carousel-nav-btn carousel-nav-prev"
              disabled={!hasMultiplePhotos}
            >
              ‹
            </button>
            <button
              id="user-profile-carousel-next"
              data-baile-id="user-profile-carousel-next"
              data-test-id="user-profile-carousel-next"
              onClick={nextPhoto}
              className="carousel-nav-btn carousel-nav-next"
              disabled={!hasMultiplePhotos}
            >
              ›
            </button>
          </>
        )}
      </div>

      {hasMultiplePhotos && (
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
          onClick={handleFullscreenClose}
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

            <button
              onClick={handleFullscreenClose}
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
});

CarouselComponent.displayName = 'CarouselComponent';

export const UserProfileLive: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: allTags } = useTags();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-public', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_user_public')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setLoadingTimedOut(false);
      const timeoutId = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 15000);
      return () => clearTimeout(timeoutId);
    }
    setLoadingTimedOut(false);
  }, [isLoading, userId]);

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

  const today = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isAvailableEventDate = React.useCallback((evento: any) => {
    if (!evento) return false;
    if (typeof (evento as any).dia_semana === 'number') return true;
    const raw = (evento as any).fecha;
    if (!raw) return false;
    try {
      const base = String(raw).split('T')[0];
      const [y, m, d] = base.split('-').map((n: string) => parseInt(n, 10));
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return true;
      const dt = new Date(y, m - 1, d);
      dt.setHours(0, 0, 0, 0);
      return dt >= today;
    } catch {
      return true;
    }
  }, [today]);

  const availableRsvpEvents = React.useMemo(() => {
    return (rsvpEvents || []).filter((r: any) => isAvailableEventDate(r.events_date));
  }, [rsvpEvents, isAvailableEventDate]);

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

  const safeMedia = React.useMemo(() => {
    const viewMedia = (profile as any)?.media;

    // Debug: verificar datos del perfil (vista pública)
    if (process.env.NODE_ENV === 'development' && profile) {
      console.log('[UserPublicScreen] Profile data (from view):', {
        hasMedia: !!(profile as any).media,
        mediaLength: Array.isArray(viewMedia) ? viewMedia.length : 0,
        mediaSample: Array.isArray(viewMedia) ? viewMedia.slice(0, 3) : viewMedia,
        mediaType: Array.isArray(viewMedia) ? 'array' : typeof viewMedia,
        hasRespuestas: !!(profile as any).respuestas,
        respuestas: (profile as any).respuestas,
      });
    }

    return Array.isArray(viewMedia) ? viewMedia : [];
  }, [profile]);

  const profileUserId = profile?.user_id || profile?.id;

  // Cargar media y respuestas desde la tabla base para asegurar que el perfil público tenga
  // la misma galería y secciones de preguntas que el perfil privado.
  const { data: profileFromTable } = useQuery({
    queryKey: ['user-public-profile-fields', profileUserId],
    enabled: !!profileUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_user')
        .select('media,respuestas')
        .eq('user_id', profileUserId)
        .maybeSingle();
      if (error) {
        console.error('[UserPublicScreen] Error fetching profile fields from profiles_user:', error);
        throw error;
      }
      return data || {};
    },
  });

  const mediaFromTable = React.useMemo(() => {
    const raw = (profileFromTable as any)?.media;
    return Array.isArray(raw) ? raw : [];
  }, [profileFromTable]);

  const respuestasFromTable = React.useMemo(() => {
    return (profileFromTable as any)?.respuestas || null;
  }, [profileFromTable]);

  const effectiveMedia = React.useMemo(() => {
    if (Array.isArray(mediaFromTable) && mediaFromTable.length > 0) {
      return mediaFromTable;
    }
    return safeMedia;
  }, [mediaFromTable, safeMedia]);

  const effectiveRespuestas = React.useMemo(() => {
    const fromView = (profile as any)?.respuestas;
    if (fromView && typeof fromView === 'object') {
      return fromView;
    }
    return respuestasFromTable;
  }, [profile, respuestasFromTable]);

  const toSupabasePublicUrl = React.useCallback((maybePath?: string): string | undefined => {
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
  }, []);

  const avatarUrl = React.useMemo(() => {
    const p1 = getMediaBySlot(effectiveMedia as any, 'p1');
    if (p1?.url) return p1.url;
    if (profile?.avatar_url) return toSupabasePublicUrl(profile.avatar_url);
    const avatar = getMediaBySlot(effectiveMedia as any, 'avatar');
    if (avatar?.url) return avatar.url;
    return undefined;
  }, [effectiveMedia, profile?.avatar_url, toSupabasePublicUrl]);

  const carouselPhotos = React.useMemo(() => {
    if (!effectiveMedia || !Array.isArray(effectiveMedia) || effectiveMedia.length === 0) {
      return [];
    }
    return PHOTO_SLOTS
      .map(slot => getMediaBySlot(effectiveMedia as any, slot))
      .filter(item => item && item.kind === 'photo' && item.url && typeof item.url === 'string' && item.url.trim() !== '')
      .map(item => item!.url);
  }, [effectiveMedia]);

  const { counts, setCounts, refetch: refetchCounts } = useFollowerCounts(profileUserId);
  const { isFollowing, toggleFollow, loading: followLoading } = useFollowStatus(profileUserId);
  const isOwnProfile = session?.user?.id && profileUserId === session.user.id;
  const showFollowButton = !!session && !isOwnProfile && !!profileUserId;
  const { following, followers, refetch: refetchLists } = useFollowLists(profileUserId);
  const [networkTab, setNetworkTab] = useState<"following" | "followers">("followers");
  const networkList = networkTab === "following" ? following : followers;
  const networkIsEmpty = networkList.length === 0;

  const communityCards: Array<{
    id: "followers" | "following";
    label: string;
    value: number;
    accent: string;
  }> = [
    {
      id: "following",
      label: t('following'),
      value: counts.following ?? 0,
      accent: "linear-gradient(120deg, rgba(94,234,212,0.65), rgba(59,130,246,0.65))",
    },
    {
      id: "followers",
      label: t('followers'),
      value: counts.followers ?? 0,
      accent: "linear-gradient(120deg, rgba(251,113,133,0.7), rgba(168,85,247,0.7))",
    },
  ];

  const goToProfile = useCallback((id?: string) => {
    if (id) navigate(`/u/${id}`);
  }, [navigate]);

  if (isLoading && !loadingTimedOut) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⏳</div>
            <div style={{ textAlign: 'center', maxWidth: '400px', padding: '0 16px' }}>
              <p style={{ marginBottom: '8px' }}>{t('loading_profile')}</p>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                {t('refresh_page_for_faster_load')}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading && loadingTimedOut) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 360 }}>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>⚠️</div>
            <p style={{ marginBottom: 8 }}>{t('could_not_load_profile')}</p>
            <p style={{ marginBottom: 16, opacity: 0.75, fontSize: '0.9rem' }}>
              {t('check_connection')}
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ padding: 24, textAlign: 'center', color: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: 16 }}>❌</div>
            <p>{t('profile_not_found')}</p>
          </div>
        </div>
      </>
    );
  }

  const handleShareProfile = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : '';
      const title = profile?.display_name || t('profile');
      const text = t('check_teacher_profile', { name: profile?.display_name || t('user') });
      const navAny = (navigator as any);
      
      if (navAny && typeof navAny.share === 'function') {
        try {
          await navAny.share({ title, text, url });
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') return;
          throw shareError;
        }
      } else {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } else {
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
      alert(t('could_not_copy_link'));
    }
  };

  const handleToggleFollow = async () => {
    const result = await toggleFollow();
    if (result?.requiresAuth) {
      navigate('/auth/login');
      return;
    }

    if (typeof result?.following === 'boolean') {
      setCounts((prev) => ({
        following: prev.following,
        followers: Math.max(
          0,
          prev.followers + (result.following ? 1 : -1)
        ),
      }));
      
      setTimeout(() => {
        refetchCounts();
        refetchLists();
      }, 500);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="page-shell" style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: colors.darkBase,
        color: colors.light,
        paddingTop: '0',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div
          id="user-profile-banner"
          data-baile-id="user-profile-banner"
          data-test-id="user-profile-banner"
          className="profile-banner glass-card-container"
          style={{
            position: 'relative',
            margin: '0.5rem auto 0 auto',
            overflow: 'hidden'
          }}
        >
          {/* Botón Volver a inicio */}
          <motion.button
            onClick={() => navigate('/explore')}
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.95 }}
            aria-label={t('back_to_start')}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(255,209,102,0.15))',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240,147,251,0.3), rgba(255,209,102,0.25))';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(240,147,251,0.4), 0 0 0 1px rgba(255,255,255,0.15) inset';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240,147,251,0.2), rgba(255,209,102,0.15))';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset';
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#f093fb' }}
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </motion.button>
          <div
            id="user-profile-banner-grid"
            data-baile-id="user-profile-banner-grid"
            data-test-id="user-profile-banner-grid"
            className="banner-grid"
          >
            <div
              id="user-profile-banner-avatar-container"
              data-baile-id="user-profile-banner-avatar-container"
              data-test-id="user-profile-banner-avatar-container"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem'
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
                    alt={t('avatar')}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top'
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
              
              <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={t('share_profile')}
                  title={t('share')}
                  onClick={handleShareProfile}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff',
                    borderRadius: 999,
                    backdropFilter: 'blur(12px)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.20), rgba(255,255,255,0.12))';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>📤</span>
                  <span>{t('share')}</span>
                </motion.button>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{ duration: 0.2 }}
                    role="status"
                    aria-live="polite"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginTop: '0.5rem',
                      padding: '6px 12px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.3)',
                      fontSize: 13,
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                      zIndex: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>✓</span>
                    <span>{t('copied')}</span>
                  </motion.div>
                )}
              </div>
            </div>

            <div
              id="user-profile-banner-info"
              data-baile-id="user-profile-banner-info"
              data-test-id="user-profile-banner-info"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
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
                  color: '#fff',
                  lineHeight: '1.2',
                  textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px'
                }}
              >
                {profile?.display_name || t('user')}
              </h1>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.8rem'
                }}
              >
                {[
                  { label: 'Followers', value: counts.followers, icon: '★', hue: 'rgba(236,72,153,0.2)' },
                  { label: 'Following', value: counts.following, icon: '➜', hue: 'rgba(59,130,246,0.2)' },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.55rem 1.1rem',
                      borderRadius: '18px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(0,0,0,0.25)',
                      color: '#fff',
                      boxShadow: '0 12px 26px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <span style={{ fontSize: '1rem', opacity: 0.9 }}>{chip.icon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                      <span style={{ fontSize: '0.75rem', letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                        {chip.label}
                      </span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{chip.value}</span>
                    </div>
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: `radial-gradient(circle at top right, ${chip.hue}, transparent 60%)`,
                        opacity: 0.9,
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                ))}
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
                    {isFollowing ? t('following') : t('follow')}
                  </button>
                )}
              </div>

              <div
                id="user-profile-tags"
                data-baile-id="user-profile-tags"
                data-test-id="user-profile-tags"
                style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                {(() => {
                  const slugs = normalizeRitmosToSlugs(profile, allTags);
                  return slugs.length > 0 ? (
                    <RitmosChips selected={slugs} onChange={() => {}} readOnly size="compact" />
                  ) : null;
                })()}
                <ZonaGroupedChips
                  selectedIds={profile?.zonas}
                  allTags={allTags}
                  mode="display"
                  icon="📍"
                  size="compact"
                />
              </div>
            </div>
          </div>
        </div>

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

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-container"
            style={{ 
              textAlign: 'left', 
              marginTop: '1.25rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className="section-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                  👥 Comunidad
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '0.4rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)'
                }}>
                  {communityCards.map((card) => {
                    const active = networkTab === card.id;
                    return (
                      <button
                        key={card.id}
                        onClick={() => setNetworkTab(card.id)}
                        style={{
                          border: 'none',
                          borderRadius: '12px',
                          padding: '0.6rem 1.2rem',
                          background: active ? card.accent : 'transparent',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          letterSpacing: 0.2,
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: active
                            ? '0 4px 12px rgba(68,55,155,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                            : 'none',
                          transform: active ? 'scale(1.02)' : 'scale(1)',
                          opacity: active ? 1 : 0.7,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.opacity = '0.85';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.opacity = '0.7';
                          }
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', opacity: active ? 0.95 : 0.75 }}>
                          {card.label}:
                        </span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                          {card.value.toLocaleString('es-MX')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {networkIsEmpty ? (
              <div
                style={{
                  padding: '2rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                  borderRadius: '20px',
                  border: '2px dashed rgba(255,255,255,0.2)',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.8)'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.8 }}>
                  {networkTab === 'following' ? '🔍' : '👋'}
                </div>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {networkTab === 'following'
                    ? t('no_following_yet', { name: profile.display_name || t('this_user') })
                    : t('no_followers_yet', { name: profile.display_name || t('this_user') })}
                </p>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div
                  className="community-scroll"
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    overflowX: 'auto',
                    padding: '0.5rem 0.25rem 1rem 0.25rem',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin'
                  }}
                >
                  {networkList.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => goToProfile(person.id)}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        padding: '1.25rem',
                        minWidth: '240px',
                        maxWidth: '240px',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'linear-gradient(135deg, rgba(30,30,40,0.98), rgba(20,20,30,0.95))',
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        scrollSnapAlign: 'start'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          inset: '-25% -35%',
                          background: networkTab === 'followers'
                            ? 'radial-gradient(circle, rgba(236,72,153,0.15), transparent 70%)'
                            : 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)',
                          opacity: 0.6,
                          pointerEvents: 'none',
                          transition: 'opacity 0.3s ease'
                        }}
                      />
                      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            position: 'relative',
                            width: 64,
                            height: 64,
                            minWidth: 64,
                            minHeight: 64,
                            flexShrink: 0,
                            borderRadius: '50%',
                            padding: '3px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ImageWithFallback
                              src={person.avatar_url || ''}
                              alt={person.display_name || t('profile')}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                                display: 'block'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ 
                          textAlign: 'left', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '0.4rem',
                          flex: 1,
                          minWidth: 0
                        }}>
                          <div style={{ 
                            fontWeight: 800, 
                            color: '#fff', 
                            fontSize: '1.05rem',
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {person.display_name || t('dancer')}
                          </div>
                          <span
                            style={{
                              alignSelf: 'flex-start',
                              padding: '0.25rem 0.7rem',
                              borderRadius: 999,
                              fontSize: '0.7rem',
                              letterSpacing: 0.4,
                              textTransform: 'uppercase',
                              background: networkTab === 'followers'
                                ? 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(168,85,247,0.25))'
                                : 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(147,51,234,0.25))',
                              border: '1px solid rgba(255,255,255,0.2)',
                              color: 'rgba(255,255,255,0.95)',
                              fontWeight: 600,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                            }}
                          >
                            {networkTab === 'followers' ? t('follows_you') : t('you_follow')}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          position: 'relative',
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid rgba(255,255,255,0.1)',
                          marginTop: '0.25rem'
                        }}
                      >
                        <span style={{ 
                          color: 'rgba(255,255,255,0.85)', 
                          fontSize: '0.85rem', 
                          fontWeight: 600,
                          letterSpacing: 0.2
                        }}>
                          {t('view_profile')}
                        </span>
                        <span style={{ 
                          color: '#fff', 
                          fontSize: '1.3rem', 
                          fontWeight: 700,
                          transition: 'transform 0.2s ease'
                        }}>→</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ 
                    width: 32, 
                    height: '100%', 
                    background: 'linear-gradient(to right, rgba(18,18,18,0.95), rgba(18,18,18,0))',
                    pointerEvents: 'none'
                  }} />
                  <div style={{ 
                    width: 32, 
                    height: '100%', 
                    background: 'linear-gradient(to left, rgba(18,18,18,0.95), rgba(18,18,18,0))',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>
            )}
          </motion.section>

          {(() => {
            const fotoP2 = getMediaBySlot(effectiveMedia as any, 'p2');
            const datoCurioso = (effectiveRespuestas as any)?.dato_curioso;
            const datoCuriosoTrimmed = typeof datoCurioso === 'string' ? datoCurioso.trim() : '';
            const hasSection1Content = (fotoP2?.url) || (datoCuriosoTrimmed && datoCuriosoTrimmed.length > 0);
            
            // Debug: verificar qué datos tenemos
            if (process.env.NODE_ENV === 'development') {
              console.log('[UserPublicScreen] Sección 1 - fotoP2:', fotoP2, 'datoCurioso:', datoCurioso, 'hasContent:', hasSection1Content);
            }
            
            if (!hasSection1Content) return null;
            
            return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="section-content glass-card-container"
          >
            <div className="question-section">
              <div style={{
                width: '100%',
                height: '100%',
                    objectFit: 'contain',
                objectPosition: 'center',
                transition: 'transform 0.3s ease',
              }}>
                    {fotoP2 ? (
                  <ImageWithFallback
                        src={fotoP2.url}
                    alt={t('personal_photo')}
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
                    {t('no_photo')}
                  </div>
                )}
              </div>

              <div>
              <h3 className="section-title">{t('curious_fact_title')}</h3>
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
                      {datoCuriosoTrimmed || t('no_curious_fact')}
                </div>
              </div>
            </div>
          </motion.section>
            );
          })()}

          {(() => {
            const fotoP3 = getMediaBySlot(effectiveMedia as any, 'p3');
            const gustaBailar = (effectiveRespuestas as any)?.gusta_bailar;
            const gustaBailarTrimmed = typeof gustaBailar === 'string' ? gustaBailar.trim() : '';
            const hasSection2Content = (fotoP3?.url) || (gustaBailarTrimmed && gustaBailarTrimmed.length > 0);
            
            // Debug: verificar qué datos tenemos
            if (process.env.NODE_ENV === 'development') {
              console.log('[UserPublicScreen] Sección 2 - fotoP3:', fotoP3, 'gustaBailar:', gustaBailar, 'hasContent:', hasSection2Content);
            }
            
            if (!hasSection2Content) return null;
            
            return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="section-content glass-card-container"
          >
            <div className="question-section">
              <div>
              <h3 className="section-title">{t('what_you_like_to_dance_title')}</h3>
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
                      {gustaBailarTrimmed || t('no_dance_style')}
                </div>
              </div>

              <div style={{
                width: '100%',
                height: '100%',
                    objectFit: 'contain',
                objectPosition: 'center',
                transition: 'transform 0.3s ease',
              }}>
                    {fotoP3 ? (
                  <ImageWithFallback
                        src={fotoP3.url}
                    alt={t('dance_photo')}
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
                    {t('no_photo')}
                  </div>
                )}
              </div>
            </div>
          </motion.section>
            );
          })()}

          <motion.section
            id="user-profile-interested-events"
            data-baile-id="user-profile-interested-events"
            data-test-id="user-profile-interested-events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="events-section glass-card-container"
          >
            <div className="events-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <h3 className="section-title" style={{ margin: 0 }}>
                {t('interested_events_title')}
              </h3>
              {availableRsvpEvents.length > 0 && (
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light,
                  whiteSpace: 'nowrap'
                }}>
                  {availableRsvpEvents.length === 1 
                    ? t('event_count', { count: availableRsvpEvents.length })
                    : t('event_count_plural', { count: availableRsvpEvents.length })}
                </div>
              )}
            </div>

            {availableRsvpEvents.length > 0 ? (
              <HorizontalSlider
                items={availableRsvpEvents.map((rsvp: any) => rsvp.events_date).filter(Boolean)}
                renderItem={(evento: any, index: number) => (
                  <motion.div
                    key={evento.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <EventCard item={evento} />
                  </motion.div>
                )}
                gap={20}
                autoColumns="minmax(320px, 400px)"
              />
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
                  {t('no_interested_events_yet')}
                </h4>
                <p style={{
                  fontSize: '0.875rem',
                  opacity: 0.7,
                  marginBottom: '1.5rem',
                  color: colors.light
                }}>
                  {t('explore_events_prompt')}
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
                  🔍 {t('explore_events')}
                </motion.button>
              </motion.div>
            )}
          </motion.section>

          {(() => {
            if (!effectiveMedia || !Array.isArray(effectiveMedia) || effectiveMedia.length === 0) {
              return null;
            }
            
            const videoV1 = getMediaBySlot(effectiveMedia as any, 'v1');
            
            // Debug: verificar qué datos tenemos
            if (process.env.NODE_ENV === 'development') {
              console.log('[UserPublicScreen] Video - videoV1:', videoV1, 'effectiveMedia length:', effectiveMedia.length);
            }
            
            if (!videoV1 || !videoV1.url || typeof videoV1.url !== 'string' || videoV1.url.trim() === '') {
              return null;
            }
            
            return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="section-content glass-card-container"
          >
            <div className="question-section">
              <div>
                <h3 className="section-title">🎥 {t('main_video')}</h3>
                {/* <div style={{
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '1.05rem',
                  lineHeight: '1.7',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: '400'
                }}>
                  Aquí puedes ver el video principal público de este perfil.
                </div> */}
              </div>

              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '480px',
                  margin: '0 auto',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2))',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                  padding: '3px'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: '3px',
                    borderRadius: '13px',
                    background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(255, 209, 102, 0.1))',
                    pointerEvents: 'none',
                    zIndex: 1
                  }} />
                  
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: '13px',
                    overflow: 'hidden',
                    background: '#000',
                    zIndex: 2
                  }}>
                    <video
                    src={videoV1.url}
                    controls
                    style={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '4 / 5',
                      display: 'block',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      minHeight: '350px'
                    }}
                  />
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    left: '5px',
                    width: '40px',
                    height: '40px',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 3
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '5px',
                    right: '5px',
                    width: '40px',
                    height: '40px',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 3
                  }} />
                </div>
              </div>
            </div>
          </motion.section>
            );
          })()}

          {carouselPhotos && Array.isArray(carouselPhotos) && carouselPhotos.length > 0 && (
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
