// Public Academy Screen (replica visual de AcademyProfileLi  ve)
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useAcademyPublic } from "../../hooks/useAcademy";
import { useTags } from "../../hooks/useTags";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
// ❌ Toggle removido para vista pública
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import TeacherCard from "../../components/explore/cards/TeacherCard";
import ClasesLive from "../../components/events/ClasesLive";
import ClasesLiveTabs from "../../components/classes/ClasesLiveTabs";
import { useLiveClasses } from "../../hooks/useLiveClasses";
import UbicacionesLive from "../../components/locations/UbicacionesLive";
import RitmosChips from "../../components/RitmosChips";
import { normalizeRitmosToSlugs } from "../../utils/normalizeRitmos";
import { BioSection } from "../../components/profile/BioSection";
import { useAcceptedTeachers } from "../../hooks/useAcademyTeacherInvitations";

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

// Carrusel de fotos
const CarouselComponent: React.FC<{ photos: string[] }> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  if (photos.length === 0) return null;

  const nextPhoto = () => setCurrentIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  const goToPhoto = (index: number) => setCurrentIndex(index);

  return (
    <>
      <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          position: 'relative', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden',
          border: '2px solid rgba(255, 255, 255, 0.2)', background: 'rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 1, transform: 'none' }}>
            <ImageWithFallback
              src={photos[currentIndex]}
              alt={`Foto ${currentIndex + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', cursor: 'pointer' }}
              onClick={() => setIsFullscreen(true)}
            />
          </div>

          <div style={{
            position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0, 0, 0, 0.7)',
            color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600
          }}>
            {currentIndex + 1} / {photos.length}
          </div>

          <button onClick={prevPhoto} style={navBtn('left')}>‹</button>
          <button onClick={nextPhoto} style={navBtn('right')}>›</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => goToPhoto(index)}
              style={{
                width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden',
                border: index === currentIndex ? '3px solid #E53935' : '2px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer', background: 'transparent', padding: 0, transition: '0.2s'
              }}
            >
              <ImageWithFallback src={photo} alt={`Miniatura ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      </div>

      {isFullscreen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'pointer' }}
          onClick={() => setIsFullscreen(false)}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', overflow: 'hidden' }}>
            <ImageWithFallback src={photos[currentIndex]} alt={`Foto ${currentIndex + 1} - Pantalla completa`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </>
  );
};

const navBtn = (side: "left" | "right") => ({
  position: 'absolute' as const,
  [side]: '1rem',
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
});

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

export default function AcademyPublicScreen() {
  const { academyId } = useParams();
  const id = Number(academyId);
  const { data: academy, isLoading } = useAcademyPublic(!Number.isNaN(id) ? id : (undefined as any));
  const { data: allTags } = useTags();
  const [copied, setCopied] = React.useState(false);
  
  // Obtener maestros aceptados
  const { data: acceptedTeachers } = useAcceptedTeachers(id);
  
  // Obtener clases desde las tablas academy_classes
  const { data: classesFromTables, isLoading: classesLoading } = useLiveClasses({ academyId: id });

  const media = (academy as any)?.media || [];
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot)?.url)
    .filter(Boolean) as string[];

  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot)?.url)
    .filter(Boolean) as string[];

  const promotions = Array.isArray((academy as any)?.promociones) ? (academy as any).promociones : [];

  const primaryAvatarUrl = useMemo(() => {
    const p1 = getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url;
    const cover = getMediaBySlot(media as unknown as MediaSlotItem[], 'cover')?.url;
    return p1 || cover || (academy as any)?.avatar_url || (academy as any)?.portada_url || null;
  }, [media, academy]);

  const getRitmoNombres = () => {
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
  };

  const getZonaNombres = () => {
    if (!allTags || !academy?.zonas) return [];
    return academy.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona')?.nombre)
      .filter(Boolean);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: colors.light }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Cargando academia...</p>
      </div>
    );
  }

  if (!academy) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: colors.light }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Academia no disponible</h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>Esta academia no existe o no está aprobada</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .academy-container { width: 100%; max-width: 900px; margin: 0 auto; }
        .academy-banner { width: 100%; max-width: 900px; margin: 0 auto; position: relative; }
        .glass-card-container {
          opacity: 1; margin-bottom: 2rem; padding: 2rem; text-align: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px; backdrop-filter: blur(10px); transform: none;
        }
        .section-title {
          font-size: 1.5rem; font-weight: 800; margin: 0 0 1rem 0;
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .academy-banner-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; align-items: center; }
        .academy-banner-avatar {
          width: 200px; height: 200px; border-radius: 50%; overflow: hidden;
          border: 6px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
          background: linear-gradient(135deg, #1E88E5, #FF7043);
          display: flex; align-items: center; justifyContent: center;
          font-size: 4rem; font-weight: 700; color: white;
        }
        .academy-banner-avatar-fallback { font-size: 6rem; }
        @media (max-width: 768px) {
          .academy-container { max-width: 100% !important; padding: 1rem !important; }
          .academy-banner { border-radius: 16px !important; padding: 1.5rem 1rem !important; margin: 0 !important; }
          .academy-banner-grid { grid-template-columns: 1fr !important; text-align: center; gap: 1.5rem !important; justify-items: center !important; }
          .academy-banner h1 { font-size: 2.6rem !important; line-height: 1.2 !important; }
          .academy-banner-avatar { width: 220px !important; height: 220px !important; }
          .academy-banner-avatar-fallback { font-size: 4.6rem !important; }
          .glass-card-container { padding: 1rem !important; margin-bottom: 1rem !important; border-radius: 16px !important; }
        }
        @media (max-width: 480px) {
          .academy-banner h1 { font-size: 2.2rem !important; }
          .academy-banner-avatar { width: 180px !important; height: 180px !important; }
          .academy-banner-avatar-fallback { font-size: 4.1rem !important; }
          .glass-card-container { padding: 0.75rem !important; border-radius: 12px !important; }
        }
        .academy-section { margin-bottom: 2rem; padding: 2rem; }
        .academy-videos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
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
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
          .academy-container { padding: 1rem !important; }
          .academy-section { padding: 1rem !important; margin-bottom: 1.5rem !important; }
          .academy-section h2, .academy-section h3 { font-size: 1.25rem !important; margin-bottom: 1rem !important; }
          .academy-videos-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .profile-promos-section { padding: 1.5rem !important; }
          .profile-promos-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .profile-promo-card { padding: 1.25rem !important; }
        }
        @media (max-width: 480px) {
          .academy-section { padding: 0.75rem !important; margin-bottom: 1rem !important; border-radius: 12px !important; }
          .academy-section h2, .academy-section h3 { font-size: 1.1rem !important; }
          .academy-videos-grid { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
          .profile-promos-section { padding: 1.25rem !important; }
          .profile-promo-card { padding: 1rem !important; }
        }
      `}</style>

      <div className="academy-container">
        {/* ❌ Toggle eliminado */}

        {/* Banner Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="academy-banner glass-card-container"
          style={{ position: 'relative', margin: '0 auto', overflow: 'hidden' }}
        >
          {copied && <div role="status" aria-live="polite" style={{ position: 'absolute', top: 14, right: 12, padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 700, zIndex: 10 }}>Copiado</div>}
          <div className="academy-banner-grid">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '1rem' }}>
              <div className="academy-banner-avatar">
                {primaryAvatarUrl ? (
                  <img
                    src={primaryAvatarUrl}
                    alt="Logo de la academia"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="academy-banner-avatar-fallback" style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '6rem', fontWeight: 700, color: 'white'
                  }}>
                    {(academy as any).nombre_publico?.[0]?.toUpperCase() || '🎓'}
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
                      const url = typeof window !== 'undefined' ? window.location.href : '';
                      const title = (academy as any)?.nombre_publico || 'Academia';
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
                fontSize: '3rem', display: 'inline', fontWeight: 800, color: 'white',
                margin: '0 0 0.5rem 0', textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}>
                {academy.nombre_publico}
              </h1>

              <p style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.9)', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>
                Academia de Baile
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(() => {
                  const slugs = normalizeRitmosToSlugs(academy, allTags);
                  return slugs.length > 0 ? (
                    <RitmosChips selected={slugs} onChange={() => {}} readOnly />
                  ) : null;
                })()}
                {getZonaNombres().map((zona, index) => (
                  <Chip
                    key={`zona-${index}`} label={zona} active variant="zona"
                    style={{ background: 'rgba(25, 118, 210, 0.2)', border: '1px solid #1976D2', color: '#90CAF9', fontWeight: 600 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contenido */}
        <div style={{ padding: '2rem 0' }}>
          {/* Biografía y Redes Sociales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <BioSection 
              bio={(academy as any)?.bio}
              redes={(academy as any)?.redes_sociales || (academy as any)?.respuestas?.redes}
            />
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="academy-section"
            style={{
              marginBottom: '2rem', padding: '2.5rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: '24px', border: '2px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, #E53935, #FB8C00, #FFD166)', opacity: 0.9 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)'
              }}>🎓</div>
              <div>
                <h2 style={{
                  fontSize: '1.75rem', fontWeight: 800, background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, lineHeight: 1.2
                }}>
                  Nuestras clases
                </h2>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: '0.25rem 0 0 0', fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
                  Horarios, costos y ubicaciones
                </p>
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {classesLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                  Cargando clases...
                </div>
              ) : classesFromTables && classesFromTables.length > 0 ? (
                <>
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{ padding: '0.5rem', marginBottom: '1rem', background: 'rgba(0,255,0,0.1)', borderRadius: 8, fontSize: '0.75rem', color: '#fff' }}>
                      Debug: Mostrando ClasesLiveTabs con {classesFromTables.length} clases
                    </div>
                  )}
                  <ClasesLiveTabs
                    classes={classesFromTables}
                    title=""
                    subtitle="Filtra por día — solo verás los días que sí tienen clases"
                    sourceType="academy"
                    sourceId={(academy as any)?.id}
                    isClickable={true}
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
                    cronograma={(academy as any)?.horarios || (academy as any)?.cronograma || []}
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
                  />
                </>
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
                  <h2 className="profile-promos-title">Promociones y Paquetes</h2>
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

          {Array.isArray((academy as any)?.ubicaciones) && (academy as any).ubicaciones.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
              style={{
                marginBottom: '2rem', padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <UbicacionesLive ubicaciones={(academy as any).ubicaciones} />
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
                  <h3 className="section-title" style={{ margin: 0 }}>Información para Estudiantes</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: 500 }}>Preguntas frecuentes</p>
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

          {/* Maestros Invitados */}
          {acceptedTeachers && acceptedTeachers.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
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
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #E53935, #FB8C00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)' }}>🎭</div>
                <div>
                  <h3 className="section-title" style={{ margin: 0 }}>Maestros Invitados</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500' }}>Maestros que colaboran con la academia</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {acceptedTeachers.map((t: any) => {
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
                      : []
                  };
                  return <TeacherCard key={t.teacher_id} item={teacherData} />;
                })}
              </div>
            </motion.section>
          )}

          {getMediaBySlot(media as unknown as MediaSlotItem[], 'p1') && (
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              style={{
                marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'center', opacity: 1
              }}
            >
              <div style={{ width: '100%', maxWidth: '500px', height: 'auto', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255, 255, 255, 0.1)' }}>
                <ImageWithFallback
                  alt="Foto principal"
                  src={getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
                />
              </div>
            </motion.section>
          )}

          {carouselPhotos.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
              id="user-profile-photo-gallery" data-baile-id="user-profile-photo-gallery" data-test-id="user-profile-photo-gallery"
              style={{
                marginBottom: '2rem', padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', opacity: 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3 className="section-title" style={{ margin: 0 }}>📷 Galería de Fotos</h3>
                <div style={{
                  padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(245, 245, 245, 0.9)'
                }}>
                  {carouselPhotos.length} fotos
                </div>
              </div>
              <CarouselComponent photos={carouselPhotos} />
            </motion.section>
          )}

          {videos.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
              className="academy-section"
              style={{
                marginBottom: '2rem', padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <h3 className="section-title">🎥 Videos</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }} className="academy-videos-grid">
                {videos.map((video, index) => (
                  <div key={index} style={{
                    width: '100%', height: 'auto', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden',
                    border: '2px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.1)'
                  }}>
                    <video src={video} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
