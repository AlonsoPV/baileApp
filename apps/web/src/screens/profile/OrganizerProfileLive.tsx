import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useEventParentsByOrganizer, useEventDatesByOrganizer } from "../../hooks/useEventParentsByOrganizer";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import { Chip } from "../../components/profile/Chip";
import RitmosChips from "../../components/RitmosChips";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import EventInfoGrid from "../../components/events/EventInfoGrid";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";
import AddToCalendarWithStats from "../../components/AddToCalendarWithStats";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";

// Componente FAQ Accordion Moderno
const FAQAccordion: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{
        borderRadius: borderRadius.xl,
        border: `1px solid ${colors.glass.medium}`,
        overflow: 'hidden',
        transition: transitions.normal
      }}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: spacing[5],
          background: 'transparent',
          border: 'none',
          color: colors.gray[50],
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          textAlign: 'left',
          transition: transitions.normal
        }}
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.primary[500]
          }}
        >
          ▼
        </motion.span>
      </motion.button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: `0 ${spacing[5]} ${spacing[5]} ${spacing[5]}`,
          borderTop: `1px solid ${colors.glass.medium}`,
          background: colors.glass.light
        }}>
          <p style={{
            lineHeight: typography.lineHeight.relaxed,
            opacity: 0.9,
            fontSize: typography.fontSize.base,
            margin: 0,
            color: colors.gray[100]
          }}>
            {answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente de Carrusel Moderno
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
    <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Carrusel Principal */}
      <div style={{
        position: 'relative',
        aspectRatio: '16/9',
        borderRadius: borderRadius['2xl'],
        overflow: 'hidden',
        border: `2px solid ${colors.glass.medium}`,
        background: colors.dark[400],
        boxShadow: colors.shadows.glass
      }}>
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
        <div style={{
          position: 'absolute',
          top: spacing[4],
          right: spacing[4],
          background: colors.glass.darker,
          color: colors.gray[50],
          padding: `${spacing[2]} ${spacing[4]}`,
          borderRadius: borderRadius.full,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          backdropFilter: 'blur(10px)'
        }}>
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Botones de navegación */}
        {photos.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevPhoto}
              style={{
                position: 'absolute',
                left: spacing[4],
                top: '50%',
                transform: 'translateY(-50%)',
                background: colors.glass.darker,
                color: colors.light,
                border: 'none',
                borderRadius: borderRadius.full,
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: typography.fontSize.xl,
                transition: transitions.normal,
                backdropFilter: 'blur(10px)'
              }}
            >
              ‹
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextPhoto}
              style={{
                position: 'absolute',
                right: spacing[4],
                top: '50%',
                transform: 'translateY(-50%)',
                background: colors.glass.darker,
                color: colors.light,
                border: 'none',
                borderRadius: borderRadius.full,
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: typography.fontSize.xl,
                transition: transitions.normal,
                backdropFilter: 'blur(10px)'
              }}
            >
              ›
            </motion.button>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {photos.length > 1 && (
        <div style={{
          display: 'flex',
          gap: spacing[2],
          marginTop: spacing[4],
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {photos.map((photo, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goToPhoto(index)}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: borderRadius.lg,
                overflow: 'hidden',
                border: currentIndex === index
                  ? `3px solid ${colors.primary[500]}`
                  : `2px solid ${colors.glass.medium}`,
                cursor: 'pointer',
                background: 'transparent',
                padding: 0,
                transition: transitions.normal
              }}
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
            background: colors.glass.darker,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing[8]
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            borderRadius: borderRadius['2xl'],
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

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'absolute',
                top: spacing[4],
                right: spacing[4],
                background: colors.glass.darker,
                color: colors.light,
                border: 'none',
                borderRadius: borderRadius.full,
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                backdropFilter: 'blur(10px)'
              }}
            >
              ×
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export function OrganizerProfileLive() {
  const navigate = useNavigate();
  const { data: org, isLoading } = useMyOrganizer();
  const { data: parents } = useEventParentsByOrganizer(org?.id);
  const { data: eventDates } = useEventDatesByOrganizer(org?.id);
  const { media } = useOrganizerMedia();
  const { data: allTags } = useTags();

  // Obtener fotos del carrusel usando los media slots
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(media as any, slot)?.url)
    .filter(Boolean) as string[];

  // Obtener videos
  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(media as any, slot)?.url)
    .filter(Boolean) as string[];

  // Get tag names from IDs
  const getRitmoNombres = () => {
    const names: string[] = [];
    // 1) Priorizar ritmos_seleccionados (IDs del catálogo) ya que es lo que edita el usuario con RitmosChips
    if (Array.isArray((org as any)?.ritmos_seleccionados) && (org as any).ritmos_seleccionados.length > 0) {
      const labelById = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelById.set(i.id, i.label)));
      names.push(
        ...((org as any).ritmos_seleccionados as string[])
          .map(id => labelById.get(id))
          .filter(Boolean) as string[]
      );
    }
    // 2) Si no hay ritmos_seleccionados, usar ritmos/estilos (IDs numéricos de tags)
    if (names.length === 0) {
      const ritmos = (org as any)?.ritmos || (org as any)?.estilos || [];
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
    if (!allTags || !(org as any)?.zonas) return [];
    return (org as any).zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  if (isLoading) {
    return (
      <div style={{
        padding: spacing[12],
        textAlign: 'center',
        color: colors.gray[50],
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
        <p style={{ fontSize: typography.fontSize.lg }}>Cargando organizador...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{
        padding: spacing[12],
        textAlign: 'center',
        color: colors.gray[50],
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>❌</div>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
          No tienes perfil de organizador
        </h2>
        <p style={{ marginBottom: spacing[6], opacity: 0.7, fontSize: typography.fontSize.lg }}>
          Crea uno para organizar eventos
        </p>
        <p style={{ marginBottom: spacing[4], opacity: 0.85 }}>
          Para crear tu rol ve a edición y guarda tu nombre.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/app/roles/request?role=organizador')}
          style={{
            padding: `${spacing[4]} ${spacing[7]}`,
            borderRadius: borderRadius.full,
            border: 'none',
            background: colors.gradients.primary,
            color: colors.gray[50],
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.bold,
            cursor: 'pointer',
            boxShadow: colors.shadows.glow,
            transition: transitions.normal
          }}
        >
          🎤 Crear Organizador
        </motion.button>
      </div>
    );
  }

  // Preparar items de "Fechas" (fechas publicadas)
  const getUpcomingDates = () => {
    const upcomingItems: any[] = [];

    eventDates?.forEach((date, index) => {
      const fechaNombre = (date as any).nombre || `Fecha ${fmtDate(date.fecha)}`;

      const horaFormateada = date.hora_inicio && date.hora_fin
        ? `${date.hora_inicio} - ${date.hora_fin}`
        : date.hora_inicio || '';

      const item = {
        id: date.id,
        nombre: fechaNombre,
        date: fmtDate(date.fecha),
        time: horaFormateada,
        place: date.lugar || date.ciudad || '',
        href: `/social/fecha/${date.id}`,
        cover: Array.isArray(date.media) && date.media.length > 0
          ? (date.media[0] as any)?.url || date.media[0]
          : undefined,
        flyer: (date as any).flyer_url
          || (Array.isArray(date.media) && date.media.length > 0
            ? (date.media[0] as any)?.url || date.media[0]
            : undefined),
        price: (() => {
          const costos = (date as any)?.costos;
          if (Array.isArray(costos) && costos.length) {
            const nums = costos.map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
            if (nums.length) {
              const min = Math.min(...(nums as number[]));
              return min >= 0 ? `$${min.toLocaleString()}` : undefined;
            }
          }
          return undefined;
        })(),
        fecha: date.fecha,
        hora_inicio: date.hora_inicio,
        hora_fin: date.hora_fin,
        lugar: date.lugar || date.ciudad || date.direccion,
        biografia: (date as any).biografia
      };

      upcomingItems.push(item);
    });

    return upcomingItems;
  };

  const inviteItems = getUpcomingDates();
  const DateFlyerSlider: React.FC<{ items: any[]; onOpen: (href: string) => void }> = ({ items, onOpen }) => {
    const [idx, setIdx] = React.useState(0);
    if (!items?.length) return null;
    const ev = items[idx % items.length];
    
    // Construir fechas para el calendario
    const calendarStart = (() => {
      try {
        if (!ev.fecha) return new Date();
        const fechaStr = ev.fecha.includes('T') ? ev.fecha.split('T')[0] : ev.fecha;
        const hora = (ev.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
        const fechaCompleta = `${fechaStr}T${hora}:00`;
        const parsed = new Date(fechaCompleta);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
      } catch (err) {
        console.error('[DateFlyerSlider] Error parsing start date:', err);
        return new Date();
      }
    })();

    const calendarEnd = (() => {
      try {
        if (!ev.fecha) {
          const defaultEnd = new Date(calendarStart);
          defaultEnd.setHours(defaultEnd.getHours() + 2);
          return defaultEnd;
        }
        const fechaStr = ev.fecha.includes('T') ? ev.fecha.split('T')[0] : ev.fecha;
        const hora = (ev.hora_fin || ev.hora_inicio || '23:59').split(':').slice(0, 2).join(':');
        const fechaCompleta = `${fechaStr}T${hora}:00`;
        const parsed = new Date(fechaCompleta);
        if (isNaN(parsed.getTime())) {
          const defaultEnd = new Date(calendarStart);
          defaultEnd.setHours(defaultEnd.getHours() + 2);
          return defaultEnd;
        }
        return parsed;
      } catch (err) {
        console.error('[DateFlyerSlider] Error parsing end date:', err);
        const defaultEnd = new Date(calendarStart);
        defaultEnd.setHours(defaultEnd.getHours() + 2);
        return defaultEnd;
      }
    })();

    return (
      <div style={{ display: 'grid', placeItems: 'center', gap: spacing[3] }}>
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="glass-card"
          onClick={() => onOpen(ev.href)}
          style={{ position: 'relative', borderRadius: borderRadius.xl, cursor: 'pointer', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
        >
          <div style={{ width: 350, maxWidth: '80vw' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'rgba(0,0,0,0.3)' }}>
              {ev.flyer && (
                <img src={ev.flyer} alt={ev.nombre} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing[4], background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 100%)', color: '#fff' }}>
                <div style={{ fontSize: typography.fontSize.lg, fontWeight: 700, marginBottom: spacing[2], textShadow: '0 2px 4px rgba(0,0,0)' }}>{ev.nombre}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], fontSize: typography.fontSize.sm, marginBottom: spacing[2] }}>
                  {ev.date && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999 }}>📅 {ev.date}</span>}
                  {ev.time && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background: 'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999 }}>🕒 {ev.time}</span>}
                  {ev.place && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background:'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999 }}>📍 {ev.place}</span>}
                  {ev.price && <span style={{ border: '1px solid rgb(255 255 255 / 48%)', background:'rgb(25 25 25 / 89%)', padding: '8px 8px', borderRadius: 999 }}>💰 {ev.price}</span>}
                </div>
                {/* Botón de calendario */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: spacing[2], position: 'relative', zIndex: 5, pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                  <AddToCalendarWithStats
                    eventId={ev.id}
                    title={ev.nombre}
                    description={ev.biografia}
                    location={ev.lugar}
                    start={calendarStart}
                    end={calendarEnd}
                    showAsIcon={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        {items.length > 1 && (
          <div style={{ width: 350, maxWidth: '80vw', display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" onClick={() => setIdx((p) => (p - 1 + items.length) % items.length)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>‹ Anterior</button>
            <button type="button" onClick={() => setIdx((p) => (p + 1) % items.length)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>Siguiente ›</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: ${typography.fontFamily.primary};
        }
        
        .org-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .org-banner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }
        
        .org-banner-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 3rem;
          align-items: center;
        }
        
        .glass-card {
          background: ${colors.glass.light};
          backdrop-filter: blur(20px);
          border: 1px solid ${colors.glass.medium};
          box-shadow: ${colors.shadows.glass};
        }
        
        .gradient-text {
          background: ${colors.gradients.primary};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .floating-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .shimmer-effect {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
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
        
        @media (max-width: 768px) {
          .org-container {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          .org-banner {
            border-radius: 0 !important;
            padding: 2rem 1rem !important;
            margin: 1rem auto 0 auto !important;
          }
          .org-banner-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
            justify-items: center !important;
            text-align: center !important;
          }
          .org-banner-avatar {
            width: 180px !important;
            height: 180px !important;
          }
          .org-banner-avatar-fallback {
            font-size: 4rem !important;
          }
          .org-banner h1 {
            font-size: 2.5rem !important;
            line-height: 1.2 !important;
          }
          .org-banner .org-chips {
            justify-content: center !important;
            margin-bottom: 1rem !important;
          }
          .glass-card {
            margin-bottom: 1.5rem !important;
            padding: 1.5rem !important;
          }
          .glass-card h3 {
            font-size: 1.5rem !important;
          }
          .glass-card p {
            font-size: 1rem !important;
          }
          .carousel-main {
            aspect-ratio: 16/9 !important;
            max-width: 100% !important;
          }
          .carousel-thumbnails {
            gap: 0.5rem !important;
            margin-top: 1rem !important;
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
          .carousel-counter {
            font-size: 0.8rem !important;
            padding: 0.25rem 0.75rem !important;
          }
          .dfs-wrap {
            width: 100% !important;
            max-width: 100% !important;
          }
          .dfs-controls {
            width: 100% !important;
            max-width: 100% !important;
          }
          .glass-card-container {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            border-radius: 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          .org-banner {
            padding: 1.5rem 1rem !important;
          }
          .org-banner-avatar {
            width: 150px !important;
            height: 150px !important;
          }
          .org-banner-avatar-fallback {
            font-size: 3rem !important;
          }
          .org-banner h1 {
            font-size: 2rem !important;
          }
          .glass-card {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
          }
          .glass-card h3 {
            font-size: 1.25rem !important;
          }
          .carousel-thumbnail {
            width: 40px !important;
            height: 40px !important;
          }
          .carousel-nav-btn {
            width: 36px !important;
            height: 36px !important;
          }
          .glass-card-container {
            padding: 0.75rem !important;
            border-radius: 12px !important;
          }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        color: colors.gray[50],
        width: '100%',
        position: 'relative'
      }}>
        {/* Elementos flotantes de fondo */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '100px',
          height: '100px',
          background: colors.gradients.primary,
          borderRadius: '50%',
          opacity: 0.1,
          animation: 'float 8s ease-in-out infinite',
          zIndex: 0
        }} />

        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '60px',
          height: '60px',
          background: colors.gradients.secondary,
          borderRadius: '50%',
          opacity: 0.15,
          animation: 'float 6s ease-in-out infinite reverse',
          zIndex: 0
        }} />

        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '15%',
          width: '80px',
          height: '80px',
          background: colors.gradients.deep,
          borderRadius: '50%',
          opacity: 0.1,
          animation: 'float 7s ease-in-out infinite',
          zIndex: 0
        }} />

        {/* Profile Toolbar - Toggle y Edición (Fixed) */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="organizer"
            liveHref="/profile/organizer"
            editHref="/profile/organizer/edit"
          />
        </div>

        {/* Banner Principal */}
        <motion.div
          id="organizer-banner"
          data-test-id="organizer-banner"
          className="org-banner glass-card-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            position: 'relative',
            overflow: 'hidden',
            margin: `0 auto 0 auto`,
            maxWidth: '900px',
            width: '100%',
            zIndex: 1
          }}
        >
          <div className="org-banner-grid">
            {/* Columna 1: Logo del Organizador */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div
                id="organizer-avatar"
                data-test-id="organizer-avatar"
                className="org-banner-avatar"
                style={{
                  width: '250px',
                  height: '250px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `4px solid ${colors.glass.strong}`,
                  boxShadow: `${colors.shadows.glow}, 0 20px 40px rgba(0, 0, 0, 0.3)`,
                  background: colors.gradients.primary,
                  position: 'relative'
                }}
              >
                {getMediaBySlot(media as any, 'cover')?.url || getMediaBySlot(media as any, 'p1')?.url ? (
                  <img
                    src={getMediaBySlot(media as any, 'cover')?.url || getMediaBySlot(media as any, 'p1')?.url || ''}
                    alt="Logo del organizador"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="org-banner-avatar-fallback" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6rem',
                    fontWeight: typography.fontWeight.black,
                    color: colors.light
                  }}>
                    {org.nombre_publico?.[0]?.toUpperCase() || '🎤'}
                  </div>
                )}

                {/* Efecto de brillo */}
                <div className="shimmer-effect" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%'
                }} />
              </div>
              {/* Estado debajo del avatar */}
              <div style={{ marginTop: spacing[3], display: 'flex', justifyContent: 'center' }}>
                <span
                  style={{
                    padding: `${spacing[2]} ${spacing[4]}`,
                    borderRadius: borderRadius.full,
                    background: org.estado_aprobacion === 'aprobado'
                      ? `linear-gradient(135deg, ${colors.success}cc, ${colors.success}99)`
                      : colors.gradients.secondary,
                    border: `2px solid ${org.estado_aprobacion === 'aprobado' ? colors.success : colors.secondary[500]}`,
                    color: colors.light,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    backdropFilter: 'blur(10px)',
                    boxShadow: org.estado_aprobacion === 'aprobado'
                      ? `0 4px 16px ${colors.success}66`
                      : `0 4px 16px ${colors.secondary[500]}66`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: spacing[1],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  {org.estado_aprobacion === 'aprobado' ? '✅ Verificado' : `⏳ ${org.estado_aprobacion}`}
                </span>
              </div>
            </motion.div>

            {/* Columna 2: Nombre, Chips y Estado */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[6],
                justifyContent: 'center'
              }}
            >
              <h1
                id="organizer-name"
                data-test-id="organizer-name"
                className="gradient-text"
                style={{
                  fontSize: typography.fontSize['5xl'],
                  fontWeight: typography.fontWeight.black,
                  margin: 0,
                  lineHeight: typography.lineHeight.tight,
                  textShadow: `0 4px 20px ${colors.primary[500]}40`
                }}
              >
                {org.nombre_publico}
              </h1>

              {/* Chips de ritmos y zonas */}
              <div
                id="organizer-chips"
                data-test-id="organizer-chips"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: spacing[2],
                  marginBottom: spacing[2]
                }}
              >
                {Array.isArray((org as any)?.ritmos_seleccionados) && (org as any).ritmos_seleccionados.length > 0 && (
                  <RitmosChips
                    selected={((org as any).ritmos_seleccionados || []) as string[]}
                    onChange={() => {}}
                    readOnly
                  />
                )}
                {getZonaNombres().map((nombre) => (
                  <Chip
                    key={`z-${nombre}`}
                    label={nombre}
                    icon="📍"
                    variant="zona"
                  />
                ))}
              </div>

            </motion.div>
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div className="org-container" style={{
          padding: spacing[8],
          position: 'relative',
          zIndex: 1,
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Biografía */}
          {org.bio && (
            <motion.section
              id="organizer-bio"
              data-test-id="organizer-bio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[6],
                borderRadius: borderRadius['2xl']
              }}
            >
              <h3 className="section-title">💬 Sobre nosotros</h3>
              <p style={{
                lineHeight: typography.lineHeight.relaxed,
                opacity: 0.9,
                fontSize: typography.fontSize.lg,
                color: colors.light
              }}>
                {org.bio}
              </p>
            </motion.section>
          )}

          {/* Redes Sociales */}
          <div
            id="organizer-social-media"
            data-test-id="organizer-social-media"
          >
            <SocialMediaSection
              respuestas={(org as any)?.respuestas}
              redes_sociales={(org as any)?.redes_sociales}
              title="Redes Sociales"
              availablePlatforms={['instagram', 'facebook', 'whatsapp']}
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                textAlign: 'center',
                background: colors.gradients.glass,
                borderRadius: borderRadius['2xl'],
                border: `1px solid ${colors.glass.medium}`,
                boxShadow: colors.shadows.glass
              }}
            />
          </div>

          {/* Maestros Invitados */}
          <div
            id="organizer-invited-masters"
            data-test-id="organizer-invited-masters"
          >
            <InvitedMastersSection
              masters={[]} // TODO: Conectar con datos reales en el siguiente sprint
              title="🎭 Maestros Invitados"
              showTitle={true}
              isEditable={false}
            />
          </div>

          {/* Próximas Fechas del Organizador */}
          {inviteItems.length > 0 && (
            <motion.section
              id="organizer-upcoming-dates"
              data-test-id="organizer-upcoming-dates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                marginBottom: spacing[6]
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: colors.gradients.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: colors.shadows.glow
                }}>
                  📅
                </div>
                <div>
                  <h3 className="section-title">Próximas Fechas</h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: colors.light
                  }}>
                    {inviteItems.length} fecha{inviteItems.length !== 1 ? 's' : ''} programada{inviteItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Slider de 1 card con flyer vertical + info inferior */}
              <DateFlyerSlider items={inviteItems} onOpen={(href: string) => navigate(href)} />
            </motion.section>
          )}

          {/* Mis Sociales */}
          {parents && parents.length > 0 && (
            <motion.section
              id="organizer-social-events"
              data-test-id="organizer-social-events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                marginBottom: spacing[6]
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: colors.gradients.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: `0 8px 24px ${colors.secondary[500]}40`
                }}>
                  🎭
                </div>
                <div>
                  <h3 className="section-title">Sociales que organizamos</h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: colors.light
                  }}>
                    {parents.length} social{parents.length !== 1 ? 'es' : ''} organizado{parents.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: spacing[4] }}>
                {parents.map((parent) => (
                  <motion.div
                    key={parent.id}
                    whileHover={{
                      scale: 1.02,
                      y: -4,
                      boxShadow: colors.shadows.lg
                    }}
                    onClick={() => navigate(`/social/${parent.id}`)}
                    className="glass-card"
                    style={{
                      padding: spacing[6],
                      borderRadius: borderRadius.xl,
                      cursor: 'pointer',
                      transition: transitions.normal
                    }}
                  >
                    <h4 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.semibold,
                      marginBottom: spacing[2],
                      color: colors.light
                    }}>
                      {parent.nombre}
                    </h4>
                    {parent.descripcion && (
                      <p style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.light,
                        marginBottom: spacing[3]
                      }}>
                        {parent.descripcion}
                      </p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/social/${parent.id}`);
                      }}
                      style={{
                        padding: `${spacing[3]} ${spacing[6]}`,
                        background: colors.gradients.secondary,
                        border: 'none',
                        borderRadius: borderRadius.lg,
                        color: colors.light,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: 'pointer',
                        transition: transitions.normal,
                        boxShadow: `0 4px 16px ${colors.secondary[500]}40`
                      }}
                    >
                      📅 Ver próximas fechas
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Galería de Fotos del Organizador */}
          {carouselPhotos.length > 0 && (
            <motion.section
              id="organizer-profile-photo-gallery"
              data-test-id="organizer-profile-photo-gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                marginBottom: spacing[6]
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: colors.gradients.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: colors.shadows.glow
                }}>
                  📷
                </div>
                <div>
                  <h3 className="section-title">📷 Galería de Fotos</h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: colors.light
                  }}>
                    {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <CarouselComponent photos={carouselPhotos} />
            </motion.section>
          )}

          {/* Sección de Videos del Organizador */}
          {videos.length > 0 && (
            <motion.section
              id="organizer-profile-video-gallery"
              data-test-id="organizer-profile-video-gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                marginBottom: spacing[6]
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: colors.gradients.deep,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: `0 8px 24px ${colors.deep[500]}40`
                }}>
                  🎥
                </div>
                <div>
                  <h3 className="section-title">🎥 Videos del Organizador</h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: colors.light
                  }}>
                    {videos.length} video{videos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: spacing[6]
              }}>
                {videos.map((video, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{
                      scale: 1.05,
                      y: -8,
                      boxShadow: colors.shadows.lg
                    }}
                    style={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '16/9',
                      borderRadius: borderRadius.xl,
                      overflow: 'hidden',
                      border: `2px solid ${colors.glass.medium}`,
                      cursor: 'pointer',
                      transition: transitions.normal,
                      position: 'relative',
                      background: colors.dark[400],
                      boxShadow: colors.shadows.md
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
                    <div style={{
                      position: 'absolute',
                      top: spacing[4],
                      right: spacing[4],
                      background: colors.glass.darker,
                      color: colors.light,
                      padding: `${spacing[2]} ${spacing[4]}`,
                      borderRadius: borderRadius.lg,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      boxShadow: colors.shadows.md,
                      backdropFilter: 'blur(10px)'
                    }}>
                      🎥 Video {index + 1}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Información para Asistentes - FAQ */}
          {((org as any)?.respuestas?.musica_tocaran || (org as any)?.respuestas?.hay_estacionamiento) && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="glass-card"
              style={{
                marginBottom: spacing[8],
                padding: spacing[8],
                borderRadius: borderRadius['2xl']
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[4],
                marginBottom: spacing[6]
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: colors.gradients.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: typography.fontSize['2xl'],
                  boxShadow: `0 8px 24px ${colors.secondary[500]}40`
                }}>
                  ❓
                </div>
                <div>
                  <h3 className="section-title">❓ Información para Asistentes</h3>
                  <p style={{
                    fontSize: typography.fontSize.sm,
                    opacity: 0.8,
                    margin: 0,
                    color: colors.light
                  }}>
                    Preguntas frecuentes
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                {/* FAQ Item: Música */}
                {(org as any)?.respuestas?.musica_tocaran && (
                  <FAQAccordion
                    question="🎵 ¿Qué música tocarán?"
                    answer={(org as any)?.respuestas?.musica_tocaran}
                  />
                )}

                {/* FAQ Item: Estacionamiento */}
                {(org as any)?.respuestas?.hay_estacionamiento && (
                  <FAQAccordion
                    question="🅿️ ¿Hay estacionamiento?"
                    answer={(org as any)?.respuestas?.hay_estacionamiento}
                  />
                )}
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </>
  );
}

