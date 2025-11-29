import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTags } from "../../hooks/useTags";
import { Chip } from "../../components/profile/Chip";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import ClasesLive from '../../components/events/ClasesLive';
import ClasesLiveTabs from "../../components/classes/ClasesLiveTabs";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import UbicacionesLive from "../../components/locations/UbicacionesLive";
import RitmosChips from "../../components/RitmosChips";
import { supabase } from "../../lib/supabase";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import { BioSection } from "../../components/profile/BioSection";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import { useTeacherAcademies } from "../../hooks/useAcademyTeacherInvitations";
import AcademyCard from "../../components/explore/cards/AcademyCard";
import HorizontalSlider from "../../components/explore/HorizontalSlider";
import TeacherRatingComponent from "../../components/teacher/TeacherRatingComponent";
import CompetitionGroupCard from "../../components/explore/cards/CompetitionGroupCard";
import { useCompetitionGroupsByTeacher } from "../../hooks/useCompetitionGroups";
import { colors } from "../../theme/colors";

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

const promotionTypeMeta: Record<string, { icon: string; label: string }> = {
  promocion: { icon: '✨', label: 'Promoción' },
  paquete: { icon: '🧾', label: 'Paquete' },
  descuento: { icon: '💸', label: 'Descuento' },
  membresia: { icon: '🎟️', label: 'Membresía' },
  otro: { icon: '💡', label: 'Otros' },
};

const promotionTypeStyles: Record<string, { background: string; border: string; color: string }> = {
  promocion: { background: 'rgba(240,147,251,0.16)', border: '1px solid rgba(240,147,251,0.28)', color: '#f3c6ff' },
  paquete: { background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)', color: '#a7c8ff' },
  descuento: { background: 'rgba(255,138,101,0.18)', border: '1px solid rgba(255,138,101,0.35)', color: '#ffc1b3' },
  membresia: { background: 'rgba(129,199,132,0.18)', border: '1px solid rgba(129,199,132,0.32)', color: '#bdf2c1' },
  otro: { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: '#f1f5f9' },
};

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

const formatDateOrDay = (fecha?: string, diaSemana?: number | null) => {
  if (fecha) {
    try {
      // Parsear fecha como hora local para evitar problemas de zona horaria
      const plain = String(fecha).split('T')[0];
      const [year, month, day] = plain.split('-').map((part) => parseInt(part, 10));
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        const safe = new Date(year, month - 1, day);
        return safe.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {
      console.error('[TeacherPublicLive] Error formatting date:', e);
    }
  }
  if (typeof diaSemana === 'number' && diaSemana >= 0 && diaSemana <= 6) {
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dayNames[diaSemana];
  }
  return null;
};

export default function TeacherProfileLive() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const { data: allTags } = useTags();
  const [copied, setCopied] = React.useState(false);

  // Fetch public teacher profile
  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher-public', teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_teacher')
        .select('*')
        .eq('id', teacherId)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  // Evitar loops infinitos de "Cargando maestro..." en WebView si hay problemas de red
  const [loadingTimedOut, setLoadingTimedOut] = React.useState(false);

  React.useEffect(() => {
    if (isLoading) {
      setLoadingTimedOut(false);
      const timeoutId = setTimeout(() => {
        setLoadingTimedOut(true);
      }, 15000); // 15s máximo
      return () => clearTimeout(timeoutId);
    }
    setLoadingTimedOut(false);
  }, [isLoading, teacherId]);

  const media = teacher?.media || [];
  const teacherIdNum = teacherId ? Number(teacherId) : undefined;
  const { data: classesFromTables, isLoading: classesLoading } = useLiveClasses(
    teacherIdNum ? { teacherId: teacherIdNum } : undefined
  );
  const promotions = Array.isArray((teacher as any)?.promociones) ? (teacher as any).promociones : [];
  
  // Obtener academias donde el maestro enseña
  const { data: academies } = useTeacherAcademies(teacherIdNum);
  
  // Obtener grupos de competencia del maestro (solo los que no están asociados a una academia)
  const teacherUserId = (teacher as any)?.user_id;
  const { data: competitionGroups, isLoading: loadingGroups } = useCompetitionGroupsByTeacher(teacherUserId);

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

  if (isLoading && !loadingTimedOut) {
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

  if (isLoading && loadingTimedOut) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ maxWidth: 360, margin: '0 auto' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>⚠️</div>
          <p style={{ marginBottom: 8 }}>No se pudo cargar el perfil del maestro.</p>
          <p style={{ marginBottom: 16, opacity: 0.75, fontSize: '0.9rem' }}>
            Revisa tu conexión a internet e inténtalo de nuevo.
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
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
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
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
          No tienes perfil de maestro
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          Crea uno para dar clases
        </p>
        <p style={{ marginBottom: '16px', opacity: 0.8, fontSize: '0.95rem' }}>
          Para crear tu rol ve a edición y guarda tu nombre.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile/teacher')}
          style={{
            padding: '14px 28px',
            borderRadius: '50px',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(30,136,229,0.5)',
          }}
        >
          🎓 Crear Perfil Maestro
        </motion.button>
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
        @media (max-width: 768px) { .teacher-container { padding-top: 64px !important; } }
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
        .teacher-container h2,
        .teacher-container h3 {
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
        .promo-header h2, .promo-header h3 {
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
          .promo-section { padding: 18px 14px 22px !important; }
          .promo-card { flex-direction: column; align-items: flex-start !important; }
          .promo-price-box { align-self: stretch; text-align: right !important; }
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
          .promo-section { padding: 18px 14px 22px !important; }
          .promo-card { padding: 14px 16px !important; }
        }
        @media (max-width: 430px) {
          .teacher-container { padding: 0.75rem !important; }
          .teacher-banner { padding: 1.25rem 0.875rem !important; border-radius: 14px !important; }
          .teacher-banner h1 { font-size: 1.9rem !important; }
          .teacher-banner-avatar { width: 160px !important; height: 160px !important; }
          .teacher-banner-avatar-fallback { font-size: 3.8rem !important; }
          .glass-card-container { 
            padding: 0.625rem !important; 
            border-radius: 10px !important;
            margin-bottom: 0.875rem !important;
          }
          .section-title { font-size: 1rem !important; margin-bottom: 0.75rem !important; }
          .teacher-section {
            padding: 0.625rem !important;
            margin-bottom: 0.875rem !important;
            border-radius: 10px !important;
          }
          .teacher-section h2, .teacher-section h3 {
            font-size: 1rem !important;
            margin-bottom: 0.75rem !important;
          }
          .promo-section { 
            padding: 14px 12px 18px !important;
            border-radius: 20px !important;
          }
          .promo-header h2, .promo-header h3 { font-size: 1.4rem !important; }
          .promo-icon { width: 44px !important; height: 44px !important; font-size: 22px !important; }
          .promo-card { 
            padding: 12px 14px !important;
            border-radius: 18px !important;
          }
          .promo-info h3 { font-size: 1rem !important; }
          .promo-price-box { 
            padding: 8px 12px !important;
            border-radius: 14px !important;
            min-width: 100px !important;
          }
        }
      `}</style>

      <div className="teacher-container">
        {/* Banner Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="teacher-banner glass-card-container"
          style={{
            position: 'relative',
            margin: '2rem auto 0 auto',
            overflow: 'hidden'
          }}
        >
          {copied && <div role="status" aria-live="polite" style={{ position: 'absolute', top: 14, right: 12, padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 700, zIndex: 10 }}>Copiado</div>}
          <div className="teacher-banner-grid">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '1rem'
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
              {/* Badge de verificación y botón de compartir inline */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                {((teacher as any)?.estado_aprobacion === 'aprobado') && (
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
                      const url = typeof window !== 'undefined' ? window.location.href : '';
                      const title = (teacher as any)?.nombre_publico || 'Maestro';
                      const text = `Mira el perfil de ${title}`;
                      const navAny = (navigator as any);
                      if (navAny && typeof navAny.share === 'function') {
                        navAny.share({ title, text, url }).catch(() => {});
                      } else {
                        navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
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
                  ✅
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
                    <RitmosChips selected={slugs} onChange={() => {}} readOnly size="compact" />
                  ) : null;
                })()}
                <ZonaGroupedChips
                  selectedIds={(teacher as any)?.zonas}
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
              {classesLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                  Cargando clases...
                </div>
              ) : classesFromTables && classesFromTables.length > 0 ? (
                <ClasesLiveTabs
                  classes={classesFromTables}
                  title=""
                  subtitle="Filtra por día — solo verás los días que sí tienen clases"
                  sourceType="teacher"
                  sourceId={teacherIdNum}
                  isClickable={true}
                />
              ) : (
                <ClasesLive
                  title=""
                  cronograma={(teacher as any)?.cronograma || []}
                  costos={(teacher as any)?.costos || []}
                  ubicacion={{
                    nombre: (teacher as any)?.ubicaciones?.[0]?.nombre,
                    direccion: (teacher as any)?.ubicaciones?.[0]?.direccion,
                    ciudad: (teacher as any)?.ubicaciones?.[0]?.ciudad,
                    referencias: (teacher as any)?.ubicaciones?.[0]?.referencias
                  }}
                  showCalendarButton={true}
                />
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
                  <h3>Promociones y Paquetes</h3>
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
                  <h3 className="section-title" style={{ margin: 0 }}>Doy clases en</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500' }}>Academias donde colaboro</p>
                </div>
              </div>
              <HorizontalSlider
                items={academies}
                renderItem={(academy: any) => {
                  const academyData = {
                    id: academy.academy_id,
                    nombre_publico: academy.academy_name,
                    bio: academy.academy_bio || '',
                    avatar_url: academy.academy_avatar || null,
                    portada_url: academy.academy_portada || null,
                    ritmos: Array.isArray(academy.academy_ritmos) ? academy.academy_ritmos : [],
                    zonas: Array.isArray(academy.academy_zonas) ? academy.academy_zonas : [],
                    media: academy.academy_portada 
                      ? [{ url: academy.academy_portada, type: 'image', slot: 'cover' }]
                      : academy.academy_avatar 
                      ? [{ url: academy.academy_avatar, type: 'image', slot: 'avatar' }]
                      : (Array.isArray(academy.academy_media) ? academy.academy_media : [])
                  };
                  return <AcademyCard key={academy.academy_id} item={academyData} />;
                }}
                gap={24}
                autoColumns="280px"
              />
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
                  <h3 className="section-title" style={{ margin: 0 }}>Qué dicen sus alumnos</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500' }}>Testimonios de estudiantes</p>
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
          {teacherIdNum && (
            <TeacherRatingComponent teacherId={teacherIdNum} />
          )}

          {/* Slot Video */}
          {getMediaBySlot(media as unknown as MediaSlotItem[], 'v1') && (
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
                  <h3 className="section-title" style={{ margin: 0, fontSize: '1.15rem', lineHeight: 1.3 }}>
                    Video Principal
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

              {/* Contenedor del video compacto */}
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
                    src={getMediaBySlot(media as unknown as MediaSlotItem[], 'v1')!.url}
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
