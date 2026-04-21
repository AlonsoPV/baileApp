import React, { useState, useMemo, useCallback, Suspense, lazy, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTeacherMy } from "../../hooks/useTeacher";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useTeacherAcademies } from "../../hooks/useAcademyTeacherInvitations";
import AcademyCard from "../../components/explore/cards/AcademyCard";
import { useTeacherMedia } from "../../hooks/useTeacherMedia";
import { useTags } from "../../hooks/useTags";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import ImageWithFallback from "../../components/ImageWithFallback";
import { toDirectPublicStorageUrl } from "../../utils/imageOptimization";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import UbicacionesLive from "../../components/locations/UbicacionesLive";
import RitmosChips from "../../components/RitmosChips";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import { colors } from "../../theme/colors";
import { useCompetitionGroupsByTeacher } from "../../hooks/useCompetitionGroups";
import "./TeacherProfileLive.css";
import "./profileLiveEventHero.css";
import { EventHero } from "../../components/events/EventDetail";
import "../../components/events/EventDetail/eventDetailScreen.css";
import { routes } from "../../routes/registry";
import BankAccountDisplay from "../../components/profile/BankAccountDisplay";

// Lazy load heavy components
const BioSection = lazy(() => import("../../components/profile/BioSection").then(m => ({ default: m.BioSection })));
const ClasesLiveTabs = lazy(() => import("@/components/classes/ClasesLiveTabs"));
const ClasesLive = lazy(() => import("../../components/events/ClasesLive"));
const UbicacionesLiveLazy = lazy(() => import("../../components/locations/UbicacionesLive"));
const HorizontalSlider = lazy(() => import("../../components/explore/HorizontalSlider"));
const TeacherRatingComponent = lazy(() => 
  import("../../components/teacher/TeacherRatingComponent").catch((err) => {
    console.error('Error loading TeacherRatingComponent:', err);
    // Retornar un componente de fallback
    return { default: () => null };
  })
);
const CompetitionGroupCard = lazy(() => import("../../components/explore/cards/CompetitionGroupCard"));

// Componente FAQ Accordion (memoizado)
const FAQAccordion = React.memo(function FAQAccordion({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);
  const slugifiedQuestion = useMemo(() => question.toLowerCase().replace(/\s+/g, '-').slice(0, 60), [question]);
  const panelId = `faq-panel-${slugifiedQuestion}`;

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
        aria-controls={panelId}
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
          transition: 'all 0.2s'
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
          id={panelId}
          role="region"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: '0 1.5rem 1rem 1.5rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6
          }}
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
});
// Componente Carousel para fotos (memoizado)
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

  const openFullscreen = useCallback(() => setIsFullscreen(true), []);
  const closeFullscreen = useCallback(() => setIsFullscreen(false), []);

  if (photos.length === 0) return null;

  return (
    <>
      <div style={{
        position: 'relative',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* Imagen principal */}
        <div style={{
          position: 'relative',
          height: '350px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 1,
            transform: 'none'
          }}>
            <img
              src={photos[currentIndex]}
              alt={`Foto ${currentIndex + 1}`}
              loading="lazy"
              decoding="async"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                cursor: 'pointer'
              }}
              onClick={openFullscreen}
            />
          </div>

          {/* Contador */}
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
                disabled={photos.length <= 1}
                aria-label="Foto anterior"
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
                  cursor: photos.length <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '1.25rem',
                  transition: '0.2s',
                  opacity: photos.length <= 1 ? 0.5 : 1
                }}
              >
                ‹
              </button>
              <button
                onClick={nextPhoto}
                disabled={photos.length <= 1}
                aria-label="Foto siguiente"
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
                  cursor: photos.length <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '1.25rem',
                  transition: '0.2s',
                  opacity: photos.length <= 1 ? 0.5 : 1
                }}
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Miniaturas */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
                {photos.map((photo, index) => (
                  <button
                    key={`photo-${index}-${photo.slice(-20)}`}
                    onClick={() => goToPhoto(index)}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: index === currentIndex ? '3px solid #E53935' : '2px solid rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      background: 'transparent',
                      padding: 0,
                      transition: '0.2s'
                    }}
                  >
                    <img
                      src={photo}
                      alt={`Miniatura ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center'
                      }}
                    />
                  </button>
                ))}
        </div>
      </div>

      {/* Pantalla completa */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
          onClick={closeFullscreen}
        >
          <div style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <img
              src={photos[currentIndex]}
              alt={`Foto ${currentIndex + 1} - Pantalla completa`}
              loading="lazy"
              decoding="async"
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
        console.error('[TeacherProfileLive] Error formatting date:', e);
      }
    }
  }
  if (typeof diaSemana === 'number' && diaSemana >= 0 && diaSemana <= 6) {
    return dayNames[diaSemana];
  }
  return null;
};

const promotionTypeMeta: Record<string, { icon: string; label: string }> = {
  clase_suelta: { icon: '🎫', label: 'Clase suelta' },
  promocion: { icon: '✨', label: 'Promoción' },
  paquete: { icon: '🧾', label: 'Paquete' },
  descuento: { icon: '💸', label: 'Descuento' },
  membresia: { icon: '🎟️', label: 'Membresía' },
  otro: { icon: '💡', label: 'Otros' },
};

const promotionTypeStyles: Record<string, { background: string; border: string; color: string }> = {
  clase_suelta: { background: 'rgba(46,163,188,0.16)', border: '1px solid rgba(56,189,248,0.35)', color: '#7dd3fc' },
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

export default function TeacherProfileLive() {
  const navigate = useNavigate();
  const { data: teacher, isLoading, error, isError } = useTeacherMy();
  const { media } = useTeacherMedia();
  const { data: allTags } = useTags();
  const [copied, setCopied] = useState(false);
  const hasNavigatedRef = useRef(false);

  // Obtener academias donde el maestro enseña
  const teacherId = teacher?.id;
  const { data: academies } = useTeacherAcademies(teacherId);
  
  // Obtener grupos de competencia del maestro (solo los que no están asociados a una academia)
  const teacherUserId = teacher?.user_id;
  const { data: competitionGroups, isLoading: loadingGroups } = useCompetitionGroupsByTeacher(teacherUserId);

  // Configuración de WhatsApp para clases
  const whatsappNumber = useMemo(
    () => teacher?.whatsapp_number || teacher?.redes_sociales?.whatsapp || null,
    [teacher],
  );
  const whatsappMessageTemplate = useMemo(
    () => teacher?.whatsapp_message_template || 'Hola, me interesa la clase: {nombre}',
    [teacher?.whatsapp_message_template],
  );

  // ✅ Auto-redirigir a Edit si no tiene perfil de maestro (solo si no hay error)
  // Si hay error, no redirigir para evitar perder el mensaje de error
  React.useEffect(() => {
    if (!isLoading && !teacher && !isError && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      if (import.meta.env.DEV) {
        console.log('[TeacherProfileLive] No hay perfil y no hay error, redirigiendo a /edit');
      }
      navigate('/profile/teacher/edit', { replace: true });
    }
  }, [isLoading, teacher, isError, navigate]);

  // Obtener clases desde las tablas / cronograma
  const teacherNumericId = teacher?.id as number | undefined;
  const { data: classesFromTables, isLoading: classesLoading } = useLiveClasses(
    teacherNumericId ? { teacherId: teacherNumericId } : undefined
  );

  // Memoizar fotos del carrusel usando los media slots
  const carouselPhotos = useMemo(() => (
    PHOTO_SLOTS
      .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot)?.url)
      .filter(Boolean)
      .map(u => toDirectPublicStorageUrl(u) || u) as string[]
  ), [media]);

  const videos = useMemo(() => (
    VIDEO_SLOTS
      .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot)?.url)
      .filter(Boolean)
      .map(u => toDirectPublicStorageUrl(u) || u) as string[]
  ), [media]);

  // Memoizar ritmo nombres
  const ritmoNombres = useMemo(() => {
    const names: string[] = [];
    // 1) Priorizar ritmos_seleccionados (IDs del catálogo) ya que es lo que edita el usuario con RitmosChips
    if (teacher && Array.isArray(teacher.ritmos_seleccionados) && teacher.ritmos_seleccionados.length > 0) {
      const labelById = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelById.set(i.id, i.label)));
      names.push(
        ...teacher.ritmos_seleccionados
          .map(id => labelById.get(id))
          .filter(Boolean) as string[]
      );
    }
    // 2) Si no hay ritmos_seleccionados, usar ritmos (IDs numéricos de tags)
    if (names.length === 0 && teacher) {
      const ritmos = teacher.ritmos || [];
      if (allTags && Array.isArray(ritmos) && ritmos.length > 0) {
        names.push(
          ...ritmos
            .map((id: number) => allTags.find((tag: any) => tag.id === id && tag.tipo === 'ritmo')?.nombre)
            .filter(Boolean) as string[]
        );
      }
    }
    return names;
  }, [teacher, allTags]);

  // Memoizar promociones
  const promotions = useMemo(() => 
    Array.isArray(teacher?.promociones) ? teacher.promociones : []
  , [teacher?.promociones]);
  const promoBestValueIndex = useMemo(() => {
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

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(routes.app.explore);
    }
  }, [navigate]);

  const handleShare = useCallback(() => {
    try {
      const publicUrl = teacherId ? `${window.location.origin}/maestro/${teacherId}` : "";
      const title = teacher?.nombre_publico || "Maestro";
      const text = `Mira el perfil de ${title}`;
      const navAny = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
      if (navAny && typeof navAny.share === "function") {
        navAny.share({ title, text, url: publicUrl }).catch(() => {});
      } else {
        navigator.clipboard?.writeText(publicUrl).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
      }
    } catch {
      /* noop */
    }
  }, [teacherId, teacher?.nombre_publico]);

  const primaryAvatarUrl = useMemo(() => {
    if (!teacher) return null as string | null;
    const cover = getMediaBySlot(media as unknown as MediaSlotItem[], "cover")?.url;
    const p1 = getMediaBySlot(media as unknown as MediaSlotItem[], "p1")?.url;
    const raw = cover || p1 || null;
    if (!raw || typeof raw !== "string" || !raw.trim()) return null;
    return toDirectPublicStorageUrl(raw) ?? raw;
  }, [teacher, media]);

  const heroLocationMeta = useMemo(() => {
    const ubis = (teacher as { ubicaciones?: Array<{ ciudad?: string; nombre?: string }> })?.ubicaciones;
    const first = Array.isArray(ubis) && ubis[0] ? ubis[0] : null;
    const city = (first?.ciudad && String(first.ciudad).trim()) || "";
    const venue = (first?.nombre && String(first.nombre).trim()) || "";
    return { city, venue };
  }, [teacher]);

  if (isLoading) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p style={{ fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Cargando maestro...</p>
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
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            Error al cargar perfil
          </h2>
          <p style={{ opacity: 0.7, marginBottom: '24px', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
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
              fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!teacher) {
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
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            Estamos cargando tu perfil...
          </h2>
          <p style={{ opacity: 0.7, marginBottom: '8px', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            Redirigiendo a edición para crear tu perfil de maestro
          </p>
          <p style={{ opacity: 0.6, fontSize: '0.9rem', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            Si tarda mucho, intenta refrescar la página para una carga más rápida.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="teacher-container">
        {/* Navigation Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="teacher"
            liveHref="/profile/teacher"
            editHref="/profile/teacher/edit"
          />
        </div>

        {/* Hero: mismo patrón que AcademyProfileLive (EventHero + bloque inferior) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="profile-live-hero-wrap"
        >
          {copied && (
            <div className="profile-live-copied-toast" role="status" aria-live="polite">
              Copiado
            </div>
          )}
          <div className="profile-live-hero-eds">
            <EventHero
              title={(teacher as any)?.nombre_publico || "Maestro"}
              flyerUrl={primaryAvatarUrl}
              flyerCacheKey={
                (teacher as any)?.updated_at ?? (teacher as any)?.created_at ?? teacherId ?? null
              }
              dateStr="Maestro de baile"
              timeRange={heroLocationMeta.city}
              venueName={heroLocationMeta.venue}
              onShare={handleShare}
              onBack={handleBack}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="profile-live-hero-below glass-card-container"
        >
          {((teacher as any)?.estado_aprobacion === "aprobado") && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
                marginBottom: "1rem",
              }}
            >
              <div
                className="badge"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: ".45rem",
                  padding: ".35rem .6rem",
                  borderRadius: "999px",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #106c37, #0b5)",
                  border: "1px solid #13a65a",
                  boxShadow: "0 8px 18px rgba(0,0,0,.35)",
                  fontSize: ".82rem",
                  color: "#fff",
                }}
              >
                <div
                  className="dot"
                  style={{
                    width: "16px",
                    height: "16px",
                    display: "grid",
                    placeItems: "center",
                    background: "#16c784",
                    borderRadius: "50%",
                    color: "#062d1f",
                    fontSize: ".75rem",
                    fontWeight: 900,
                  }}
                >
                  ✓
                </div>
                <span>Verificado</span>
              </div>
            </div>
          )}
          <div id="profile-hero-bio" style={{ width: "100%", marginBottom: "1rem" }}>
            <Suspense fallback={null}>
              <BioSection
                bio={teacher?.bio}
                redes={teacher?.redes_sociales || (teacher as any)?.respuestas?.redes}
                variant="banner"
              />
            </Suspense>
          </div>
          <div
            id="profile-hero-chips"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginTop: "0.25rem",
              width: "100%",
              justifyContent: "center",
            }}
          >
            {(() => {
              const slugs = normalizeRitmosToSlugs(teacher, allTags);
              return slugs.length > 0 ? (
                <RitmosChips selected={slugs} onChange={() => {}} readOnly size="compact" />
              ) : null;
            })()}
            <ZonaGroupedChips
              selectedIds={(teacher as any)?.zonas}
              allTags={allTags}
              mode="display"
            />
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
                {getRitmoNombres().map((ritmo, index) => (
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
            const hasCronograma = Array.isArray((teacher as any)?.cronograma) && (teacher as any).cronograma.length > 0;
            const hasClasses = hasClassesFromTables || hasCronograma;
            
            // Solo mostrar la sección si hay clases o si está cargando
            if (!classesLoading && !hasClasses) return null;
            
            return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="teacher-section"
            style={{
              marginBottom: '2rem',
              padding: '2.5rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: '24px',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Top gradient bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #E53935, #FB8C00, #FFD166)',
              opacity: 0.9
            }} />

            {/* Header destacado */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)'
              }}>
                🎓
              </div>
              <div>
                <h3 className="section-title" style={{ margin: 0, fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Mis clases</h3>
                <p style={{
                  fontSize: '0.9rem',
                  opacity: 0.8,
                  margin: '0.25rem 0 0 0',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                }}>
                  Horarios, costos y ubicaciones
                </p>
              </div>
            </div>

            {/* Contenido de clases */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {classesLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                  Cargando clases...
                </div>
              ) : classesFromTables && classesFromTables.length > 0 ? (
                <Suspense fallback={<div role="status" style={{ padding: '1rem', textAlign: 'center', opacity: 0.8 }}>Cargando…</div>}>
                  <ClasesLiveTabs
                    classes={classesFromTables}
                    title=""
                    subtitle="Filtra por día — solo verás los días que sí tienen clases"
                    sourceType="teacher"
                    sourceId={teacherNumericId}
                    isClickable={true}
                    whatsappNumber={whatsappNumber}
                    whatsappMessageTemplate={whatsappMessageTemplate}
                    stripeAccountId={(teacher as any)?.stripe_account_id}
                    stripeChargesEnabled={(teacher as any)?.stripe_charges_enabled}
                    creatorName={(teacher as any)?.nombre_publico || (teacher as any)?.display_name}
                  />
                </Suspense>
              ) : (
                <Suspense fallback={<div role="status" style={{ padding: '1rem', textAlign: 'center', opacity: 0.8 }}>Cargando…</div>}>
                  <ClasesLive
                    title=""
                    cronograma={teacher?.cronograma || []}
                    costos={teacher?.costos || []}
                    ubicacion={{
                      nombre: teacher?.ubicaciones?.[0]?.nombre,
                      direccion: teacher?.ubicaciones?.[0]?.direccion,
                      ciudad: teacher?.ubicaciones?.[0]?.ciudad,
                      referencias: teacher?.ubicaciones?.[0]?.referencias
                    }}
                    showCalendarButton={true}
                    whatsappNumber={whatsappNumber}
                    whatsappMessageTemplate={whatsappMessageTemplate}
                  />
                </Suspense>
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
                  <h3 style={{ fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Promociones y Paquetes</h3>
                  <p style={{ fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Ofertas especiales y descuentos disponibles</p>
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
                      ? 'Pago mensual'
                      : typeKey === 'paquete'
                        ? 'Pago por paquete'
                        : typeKey === 'clase_suelta'
                          ? 'Pago por clase'
                          : 'Pago unico';
                  
                  // Formatear el precio: extraer número y formatear con comas
                  let priceNumber: string | null = null;
                  let perClassLabel: string | null = null;
                  const rawName = String(promo?.nombre || '');
                  const classCountMatch = rawName.toLowerCase().match(/(\d+)\s*clases?/);
                  const classCount = classCountMatch ? Number(classCountMatch[1]) : 1;
                  if (priceLabel && priceLabel !== 'Gratis') {
                    const numeric = typeof promo?.precio === 'number' ? promo.precio : Number(promo?.precio);
                    if (!Number.isNaN(numeric) && numeric > 0) {
                      priceNumber = numeric.toLocaleString('en-US');
                      if (classCount > 1) {
                        const perClass = Math.round(numeric / classCount);
                        perClassLabel = `$${perClass.toLocaleString('en-US')} por clase`;
                      }
                    }
                  }
                  const isPopular = index === promoBestValueIndex && classCount > 1;

                  return (
                    <motion.article
                      key={promo?.id ?? promo?.nombre ?? `promo-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`promo-card${isPopular ? ' promo-card--featured' : ''}`}
                    >
                      <div className="promo-info">
                        <div className="promo-title-row">
                          <h3 style={{ fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{promo?.nombre || 'Promoción'}</h3>
                          {isPopular && <span className="promo-popular-badge">Mas popular</span>}
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

          {/* Datos de Cuenta Bancaria */}
          {(() => {
            const bankData = (teacher as any)?.cuenta_bancaria;
            // Verificar que existe y no es solo un objeto vacío
            if (!bankData || typeof bankData !== 'object') return null;
            const hasBankData = bankData.banco || bankData.nombre || bankData.clabe || bankData.cuenta || bankData.concepto;
            if (!hasBankData) return null;
            return <BankAccountDisplay data={bankData} />;
          })()}

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
                  <h3 className="section-title" style={{ margin: 0, fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Mis Grupos de Competencia</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Grupos de entrenamiento y competencia</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {competitionGroups.map((group: any) => (
                  <Suspense key={group.id} fallback={<div role="status" style={{ padding: '1rem', textAlign: 'center', opacity: 0.8 }}>Cargando…</div>}>
                    <CompetitionGroupCard group={group} />
                  </Suspense>
                ))}
              </div>
            </motion.section>
          )}

          {/* Ubicaciones (live) */}
          {Array.isArray(teacher?.ubicaciones) && teacher.ubicaciones.length > 0 && (
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
              <Suspense fallback={<div role="status" style={{ padding: '1rem', textAlign: 'center', opacity: 0.8 }}>Cargando…</div>}>
                <UbicacionesLiveLazy ubicaciones={teacher.ubicaciones} />
              </Suspense>
            </motion.section>
          )}


          {/* Doy clases en */}
          {academies && academies.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
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
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #1E88E5, #7C4DFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 24px rgba(30, 136, 229, 0.4)' }}>🎓</div>
                <div>
                  <h3 className="section-title" style={{ margin: 0, fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Doy clases en</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Academias donde colaboro</p>
                </div>
              </div>
              <Suspense fallback={<div role="status" style={{ padding: '1rem', textAlign: 'center', opacity: 0.8 }}>Cargando…</div>}>
                <HorizontalSlider
                  items={academies}
                  renderItem={(academy: any) => {
                    // Usar la misma lógica que AcademyPublicScreen.tsx para obtener la URL
                    // Primero p1, luego cover - misma prioridad que "Logo de la academia"
                    const academyMedia = Array.isArray(academy.academy_media) ? academy.academy_media : [];
                    const p1Url = getMediaBySlot(academyMedia as unknown as MediaSlotItem[], 'p1')?.url;
                    const coverUrl = getMediaBySlot(academyMedia as unknown as MediaSlotItem[], 'cover')?.url;
                    
                    // Construir media array con la misma prioridad que AcademyPublicScreen.tsx
                    const media: any[] = [];
                    if (p1Url) {
                      media.push({ url: p1Url, type: 'image', slot: 'p1' });
                    }
                    if (coverUrl) {
                      media.push({ url: coverUrl, type: 'image', slot: 'cover' });
                    }
                    
                    // Si no hay media desde el array, usar las URLs directas como fallback
                    if (media.length === 0) {
                      if (academy.academy_avatar) {
                        media.push({ url: academy.academy_avatar, type: 'image', slot: 'p1' });
                      }
                      if (academy.academy_portada) {
                        media.push({ url: academy.academy_portada, type: 'image', slot: 'cover' });
                      }
                    }
                    
                    // Obtener la URL del avatar usando la misma lógica que AcademyPublicScreen.tsx
                    const primaryAvatarUrl = p1Url || coverUrl || academy.academy_avatar || academy.academy_portada || null;
                    
                    const academyData = {
                      id: academy.academy_id,
                      // Nombre robusto para la card (misma lógica que AcademyCard.tsx)
                      nombre_publico:
                        academy.academy_name ??
                        academy.academy_nombre ??
                        academy.nombre_publico ??
                        academy.nombre_academia ??
                        academy.display_name,
                      bio: academy.academy_bio || '',
                      avatar_url: primaryAvatarUrl, // Misma URL que "Logo de la academia" en AcademyPublicScreen
                      portada_url: academy.academy_portada || null,
                      ritmos: Array.isArray(academy.academy_ritmos) ? academy.academy_ritmos : [],
                      zonas: Array.isArray(academy.academy_zonas) ? academy.academy_zonas : [],
                      media
                    };
                    return <AcademyCard key={academy.academy_id} item={academyData} />;
                  }}
                  gap={24}
                  autoColumns="280px"
                />
              </Suspense>
            </motion.section>
          )}

          {/* FAQ estilo Organizer (si hay FAQ en el perfil) */}
          {Array.isArray((teacher as any)?.faq) && (teacher as any).faq.length > 0 && (
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
                  <h3 className="section-title" style={{ margin: 0, fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Información para Estudiantes</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Preguntas frecuentes</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {teacher?.faq?.map((faq: any, index: number) => (
                  <FAQAccordion 
                    key={faq?.id ?? `${faq.q}-${index}`} 
                    question={faq.q} 
                    answer={faq.a} 
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* Reseñas de Alumnos */}
          {Array.isArray((teacher as any)?.reseñas) && (teacher as any).reseñas.length > 0 && (
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
                  <h3 className="section-title" style={{ margin: 0, fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Qué dicen mis alumnos</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Testimonios de estudiantes</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {(teacher as any).reseñas.map((review: any, index: number) => (
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
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{review.author}</div>
                        {review.location && (
                          <div style={{ fontSize: '0.85rem', opacity: 0.75, color: 'rgba(255,255,255,0.8)', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{review.location}</div>
                        )}
                      </div>
                      <div style={{ letterSpacing: '0.15rem', fontSize: '0.9rem', color: '#FFD166' }}>
                        {'★'.repeat(review.rating || 5)}{'☆'.repeat(5 - (review.rating || 5))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', opacity: 0.85, margin: 0, lineHeight: 1.6, fontStyle: 'italic', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                      "{review.text}"
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Componente de Calificaciones */}
          {teacherNumericId && (
            <Suspense fallback={<div role="status" style={{ padding: '1rem', textAlign: 'center', opacity: 0.8 }}>Cargando…</div>}>
              <TeacherRatingComponent teacherId={teacherNumericId} />
            </Suspense>
          )}

          {/* Slot Video */}
        {/*   {getMediaBySlot(media as unknown as MediaSlotItem[], 'v1') && (
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
             
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, rgba(240, 147, 251, 0.6), rgba(255, 209, 102, 0.6), rgba(240, 147, 251, 0.6))',
                borderRadius: '20px 20px 0 0'
              }} />
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
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
                  <h3 className="section-title" style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.3, fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                    Video Principal
                  </h3>
                  <p style={{
                    margin: '0.15rem 0 0 0',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 400,
                    lineHeight: 1.2,
                    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  }}>
                    Contenido multimedia destacado
                  </p>
                </div>
              </div>

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
                    src={toDirectPublicStorageUrl(getMediaBySlot(media as unknown as MediaSlotItem[], 'v1')!.url) || getMediaBySlot(media as unknown as MediaSlotItem[], 'v1')!.url}
                    controls
                    preload="metadata"
                    controlsList="nodownload noplaybackrate"
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
            </motion.section>
          )}
 */}
          {/* Galería de Fotos Mejorada */}
        {/*   {carouselPhotos.length > 0 && (
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
                <h3 className="section-title" style={{ fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                  📷 Galería de Fotos
                </h3>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: colors.light,
                  fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                }}>
                  {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                </div>
              </div>

              <CarouselComponent photos={carouselPhotos} />
            </motion.section>
          )} */}

        </div>
      </div>
    </>
  );
}
