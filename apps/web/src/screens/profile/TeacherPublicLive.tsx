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
    const plain = String(fecha).split('T')[0];
    const [year, month, day] = plain.split('-').map((part) => parseInt(part, 10));
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      const safe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      return safe.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' });
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

  const media = teacher?.media || [];
  const teacherIdNum = teacherId ? Number(teacherId) : undefined;
  const { data: classesFromTables, isLoading: classesLoading } = useLiveClasses(
    teacherIdNum ? { teacherId: teacherIdNum } : undefined
  );
  const promotions = Array.isArray((teacher as any)?.promociones) ? (teacher as any).promociones : [];
  
  // Obtener academias donde el maestro enseña
  const { data: academies } = useTeacherAcademies(teacherIdNum);

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
        .profile-promos-section {
          margin-bottom: 2rem;
          padding: 2.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          position: relative;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }
        .profile-promos-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #f093fb, #f5576c, #FFD166, #1E88E5);
          border-radius: 24px 24px 0 0;
          opacity: 0.8;
        }
        .profile-promos-header {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .profile-promos-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          background: linear-gradient(135deg, rgba(240, 147, 251, 0.25), rgba(245, 87, 108, 0.2));
          border: 2px solid rgba(240, 147, 251, 0.4);
          box-shadow: 0 4px 16px rgba(240, 147, 251, 0.3);
        }
        .profile-promos-title { 
          margin: 0;
          font-size: 1.75rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .profile-promos-subtitle {
          font-size: 0.95rem;
          margin: 0.5rem 0 0 0;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
        }
        .profile-promos-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .profile-promo-card {
          padding: 1.75rem;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .profile-promo-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, rgba(240, 147, 251, 0.6), rgba(30, 136, 229, 0.6));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .profile-promo-card:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.08));
          border-color: rgba(240, 147, 251, 0.4);
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(240, 147, 251, 0.25);
        }
        .profile-promo-card:hover::before {
          opacity: 1;
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
        .profile-promo-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.9rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .profile-promo-title {
          margin: 0;
          color: #fff;
          font-size: 1.3rem;
          font-weight: 800;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .profile-promo-description {
          margin: 0;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.85);
          line-height: 1.65;
        }
        .profile-promo-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .profile-promo-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }
        .profile-promo-chip:hover {
          transform: translateY(-1px);
        }
        .profile-promo-chip--muted {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.6);
        }
        .profile-promo-chip--success {
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.25);
          color: #81e6b3;
        }
        .profile-promo-chip--warning {
          background: rgba(255,209,102,0.15);
          border: 1px solid rgba(255,209,102,0.25);
          color: #ffd98c;
        }
        .profile-promo-chip--meta {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.8);
        }
        .profile-promo-price {
          padding: 0.65rem 1.1rem;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(30,136,229,0.25), rgba(0,188,212,0.2));
          border: 1.5px solid rgba(30,136,229,0.4);
          color: #90caf9;
          font-weight: 800;
          font-size: 1.1rem;
          white-space: nowrap;
          box-shadow: 0 2px 12px rgba(30,136,229,0.2);
        }
        .profile-promo-price.is-placeholder {
          background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
          border: 1.5px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.8);
          box-shadow: none;
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
          .profile-promos-section { padding: 1.5rem !important; }
          .profile-promos-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .profile-promo-card { padding: 1.25rem !important; }
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
          .profile-promos-section { padding: 1.25rem !important; }
          .profile-promo-card { padding: 1rem !important; }
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
            margin: '0 auto',
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

          {promotions.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="profile-promos-section"
            >
              <div className="profile-promos-header">
                <div className="profile-promos-icon">💸</div>
                <div>
                  <h3 className="profile-promos-title">Promociones y Paquetes</h3>
                  <p className="profile-promos-subtitle">
                    Ofertas especiales y descuentos disponibles
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
                  const priceIsPlaceholder = priceLabel === 'Gratis';

                  return (
                    <motion.div
                      key={`${promo?.nombre || 'promo'}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="profile-promo-card"
                    >
                      <div className="profile-promo-header">
                        <span className="profile-promo-chip" style={typeStyle}>
                          {typeMeta.icon} {typeMeta.label}
                        </span>
                        {priceLabel !== null && (
                          <span className={`profile-promo-price${priceIsPlaceholder ? ' is-placeholder' : ''}`}>
                            {priceLabel}
                          </span>
                        )}
                      </div>

                      <h4 className="profile-promo-title">{promo?.nombre || 'Promoción'}</h4>

                      {promo?.descripcion && (
                        <p className="profile-promo-description">{promo.descripcion}</p>
                      )}

                      {(promo?.codigo || promo?.activo === false || promo?.condicion || validityParts.length > 0) && (
                        <div className="profile-promo-chips">
                          {promo?.codigo && (
                            <span className="profile-promo-chip profile-promo-chip--success">
                              🎟️ {String(promo.codigo).toUpperCase()}
                            </span>
                          )}
                          {promo?.activo === false && (
                            <span className="profile-promo-chip profile-promo-chip--muted">
                              Inactiva
                            </span>
                          )}
                          {promo?.condicion && (
                            <span className="profile-promo-chip profile-promo-chip--meta">
                              {promo.condicion}
                            </span>
                          )}
                          {validityParts.length > 0 && (
                            <span className="profile-promo-chip profile-promo-chip--warning">
                              ⏰ {validityParts.join(' · ')}
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


          {/* Doy clases en */}
          {academies && academies.length > 0 && (
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
                <h3 className="section-title" style={{ marginBottom: 0 }}>Doy clases en</h3>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <button
                    style={{
                      position: 'relative',
                      border: '1px solid transparent',
                      borderRadius: 999,
                      padding: '0.6rem 1.5rem',
                      background: 'linear-gradient(120deg, rgba(94,234,212,0.65), rgba(59,130,246,0.65))',
                      color: '#fff',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.6rem',
                      cursor: 'default',
                      boxShadow: '0 14px 32px rgba(68,55,155,0.45)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      letterSpacing: 0.2,
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', opacity: 0.95 }}>
                      Academias:
                    </span>
                    <span style={{ fontSize: '1.2rem' }}>
                      {academies.length.toLocaleString('es-MX')}
                    </span>
                  </button>
                </div>
              </div>

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
                    gap: '0.9rem',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {academies.map((academy: any) => {
                    const academyData = {
                      id: academy.academy_id,
                      display_name: academy.academy_name,
                      avatar_url: academy.academy_avatar || null,
                    };
                    return (
                      <button
                        key={academy.academy_id}
                        onClick={() => navigate(`/academia/${academy.academy_id}`)}
                        style={{
                          position: 'relative',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          padding: '1rem 1.25rem',
                          minWidth: '230px',
                          borderRadius: '22px',
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'linear-gradient(135deg, rgba(18,18,28,0.95), rgba(8,8,16,0.92))',
                          cursor: 'pointer',
                          boxShadow: '0 18px 32px rgba(0,0,0,0.45)',
                          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                          scrollSnapAlign: 'start'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 22px 36px rgba(0,0,0,0.5)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 18px 32px rgba(0,0,0,0.45)';
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            inset: '-20% -30%',
                            background: 'linear-gradient(140deg, rgba(110,231,183,0.22), rgba(147,197,253,0.15))',
                            opacity: 0.9,
                            pointerEvents: 'none'
                          }}
                        />
                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                          <div
                            style={{
                              width: 54,
                              height: 54,
                              borderRadius: '50%',
                              padding: 2,
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05))'
                            }}
                          >
                            <ImageWithFallback
                              src={academyData.avatar_url || ''}
                              alt={academyData.display_name || 'Academia'}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid rgba(0,0,0,0.4)'
                              }}
                            />
                          </div>
                          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
                              {academyData.display_name || 'Academia'}
                            </div>
                            <span
                              style={{
                                alignSelf: 'flex-start',
                                padding: '0.2rem 0.65rem',
                                borderRadius: 999,
                                fontSize: '0.72rem',
                                letterSpacing: 0.3,
                                textTransform: 'uppercase',
                                background: 'rgba(0,0,0,0.35)',
                                border: '1px solid rgba(255,255,255,0.18)',
                                color: 'rgba(255,255,255,0.8)'
                              }}
                            >
                              Colaboro aquí
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
                            paddingTop: '0.6rem',
                            borderTop: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.82rem', fontWeight: 600 }}>
                            Ver perfil
                          </span>
                          <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Edge fades */}
                <div aria-hidden style={{ pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to right, rgba(18,18,18,1), rgba(18,18,18,0))' }} />
                  <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 24, background: 'linear-gradient(to left, rgba(18,18,18,1), rgba(18,18,18,0))' }} />
                </div>
              </div>
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
