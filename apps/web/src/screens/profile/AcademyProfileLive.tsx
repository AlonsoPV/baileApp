import React, { useState, useMemo, useCallback, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAcademyMy } from "../../hooks/useAcademy";
import { useAcademyMedia } from "../../hooks/useAcademyMedia";
import { useTags } from "../../hooks/useTags";
import ImageWithFallback from "../../components/ImageWithFallback";
import { toDirectPublicStorageUrl } from "../../utils/imageOptimization";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import { useLiveClasses } from '../../hooks/useLiveClasses';
import { useUpsertAcademy } from "../../hooks/useAcademy";
import { BioSection } from "../../components/profile/BioSection";
import { useAcceptedTeachers } from "../../hooks/useAcademyTeacherInvitations";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import RitmosChips from "../../components/RitmosChips";
import { Chip } from "../../components/profile/Chip";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import HorizontalSlider from "../../components/explore/HorizontalSlider";
import { colors } from "../../theme/colors";
import { useCompetitionGroupsByAcademy } from "../../hooks/useCompetitionGroups";
import { useAuth } from "@/contexts/AuthProvider";
import BankAccountDisplay from "../../components/profile/BankAccountDisplay";
import { VideoPlayerWithPiP } from "../../components/video/VideoPlayerWithPiP";
import "./AcademyProfileLive.css";

// Lazy load heavy components
const ClasesLive = lazy(() => import('../../components/events/ClasesLive'));
const ClasesLiveTabs = lazy(() => import('../../components/classes/ClasesLiveTabs'));
const UbicacionesLive = lazy(() => import("../../components/locations/UbicacionesLive"));
const AcademyRatingComponent = lazy(() => import("../../components/academy/AcademyRatingComponent"));
const CompetitionGroupCard = lazy(() => import("../../components/explore/cards/CompetitionGroupCard"));

// Componente FAQ Accordion (memoizado)
const FAQAccordion = React.memo(function FAQAccordion({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <div style={{
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      marginBottom: '0.75rem',
      overflow: 'hidden',
      background: 'rgba(255, 255, 255, 0.02)'
    }}>
      <button
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${question.slice(0, 10)}`}
        style={{
          width: '100%',
          padding: '1rem 1.5rem',
          background: 'transparent',
          border: 'none',
          color: 'white',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '1rem',
          fontWeight: '600',
          transition: 'all 0.2s',
          fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}
      >
        <span>{question}</span>
        <span style={{
          fontSize: '1.25rem',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: '0 1.5rem 1rem 1.5rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6,
            fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }}
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
});

// Componente para texto expandible (memoizado)
const ExpandableText = React.memo(function ExpandableText({ text, maxLength = 450 }: { text: string; maxLength?: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.substring(0, maxLength) + '...'
    : text;
  const toggleExpanded = useCallback(() => setIsExpanded(prev => !prev), []);

  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(5px)'
    }}>
      <p style={{
        fontSize: '1.1rem',
        lineHeight: 1.8,
        color: 'rgba(255, 255, 255, 0.95)',
        margin: 0,
        marginBottom: shouldTruncate ? '1rem' : 0,
        fontWeight: 400
      }}>
        {displayText}
      </p>
      {shouldTruncate && (
        <button
          onClick={toggleExpanded}
          className="expandable-text-toggle"
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
});

// Componente Carousel para videos (memoizado)
const VideoCarouselComponent = React.memo(function VideoCarouselComponent({ videos }: { videos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextVideo = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  }, [videos.length]);

  const prevVideo = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  }, [videos.length]);

  const goToVideo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (videos.length === 0) return null;

  return (
    <>
      
      <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Video principal */}
        <div className="video-gallery-main">
          <VideoPlayerWithPiP
            src={videos[currentIndex]}
            className="video-gallery-video"
            controls
            preload="metadata"
            controlsList="nodownload noplaybackrate"
            aspectRatio="16 / 9"
            aria-label={`Video ${currentIndex + 1} de ${videos.length}`}
          />

          {/* Contador */}
          <div className="video-gallery-counter">
            {currentIndex + 1} / {videos.length}
          </div>

          {/* Botones de navegación */}
          {videos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevVideo(); }}
                className="video-gallery-nav-btn video-gallery-nav-btn--prev"
                aria-label="Video anterior"
                disabled={videos.length <= 1}
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextVideo(); }}
                className="video-gallery-nav-btn video-gallery-nav-btn--next"
                aria-label="Video siguiente"
                disabled={videos.length <= 1}
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Miniaturas */}
        {videos.length > 1 && (
          <div className="video-gallery-thumbnails" role="tablist" aria-label="Miniaturas de videos">
            {videos.map((video, index) => (
              <button
                key={index}
                onClick={() => goToVideo(index)}
                className={`video-gallery-thumb ${index === currentIndex ? 'active' : ''}`}
                aria-label={`Ver video ${index + 1}`}
                aria-selected={index === currentIndex}
                role="tab"
              >
                <video src={video} muted preload="metadata" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
});

// Componente Carousel para fotos mejorado (memoizado)
const CarouselComponent = React.memo(function CarouselComponent({ photos }: { photos: string[] }) {
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

  if (photos.length === 0) return null;

  return (
    <>
     
      <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Imagen principal */}
        <div className="photo-gallery-main">
          <ImageWithFallback
            src={photos[currentIndex]}
            alt={`Foto ${currentIndex + 1}`}
            className="photo-gallery-image"
            onClick={() => setIsFullscreen(true)}
          />

          {/* Contador */}
          <div className="photo-gallery-counter">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Botones de navegación */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                className="photo-gallery-nav-btn photo-gallery-nav-btn--prev"
                aria-label="Foto anterior"
                disabled={photos.length <= 1}
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="photo-gallery-nav-btn photo-gallery-nav-btn--next"
                aria-label="Foto siguiente"
                disabled={photos.length <= 1}
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Miniaturas */}
        {photos.length > 1 && (
          <div className="photo-gallery-thumbnails" role="tablist" aria-label="Miniaturas de fotos">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => goToPhoto(index)}
                className={`photo-gallery-thumb ${index === currentIndex ? 'active' : ''}`}
                aria-label={`Ver foto ${index + 1}`}
                aria-selected={index === currentIndex}
                role="tab"
              >
                <ImageWithFallback
                  src={photo}
                  alt={`Miniatura ${index + 1}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pantalla completa */}
      {isFullscreen && (
        <div
          className="photo-gallery-fullscreen"
          onClick={() => setIsFullscreen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Vista de pantalla completa"
        >
          <button
            className="photo-gallery-fullscreen-close"
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
            aria-label="Cerrar pantalla completa"
          >
            ✕
          </button>
          <div className="photo-gallery-fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <ImageWithFallback
              src={photos[currentIndex]}
              alt={`Foto ${currentIndex + 1} - Pantalla completa`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
});

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return 'Gratis';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (numeric === null || Number.isNaN(numeric)) return `$${String(value)}`;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `$${Number(numeric).toLocaleString('en-US')}`;
  }
};

const formatDateOrDay = (fecha?: string, diaSemana?: number | null) => {
  if (fecha) {
    try {
      // Parsear fecha como hora local para evitar problemas de zona horaria
      const fechaOnly = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const [year, month, day] = fechaOnly.split('-').map(Number);
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        const parsed = new Date(year, month - 1, day);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('[AcademyProfileLive] Error formatting date:', e);
      }
    }
  }
  if (typeof diaSemana === 'number' && diaSemana >= 0 && diaSemana <= 6) {
    return dayNames[diaSemana];
  }
  return null;
};

const promotionTypeMeta: Record<string, { icon: string; label: string }> = {
  promocion: { icon: '✨', label: 'Promoción' },
  paquete: { icon: '🧾', label: 'Paquete' },
  descuento: { icon: '💸', label: 'Descuento' },
  membresia: { icon: '🎟️', label: 'Membresía' },
  otro: { icon: '💡', label: 'Otros' },
};

const promotionTypeStyles: Record<string, { background: string; border: string; color: string }> = {
  promocion: { background: 'rgba(240,147,251,0.16)', border: '1px solid rgba(240,147,251,0.28)', color: '#f3c6ff' },
  paquete: { background: 'rgba(59, 130, 246, 0.18)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#a7c8ff' },
  descuento: { background: 'rgba(255, 138, 101, 0.18)', border: '1px solid rgba(255, 138, 101, 0.35)', color: '#ffc1b3' },
  membresia: { background: 'rgba(129,199,132,0.18)', border: '1px solid rgba(129,199,132,0.32)', color: '#bdf2c1' },
  otro: { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: '#f1f5f9' },
};

const formatPriceLabel = (value: any): string | null => {
  // Si no hay precio (null, undefined, vacío), no mostrar nada
  if (value === undefined || value === null || value === '') return null;
  
  // Convertir a número
  const numeric = typeof value === 'number' ? value : Number(value);
  
  // Si no es un número válido, no mostrar
  if (Number.isNaN(numeric)) return null;
  
  // Si es cero, mostrar "Gratis"
  if (numeric === 0) return 'Gratis';
  
  // Si tiene valor, formatear como moneda
  return formatCurrency(numeric);
};

// Estilos constantes a nivel de módulo para evitar reinserción en cada render


export default function AcademyProfileLive() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: academy, isLoading, error, isError } = useAcademyMy();
  const { media } = useAcademyMedia();
  const { data: allTags } = useTags();
  const [copied, setCopied] = useState(false);
  
  // Obtener maestros aceptados
  const academyId = (academy as any)?.id;
  const { data: acceptedTeachers } = useAcceptedTeachers(academyId);
  const upsert = useUpsertAcademy();
  
  // Obtener clases desde las tablas academy_classes
  const { data: classesFromTables, isLoading: classesLoading } = useLiveClasses({ academyId });
  
  // Obtener grupos de competencia de la academia
  const { data: competitionGroups, isLoading: loadingGroups } = useCompetitionGroupsByAcademy(academyId);
  
  // Debug: verificar datos (solo en desarrollo)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AcademyProfileLive] academyId:', academyId);
      console.log('[AcademyProfileLive] competitionGroups:', competitionGroups);
      console.log('[AcademyProfileLive] loadingGroups:', loadingGroups);
      console.log('[AcademyProfileLive] Error state:', { isError, error });
    }
  }, [academyId, competitionGroups, loadingGroups, isError, error]);

  // ✅ Auto-redirigir a Edit si no tiene perfil de academia (solo si no hay error)
  // Si hay error, no redirigir para evitar perder el mensaje de error
  React.useEffect(() => {
    if (!isLoading && !academy && !isError) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AcademyProfileLive] No hay perfil y no hay error, redirigiendo a /edit');
      }
      navigate('/profile/academy/edit', { replace: true });
    }
  }, [isLoading, academy, isError, navigate]);

  // Memoizar fotos del carrusel
  const carouselPhotos = useMemo(() => 
    PHOTO_SLOTS
      .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot))
      .filter((m): m is MediaSlotItem => !!m && m.kind === 'photo' && !!m.url && typeof m.url === 'string' && m.url.trim() !== '' && !m.url.includes('undefined') && m.url !== '/default-media.png')
      .map(m => toDirectPublicStorageUrl(m.url) || m.url) as string[],
    [media]
  );

  const primaryAvatarUrl = useMemo(() => {
    const cover = getMediaBySlot(media as unknown as MediaSlotItem[], 'cover')?.url;
    const avatarSlot = getMediaBySlot(media as unknown as MediaSlotItem[], 'avatar')?.url;
    const p1 = getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url;
    // Prioridad requerida (avatar): avatar_url -> slot avatar -> p1 -> cover
    const raw = (academy as any)?.avatar_url || avatarSlot || p1 || cover || (academy as any)?.portada_url || null;
    if (!raw || typeof raw !== 'string' || !raw.trim() || raw.includes('undefined') || raw === '/default-media.png') return null;
    return toDirectPublicStorageUrl(raw) ?? raw;
  }, [media, academy]);

  const videos = useMemo(() =>
    VIDEO_SLOTS
      .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot))
      .filter((m): m is MediaSlotItem => !!m && m.kind === 'video' && !!m.url && typeof m.url === 'string' && m.url.trim() !== '' && !m.url.includes('undefined') && m.url !== '/default-media.png')
      .map(m => toDirectPublicStorageUrl(m.url) || m.url) as string[],
    [media]
  );

  // Memoizar datos de "Un poco más de nosotros"
  const fotoAbout = useMemo(() => getMediaBySlot(media as unknown as MediaSlotItem[], 'about'), [media]);
  const datoCurioso = useMemo(() => (academy as any)?.respuestas?.dato_curioso || '', [academy]);
  const verMasLink = useMemo(() => (academy as any)?.respuestas?.ver_mas_link || '', [academy]);
  const hasAboutSection = useMemo(() => fotoAbout || datoCurioso || verMasLink, [fotoAbout, datoCurioso, verMasLink]);

  // Memoizar nombres de ritmos
  const ritmoNombres = useMemo(() => {
    const names: string[] = [];
    if (allTags) {
      const tagToName = (ids?: number[]) => (ids || [])
        .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo')?.nombre)
        .filter(Boolean) as string[];
      // Prefer explicit ritmos, then estilos
      if (Array.isArray((academy as any)?.ritmos) && (academy as any).ritmos.length) {
        names.push(...tagToName((academy as any).ritmos));
      } else if (Array.isArray((academy as any)?.estilos) && (academy as any).estilos.length) {
        names.push(...tagToName((academy as any).estilos));
      }
    }
    // If no tag-based names, fallback to catalog IDs stored in ritmos_seleccionados
    if (names.length === 0 && Array.isArray((academy as any)?.ritmos_seleccionados)) {
      const labelById = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelById.set(i.id, i.label)));
      const extra = ((academy as any).ritmos_seleccionados as string[])
        .map(id => labelById.get(id))
        .filter(Boolean) as string[];
      names.push(...extra);
    }
    return names;
  }, [allTags, academy]);

  // Memoizar promociones
  const promotions = useMemo(() => 
    Array.isArray((academy as any)?.promociones) ? (academy as any).promociones : [],
    [academy]
  );

  // Handler para compartir
  const onShare = useCallback(() => {
    if (navigator.share && academyId && (academy as any)?.nombre_publico) {
      navigator.share({
        title: (academy as any).nombre_publico,
        text: `Mira el perfil de ${(academy as any).nombre_publico} en Donde Bailar MX`,
        url: window.location.href,
      }).catch(() => {
        // Fallback a copiar al portapapeles
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [academyId, academy]);

  if (isLoading) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Cargando academia...</p>
      </div>
    );
  }

  // Mostrar error si hay un problema de carga (no redirigir automáticamente)
  if (isError && error) {
    const errorMessage = (error as any)?.message || 'Error desconocido al cargar el perfil';
    const errorCode = (error as any)?.code;
    
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            Error al cargar perfil
          </h2>
          <p style={{ opacity: 0.7, marginBottom: '24px' }}>
            {errorMessage}
            {errorCode && ` (Código: ${errorCode})`}
          </p>
          <button
            onClick={() => {
              // Intentar recargar la página
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!academy) {
    return (
      <div style={{ padding: '16px' }}>
        {/* <pre
          style={{
            fontSize: 12,
            background: '#f3f4f6',
            padding: 8,
            marginBottom: 16,
            borderRadius: 8,
            whiteSpace: 'pre-wrap',
          }}
        >
          {JSON.stringify(
            {
              isLoadingUser: authLoading,
              user: user ? { id: user.id, email: (user as any).email ?? null } : null,
              isLoadingProfile: isLoading,
              hasProfile: !!academy,
              profilePreview: null,
              error: isError ? (error as any) ?? null : null,
            },
            null,
            2
          )}
        </pre> */}
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: colors.light,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
              Estamos cargando tu perfil...
            </h2>
            <p style={{ opacity: 0.7, marginBottom: '8px' }}>
              Redirigiendo a edición para crear tu perfil de academia
            </p>
            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
              Si tarda mucho, intenta refrescar la página para una carga más rápida.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const debugState = {
    isLoadingUser: authLoading,
    user: user ? { id: user.id, email: (user as any).email ?? null } : null,
    isLoadingProfile: isLoading,
    hasProfile: !!academy,
    profilePreview: academy
      ? {
          id: (academy as any).id,
          nombre_publico: (academy as any).nombre_publico || null,
        }
      : null,
    error: isError ? (error as any) ?? null : null,
  };

  return (
    <>
      {/* <div style={{ padding: 16, maxWidth: 900, margin: '0 auto 16px auto' }}>
        <pre
          style={{
            fontSize: 12,
            background: '#f3f4f6',
            padding: 8,
            marginBottom: 16,
            borderRadius: 8,
            whiteSpace: 'pre-wrap',
          }}
        >
          {JSON.stringify(debugState, null, 2)}
        </pre>
      </div> */}
  
      <div className="academy-container">
        {/* Navigation Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="academy"
          />
        </div>

        {/* Banner Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="academy-banner glass-card-container"
          style={{
            position: 'relative',
            margin: '0 auto',
            overflow: 'hidden',
            background: 'linear-gradient(165deg, rgba(8, 8, 14, 0.98) 0%, rgba(14, 12, 22, 0.97) 35%, rgba(10, 8, 16, 0.98) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          {/* Botón Volver a inicio */}
          <motion.button
            onClick={() => navigate('/explore')}
            whileHover={{ scale: 1.1, x: -3 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Volver a inicio"
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
            className="academy-hero-top-actions"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              zIndex: 12,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <button
              aria-label="Compartir perfil"
              title="Compartir"
              onClick={onShare}
              className="academy-hero-share-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(50, 50, 58, 0.8)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1.1rem'
              }}
            >
              📤
            </button>
          </div>
          {copied && <div role="status" aria-live="polite" style={{ position: 'absolute', top: 14, right: 64, padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 700, zIndex: 10 }}>Copiado</div>}
          <div className="academy-banner-grid">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div className="academy-banner-avatar">
                {primaryAvatarUrl ? (
                  <img
                    src={primaryAvatarUrl}
                    alt="Logo de la academia"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="academy-banner-avatar-fallback" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6rem',
                    fontWeight: '700',
                    color: 'white'
                  }}>
                    {academy.nombre_publico?.[0]?.toUpperCase() || '🎓'}
                  </div>
                )}
              </div>
              {/* Badge de verificación inline */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {((academy as any)?.estado_aprobacion === 'aprobado') && (
                  <div className="badge" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '.45rem',
                    padding: '.35rem .6rem',
                    borderRadius: '999px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #106c37, #0b5)',
                    border: '1px solid #13a65a',
                    boxShadow: '0 8px 18px rgba(0,0,0,.35)',
                    fontSize: '.82rem',
                    color: '#fff'
                  }}>
                    <div className="dot" style={{
                      width: '16px',
                      height: '16px',
                      display: 'grid',
                      placeItems: 'center',
                      background: '#16c784',
                      borderRadius: '50%',
                      color: '#062d1f',
                      fontSize: '.75rem',
                      fontWeight: 900
                    }}>✓</div>
                    <span>Verificado</span>
                  </div>
                )}
              </div>
            </div>

            <div>

              <h1 style={{
                fontSize: '3rem',
                display: 'inline',
                fontWeight: '800',
                color: 'white',
                margin: '0 0 0.5rem 0',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}>
                {academy.nombre_publico}
              </h1>
             {/*  {(academy as any)?.estado_aprobacion === 'aprobado' && (
                <span style={{
                  marginLeft: 12,
                  border: '1px solid rgb(255 255 255 / 40%)',
                  background: 'rgb(25 25 25 / 70%)',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  color: '#9be7a1',
                  whiteSpace: 'nowrap',
                  verticalAlign: 'middle',
                  display: 'inline-block'
                }}>
                  ✅
                </span>
              )} */}
              <p style={{
                fontSize: '1.25rem',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 1.5rem 0',
                lineHeight: 1.4
              }}>
                Academia de Baile
              </p>

              {/* Chips de Ritmos y Zonas dentro del banner */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(() => {
                  const slugs = normalizeRitmosToSlugs(academy, allTags);
                  return slugs.length > 0 ? (
                    <RitmosChips selected={slugs} onChange={() => {}} readOnly size="compact" />
                  ) : null;
                })()}
                <ZonaGroupedChips
                  selectedIds={academy.zonas}
                  allTags={allTags}
                  mode="display"
                />
              </div>

            </div>
            <div style={{ gridColumn: '1 / -1', width: '100%', marginTop: '1rem' }}>
              <BioSection 
                bio={academy.bio}
                redes={(academy as any)?.redes_sociales || (academy as any)?.respuestas?.redes}
                variant="banner"
              />
            </div>
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div style={{ padding: '2rem 0' }}>
          {/* Ritmos de Baile */}
          {/*   {academy.ritmos && academy.ritmos.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 1.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎵 Estilos que Enseñamos
              </h2>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                {ritmoNombres.map((ritmo, index) => (
                  <Chip
                    key={index}
                    label={ritmo}
                    active={true}
                    variant="ritmo"
                    style={{
                      background: 'rgba(229, 57, 53, 0.2)',
                      border: '1px solid #E53935',
                      color: '#E53935',
                      fontWeight: '600'
                    }}
                  />
                ))}
              </div>
            </motion.section>
          )} */}
          {/* Clases & Tarifas (visualización) */}
          {(() => {
            // Verificar si hay clases para mostrar
            const hasClassesFromTables = classesFromTables && classesFromTables.length > 0;
            // Usar cronograma como fuente principal, con horarios como fallback
            const cronogramaData = (academy as any)?.cronograma || (academy as any)?.horarios || [];
            const hasCronograma = Array.isArray(cronogramaData) && cronogramaData.length > 0;
            const hasClasses = hasClassesFromTables || hasCronograma;
            
            // Solo mostrar la sección si hay clases o si está cargando
            if (!classesLoading && !hasClasses) return null;
            
            return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="academy-section"
          >
            {/* Header destacado */}
            <div className="academy-section-header">
              <div className="academy-section-icon">🎓</div>
              <div className="academy-section-title-wrapper">
                <h2 className="academy-section-title">
                  Nuestras clases
                </h2>
                <p className="academy-section-subtitle">
                  Horarios, costos y ubicaciones
                </p>
              </div>
            </div>

            {/* Contenido de clases */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {classesLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                  Cargando clases...
                </div>
              ) : classesFromTables && classesFromTables.length > 0 ? (
                <Suspense fallback={<div role="status" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Cargando...</div>}>
                  <ClasesLiveTabs
                    classes={classesFromTables}
                    title=""
                    subtitle="Filtra por día — solo verás los días que sí tienen clases"
                    sourceType="academy"
                    sourceId={academy?.id}
                    isClickable={false}
                    whatsappNumber={(academy as any)?.whatsapp_number}
                    whatsappMessageTemplate={(academy as any)?.whatsapp_message_template || 'Hola, me interesa la clase: {nombre}'}
                    stripeAccountId={(academy as any)?.stripe_account_id}
                    stripeChargesEnabled={(academy as any)?.stripe_charges_enabled}
                    creatorName={(academy as any)?.nombre_publico || (academy as any)?.display_name}
                  />
                </Suspense>
              ) : (
                <>
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{ padding: '0.5rem', marginBottom: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: 8, fontSize: '0.75rem', color: '#fff' }}>
                      Debug: Fallback a ClasesLive. ClassesFromTables: {classesFromTables?.length || 0} clases
                    </div>
                  )}
                  <Suspense fallback={<div role="status" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Cargando...</div>}>
                    <ClasesLive
                      title=""
                      cronograma={(academy as any)?.cronograma || (academy as any)?.horarios || []}
                      costos={(academy as any)?.costos || []}
                      ubicacion={{
                        nombre: (academy as any)?.ubicaciones?.[0]?.nombre,
                        direccion: (academy as any)?.ubicaciones?.[0]?.direccion,
                      ciudad: (academy as any)?.ubicaciones?.[0]?.ciudad,
                      referencias: (academy as any)?.ubicaciones?.[0]?.referencias
                    }}
                    showCalendarButton={true}
                    sourceType="academy"
                    sourceId={academy?.id}
                    isClickable={false}
                    whatsappNumber={(academy as any)?.whatsapp_number}
                    whatsappMessageTemplate={(academy as any)?.whatsapp_message_template || 'Hola, me interesa la clase: {nombre}'}
                  />
                  </Suspense>
                </>
              )}
            </div>
          </motion.section>
            );
          })()}

          {promotions.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="promo-section"
            >
              <header className="promo-header">
                <div className="promo-icon">💸</div>
                <div>
                  <h2>Promociones y Paquetes</h2>
                  <p>Ofertas especiales y descuentos disponibles</p>
                </div>
              </header>

              <div className="promo-list">
                {promotions.map((promo: any, index: number) => {
                  const typeKey = promo?.tipo && promotionTypeMeta[promo.tipo] ? promo.tipo : 'otro';
                  const typeMeta = promotionTypeMeta[typeKey];
                  const priceLabel = formatPriceLabel(promo?.precio);
                  const isDestacado = typeKey === 'promocion' || typeKey === 'descuento';
                  
                  // Formatear el precio: extraer número y formatear con comas
                  let priceNumber: string | null = null;
                  if (priceLabel && priceLabel !== 'Gratis') {
                    const numeric = typeof promo?.precio === 'number' ? promo.precio : Number(promo?.precio);
                    if (!Number.isNaN(numeric) && numeric > 0) {
                      priceNumber = numeric.toLocaleString('en-US');
                    }
                  }

                  return (
                    <motion.article
                      key={`${promo?.nombre || 'promo'}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="promo-card"
                    >
                      <div className="promo-info">
                        <span className={`promo-chip${isDestacado ? ' promo-chip--destacado' : ''}`}>
                          {typeMeta.icon} {typeMeta.label}
                        </span>
                        <h3>{promo?.nombre || 'Promoción'}</h3>
                        {promo?.descripcion && (
                          <p className="promo-desc">{promo.descripcion}</p>
                        )}
                      </div>
                      {priceLabel !== null && (
                        <div className={`promo-price-box${isDestacado ? ' promo-price-box--destacado' : ''}`}>
                          <span className="promo-price">{priceNumber || priceLabel}</span>
                          <span className="promo-unit">MXN</span>
                        </div>
                      )}
                    </motion.article>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Grupos de Competencia */}
          {!loadingGroups && competitionGroups && Array.isArray(competitionGroups) && competitionGroups.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              style={{
                marginBottom: '2rem',
                marginTop: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #f093fb, #f5576c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)' }}>🏆</div>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>Grupos de Competencia</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500' }}>Grupos de entrenamiento y competencia</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {competitionGroups.map((group: any) => (
                  <Suspense key={group.id} fallback={<div role="status" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Cargando...</div>}>
                    <CompetitionGroupCard group={group} />
                  </Suspense>
                ))}
              </div>
            </motion.section>
          )}

          {/* Ubicaciones (live) */}
          {Array.isArray((academy as any)?.ubicaciones) && (academy as any).ubicaciones.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <Suspense fallback={<div role="status" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Cargando...</div>}>
                <UbicacionesLive
                  ubicaciones={(academy as any).ubicaciones}
                  headingSize="1.5rem"
                />
              </Suspense>
            </motion.section>
          )}

          {/* Datos de Cuenta Bancaria */}
          {(() => {
            const bankData = (academy as any)?.cuenta_bancaria;
            // Verificar que existe y no es solo un objeto vacío
            if (!bankData || typeof bankData !== 'object') return null;
            const hasBankData = bankData.banco || bankData.nombre || bankData.clabe || bankData.cuenta || bankData.concepto;
            if (!hasBankData) return null;
            return <BankAccountDisplay data={bankData} />;
          })()}

          {/* FAQ estilo Organizer (si hay FAQ en el perfil) */}
          {Array.isArray((academy as any)?.faq) && (academy as any).faq.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              style={{
                marginBottom: '2rem',
                marginTop: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #FB8C00, #FF7043)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 24px rgba(251, 140, 0, 0.4)' }}>❓</div>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>Información para Estudiantes</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500' }}>Preguntas frecuentes</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(academy as any).faq.map((faq: any, index: number) => (
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} style={{ padding: '1rem 1.25rem', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem' }}>{faq.q}</h4>
                    <p style={{ fontSize: '1rem', opacity: 0.85, margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Reseñas de Alumnos */}
          {Array.isArray((academy as any)?.reseñas) && (academy as any).reseñas.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              style={{
                marginBottom: '2rem',
                marginTop: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)' }}>⭐</div>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>Qué dicen nuestros alumnos</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500' }}>Testimonios de estudiantes</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {(academy as any).reseñas.map((review: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      padding: '1rem 1.25rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{review.author}</div>
                        {review.location && (
                          <div style={{ fontSize: '0.85rem', opacity: 0.75, color: 'rgba(255,255,255,0.8)' }}>{review.location}</div>
                        )}
                      </div>
                      <div style={{ letterSpacing: '0.15rem', fontSize: '0.9rem', color: '#FFD166' }}>
                        {'★'.repeat(review.rating || 5)}{'☆'.repeat(5 - (review.rating || 5))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', opacity: 0.85, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                      "{review.text}"
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Componente de Calificaciones */}
          {academy?.id && (
            <Suspense fallback={<div role="status" style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>Cargando...</div>}>
              <AcademyRatingComponent academyId={academy.id} />
            </Suspense>
          )}

          {/* Maestros Invitados */}
          {acceptedTeachers && acceptedTeachers.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="teachers-invited-section"
            >
              <div className="teachers-invited-header">
                <div className="teachers-invited-icon">🎭</div>
                <div>
                  <h3 className="teachers-invited-title">Maestros Invitados</h3>
                  <p className="teachers-invited-subtitle">Maestros que colaboran con la academia</p>
                </div>
              </div>
              <HorizontalSlider
                items={acceptedTeachers}
                renderItem={(t: any) => {
                  // Usar la misma lógica que AcademyPublicScreen.tsx para obtener la URL
                  // Primero cover, luego p1 - misma prioridad que "Foto del maestro" en TeacherProfileLive
                  const teacherMedia = Array.isArray(t.teacher_media) ? t.teacher_media : [];
                  const coverUrl = getMediaBySlot(teacherMedia as unknown as MediaSlotItem[], 'cover')?.url;
                  const p1Url = getMediaBySlot(teacherMedia as unknown as MediaSlotItem[], 'p1')?.url;
                  
                  // Construir media array con la misma prioridad que AcademyPublicScreen.tsx
                  const media: any[] = [];
                  // Priorizar portada (cover) para que se muestre en la card (misma lógica que TeacherProfileLive)
                  if (t.teacher_portada) {
                    media.push({ url: t.teacher_portada, type: 'image', slot: 'cover' });
                  }
                  // Luego avatar (p1) si existe
                  if (t.teacher_avatar) {
                    media.push({ url: t.teacher_avatar, type: 'image', slot: 'p1' });
                  }
                  // Si no hay portada ni avatar, usar teacher_media si existe
                  if (media.length === 0 && teacherMedia.length > 0) {
                    media.push(...teacherMedia);
                  }
                  
                  // Obtener la URL del banner usando la misma lógica que TeacherProfileLive.tsx
                  const bannerUrl = coverUrl || p1Url || t.teacher_portada || t.teacher_avatar || null;
                  
                  const teacherData = {
                    id: t.teacher_id,
                    nombre_publico: t.teacher_name,
                    bio: t.teacher_bio || '',
                    avatar_url: t.teacher_avatar || null,
                    portada_url: t.teacher_portada || null,
                    // Misma URL que "Foto del maestro" en TeacherProfileLive
                    banner_url: bannerUrl,
                    ritmos: Array.isArray(t.teacher_ritmos) ? t.teacher_ritmos : [],
                    zonas: Array.isArray(t.teacher_zonas) ? t.teacher_zonas : [],
                    media
                  };
                  return <TeacherCard key={t.teacher_id} item={teacherData} />;
                }}
                gap={24}
                autoColumns="280px"
              />
            </motion.section>
          )}




          {/* Sección: Un poco más de nosotros */}
          {hasAboutSection && (
            <>
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="about-section-container"
              >
                {/* Top gradient bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #E53935, #FB8C00, #FFD166)',
                  opacity: 0.9,
                  borderRadius: '24px 24px 0 0'
                }} />

                {/* Header */}
                <div className="about-section-header">
                  <div className="about-section-icon">
                    📖
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: '1.75rem',
                      fontWeight: 900,
                      margin: 0,
                      color: '#fff',
                      textShadow: '0 2px 8px rgba(229, 57, 53, 0.3), 0 0 16px rgba(251, 140, 0, 0.2)'
                    }}>
                      Un poco más de nosotros
                    </h2>
                    <p style={{
                      fontSize: '0.95rem',
                      opacity: 0.85,
                      margin: '0.25rem 0 0 0',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500
                    }}>
                      Conoce más sobre nuestra academia
                    </p>
                  </div>
                </div>

                <div className="about-section-content">
                  {/* Foto con botón debajo */}
                  {fotoAbout && (
                    <div className="about-section-photo">
                      <div style={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: 'rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <img
                          src={fotoAbout.url}
                          alt="Foto sobre nosotros"
                        />
                      </div>
                      {verMasLink && (
                        <a
                          href={verMasLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '1rem 2rem',
                            background: 'linear-gradient(135deg, rgba(30,136,229,0.25), rgba(124,77,255,0.25))',
                            border: '2px solid rgba(30,136,229,0.5)',
                            borderRadius: '16px',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '700',
                            textDecoration: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 8px 24px rgba(30,136,229,0.3)',
                            width: 'fit-content'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,136,229,0.35), rgba(124,77,255,0.35))';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,136,229,0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,136,229,0.25), rgba(124,77,255,0.25))';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,136,229,0.3)';
                          }}
                        >
                          <span>Conoce más</span>
                          <span style={{ fontSize: '1.2rem' }}>→</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Contenido de texto */}
                  {datoCurioso && (
                    <div style={{
                      width: '100%',
                      maxWidth: '600px',
                      padding: '0'
                    }}>
                      <ExpandableText text={datoCurioso} maxLength={450} />
                    </div>
                  )}

                  {/* Botón si no hay foto */}
                  {!fotoAbout && verMasLink && (
                    <a
                      href={verMasLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '1rem 2rem',
                        background: 'linear-gradient(135deg, rgba(30,136,229,0.25), rgba(124,77,255,0.25))',
                        border: '2px solid rgba(30,136,229,0.5)',
                        borderRadius: '16px',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 8px 24px rgba(30,136,229,0.3)',
                        width: 'fit-content'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,136,229,0.35), rgba(124,77,255,0.35))';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(30,136,229,0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,136,229,0.25), rgba(124,77,255,0.25))';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,136,229,0.3)';
                      }}
                    >
                      <span>Conoce más</span>
                      <span style={{ fontSize: '1.2rem' }}>→</span>
                    </a>
                  )}
                </div>
            </motion.section>
            </>
          )}

          {/* Sección de Videos */}
          {videos.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card-container"
              style={{
                marginBottom: '1.5rem',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Header con gradiente superior */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, rgba(240, 147, 251, 0.6), rgba(255, 209, 102, 0.6), rgba(240, 147, 251, 0.6))',
                borderRadius: '20px 20px 0 0'
              }} />
              
              {/* Header compacto */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(255, 209, 102, 0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    flexShrink: 0
                  }}>
                    🎥
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="section-title" style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.3 }}>
                      {videos.length > 1 ? 'Videos' : 'Video Principal'}
                    </h3>
                    <p style={{
                      margin: '0.15rem 0 0 0',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 400,
                      lineHeight: 1.2
                    }}>
                      Contenido multimedia destacado
                    </p>
                  </div>
                </div>
                {videos.length > 1 && (
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: colors.light
                  }}>
                    {videos.length} video{videos.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Carrusel de Videos o Video Individual */}
              {videos.length > 1 ? (
                <VideoCarouselComponent videos={videos} />
              ) : (
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
                  {/* Borde interno con gradiente */}
                  <div style={{
                    position: 'absolute',
                    inset: '3px',
                    borderRadius: '13px',
                    background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1), rgba(255, 209, 102, 0.1))',
                    pointerEvents: 'none',
                    zIndex: 1
                  }} />
                  
                  {/* Video */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    borderRadius: '13px',
                    overflow: 'hidden',
                    background: '#000',
                    zIndex: 2
                  }}>
                    <video
                      src={videos[0]}
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

                  {/* Efecto de brillo en las esquinas */}
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
              )}
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
}
