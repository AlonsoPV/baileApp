import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTeacherMy } from "../../hooks/useTeacher";
import { useTeacherMedia } from "../../hooks/useTeacherMedia";
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import { Chip } from "../../components/profile/Chip";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import CostosyHorarios from './CostosyHorarios';
import ClasesLive from '../../components/events/ClasesLive';
import CrearClase from "../../components/events/CrearClase";
// import { useUpsertTeacher } from "../../hooks/useTeacher";
import UbicacionesLive from "../../components/locations/UbicacionesLive";
import RitmosChips from "../../components/RitmosChips";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import { BioSection } from "../../components/profile/BioSection";

// Componente FAQ Accordion
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
// Componente Carousel para fotos
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
      <div style={{
        position: 'relative',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* Imagen principal */}
        <div style={{
          position: 'relative',
          aspectRatio: '16/9',
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
              onClick={() => setIsFullscreen(true)}
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
          <button
            onClick={prevPhoto}
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
              cursor: 'pointer',
              fontSize: '1.25rem',
              transition: '0.2s'
            }}
          >
            ‹
          </button>
          <button
            onClick={nextPhoto}
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
              cursor: 'pointer',
              fontSize: '1.25rem',
              transition: '0.2s'
            }}
          >
            ›
          </button>
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
              key={index}
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
              <ImageWithFallback
                src={photo}
                alt={`Miniatura ${index + 1}`}
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
          onClick={() => setIsFullscreen(false)}
        >
          <div style={{
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
    const parsed = new Date(fecha);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
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

const formatPriceLabel = (value: any) => {
  if (value === undefined || value === null || value === '') return 'Consultar';
  if (typeof value === 'number') return formatCurrency(value);
  const numeric = Number(value);
  if (!Number.isNaN(numeric)) return formatCurrency(numeric);
  return String(value);
};

export default function TeacherProfileLive() {
  const navigate = useNavigate();
  const { data: teacher, isLoading } = useTeacherMy();
  const { media } = useTeacherMedia();
  const { data: allTags } = useTags();
  // const upsert = useUpsertTeacher();

  // ✅ Auto-redirigir a Edit si no tiene perfil de maestro (DEBE estar ANTES de cualquier return)
  React.useEffect(() => {
    if (!isLoading && !teacher) {
      console.log('[TeacherProfileLive] No profile found, redirecting to edit...');
      navigate('/profile/teacher/edit', { replace: true });
    }
  }, [isLoading, teacher, navigate]);

  // Obtener fotos del carrusel usando los media slots
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot)?.url)
    .filter(Boolean) as string[];

  // Obtener videos
  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot)?.url)
    .filter(Boolean) as string[];

  // Get rhythm names from numeric tag IDs or fallback to catalog IDs (ritmos_seleccionados)
  const getRitmoNombres = () => {
    const names: string[] = [];
    // 1) Priorizar ritmos_seleccionados (IDs del catálogo) ya que es lo que edita el usuario con RitmosChips
    if (Array.isArray((teacher as any)?.ritmos_seleccionados) && (teacher as any).ritmos_seleccionados.length > 0) {
      const labelById = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelById.set(i.id, i.label)));
      names.push(
        ...((teacher as any).ritmos_seleccionados as string[])
          .map(id => labelById.get(id))
          .filter(Boolean) as string[]
      );
    }
    // 2) Si no hay ritmos_seleccionados, usar ritmos (IDs numéricos de tags)
    if (names.length === 0) {
      const ritmos = (teacher as any)?.ritmos || [];
      if (allTags && Array.isArray(ritmos) && ritmos.length > 0) {
        names.push(
          ...ritmos
            .map((id: number) => allTags.find((tag: any) => tag.id === id && tag.tipo === 'ritmo')?.nombre)
            .filter(Boolean) as string[]
        );
      }
    }
    return names;
  };

  const getZonaNombres = () => {
    const zonas = (teacher as any)?.zonas || [];
    if (!allTags || !zonas) return [];
    return zonas.map((id: number) => allTags.find((tag: any) => tag.id === id && tag.tipo === 'zona')?.nombre).filter(Boolean);
  };

  const promotions = Array.isArray((teacher as any)?.promociones) ? (teacher as any).promociones : [];

  console.log('[TeacherProfileLive] Teacher data:', teacher);
  console.log('[TeacherProfileLive] Teacher redes_sociales:', (teacher as any)?.redes_sociales);

  if (isLoading) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Cargando maestro...</p>
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
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            Cargando perfil...
          </h2>
          <p style={{ opacity: 0.7 }}>
            Redirigiendo a edición para crear tu perfil de maestro
          </p>
        </div>
      </div>
    );
  }



  return (
    <>
      <style>{`
        .teacher-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .teacher-banner {
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
        .teacher-banner-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          align-items: center;
        }
        .teacher-banner-avatar {
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
        .teacher-banner-avatar-fallback {
          font-size: 6rem;
        }
        .profile-promos-section {
          margin-bottom: 2rem;
          padding: 2rem;
          background: rgba(18, 20, 28, 0.78);
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
        }
        .profile-promos-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(30,136,229,0.16), transparent 55%);
          pointer-events: none;
        }
        .profile-promos-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }
        .profile-promos-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          background: linear-gradient(135deg, rgba(30,136,229,0.9), rgba(240,147,251,0.9));
          box-shadow: 0 10px 26px rgba(30,136,229,0.28);
        }
        .profile-promos-title {
          margin: 0;
        }
        .profile-promos-subtitle {
          font-size: 0.9rem;
          opacity: 0.8;
          margin: 0.35rem 0 0 0;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
        }
        .profile-promos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.1rem;
          position: relative;
          z-index: 1;
        }
        .profile-promo-card {
          padding: 1.4rem 1.5rem;
          border-radius: 16px;
          background: rgba(8, 10, 18, 0.55);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-height: 180px;
        }
        .profile-promo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .profile-promo-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .profile-promo-title {
          margin: 0;
          color: #fff;
          font-size: 1.1rem;
          font-weight: 700;
        }
        .profile-promo-description {
          margin: 0;
          font-size: 0.92rem;
          color: rgba(255,255,255,0.78);
          line-height: 1.55;
        }
        .profile-promo-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .profile-promo-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .profile-promo-chip--muted {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.72);
        }
        .profile-promo-chip--success {
          background: rgba(16,185,129,0.14);
          border: 1px solid rgba(16,185,129,0.32);
          color: #98f5c5;
        }
        .profile-promo-chip--warning {
          background: rgba(255,209,102,0.14);
          border: 1px solid rgba(255,209,102,0.32);
          color: #ffe3a6;
        }
        .profile-promo-chip--meta {
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.16);
          color: rgba(255,255,255,0.8);
        }
        .profile-promo-price {
          padding: 0.4rem 0.85rem;
          border-radius: 12px;
          background: rgba(30,136,229,0.18);
          border: 1px solid rgba(30,136,229,0.35);
          color: #bbdcff;
          font-weight: 700;
          font-size: 0.95rem;
        }
        .profile-promo-price.is-placeholder {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.8);
        }

        @media (max-width: 768px) {
          .teacher-container {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          .teacher-banner {
            border-radius: 16px !important;
            padding: 1.5rem 1rem !important;
            margin: 0 !important;
          }
          .teacher-banner-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
            gap: 1.5rem !important;
            justify-items: center !important;
          }
          .teacher-banner h1 {
            font-size: 2.6rem !important;
            line-height: 1.2 !important;
          }
          .teacher-banner-avatar {
            width: 220px !important;
            height: 220px !important;
          }
          .teacher-banner-avatar-fallback {
            font-size: 4.6rem !important;
          }
          .glass-card-container {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            border-radius: 16px !important;
          }
          .profile-promos-section {
            padding: 1.5rem !important;
            border-radius: 18px !important;
          }
          .profile-promos-header {
            align-items: flex-start;
          }
          .profile-promos-icon {
            width: 52px;
            height: 52px;
            font-size: 1.55rem;
          }
          .profile-promos-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 480px) {
          .teacher-banner h1 {
            font-size: 2.2rem !important;
          }
          .teacher-banner-avatar {
            width: 180px !important;
            height: 180px !important;
          }
          .teacher-banner-avatar-fallback {
            font-size: 4.1rem !important;
          }
          .glass-card-container {
            padding: 0.75rem !important;
            border-radius: 12px !important;
          }
          .profile-promos-section {
            padding: 1.25rem !important;
            border-radius: 16px !important;
          }
          .profile-promo-card {
            padding: 1.1rem 1.15rem !important;
          }
          .profile-promo-title {
            font-size: 1rem !important;
          }
          .profile-promo-description {
            font-size: 0.88rem !important;
          }
        }
        
        /* Responsive styles for sections */
        .teacher-section {
          margin-bottom: 2rem;
          padding: 2rem;
        }
        .teacher-videos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .teacher-container {
            padding: 1rem !important;
          }
          .teacher-section {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          .teacher-section h2, .teacher-section h3 {
            font-size: 1.25rem !important;
            margin-bottom: 1rem !important;
          }
          .teacher-videos-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .teacher-section {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 12px !important;
          }
          .teacher-section h2, .teacher-section h3 {
            font-size: 1.1rem !important;
          }
          .teacher-videos-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>

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

        {/* Banner Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="teacher-banner glass-card-container"
          style={{
            position: 'relative',
            margin: '0 auto',
            overflow: 'hidden'
          }}
        >
          <div className="teacher-banner-grid">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div className="teacher-banner-avatar">
                {getMediaBySlot(media as unknown as MediaSlotItem[], 'cover')?.url || getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url ? (
                  <img
                    src={getMediaBySlot(media as unknown as MediaSlotItem[], 'cover')?.url || getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url || ''}
                    alt="Foto del maestro"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="teacher-banner-avatar-fallback" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6rem',
                    fontWeight: '700',
                    color: 'white'
                  }}>
                    {(teacher as any)?.nombre_publico?.[0]?.toUpperCase() || '🎓'}
                  </div>
                )}
              </div>
              {/* Estado debajo del avatar */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 9999,
                    background: (teacher as any)?.estado_aprobacion === 'aprobado'
                      ? 'rgba(16,185,129,0.12)'
                      : 'rgba(30,136,229,0.12)',
                    border: (teacher as any)?.estado_aprobacion === 'aprobado'
                      ? '1px solid rgba(16,185,129,0.35)'
                      : '1px solid rgba(30,136,229,0.35)',
                    color: (teacher as any)?.estado_aprobacion === 'aprobado' ? '#9be7a1' : '#90caf9',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: 'none',
                    backdropFilter: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    textTransform: 'none',
                    letterSpacing: 0
                  }}
                >
                  {(teacher as any)?.estado_aprobacion === 'aprobado' ? '✅ Verificado' : `⏳ ${(teacher as any)?.estado_aprobacion || 'pendiente'}`}
                </motion.span>
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
                {(teacher as any)?.nombre_publico}
              </h1>
             {/*  {(teacher as any)?.estado_aprobacion === 'aprobado' && (
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
                  ✅ Verificado
                </span>
              )} */}
              <p style={{
                fontSize: '1.25rem',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 1.5rem 0',
                lineHeight: 1.4
              }}>
                Maestro
              </p>

              {/* Chips de Ritmos y Zonas dentro del banner */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(() => {
                  const slugs = normalizeRitmosToSlugs(teacher, allTags);
                  return slugs.length > 0 ? (
                    <RitmosChips selected={slugs} onChange={() => {}} readOnly />
                  ) : null;
                })()}
                {getZonaNombres().map((zona, index) => (
                  <Chip
                    key={`zona-${index}`}
                    label={zona}
                    active={true}
                    variant="zona"
                    style={{
                      background: 'rgba(25, 118, 210, 0.2)',
                      border: '1px solid #1976D2',
                      color: '#90CAF9',
                      fontWeight: '600'
                    }}
                  />
                ))}
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
              bio={(teacher as any)?.bio}
              redes={(teacher as any)?.redes_sociales || (teacher as any)?.respuestas?.redes}
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
                <h3 className="section-title" style={{ margin: 0 }}>Mis clases</h3>
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
              <ClasesLive title="" cronograma={(teacher as any)?.cronograma || []} costos={(teacher as any)?.costos || []} ubicacion={{ nombre: (teacher as any)?.ubicaciones?.[0]?.nombre, direccion: (teacher as any)?.ubicaciones?.[0]?.direccion, ciudad: (teacher as any)?.ubicaciones?.[0]?.ciudad, referencias: (teacher as any)?.ubicaciones?.[0]?.referencias }} showCalendarButton={true} />
            </div>
          </motion.section>

          {promotions.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="profile-promos-section"
            >
              <div className="profile-promos-header">
                <div className="profile-promos-icon">💸</div>
                <div>
                  <h3 className="section-title profile-promos-title">Promociones y Paquetes</h3>
                  <p className="profile-promos-subtitle">
                    Paquetes especiales, descuentos y membresías disponibles
                  </p>
                </div>
              </div>

              <div className="profile-promos-grid">
                {promotions.map((promo: any, index: number) => {
                  const typeKey = promo?.tipo && promotionTypeMeta[promo.tipo] ? promo.tipo : 'otro';
                  const typeMeta = promotionTypeMeta[typeKey];
                  const typeStyle = promotionTypeStyles[typeKey];
                  const validityParts: string[] = [];
                  const desde = formatDateOrDay(promo?.validoDesde);
                  const hasta = formatDateOrDay(promo?.validoHasta);
                  if (desde) validityParts.push(`desde ${desde}`);
                  if (hasta) validityParts.push(`hasta ${hasta}`);
                  const priceLabel = formatPriceLabel(promo?.precio);
                  const priceIsPlaceholder = priceLabel === 'Consultar';

                  return (
                    <motion.div
                      key={`${promo?.nombre || 'promo'}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="profile-promo-card"
                    >
                      <div className="profile-promo-header">
                        <span
                          className="profile-promo-chip"
                          style={typeStyle}
                        >
                          {typeMeta.icon} {typeMeta.label}
                        </span>
                        <span
                          className={`profile-promo-price${priceIsPlaceholder ? ' is-placeholder' : ''}`}
                        >
                          {priceLabel}
                        </span>
                      </div>

                      {(promo?.codigo || promo?.activo === false) && (
                        <div className="profile-promo-meta">
                          {promo?.codigo && (
                            <span className="profile-promo-chip profile-promo-chip--success">
                              Código: {String(promo.codigo).toUpperCase()}
                            </span>
                          )}
                          {promo?.activo === false && (
                            <span className="profile-promo-chip profile-promo-chip--muted">
                              Inactiva
                            </span>
                          )}
                        </div>
                      )}

                      <h4 className="profile-promo-title">
                        {promo?.nombre || 'Promoción'}
                      </h4>

                      {promo?.descripcion && (
                        <p className="profile-promo-description">
                          {promo.descripcion}
                        </p>
                      )}

                      {(promo?.condicion || validityParts.length > 0) && (
                        <div className="profile-promo-chips">
                          {promo?.condicion && (
                            <span className="profile-promo-chip profile-promo-chip--meta">
                              📋 {promo.condicion}
                            </span>
                          )}
                          {validityParts.length > 0 && (
                            <span className="profile-promo-chip profile-promo-chip--warning">
                              ⏰ Vigente {validityParts.join(' · ')}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Ubicaciones (live) */}
          {Array.isArray((teacher as any)?.ubicaciones) && (teacher as any).ubicaciones.length > 0 && (
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
              <UbicacionesLive ubicaciones={(teacher as any).ubicaciones} />
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
                  <h3 className="section-title" style={{ margin: 0 }}>Información para Estudiantes</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500' }}>Preguntas frecuentes</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(teacher as any).faq.map((faq: any, index: number) => (
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} style={{ padding: '1rem 1.25rem', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem' }}>{faq.q}</h4>
                    <p style={{ fontSize: '1rem', opacity: 0.85, margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

         

          {/* Foto Principal */}
          {getMediaBySlot(media as unknown as MediaSlotItem[], 'p1') && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'center',
                opacity: 1,
                transform: 'none'
              }}
            >
              <div style={{
                width: '100%',
                maxWidth: '500px',
                height: 'auto',
                aspectRatio: '16/9',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}>
                <ImageWithFallback
                  alt="Foto principal"
                  src={getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center'
                  }}
                />
              </div>
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
              style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                opacity: 1,
                transform: 'none'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: 0
                }}>
                  📷 Galería de Fotos
                </h3>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgba(245, 245, 245, 0.9)'
                }}>
                  {carouselPhotos.length} fotos
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
