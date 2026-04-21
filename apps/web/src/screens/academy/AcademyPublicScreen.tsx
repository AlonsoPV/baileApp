// Public Academy Screen (replica visual de AcademyProfileLi  ve)
import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAcademyPublic } from "../../hooks/useAcademy";
import { useTags } from "../../hooks/useTags";
import { toDirectPublicStorageUrl } from "../../utils/imageOptimization";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot, normalizeMediaArray } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
// ❌ Toggle removido para vista pública
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import SeoHead from "@/components/SeoHead";
import { SEO_BASE_URL, SEO_LOGO_URL } from "@/lib/seoConfig";
import { buildShareUrl } from "@/utils/shareUrls";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import ClasesLive from "../../components/events/ClasesLive";
import ClasesLiveTabs from "../../components/classes/ClasesLiveTabs";
import { useLiveClasses } from "../../hooks/useLiveClasses";
import UbicacionesLive from "../../components/locations/UbicacionesLive";
import RitmosChips from "../../components/RitmosChips";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import { BioSection } from "../../components/profile/BioSection";
import { useAcceptedTeachers } from "../../hooks/useAcademyTeacherInvitations";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import HorizontalSlider from "../../components/explore/HorizontalSlider";
import AcademyRatingComponent from "../../components/academy/AcademyRatingComponent";
import CompetitionGroupCard from "../../components/explore/cards/CompetitionGroupCard";
import { useCompetitionGroupsByAcademy } from "../../hooks/useCompetitionGroups";
import { colors } from "../../theme/colors";
import BankAccountDisplay from "../../components/profile/BankAccountDisplay";
import { ProfileSkeleton } from "../../components/skeletons/ProfileSkeleton";
import { RefreshingIndicator } from "../../components/loading/RefreshingIndicator";
import { useSmartLoading } from "../../hooks/useSmartLoading";
import { useTranslation } from "react-i18next";
import { getLocaleFromI18n } from "../../utils/locale";
import { routes } from "../../routes/registry";
import { VideoPlayerWithPiP } from "../../components/video/VideoPlayerWithPiP";
import OrganizerPublicGallery from "../../components/profile/gallery/OrganizerPublicGallery";
import { EventHero } from "../../components/events/EventDetail";
import "../../components/events/EventDetail/eventDetailScreen.css";
import "./AcademyPublicScreen.css";

// FAQ
const FAQAccordion: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      marginBottom: '0.75rem',
      overflow: 'hidden',
      background: 'rgba(255, 255, 255, 0.02)'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', padding: '1rem 1.5rem', background: 'transparent', border: 'none',
          color: 'white', textAlign: 'left', cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', fontWeight: '600',
          transition: 'all 0.2s'
        }}
      >
        <span>{question}</span>
        <span style={{ fontSize: '1.25rem', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ padding: '0 1.5rem 1rem 1.5rem', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.6 }}
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
};

// Componente para texto expandible (se define dentro del componente para usar t())

// Componente Carousel para videos
const VideoCarouselComponent: React.FC<{ videos: string[] }> = React.memo(({ videos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useTranslation();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  if (videos.length === 0) return null;

  const nextVideo = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  }, [videos.length]);

  const prevVideo = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  }, [videos.length]);

  const goToVideo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return (
    <>
      <style>{`
        .video-gallery-main {
          position: relative;
          aspect-ratio: 16/9;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.15);
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1));
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .video-gallery-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.25);
        }
        .video-gallery-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          cursor: pointer;
        }
        .video-gallery-counter {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.7));
          backdrop-filter: blur(10px);
          color: white;
          padding: 0.6rem 1.2rem;
          border-radius: 24px;
          font-size: 0.875rem;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
        .video-gallery-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
          backdrop-filter: blur(10px);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 50%;
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.5rem;
          font-weight: 700;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }
        .video-gallery-nav-btn:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15));
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }
        .video-gallery-nav-btn:active {
          transform: translateY(-50%) scale(0.95);
        }
        .video-gallery-nav-btn--prev {
          left: 1.25rem;
        }
        .video-gallery-nav-btn--next {
          right: 1.25rem;
        }
        .video-gallery-thumbnails {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.75rem;
          margin-top: 1.5rem;
          max-width: 100%;
        }
        .video-gallery-thumb {
          position: relative;
          aspect-ratio: 16/9;
          border-radius: 12px;
          overflow: hidden;
          border: 3px solid transparent;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .video-gallery-thumb:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
        .video-gallery-thumb.active {
          border-color: #E53935;
          box-shadow: 0 0 0 2px rgba(229, 57, 53, 0.3), 0 8px 24px rgba(229, 57, 53, 0.4);
        }
        .video-gallery-thumb video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        @media (max-width: 768px) {
          .video-gallery-main {
            border-radius: 16px;
          }
          .video-gallery-counter {
            top: 1rem;
            right: 1rem;
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
          }
          .video-gallery-nav-btn {
            width: 44px;
            height: 44px;
            font-size: 1.25rem;
          }
          .video-gallery-nav-btn--prev {
            left: 1rem;
          }
          .video-gallery-nav-btn--next {
            right: 1rem;
          }
          .video-gallery-thumbnails {
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
            gap: 0.6rem;
            margin-top: 1.25rem;
          }
        }
        @media (max-width: 480px) {
          .video-gallery-main {
            border-radius: 12px;
          }
          .video-gallery-counter {
            top: 0.75rem;
            right: 0.75rem;
            padding: 0.4rem 0.8rem;
            font-size: 0.75rem;
          }
          .video-gallery-nav-btn {
            width: 40px;
            height: 40px;
            font-size: 1.1rem;
          }
          .video-gallery-nav-btn--prev {
            left: 0.75rem;
          }
          .video-gallery-nav-btn--next {
            right: 0.75rem;
          }
          .video-gallery-thumbnails {
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
            gap: 0.5rem;
            margin-top: 1rem;
          }
        }
      `}</style>
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
            aria-label={t('promotional_video')}
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
                aria-label={t('previous_video')}
                disabled={videos.length <= 1}
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextVideo(); }}
                className="video-gallery-nav-btn video-gallery-nav-btn--next"
                aria-label={t('next_video')}
                disabled={videos.length <= 1}
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Miniaturas */}
        {videos.length > 1 && (
          <div className="video-gallery-thumbnails">
            {videos.map((video, index) => (
              <button
                key={index}
                onClick={() => goToVideo(index)}
                className={`video-gallery-thumb ${index === currentIndex ? 'active' : ''}`}
                aria-label={t('see_photo', { index: index + 1 })}
              >
                <video src={video} muted />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
});

// promotionTypeMeta se define dentro del componente para usar t()

const formatCurrency = (value?: number | string | null) => {
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

// formatPriceLabel se define dentro del componente para usar t()


export default function AcademyPublicScreen() {
  const { academyId } = useParams();
  const navigate = useNavigate();
  const handleBack = React.useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(routes.app.explore);
    }
  }, [navigate]);
  const { t } = useTranslation();
  const locale = getLocaleFromI18n();
  const id = Number(academyId);
  const academyQuery = useAcademyPublic(!Number.isNaN(id) ? id : (undefined as any));
  const { data: academy, isLoading, isFetching } = academyQuery;
  const { isFirstLoad, isRefetching } = useSmartLoading(academyQuery);
  const { data: allTags } = useTags();
  const [copied, setCopied] = React.useState(false);

  const onShare = React.useCallback(() => {
    if (!id || Number.isNaN(id) || !academy) return;
    try {
      const url = buildShareUrl("academia", String(id));
      const title = (academy as any)?.nombre_publico || t("academy");
      const text = t("check_academy_profile", { name: title });
      const navAny = navigator as any;
      if (navAny?.share) {
        navAny
          .share({ title, text, url })
          .catch(() => {
            navigator.clipboard?.writeText(url).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }).catch(() => {});
          });
      } else {
        navigator.clipboard?.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }, [id, academy, t]);
  
  // promotionTypeMeta dentro del componente para usar t()
  const promotionTypeMeta = React.useMemo(() => ({
    clase_suelta: { icon: '🎫', label: t('single_class') },
    promocion: { icon: '✨', label: t('promotion') },
    paquete: { icon: '🧾', label: t('package') },
    descuento: { icon: '💸', label: t('discount') },
    membresia: { icon: '🎟️', label: t('membership') },
    otro: { icon: '💡', label: t('other') },
  }), [t]);
  
  // formatPriceLabel dentro del componente para usar t()
  const formatPriceLabel = React.useCallback((value: any): string | null => {
    if (value === undefined || value === null || value === '') return null;
    const numeric = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numeric)) return null;
    if (numeric === 0) return t('free');
    return formatCurrency(numeric);
  }, [t]);
  
  // ExpandableText dentro del componente para usar t()
  const ExpandableText: React.FC<{ text: string; maxLength?: number }> = ({ text, maxLength = 450 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = text.length > maxLength;
    const displayText = shouldTruncate && !isExpanded 
      ? text.substring(0, maxLength) + '...'
      : text;

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
          fontWeight: 400,
          fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>
          {displayText}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              alignSelf: 'flex-start',
              fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            {isExpanded ? t('see_less') : t('see_more')}
          </button>
        )}
      </div>
    );
  };
  
  // Obtener maestros aceptados
  const { data: acceptedTeachers } = useAcceptedTeachers(id);
  
  // Obtener clases desde las tablas academy_classes
  const { data: classesFromTables, isLoading: classesLoading } = useLiveClasses({ academyId: id });
  
  // Obtener grupos de competencia de la academia
  const { data: competitionGroups, isLoading: loadingGroups } = useCompetitionGroupsByAcademy(id);

  const media = useMemo(
    () => normalizeMediaArray((academy as any)?.media),
    [(academy as any)?.media],
  );
  const carouselPhotos = useMemo(() => PHOTO_SLOTS
    .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot))
    .filter((m): m is MediaSlotItem => !!m && m.kind === 'photo' && !!m.url && typeof m.url === 'string' && m.url.trim() !== '' && !m.url.includes('undefined') && m.url !== '/default-media.png')
    .map(m => toDirectPublicStorageUrl(m.url) || m.url) as string[], [media]);

  const videos = useMemo(() => VIDEO_SLOTS
    .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot))
    .filter((m): m is MediaSlotItem => !!m && m.kind === 'video' && !!m.url && typeof m.url === 'string' && m.url.trim() !== '' && !m.url.includes('undefined') && m.url !== '/default-media.png')
    .map(m => toDirectPublicStorageUrl(m.url) || m.url) as string[], [media]);

  // Obtener datos de "Un poco más de nosotros"
  const fotoAbout = getMediaBySlot(media as unknown as MediaSlotItem[], 'about');
  const datoCurioso = (academy as any)?.respuestas?.dato_curioso || '';
  const verMasLink = (academy as any)?.respuestas?.ver_mas_link || '';
  const hasAboutSection = fotoAbout || datoCurioso || verMasLink;

  const promotions = Array.isArray((academy as any)?.promociones) ? (academy as any).promociones : [];
  const promoBestValueIndex = React.useMemo(() => {
    let bestIndex = -1;
    let bestPerClass = Number.POSITIVE_INFINITY;
    promotions.forEach((promo: any, index: number) => {
      const price = typeof promo?.precio === 'number' ? promo.precio : Number(promo?.precio);
      const name = String(promo?.nombre || '').toLowerCase();
      const countMatch = name.match(/(\d+)\s*clases?/);
      const classCount = countMatch ? Number(countMatch[1]) : 1;
      if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(classCount) || classCount <= 1) return;
      const perClass = price / classCount;
      if (perClass < bestPerClass) {
        bestPerClass = perClass;
        bestIndex = index;
      }
    });
    return bestIndex;
  }, [promotions]);

  const primaryAvatarUrl = useMemo(() => {
    const cover = getMediaBySlot(media as unknown as MediaSlotItem[], 'cover')?.url;
    const avatarSlot = getMediaBySlot(media as unknown as MediaSlotItem[], 'avatar')?.url;
    const p1 = getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url;
    // Prioridad requerida (avatar): avatar_url -> slot avatar -> p1 -> cover
    const raw = (academy as any)?.avatar_url || avatarSlot || p1 || cover || (academy as any)?.portada_url || null;
    if (!raw || typeof raw !== 'string' || !raw.trim() || raw.includes('undefined') || raw === '/default-media.png') return null;
    return toDirectPublicStorageUrl(raw) ?? raw;
  }, [media, academy]);

  const heroLocationMeta = useMemo(() => {
    if (!academy) return { city: "", venue: "" };
    const ubis = (academy as any)?.ubicaciones;
    const first = Array.isArray(ubis) && ubis[0] ? ubis[0] : null;
    const city =
      (first?.ciudad && String(first.ciudad).trim()) ||
      ((academy as any)?.ciudad && String((academy as any).ciudad).trim()) ||
      "";
    const venue = (first?.nombre && String(first.nombre).trim()) || "";
    return { city, venue };
  }, [academy]);

  const getRitmoNombres = useMemo(() => {
    const names: string[] = [];
    if (allTags) {
      const tagToName = (ids?: number[]) => (ids || [])
        .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo')?.nombre)
        .filter(Boolean) as string[];
      if (Array.isArray((academy as any)?.ritmos) && (academy as any).ritmos.length) {
        names.push(...tagToName((academy as any).ritmos));
      } else if (Array.isArray((academy as any)?.estilos) && (academy as any).estilos.length) {
        names.push(...tagToName((academy as any).estilos));
      }
    }
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

  // First load: mostrar skeleton
  if (isFirstLoad) {
    return (
      <>
     
        <ProfileSkeleton variant="academy" />
      </>
    );
  }

  if (!academy) {
    return (
      <>
      
        <div style={{ padding: '48px 24px', textAlign: 'center', color: colors.light }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>{t('academy_not_available')}</h2>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>{t('academy_not_exists')}</p>
        </div>
      </>
    );
  }

  const academyName =
    (academy as any)?.display_name ||
    (academy as any)?.nombre ||
    (academy as any)?.nombre_academia ||
    t('dance_academy');
  const highlightedRitmos = getRitmoNombres.slice(0, 3).join(', ');
  const cityName =
    (academy as any)?.ciudad ||
    (academy as any)?.zonas_nombres?.[0] ||
    (academy as any)?.zonas?.[0] ||
    t('mexico');
  const shareImage = primaryAvatarUrl || carouselPhotos[0] || SEO_LOGO_URL;
  const academyUrl = `${SEO_BASE_URL}/academia/${academyId}`;
  const academyDescription =
    (academy as any)?.bio ||
    t('know_academy', { 
      name: academyName, 
      city: cityName, 
      rhythms: highlightedRitmos || t('default_rhythms') 
    });

  return (
    <>
      <RefreshingIndicator isFetching={isRefetching} />
      <SeoHead
        section="academy"
        title={`${academyName} | ${t('academy_in_where_dance')}`}
        description={academyDescription}
        image={shareImage}
        url={academyUrl}
        keywords={[
          academyName,
          'academia de baile',
          cityName,
          highlightedRitmos,
          'Dónde Bailar',
        ].filter(Boolean) as string[]}
      />
    

      <div className="academy-container" style={{ position: 'relative' }}>
        {/* ❌ Toggle eliminado */}

        {/* Hero: mismo patrón que EventDatePublicScreen / AcademyProfileLive */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="academy-profile-hero-wrap"
        >
          {copied && (
            <div className="academy-profile-copied-toast" role="status" aria-live="polite">
              {t('copied')}
            </div>
          )}
          <div className="academy-profile-hero-eds">
            <EventHero
              title={(academy as any)?.nombre_publico || academyName}
              flyerUrl={primaryAvatarUrl}
              flyerCacheKey={
                (academy as any)?.updated_at ?? (academy as any)?.created_at ?? id ?? null
              }
              dateStr={t('dance_academy')}
              timeRange={heroLocationMeta.city}
              venueName={heroLocationMeta.venue}
              onShare={onShare}
              onBack={handleBack}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="academy-hero-below glass-card-container"
        >
          {((academy as any)?.estado_aprobacion === 'aprobado') && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginBottom: '1rem',
              }}
            >
              <div
                className="badge"
                style={{
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
                  color: '#fff',
                }}
              >
                <div
                  className="dot"
                  style={{
                    width: '16px',
                    height: '16px',
                    display: 'grid',
                    placeItems: 'center',
                    background: '#16c784',
                    borderRadius: '50%',
                    color: '#062d1f',
                    fontSize: '.75rem',
                    fontWeight: 900,
                  }}
                >
                  ✓
                </div>
                <span>{t('verified')}</span>
              </div>
            </div>
          )}
          <div id="profile-hero-bio" style={{ width: '100%', marginBottom: '1rem' }}>
            <BioSection
              bio={(academy as any)?.bio}
              redes={(academy as any)?.redes_sociales || (academy as any)?.respuestas?.redes}
              variant="banner"
            />
          </div>
          <div
            id="profile-hero-chips"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginTop: '0.25rem',
              width: '100%',
              justifyContent: 'center',
            }}
          >
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
        </motion.div>

        {/* Contenido */}
        <div style={{ padding: '2rem 0' }}>
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
            <div className="academy-section-header">
              <div className="academy-section-icon">🎓</div>
              <div className="academy-section-title-wrapper">
                <h2 className="academy-section-title">
                  {t('our_classes')}
                </h2>
                <p className="academy-section-subtitle">
                  {t('schedule_costs_locations')}
                </p>
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {classesLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                  {t('loading_classes')}
                </div>
              ) : classesFromTables && classesFromTables.length > 0 ? (
                <>
                  <ClasesLiveTabs
                    classes={classesFromTables}
                    title=""
                    subtitle={t('filter_by_day')}
                    sourceType="academy"
                    sourceId={(academy as any)?.id}
                    isClickable={true}
                    whatsappNumber={(academy as any)?.whatsapp_number}
                    whatsappMessageTemplate={(academy as any)?.whatsapp_message_template || t('me_interested_class', { name: '{nombre}' })}
                    stripeAccountId={(academy as any)?.stripe_account_id}
                    stripeChargesEnabled={(academy as any)?.stripe_charges_enabled}
                    creatorName={(academy as any)?.nombre_publico || (academy as any)?.display_name}
                  />
                </>
              ) : (
                <>
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{ padding: '0.5rem', marginBottom: '1rem', background: 'rgba(255,0,0,0.1)', borderRadius: 8, fontSize: '0.75rem', color: '#fff' }}>
                      Debug: Fallback a ClasesLive. ClassesFromTables: {classesFromTables?.length || 0} clases
                    </div>
                  )}
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
                    sourceId={(academy as any)?.id}
                    isClickable={true}
                    whatsappNumber={(academy as any)?.whatsapp_number}
                    whatsappMessageTemplate={(academy as any)?.whatsapp_message_template || t('me_interested_class', { name: '{nombre}' })}
                  />
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
              transition={{ duration: 0.6, delay: 0.45 }}
              className="promo-section"
            >
              <header className="promo-header">
                <div className="promo-icon">💸</div>
                <div>
                  <h2>{t('promotions_packages')}</h2>
                  <p>{t('special_offers')}</p>
                </div>
              </header>

              <div className="promo-list">
                {promotions.map((promo: any, index: number) => {
                  const typeKey = promo?.tipo && promotionTypeMeta[promo.tipo] ? promo.tipo : 'otro';
                  const typeMeta = promotionTypeMeta[typeKey];
                  const priceLabel = formatPriceLabel(promo?.precio);
                  const isDestacado = typeKey === 'promocion' || typeKey === 'descuento';
                  const priceMeta =
                    typeKey === 'mensualidad'
                      ? t('monthly_payment', 'Pago mensual')
                      : typeKey === 'paquete'
                        ? t('package_payment', 'Pago por paquete')
                        : typeKey === 'clase_suelta'
                          ? t('single_class_payment', 'Pago por clase')
                          : t('one_time_payment', 'Pago unico');
                  
                  // Formatear el precio: extraer número y formatear con comas
                  let priceNumber: string | null = null;
                  let perClassLabel: string | null = null;
                  const rawName = String(promo?.nombre || '');
                  const classCountMatch = rawName.toLowerCase().match(/(\d+)\s*clases?/);
                  const classCount = classCountMatch ? Number(classCountMatch[1]) : 1;
                  if (priceLabel && priceLabel !== t('free')) {
                    const numeric = typeof promo?.precio === 'number' ? promo.precio : Number(promo?.precio);
                    if (!Number.isNaN(numeric) && numeric > 0) {
                      priceNumber = numeric.toLocaleString('en-US');
                      if (classCount > 1) {
                        const perClass = Math.round(numeric / classCount);
                        perClassLabel = `$${perClass.toLocaleString('en-US')} ${t('per_class_short', 'por clase')}`;
                      }
                    }
                  }
                  const isPopular = index === promoBestValueIndex && classCount > 1;

                  return (
                    <motion.article
                      key={`${promo?.nombre || 'promo'}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`promo-card${isPopular ? ' promo-card--featured' : ''}`}
                    >
                      <div className="promo-info">
                        <div className="promo-title-row">
                          <h3>{promo?.nombre || t('promotion')}</h3>
                          {isPopular && <span className="promo-popular-badge">{t('most_popular', 'Mas popular')}</span>}
                        </div>
                        <div className="promo-meta-row">
                          <span className={`promo-chip${isDestacado ? ' promo-chip--destacado' : ''}`}>
                            {typeMeta.label}
                          </span>
                          {perClassLabel ? <span className="promo-dot" aria-hidden>•</span> : null}
                          {perClassLabel ? <span className="promo-per-class">{perClassLabel}</span> : null}
                        </div>
                        {promo?.descripcion && (
                          <p className="promo-desc">{promo.descripcion}</p>
                        )}
                      </div>
                      {priceLabel !== null && (
                        <div className={`promo-price-box${isDestacado ? ' promo-price-box--destacado' : ''}`}>
                          <div className="promo-price-row">
                            <span className="promo-price">{priceNumber || priceLabel}</span>
                            <span className="promo-unit">MXN</span>
                          </div>
                          <span className="promo-price-meta">{priceMeta}</span>
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
              transition={{ duration: 0.6, delay: 0.5 }}
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
                  <h3 className="section-title" style={{ margin: 0 }}>{t('competition_groups')}</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: 500 }}>{t('training_competition')}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {competitionGroups.map((group: any) => (
                  <CompetitionGroupCard key={group.id} group={group} />
                ))}
              </div>
            </motion.section>
          )}

          {Array.isArray((academy as any)?.ubicaciones) && (academy as any).ubicaciones.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
              style={{
                marginBottom: '2rem', padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <UbicacionesLive
                ubicaciones={(academy as any).ubicaciones}
                headingSize="1.5rem"
              />
            </motion.section>
          )}

          {/* FAQ estilo Organizer (si hay FAQ en el perfil) */}
          {Array.isArray((academy as any)?.faq) && (academy as any).faq.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}
              style={{
                marginBottom: '2rem', marginTop: '2rem', padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #FB8C00, #FF7043)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 24px rgba(251, 140, 0, 0.4)'
                }}>❓</div>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>{t('info_for_students')}</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: 500 }}>{t('frequently_asked_questions_short')}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(academy as any).faq.map((faq: any, index: number) => (
                  <motion.div
                    key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
                    style={{ padding: '1rem 1.25rem', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)' }}
                  >
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
                  <h3 className="section-title" style={{ margin: 0 }}>{t('what_our_students_say')}</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: 500 }}>{t('student_testimonials')}</p>
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
          {id && (
            <AcademyRatingComponent academyId={id} />
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
                  <h3 className="teachers-invited-title">{t('invited_teachers')}</h3>
                  <p className="teachers-invited-subtitle">{t('teachers_collaborate')}</p>
                </div>
              </div>
              <HorizontalSlider
                items={acceptedTeachers}
                renderItem={(t: any) => {
                  // Usar la misma lógica que TeacherProfileLive.tsx para obtener la URL
                  // Primero cover, luego p1 - misma prioridad que "Foto del maestro"
                  const teacherMedia = Array.isArray(t.teacher_media) ? t.teacher_media : [];
                  const coverUrl = getMediaBySlot(teacherMedia as unknown as MediaSlotItem[], 'cover')?.url;
                  const p1Url = getMediaBySlot(teacherMedia as unknown as MediaSlotItem[], 'p1')?.url;
                  
                  // Construir media array con la misma prioridad que TeacherProfileLive.tsx
                  const media: any[] = [];
                  if (coverUrl) {
                    media.push({ url: coverUrl, type: 'image', slot: 'cover' });
                  }
                  if (p1Url) {
                    media.push({ url: p1Url, type: 'image', slot: 'p1' });
                  }
                  
                  // Si no hay media desde el array, usar las URLs directas como fallback
                  if (media.length === 0) {
                    if (t.teacher_portada) {
                      media.push({ url: t.teacher_portada, type: 'image', slot: 'cover' });
                    }
                    if (t.teacher_avatar) {
                      media.push({ url: t.teacher_avatar, type: 'image', slot: 'p1' });
                    }
                  }
                  
                  // Obtener la URL del banner usando la misma lógica que TeacherProfileLive.tsx
                  const bannerUrl = coverUrl || p1Url || t.teacher_portada || t.teacher_avatar || null;
                  
                  const teacherData = {
                    id: t.teacher_id,
                    nombre_publico: t.teacher_name,
                    bio: t.teacher_bio || '',
                    avatar_url: t.teacher_avatar || null,
                    portada_url: t.teacher_portada || null,
                    banner_url: bannerUrl, // Misma URL que "Foto del maestro" en TeacherProfileLive
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

          {/* Datos de Cuenta Bancaria */}
          {(() => {
            const bankData = (academy as any)?.cuenta_bancaria;
            // Verificar que existe y no es solo un objeto vacío
            if (!bankData || typeof bankData !== 'object') return null;
            const hasBankData = bankData.banco || bankData.nombre || bankData.clabe || bankData.cuenta || bankData.concepto;
            if (!hasBankData) return null;
            return <BankAccountDisplay data={bankData} />;
          })()}

          {/* Sección: Un poco más de nosotros */}
          {hasAboutSection && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              style={{ width: '100%', display: 'block', visibility: 'visible' }}
            >
              <style>{`
                .about-section-container {
                  margin-bottom: 2rem;
                  padding: 2.5rem;
                  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%);
                  border-radius: 24px;
                  border: 1px solid rgba(255, 255, 255, 0.15);
                  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                  backdrop-filter: blur(10px);
                  position: relative;
                  overflow: visible;
                  width: 100%;
                  max-width: 100%;
                  display: block;
                  visibility: visible;
                  opacity: 1;
                }
                .about-section-header {
                  display: flex;
                  align-items: center;
                  gap: 1rem;
                  margin-bottom: 2rem;
                  position: relative;
                  z-index: 1;
                }
                .about-section-icon {
                  width: 60px;
                  height: 60px;
                  border-radius: 20px;
                  background: linear-gradient(135deg, #E53935, #FB8C00);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 2rem;
                  box-shadow: 0 8px 24px rgba(229, 57, 53, 0.4);
                  flex-shrink: 0;
                }
                .about-section-content {
                  display: flex;
                  flex-direction: column;
                  gap: 2rem;
                  align-items: center;
                  position: relative;
                  z-index: 1;
                  width: 100%;
                  max-width: 100%;
                  visibility: visible;
                  opacity: 1;
                }
                .about-section-photo {
                  position: relative;
                  border-radius: 20px;
                  overflow: hidden;
                  border: 3px solid rgba(255, 255, 255, 0.25);
                  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1));
                  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
                  padding: 0.5rem;
                  transition: transform 0.3s ease, box-shadow 0.3s ease;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 1rem;
                }
                .about-section-photo:hover {
                  transform: translateY(-4px) scale(1.02);
                  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
                }
                .about-section-photo img {
                  width: 350px;
                  height: auto;
                  display: block;
                  object-fit: contain;
                  border-radius: 12px;
                }
                @media (max-width: 968px) {
                  .about-section-content {
                    gap: 1.5rem;
                  }
                  .about-section-photo {
                    max-width: 100%;
                    width: 100%;
                  }
                  .about-section-photo img {
                    width: 100%;
                    max-width: 350px;
                  }
                }
                @media (max-width: 768px) {
                  .about-section-container {
                    padding: 1.5rem !important;
                    border-radius: 20px !important;
                    margin-bottom: 1.5rem !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                  }
                  .about-section-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                  }
                  .about-section-icon {
                    width: 56px;
                    height: 56px;
                    font-size: 1.75rem;
                    border-radius: 16px;
                  }
                  .about-section-content {
                    gap: 1.5rem;
                    width: 100% !important;
                    max-width: 100% !important;
                    padding: 0;
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                  }
                  .about-section-photo {
                    width: 100% !important;
                    max-width: 100% !important;
                    display: flex !important;
                    visibility: visible !important;
                  }
                  .about-section-photo img {
                    width: 100% !important;
                    max-width: 100% !important;
                    display: block !important;
                    visibility: visible !important;
                  }
                  .about-section-photo a {
                    width: 100% !important;
                    justify-content: center !important;
                    padding: 0.875rem 1.5rem !important;
                    font-size: 0.9rem !important;
                    display: inline-flex !important;
                    visibility: visible !important;
                  }
                }
                @media (max-width: 480px) {
                  .about-section-container {
                    padding: 1.25rem !important;
                    border-radius: 16px !important;
                    margin-bottom: 1.25rem !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                  }
                  .about-section-header {
                    margin-bottom: 1.25rem;
                  }
                  .about-section-icon {
                    width: 48px;
                    height: 48px;
                    font-size: 1.5rem;
                    border-radius: 14px;
                  }
                  .about-section-content {
                    gap: 1.25rem;
                    width: 100% !important;
                    max-width: 100% !important;
                    padding: 0;
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                  }
                  .about-section-photo {
                    padding: 0.375rem;
                    width: 100% !important;
                    max-width: 100% !important;
                    display: flex !important;
                    visibility: visible !important;
                  }
                  .about-section-photo img {
                    width: 100% !important;
                    max-width: 100% !important;
                    border-radius: 10px;
                    display: block !important;
                    visibility: visible !important;
                  }
                  .about-section-photo a {
                    width: 100% !important;
                    justify-content: center !important;
                    padding: 0.875rem 1.5rem !important;
                    font-size: 0.9rem !important;
                    display: inline-flex !important;
                    visibility: visible !important;
                  }
                }
              `}</style>
              <div className="about-section-container">
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
                      textShadow: '0 2px 8px rgba(229, 57, 53, 0.3), 0 0 16px rgba(251, 140, 0, 0.2)',
                      fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                    }}>
                      {t('more_about_us')}
                    </h2>
                    <p style={{
                      fontSize: '0.95rem',
                      opacity: 0.85,
                      margin: '0.25rem 0 0 0',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500,
                      fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                    }}>
                      {t('learn_more_academy')}
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
                          alt={t('photo_about_us')}
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
                            width: 'fit-content',
                            fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
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
                          <span>{t('learn_more')}</span>
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
                        width: 'fit-content',
                        fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
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
              </div>
            </motion.section>
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
                overflow: 'visible',
                textAlign: 'left'
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
                        {t('videos_section')}
                      </h3>
                      <p style={{
                        margin: '0.15rem 0 0 0',
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 400,
                        lineHeight: 1.2,
                        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                      }}>
                        {videos.length === 1 ? t('promotional_video') : t('multimedia_highlighted')}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: colors.light,
                    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  }}>
                    {videos.length} {videos.length !== 1 ? t('videos') : t('video')}
                  </div>
              </div>

              {/* Carrusel de Videos - Siempre usar carrusel para mostrar todos los videos */}
              <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
                <VideoCarouselComponent videos={videos} />
              </div>
            </motion.section>
          )}

          {/* Galería de fotos (mismo patrón que organizador: id estable para auditorías) */}
          {carouselPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="gallery-section"
            >
              <OrganizerPublicGallery photos={carouselPhotos} title={t('photo_gallery')} />
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
