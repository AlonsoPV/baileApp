import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAcademyMy } from "../../hooks/useAcademy";
import { useAcademyMedia } from "../../hooks/useAcademyMedia";
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import CostosyHorarios from './CostosyHorarios';
import ClasesLive from '../../components/events/ClasesLive';
import ClasesLiveTabs from '../../components/classes/ClasesLiveTabs';
import { useLiveClasses } from '../../hooks/useLiveClasses';
import CrearClase from "../../components/events/CrearClase";
import { useUpsertAcademy } from "../../hooks/useAcademy";
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

// Componente FA   Q Accordion
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
};
{/* sección eliminada: contenía referencias a variables no definidas (parents, spacing, typography) y no pertenece a Academy */ }
// Componente Carousel para fotos mejorado
const CarouselComponent: React.FC<{ photos: string[] }> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (photos.length === 0) return null;

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <>
      <style>{`
        .photo-gallery-main {
          position: relative;
          aspect-ratio: 16/9;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.15);
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1));
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .photo-gallery-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.25);
        }
        .photo-gallery-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        .photo-gallery-image:hover {
          transform: scale(1.02);
        }
        .photo-gallery-counter {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.7));
          backdrop-filter: blur(10px);
          color: white;
          padding: 0.6rem 1.2rem;
          border-radius: 24px;
          fontSize: 0.875rem;
          fontWeight: 700;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }
        .photo-gallery-nav-btn {
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
        }
        .photo-gallery-nav-btn:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.15));
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }
        .photo-gallery-nav-btn:active {
          transform: translateY(-50%) scale(0.95);
        }
        .photo-gallery-nav-btn--prev {
          left: 1.25rem;
        }
        .photo-gallery-nav-btn--next {
          right: 1.25rem;
        }
        .photo-gallery-thumbnails {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.75rem;
          margin-top: 1.5rem;
          max-width: 100%;
        }
        .photo-gallery-thumb {
          position: relative;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          border: 3px solid transparent;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        .photo-gallery-thumb:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }
        .photo-gallery-thumb.active {
          border-color: #E53935;
          box-shadow: 0 0 0 2px rgba(229, 57, 53, 0.3), 0 8px 24px rgba(229, 57, 53, 0.4);
        }
        .photo-gallery-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .photo-gallery-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          cursor: pointer;
          backdrop-filter: blur(10px);
        }
        .photo-gallery-fullscreen-content {
          max-width: 95vw;
          max-height: 95vh;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }
        .photo-gallery-fullscreen-close {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.5rem;
          font-weight: 700;
          transition: all 0.2s ease;
          z-index: 1001;
        }
        .photo-gallery-fullscreen-close:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.1);
        }
        @media (max-width: 768px) {
          .photo-gallery-main {
            border-radius: 16px;
          }
          .photo-gallery-counter {
            top: 1rem;
            right: 1rem;
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
          }
          .photo-gallery-nav-btn {
            width: 44px;
            height: 44px;
            font-size: 1.25rem;
          }
          .photo-gallery-nav-btn--prev {
            left: 1rem;
          }
          .photo-gallery-nav-btn--next {
            right: 1rem;
          }
          .photo-gallery-thumbnails {
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
            gap: 0.6rem;
            margin-top: 1.25rem;
          }
        }
        @media (max-width: 480px) {
          .photo-gallery-main {
            border-radius: 12px;
          }
          .photo-gallery-counter {
            top: 0.75rem;
            right: 0.75rem;
            padding: 0.4rem 0.8rem;
            font-size: 0.75rem;
          }
          .photo-gallery-nav-btn {
            width: 40px;
            height: 40px;
            font-size: 1.1rem;
          }
          .photo-gallery-nav-btn--prev {
            left: 0.75rem;
          }
          .photo-gallery-nav-btn--next {
            right: 0.75rem;
          }
          .photo-gallery-thumbnails {
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
            gap: 0.5rem;
            margin-top: 1rem;
          }
        }
      `}</style>
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
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="photo-gallery-nav-btn photo-gallery-nav-btn--next"
                aria-label="Foto siguiente"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Miniaturas */}
        {photos.length > 1 && (
          <div className="photo-gallery-thumbnails">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => goToPhoto(index)}
                className={`photo-gallery-thumb ${index === currentIndex ? 'active' : ''}`}
                aria-label={`Ver foto ${index + 1}`}
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
        >
          <button
            className="photo-gallery-fullscreen-close"
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
            aria-label="Cerrar"
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
};

const colors = {
  primary: '#E53935',
  secondary: '#FB8C00',
  blue: '#1E88E5',
  coral: '#FF7043',
  light: '#F5F5F5',
  dark: '#1A1A1A',
  orange: '#FF9800'
};

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
      console.error('[AcademyProfileLive] Error formatting date:', e);
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

export default function AcademyProfileLive() {
  const navigate = useNavigate();
  const { data: academy, isLoading } = useAcademyMy();
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
  
  // Debug: verificar datos
  React.useEffect(() => {
    console.log('[AcademyProfileLive] academyId:', academyId);
    console.log('[AcademyProfileLive] competitionGroups:', competitionGroups);
    console.log('[AcademyProfileLive] loadingGroups:', loadingGroups);
  }, [academyId, competitionGroups, loadingGroups]);

  // ✅ Auto-redirigir a Edit si no tiene perfil de academia (DEBE estar antes de cualquier return)
  React.useEffect(() => {
    if (!isLoading && !academy) {
      navigate('/profile/academy/edit', { replace: true });
    }
  }, [isLoading, academy, navigate]);

  // Obtener fotos del carrusel usando los media slots
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot)?.url)
    .filter(Boolean) as string[];

  const primaryAvatarUrl = useMemo(() => {
    const p1 = getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url;
    const cover = getMediaBySlot(media as unknown as MediaSlotItem[], 'cover')?.url;
    return p1 || cover || (academy as any)?.avatar_url || (academy as any)?.portada_url || null;
  }, [media, academy]);

  // Obtener videos
  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot)?.url)
    .filter(Boolean) as string[];

  // Get rhythm names from either numeric tag IDs (ritmos/estilos) or catalog IDs (ritmos_seleccionados)
  const getRitmoNombres = () => {
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
  };

  const promotions = Array.isArray((academy as any)?.promociones) ? (academy as any).promociones : [];

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

  if (!academy) {
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
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            Cargando perfil...
          </h2>
          <p style={{ opacity: 0.7 }}>
            Redirigiendo a edición para crear tu perfil de academia
          </p>
        </div>
      </div>
    );
  }



  return (
    <>
      <style>{`
        .academy-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .academy-banner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
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
        .academy-container h2,
        .academy-container h3 {
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
        .academy-banner-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          align-items: center;
        }
        .academy-banner-avatar {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          overflow: hidden;
          border: 6px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
          background: linear-gradient(135deg, #1E88E5, #FF7043);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          font-weight: 700;
          color: white;
        }
        .academy-banner-avatar-fallback {
          font-size: 6rem;
        }
        .promo-section {
          background: radial-gradient(circle at top, #161929, #05060c);
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 24px 24px 28px;
          max-width: 1000px;
          margin: 0 auto 2rem;
        }
        .promo-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .promo-icon {
          width: 52px;
          height: 52px;
          border-radius: 20px;
          background: radial-gradient(circle at 20% 20%, #4ade80, #22c55e, #16a34a);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
        }
        .promo-header h2 {
          font-size: 1.7rem;
          color: #fff;
          margin: 0;
          font-weight: 900;
        }
        .promo-header p {
          color: #a9b1c8;
          font-size: 0.95rem;
          margin: 0.5rem 0 0 0;
        }
        .promo-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .promo-card {
          background: linear-gradient(135deg, #111522, #101321);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
          transition: transform 0.16s ease-out, box-shadow 0.16s ease-out, border-color 0.16s ease-out, background 0.16s ease-out;
        }
        .promo-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 26px 55px rgba(0, 0, 0, 0.7);
          border-color: rgba(148, 163, 255, 0.4);
          background: linear-gradient(145deg, #14182a, #101320);
        }
        .promo-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .promo-chip {
          align-self: flex-start;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: rgba(37, 99, 235, 0.15);
          color: #bfdbfe;
          border: 1px solid rgba(59, 130, 246, 0.5);
        }
        .promo-chip--destacado {
          background: rgba(249, 115, 22, 0.18);
          color: #fed7aa;
          border-color: rgba(249, 115, 22, 0.7);
        }
        .promo-info h3 {
          font-size: 1.1rem;
          color: #fff;
          margin: 0;
          font-weight: 800;
        }
        .promo-desc {
          color: #a9b1c8;
          font-size: 0.9rem;
          margin: 0;
        }
        .promo-price-box {
          min-width: 120px;
          padding: 10px 16px;
          border-radius: 18px;
          background: radial-gradient(circle at top, #0b3b74, #0b1220);
          border: 1px solid rgba(56, 189, 248, 0.7);
          box-shadow: 0 12px 35px rgba(56, 189, 248, 0.45);
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .promo-price-box--destacado {
          background: radial-gradient(circle at top, #f97316, #b45309);
          border-color: rgba(251, 191, 36, 0.9);
          box-shadow: 0 14px 40px rgba(251, 146, 60, 0.65);
        }
        .promo-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .promo-unit {
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgba(191, 219, 254, 0.85);
          margin: 0;
        }
        @media (max-width: 768px) {
          .academy-container {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          .academy-banner {
            border-radius: 16px !important;
            padding: 1.5rem 1rem !important;
            margin: 0 !important;
          }
          .academy-banner-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
            gap: 1.5rem !important;
            justify-items: center !important;
          }
          .academy-banner h1 {
            font-size: 2.6rem !important;
            line-height: 1.2 !important;
          }
          .academy-banner-avatar {
            width: 220px !important;
            height: 220px !important;
          }
          .academy-banner-avatar-fallback {
            font-size: 4.6rem !important;
          }
          .glass-card-container {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            border-radius: 16px !important;
          }
          .promo-section { padding: 18px 14px 22px !important; }
          .promo-card { flex-direction: column; align-items: flex-start !important; }
          .promo-price-box { align-self: stretch; text-align: right !important; }
        }
        @media (max-width: 480px) {
          .academy-banner h1 {
            font-size: 2.2rem !important;
          }
          .academy-banner-avatar {
            width: 180px !important;
            height: 180px !important;
          }
          .academy-banner-avatar-fallback {
            font-size: 4.1rem !important;
          }
          .glass-card-container {
            padding: 0.75rem !important;
            border-radius: 12px !important;
          }
          .promo-section { padding: 18px 14px 22px !important; }
          .promo-card { padding: 14px 16px !important; }
        }
        /* Maestros Invitados Section */
        /* Maestros Invitados Section - Diseño mejorado y responsive */
        .teachers-invited-section {
          position: relative;
          margin-bottom: 3rem;
          margin-top: 3rem;
          padding: 3rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          overflow: visible;
        }
        .teachers-invited-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #E53935, #FB8C00, #FFD166);
          opacity: 0.9;
          border-radius: 28px 28px 0 0;
        }
        .teachers-invited-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
          position: relative;
          z-index: 1;
        }
        .teachers-invited-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #E53935, #FB8C00);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 0 8px 24px rgba(229, 57, 53, 0.4);
          flex-shrink: 0;
        }
        .teachers-invited-title {
          font-size: 1.75rem;
          font-weight: 900;
          margin: 0 0 0.25rem 0;
          color: #fff;
          text-shadow: 0 2px 8px rgba(229, 57, 53, 0.3), 0 0 16px rgba(251, 140, 0, 0.2);
        }
        .teachers-invited-subtitle {
          font-size: 0.95rem;
          opacity: 0.85;
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }
        /* Espacio visual mejorado para las tarjetas */
        .teachers-invited-section .horizontal-slider-grid {
          display: grid !important;
          grid-auto-flow: column !important;
          gap: 1.5rem !important;
          padding: 0.75rem 0 !important;
          margin: 0 !important;
        }
        .teachers-invited-section .horizontal-slider-grid > * {
          min-width: 0 !important;
          overflow: visible !important;
          margin: 0 !important;
          width: auto !important;
          flex-shrink: 0 !important;
        }
        /* Asegurar que las TeacherCard tengan espacio suficiente y se vean completas */
        .teachers-invited-section .horizontal-slider-grid > div {
          width: 320px !important;
          min-width: 320px !important;
          max-width: 320px !important;
          height: auto !important;
        }
        /* Asegurar que el viewport no corte las tarjetas */
        .teachers-invited-section > div > div {
          overflow-x: auto !important;
          overflow-y: visible !important;
        }
        /* Asegurar que las tarjetas no se compriman */
        .teachers-invited-section .horizontal-slider-grid > div > div {
          width: 100% !important;
          height: 100% !important;
        }
        @media (max-width: 768px) {
          .teachers-invited-section {
            padding: 2rem !important;
            margin-bottom: 2rem !important;
            margin-top: 2rem !important;
            border-radius: 24px !important;
          }
          .teachers-invited-header {
            flex-direction: row !important;
            align-items: center !important;
            gap: 1rem !important;
            margin-bottom: 2rem !important;
          }
          .teachers-invited-icon {
            width: 56px !important;
            height: 56px !important;
            font-size: 1.75rem !important;
            border-radius: 16px !important;
          }
          .teachers-invited-title {
            font-size: 1.5rem !important;
          }
          .teachers-invited-subtitle {
            font-size: 0.875rem !important;
          }
          .teachers-invited-section .horizontal-slider-grid {
            gap: 1.25rem !important;
            padding: 0.75rem 0 !important;
          }
          .teachers-invited-section .horizontal-slider-grid > div {
            width: 300px !important;
            min-width: 300px !important;
            max-width: 300px !important;
          }
        }
        @media (max-width: 480px) {
          .teachers-invited-section {
            padding: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            margin-top: 1.5rem !important;
            border-radius: 20px !important;
          }
          .teachers-invited-header {
            flex-direction: row !important;
            align-items: center !important;
            gap: 0.875rem !important;
            margin-bottom: 1.5rem !important;
          }
          .teachers-invited-icon {
            width: 48px !important;
            height: 48px !important;
            font-size: 1.5rem !important;
            border-radius: 14px !important;
          }
          .teachers-invited-title {
            font-size: 1.25rem !important;
          }
          .teachers-invited-subtitle {
            font-size: 0.8rem !important;
          }
          .teachers-invited-section .horizontal-slider-grid {
            gap: 1rem !important;
            padding: 0.75rem 0 !important;
          }
          .teachers-invited-section .horizontal-slider-grid > div {
            width: 280px !important;
            min-width: 280px !important;
            max-width: 280px !important;
          }
        }
        /* Galería de Fotos Section - Diseño mejorado */
        .photo-gallery-section {
          position: relative;
          margin-bottom: 2rem;
          padding: 2.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }
        .photo-gallery-section-top-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #E53935, #FB8C00, #FFD166, #4CAF50);
          opacity: 0.9;
        }
        .photo-gallery-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }
        .photo-gallery-section-header-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .photo-gallery-section-icon {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #E53935, #FB8C00);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 0 8px 24px rgba(229, 57, 53, 0.4);
          flex-shrink: 0;
        }
        .photo-gallery-section-title {
          font-size: 1.75rem;
          font-weight: 900;
          margin: 0 0 0.25rem 0;
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%);
          -webkit-background-clip: text;
         
          background-clip: text;
        }
        .photo-gallery-section-subtitle {
          font-size: 0.95rem;
          opacity: 0.8;
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }
        .photo-gallery-section-count {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, rgba(229, 57, 53, 0.2), rgba(251, 140, 0, 0.2));
          border-radius: 16px;
          border: 1px solid rgba(229, 57, 53, 0.3);
          box-shadow: 0 4px 16px rgba(229, 57, 53, 0.2);
          min-width: 80px;
        }
        .photo-gallery-section-count-number {
          font-size: 1.75rem;
          font-weight: 900;
          color: #fff;
          line-height: 1;
          margin-bottom: 0.125rem;
        }
        .photo-gallery-section-count-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .photo-gallery-section {
            padding: 1.5rem !important;
            border-radius: 20px !important;
            margin-bottom: 1.5rem !important;
          }
          .photo-gallery-section-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          .photo-gallery-section-header-left {
            width: 100% !important;
            gap: 1rem !important;
          }
          .photo-gallery-section-icon {
            width: 56px !important;
            height: 56px !important;
            font-size: 1.75rem !important;
            border-radius: 16px !important;
          }
          .photo-gallery-section-title {
            font-size: 1.5rem !important;
          }
          .photo-gallery-section-subtitle {
            font-size: 0.875rem !important;
          }
          .photo-gallery-section-count {
            align-self: flex-end !important;
            padding: 0.625rem 1rem !important;
            min-width: 70px !important;
          }
          .photo-gallery-section-count-number {
            font-size: 1.5rem !important;
          }
          .photo-gallery-section-count-label {
            font-size: 0.7rem !important;
          }
          /* Ajustes para el carousel en tablet */
          .photo-gallery-main {
            border-radius: 16px !important;
          }
          .photo-gallery-thumbnails {
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)) !important;
            gap: 0.6rem !important;
          }
        }
        @media (max-width: 480px) {
          .photo-gallery-section {
            padding: 1.25rem !important;
            border-radius: 16px !important;
            margin-bottom: 1rem !important;
          }
          .photo-gallery-section-header {
            margin-bottom: 1.25rem !important;
          }
          .photo-gallery-section-header-left {
            gap: 0.875rem !important;
          }
          .photo-gallery-section-icon {
            width: 48px !important;
            height: 48px !important;
            font-size: 1.5rem !important;
            border-radius: 14px !important;
          }
          .photo-gallery-section-title {
            font-size: 1.25rem !important;
          }
          .photo-gallery-section-subtitle {
            font-size: 0.8rem !important;
          }
          .photo-gallery-section-count {
            padding: 0.5rem 0.875rem !important;
            min-width: 60px !important;
            border-radius: 12px !important;
          }
          .photo-gallery-section-count-number {
            font-size: 1.25rem !important;
          }
          .photo-gallery-section-count-label {
            font-size: 0.65rem !important;
          }
          /* Ajustes para el carousel en móvil */
          .photo-gallery-main {
            border-radius: 12px !important;
          }
          .photo-gallery-thumbnails {
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)) !important;
            gap: 0.5rem !important;
            margin-top: 1rem !important;
          }
        }
        
        /* Responsive styles for sections */
        .academy-section {
          margin-bottom: 2rem;
          padding: 2rem;
        }
        .academy-videos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .academy-container {
            padding: 1rem !important;
          }
          .academy-section {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          .academy-section h2, .academy-section h3 {
            font-size: 1.25rem !important;
            margin-bottom: 1rem !important;
          }
          .academy-videos-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .academy-section {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 12px !important;
          }
          .academy-section h2, .academy-section h3 {
            font-size: 1.1rem !important;
          }
          .academy-videos-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>

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
            overflow: 'hidden'
          }}
        >
          {copied && <div role="status" aria-live="polite" style={{ position: 'absolute', top: 14, right: 12, padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 700, zIndex: 10 }}>Copiado</div>}
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
              {/* Badge de verificación y botón de compartir inline */}
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
                <button
                  aria-label="Compartir perfil"
                  title="Compartir"
                  onClick={() => {
                    try {
                      const publicUrl = academyId ? `${window.location.origin}/academia/${academyId}` : '';
                      const title = academy.nombre_publico || 'Academia';
                      const text = `Mira el perfil de ${title}`;
                      const navAny = (navigator as any);
                      if (navAny && typeof navAny.share === 'function') {
                        navAny.share({ title, text, url: publicUrl }).catch(() => {});
                      } else {
                        navigator.clipboard?.writeText(publicUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
                      }
                    } catch {}
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff',
                    borderRadius: 999,
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700
                  }}
                >
                  📤 Compartir
                </button>
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
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div style={{ padding: '2rem 0' }}>
          {/* Biografía y Redes Sociales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <BioSection 
              bio={academy.bio}
              redes={(academy as any)?.redes_sociales || (academy as any)?.respuestas?.redes}
            />
          </motion.div>

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
                <h2 className="section-title" style={{ margin: 0 }}>
                  Nuestras clases
                </h2>
                <p style={{
                  fontSize: '0.9rem',
                  opacity: 0.8,
                  margin: '0.25rem 0 0 0',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
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
                <>
                  <ClasesLiveTabs
                    classes={classesFromTables}
                    title=""
                    subtitle="Filtra por día — solo verás los días que sí tienen clases"
                    sourceType="academy"
                    sourceId={academy?.id}
                    isClickable={false}
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
                    sourceId={academy?.id}
                    isClickable={false}
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
                  <CompetitionGroupCard key={group.id} group={group} />
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
              <UbicacionesLive
                ubicaciones={(academy as any).ubicaciones}
                headingSize="1.5rem"
              />
            </motion.section>
          )}


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
            <AcademyRatingComponent academyId={academy.id} />
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
                  const teacherData = {
                    id: t.teacher_id,
                    nombre_publico: t.teacher_name,
                    bio: t.teacher_bio || '',
                    avatar_url: t.teacher_avatar || null,
                    portada_url: t.teacher_portada || null,
                    banner_url: t.teacher_portada || t.teacher_avatar || null,
                    ritmos: Array.isArray(t.teacher_ritmos) ? t.teacher_ritmos : [],
                    zonas: Array.isArray(t.teacher_zonas) ? t.teacher_zonas : [],
                    media: t.teacher_portada 
                      ? [{ url: t.teacher_portada, type: 'image', slot: 'cover' }]
                      : t.teacher_avatar 
                      ? [{ url: t.teacher_avatar, type: 'image', slot: 'avatar' }]
                      : (Array.isArray(t.teacher_media) ? t.teacher_media : [])
                  };
                  return <TeacherCard key={t.teacher_id} item={teacherData} />;
                }}
                gap={24}
                autoColumns="280px"
              />
            </motion.section>
          )}




          {/* Galería de Fotos Mejorada */}
          {carouselPhotos.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              id="user-profile-photo-gallery"
              data-baile-id="user-profile-photo-gallery"
              data-test-id="user-profile-photo-gallery"
              className="photo-gallery-section"
            >
              {/* Top gradient bar */}
              <div className="photo-gallery-section-top-bar" />
              
              {/* Header destacado */}
              <div className="photo-gallery-section-header">
                <div className="photo-gallery-section-header-left">
                  <div className="photo-gallery-section-icon">
                    📷
                  </div>
                  <div>
                    <h3 className="photo-gallery-section-title">Galería de Fotos</h3>
                    <p className="photo-gallery-section-subtitle">Momentos y recuerdos de la academia</p>
                  </div>
                </div>
                <div className="photo-gallery-section-count">
                  <span className="photo-gallery-section-count-number">{carouselPhotos.length}</span>
                  <span className="photo-gallery-section-count-label">fotos</span>
                </div>
              </div>
              
              <CarouselComponent photos={carouselPhotos} />
            </motion.section>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="academy-section"
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
              <h3 className="section-title">🎥 Videos</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}
                className="academy-videos-grid"
              >
                {videos.map((video, index) => (
                  <div
                    key={index}
                    style={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '16/9',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(0, 0, 0, 0.1)'
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
                  </div>
                ))}
              </div>
            </motion.section>
          )}


        </div>
      </div>
    </>
  );
}
