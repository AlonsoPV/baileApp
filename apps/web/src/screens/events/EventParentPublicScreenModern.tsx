import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEventParent } from "../../hooks/useEventParent";
import { useEventDatesByParent } from "../../hooks/useEventDate";
import { useTags } from "../../hooks/useTags";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { motion } from "framer-motion";
import ShareButton from "../../components/events/ShareButton";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { colors, typography, spacing, borderRadius, transitions } from "../../theme/colors";
import UbicacionesLive from "../../components/locations/UbicacionesLive";
import AddToCalendarWithStats from "../../components/AddToCalendarWithStats";
import RequireLogin from "@/components/auth/RequireLogin";
import RitmosChips from "../../components/RitmosChips";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";

/* ──────────────────────────────────────────────────────────────
   Carousel optimizado: accesible, ligero, lazy images, teclado
─────────────────────────────────────────────────────────────── */
const CarouselComponent: React.FC<{ photos: string[] }> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goToPhoto = (index: number) => setCurrentIndex(index);

  // Teclado en fullscreen: ← → y ESC
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, nextPhoto, prevPhoto]);

  if (photos.length === 0) return null;

  return (
    <div
      style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}
      aria-roledescription="carrusel"
      aria-label="Galería del evento"
    >
      {/* Carrusel Principal */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '16/9',
          borderRadius: borderRadius['2xl'],
          overflow: 'hidden',
          border: `1px solid ${colors.glass.medium}`,
          background: colors.dark[400],
          boxShadow: '0 10px 28px rgba(0,0,0,.35)'
        }}
      >
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24 }}
          style={{
            position: 'absolute', inset: 0
          }}
        >
          <ImageWithFallback
            src={photos[currentIndex]}
            alt={`Imagen ${currentIndex + 1} de ${photos.length}`}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'zoom-in'
            }}
            onClick={() => setIsFullscreen(true)}
          />
        </motion.div>

        {/* Contador */}
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: spacing[3],
            right: spacing[3],
            background: 'rgba(0,0,0,.45)',
            color: colors.gray[50],
            padding: `${spacing[1]} ${spacing[3]}`,
            borderRadius: borderRadius.full,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            backdropFilter: 'blur(6px)'
          }}
        >
          {currentIndex + 1} / {photos.length}
        </div>

        {/* Navegación */}
        {photos.length > 1 && (
          <>
            <button
              aria-label="Anterior"
              onClick={prevPhoto}
              style={{
                position: 'absolute',
                left: spacing[3],
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,.45)',
                color: colors.gray[50],
                border: 'none',
                borderRadius: borderRadius.full,
                width: 44, height: 44,
                display: 'grid', placeItems: 'center',
                cursor: 'pointer',
                fontSize: 22,
                transition: transitions.normal,
                backdropFilter: 'blur(6px)'
              }}
            >
              ‹
            </button>
            <button
              aria-label="Siguiente"
              onClick={nextPhoto}
              style={{
                position: 'absolute',
                right: spacing[3],
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,.45)',
                color: colors.gray[50],
                border: 'none',
                borderRadius: borderRadius.full,
                width: 44, height: 44,
                display: 'grid', placeItems: 'center',
                cursor: 'pointer',
                fontSize: 22,
                transition: transitions.normal,
                backdropFilter: 'blur(6px)'
              }}
            >
              ›
            </button>
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
            <button
              key={index}
              onClick={() => goToPhoto(index)}
              aria-label={`Ver imagen ${index + 1}`}
              aria-current={index === currentIndex}
              style={{
                width: 56, height: 56,
                borderRadius: borderRadius.lg,
                overflow: 'hidden',
                border: index === currentIndex
                  ? `2px solid ${colors.primary[500]}`
                  : `1px solid ${colors.glass.medium}`,
                cursor: 'pointer',
                background: 'transparent',
                padding: 0,
                outlineOffset: 2
              }}
            >
              <ImageWithFallback
                src={photo}
                alt={`Miniatura ${index + 1}`}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Imagen en pantalla completa"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.82)',
            zIndex: 60,
            display: 'grid',
            placeItems: 'center',
            padding: spacing[6]
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div style={{
            position: 'relative',
            maxWidth: '92vw',
            maxHeight: '92vh',
            borderRadius: borderRadius['2xl'],
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,.5)'
          }}>
            <ImageWithFallback
              src={photos[currentIndex]}
              alt={`Imagen ${currentIndex + 1} ampliada`}
              loading="eager"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            />

            <button
              aria-label="Cerrar"
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'absolute',
                top: spacing[3],
                right: spacing[3],
                background: 'rgba(0,0,0,.5)',
                color: colors.gray[50],
                border: 'none',
                borderRadius: borderRadius.full,
                width: 44, height: 44,
                display: 'grid', placeItems: 'center',
                cursor: 'pointer',
                fontSize: 22,
                backdropFilter: 'blur(6px)'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Slider de fechas: chips más limpios + CTA único (calendario)
─────────────────────────────────────────────────────────────── */
const DateFlyerSlider: React.FC<{ items: any[]; onOpen: (href: string) => void }> = ({ items, onOpen }) => {
  const [idx, setIdx] = React.useState(0);
  if (!items?.length) return null;
  const ev = items[idx % items.length];

  const calendarStart = (() => {
    try {
      if (!ev.fecha) return new Date();
      const fechaStr = ev.fecha.includes('T') ? ev.fecha.split('T')[0] : ev.fecha;
      const hora = (ev.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
      const fechaCompleta = `${fechaStr}T${hora}:00`;
      const parsed = new Date(fechaCompleta);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    } catch {
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
    } catch {
      const defaultEnd = new Date(calendarStart);
      defaultEnd.setHours(defaultEnd.getHours() + 2);
      return defaultEnd;
    }
  })();

  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: '1.25rem', width: '100%' }}>
      <style>{`
        @media (max-width: 640px) {
          .dfs-wrap { width: 100% !important; max-width: 100% !important; }
          .dfs-controls { width: 100% !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dfs-flyer-card { transition: none !important; }
        }
        .chip {
          border: 1px solid rgba(255,255,255,0.22);
          padding: .45rem .85rem;
          border-radius: 999px;
          font-weight: 800;
          font-size: .9rem;
          backdrop-filter: blur(6px);
        }
      `}</style>

      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        onClick={() => onOpen(ev.href)}
        style={{
          position: 'relative',
          borderRadius: 22,
          cursor: 'pointer',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.16)',
          boxShadow: '0 10px 32px rgba(0,0,0,0.45)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          backdropFilter: 'blur(10px)'
        }}
        className="dfs-wrap dfs-flyer-card"
        aria-label={`Ver detalle de ${ev.nombre}`}
      >
        <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'linear-gradient(135deg, rgba(30,136,229,0.18) 0%, rgba(255,61,87,0.18) 100%)' }}>
            {ev.flyer ? (
              <img
                src={ev.flyer}
                alt={`Flyer de ${ev.nombre}`}
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'grid', placeItems: 'center',
                color: '#fff', fontSize: '3rem'
              }}>
                📅
              </div>
            )}

            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              padding: '1.25rem',
              background: 'linear-gradient(0deg, rgba(0,0,0,.92) 0%, rgba(0,0,0,.6) 55%, rgba(0,0,0,0) 100%)',
              color: '#fff'
            }}>
              <div style={{
                fontSize: '1.25rem', fontWeight: 900, marginBottom: '.6rem',
                textShadow: '0 2px 10px rgba(0,0,0,.55)', lineHeight: 1.2, letterSpacing: '-.02em'
              }}>
                {ev.nombre}
              </div>

              {/* Chips: fecha, hora, lugar (máx 3) */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.6rem' }}>
                {ev.date && <span className="chip">📅 {ev.date}</span>}
                {ev.time && <span className="chip">🕒 {ev.time}</span>}
                {ev.place && <span className="chip">📍 {ev.place}</span>}
                {ev.price && <span className="chip">💰 {ev.price}</span>}
              </div>

              {/* CTA único: añadir a calendario (tap seguro en móvil) */}
              <div
                style={{ display: 'flex', justifyContent: 'center' }}
                onClick={(e) => e.stopPropagation()}
              >
                <RequireLogin>
                  <AddToCalendarWithStats
                    eventId={ev.id}
                    title={ev.nombre}
                    description={ev.biografia || ev.parentDescripcion}
                    location={ev.lugar}
                    start={calendarStart}
                    end={calendarEnd}
                    showAsIcon={false}
                  />
                </RequireLogin>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {items.length > 1 && (
        <div className="dfs-controls" style={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          margin: '0 auto'
        }}>
          <button
            type="button"
            onClick={() => setIdx((p) => (p - 1 + items.length) % items.length)}
            aria-label="Anterior"
            style={{
              padding: '.9rem 1.25rem',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            ‹ Anterior
          </button>
          <button
            type="button"
            onClick={() => setIdx((p) => (p + 1) % items.length)}
            aria-label="Siguiente"
            style={{
              padding: '.9rem 1.25rem',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            Siguiente ›
          </button>
        </div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Pantalla principal sin RSVP: hero + info strip + contenido
─────────────────────────────────────────────────────────────── */
export default function EventParentPublicScreen() {
  const params = useParams<{ parentId?: string; id?: string }>();
  const navigate = useNavigate();
  const parentIdParam = params.parentId ?? params.id;
  const parentIdNum = parentIdParam ? parseInt(parentIdParam) : undefined;

  const { data: parent, isLoading } = useEventParent(parentIdNum);
  const { data: dates } = useEventDatesByParent(parentIdNum);
  const { data: ritmos } = useTags('ritmo');
  const { data: zonas } = useTags('zona');
  const { data: organizer } = useMyOrganizer();

  // Próxima fecha (para info rápida en hero)
  const nextDate = React.useMemo(() => {
    if (!dates || !dates.length) return null as any;
    try {
      return [...dates].sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())[0];
    } catch {
      return dates[0] as any;
    }
  }, [dates]);

  // Dueño
  const isOwner = organizer?.id === parent?.organizer_id;

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.gray[50],
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
          <p style={{ fontSize: typography.fontSize.lg }}>Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.gray[50],
        padding: spacing[8]
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>❌</div>
          <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
            Evento no encontrado
          </h2>
          <p style={{ marginBottom: spacing[6], opacity: 0.7, fontSize: typography.fontSize.lg }}>
            El evento que buscas no existe o ha sido eliminado
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/explore')}
            style={{
              padding: `${spacing[4]} ${spacing[7]}`,
              borderRadius: borderRadius.full,
              border: 'none',
              background: colors.gradients.primary,
              color: colors.gray[50],
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,.35)',
              transition: transitions.normal
            }}
          >
            🔍 Explorar Eventos
          </motion.button>
        </div>
      </div>
    );
  }

  // Medios
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(parent.media as any, slot)?.url)
    .filter(Boolean) as string[];

  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(parent.media as any, slot)?.url)
    .filter(Boolean) as string[];

  const avatarUrl =
    getMediaBySlot(parent.media as any, 'avatar')?.url ||
    (parent as any).avatar_url ||
    (parent as any).portada_url ||
    carouselPhotos[0];

  // Ritmos seleccionados
  let selectedCatalogIds: string[] = Array.isArray((parent as any)?.ritmos_seleccionados)
    ? ((parent as any).ritmos_seleccionados as string[])
    : [];
  if ((!selectedCatalogIds || selectedCatalogIds.length === 0) && Array.isArray(parent.estilos) && parent.estilos.length > 0 && Array.isArray(ritmos)) {
    const nameByTagId = new Map<number, string>();
    ritmos.forEach((t: any) => nameByTagId.set(t.id, t.nombre));
    const catalogIdByLabel = new Map<string, string>();
    RITMOS_CATALOG.forEach(g => g.items.forEach(i => catalogIdByLabel.set(i.label, i.id)));
    selectedCatalogIds = (parent.estilos as number[])
      .map(tagId => nameByTagId.get(tagId))
      .filter(Boolean)
      .map(label => catalogIdByLabel.get(label as string))
      .filter(Boolean) as string[];
  }

  // Slider items
  const dateItems = (dates || []).map((d: any) => {
    const hora = d.hora_inicio && d.hora_fin
      ? `${d.hora_inicio} - ${d.hora_fin}`
      : (d.hora_inicio ? d.hora_inicio : undefined);
    const flyer = (d as any).flyer_url || (Array.isArray(d.media) && d.media.length > 0 ? ((d.media[0] as any)?.url || d.media[0]) : undefined);
    const price = (() => {
      const costos = (d as any)?.costos;
      if (Array.isArray(costos) && costos.length) {
        const nums = costos.map((c: any) => (typeof c?.precio === 'number' ? c.precio : null)).filter((n: any) => n !== null);
        if (nums.length) { const min = Math.min(...(nums as number[])); return min >= 0 ? `$${min.toLocaleString()}` : undefined; }
      }
      return undefined;
    })();
    return {
      id: d.id,
      nombre: d.nombre || parent?.nombre,
      date: new Date(d.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: hora,
      place: d.lugar || d.ciudad || '',
      flyer,
      price,
      href: `/social/fecha/${d.id}`,
      fecha: d.fecha,
      hora_inicio: d.hora_inicio,
      hora_fin: d.hora_fin,
      lugar: d.lugar || d.ciudad || d.direccion,
      biografia: d.biografia,
      parentDescripcion: parent?.descripcion
    };
  });

  const getZonaNombres = () => {
    if (!zonas || !parent.zonas) return [];
    return parent.zonas
      .map((id: number) => zonas.find(zona => zona.id === id))
      .filter(Boolean)
      .map(zona => zona!.nombre);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: ${typography.fontFamily.primary}; }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
        .glass-card-container {
          margin-bottom: 2rem; padding: 2rem;
          background: linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.03));
          border-radius: 22px; border: 1px solid rgba(255,255,255,.15);
          box-shadow: 0 10px 32px rgba(0,0,0,.4); backdrop-filter: blur(10px);
        }
        
        @media (max-width: 768px) {
          .glass-card-container {
            padding: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 18px !important;
          }
        }
        
        @media (max-width: 480px) {
          .glass-card-container {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            border-radius: 16px !important;
          }
        }
        .social-hero-modern {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, rgba(11,13,16,.96), rgba(18,22,27,.9));
          padding: 3.5rem 2.25rem; text-align: center; border-radius: 28px;
          margin: 1.5rem auto 0; max-width: 1400px;
          border: 1px solid rgba(255,255,255,.09);
          box-shadow: 0 16px 48px rgba(0,0,0,.5);
        }
        .social-hero-title {
          font-size: clamp(2rem, 4vw, 4rem);
          font-weight: 900;
          background: linear-gradient(135deg, #1E88E5 0%, #00BCD4 50%, #FF3D57 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          margin-bottom: 1rem; letter-spacing: -0.03em; line-height: 1.1;
        }
        .social-hero-description {
          font-size: clamp(1rem, 2vw, 1.25rem);
          opacity: .95; max-width: 820px; margin: 0 auto 1.25rem; line-height: 1.6;
          color: rgba(255,255,255,.92);
        }
        .info-strip {
          display: flex; flex-wrap: wrap; gap: .5rem; justify-content: flex-start;
        }
        .info-chip {
          padding: .5rem .85rem; border-radius: 999px; font-weight: 800; font-size: .95rem;
          border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.08);
          color: #fff; backdrop-filter: blur(6px);
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        color: colors.gray[50],
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* HERO */}
        <motion.div
          className="social-hero-modern"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36 }}
        >
          <style>{`
            .social-hero-content {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2rem;
              align-items: start;
            }
            
            @media (max-width: 1024px) {
              .social-hero-content {
                grid-template-columns: 1fr !important;
                gap: 1.5rem !important;
              }
            }
            
            @media (max-width: 768px) {
              .social-hero-modern {
                padding: 2rem 1.5rem !important;
              }
            }
            
            @media (max-width: 480px) {
              .social-hero-modern {
                padding: 1.5rem 1rem !important;
              }
              
              .social-hero-title {
                font-size: 1.75rem !important;
              }
              
              .social-hero-description {
                font-size: 0.95rem !important;
              }
            }
          `}</style>
          
          <div className="social-hero-content">
            {/* Columna 1: Nombre, Bio, Botones */}
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="social-hero-title"
                style={{ textAlign: 'left' }}
              >
                {parent.nombre}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
                className="social-hero-description"
                style={{ textAlign: 'left', marginBottom: '1.5rem' }}
              >
                {parent.biografia || 'Descubre más sobre este evento especial'}
              </motion.p>

              {/* Acciones */}
              <style>{`
                .action-buttons {
                  display: flex;
                  gap: 1rem;
                  flex-wrap: wrap;
                }
                
                @media (max-width: 480px) {
                  .action-buttons {
                    flex-direction: column;
                    gap: 0.75rem;
                  }
                  
                  .action-buttons button,
                  .action-buttons > div {
                    width: 100%;
                  }
                  
                  .action-buttons button {
                    padding: 0.75rem 1.25rem !important;
                    font-size: 0.9rem !important;
                  }
                }
              `}</style>
              
              <div className="action-buttons">
                {isOwner && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/social/${parent.id}/edit`)}
                    style={{
                      padding: '0.9rem 1.6rem',
                      borderRadius: borderRadius.full,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'linear-gradient(135deg, rgba(255,61,87,.9), rgba(255,140,66,.9))',
                      color: colors.gray[50],
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(0,0,0,.35)'
                    }}
                  >
                    ✏️ Editar Social
                  </motion.button>
                )}

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <ShareButton
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                    title={parent.nombre}
                    style={{
                      padding: '0.9rem 1.6rem',
                      borderRadius: borderRadius.full,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'linear-gradient(135deg, rgba(30,136,229,.9), rgba(0,188,212,.9))',
                      color: colors.gray[50],
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(0,0,0,.35)'
                    }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Columna 2: Fechas Disponibles */}
            <div>
              <style>{`
                .dates-container {
                  padding: 1.5rem;
                  border-radius: 18px;
                  border: 1px solid rgba(30,136,229,.25);
                  background: linear-gradient(135deg, rgba(30,136,229,.12), rgba(0,188,212,.08));
                  box-shadow: 0 10px 28px rgba(30,136,229,.25);
                }
                
                .dates-list {
                  display: grid;
                  gap: .75rem;
                  max-height: 400px;
                  overflow-y: auto;
                  padding-right: .5rem;
                }
                
                .date-card {
                  padding: 1rem;
                  border-radius: 14px;
                  border: 1px solid rgba(255,255,255,.15);
                  background: rgba(255,255,255,.06);
                  cursor: pointer;
                  transition: all 0.2s;
                }
                
                @media (max-width: 768px) {
                  .dates-container {
                    padding: 1.25rem !important;
                  }
                  
                  .dates-list {
                    max-height: 300px !important;
                  }
                  
                  .date-card {
                    padding: 0.85rem !important;
                  }
                }
                
                @media (max-width: 480px) {
                  .dates-container {
                    padding: 1rem !important;
                  }
                  
                  .dates-list {
                    max-height: 250px !important;
                    gap: 0.5rem !important;
                  }
                  
                  .date-card {
                    padding: 0.75rem !important;
                  }
                  
                  .date-card-title {
                    font-size: 0.9rem !important;
                  }
                  
                  .date-card-chips {
                    gap: 0.35rem !important;
                  }
                  
                  .date-card-chips span {
                    padding: 0.3rem 0.6rem !important;
                    font-size: 0.8rem !important;
                  }
                }
              `}</style>
              
              {dates && dates.length > 0 ? (
                <div className="dates-container">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      display: 'grid', placeItems: 'center',
                      background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                      boxShadow: '0 8px 20px rgba(30,136,229,.4)', fontSize: '1.25rem'
                    }}>📅</div>
                    <div>
                      <h3 style={{
                        margin: 0, fontSize: '1.25rem', fontWeight: 900,
                        background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                      }}>
                        Fechas Disponibles
                      </h3>
                      <p style={{ margin: 0, opacity: .85, fontSize: '0.9rem' }}>
                        {dates.length} fecha{dates.length !== 1 ? 's' : ''} programada{dates.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="dates-list">
                    {dates.map((d: any) => (
                      <motion.div
                        key={d.id}
                        whileHover={{ scale: 1.02, x: 4 }}
                        onClick={() => navigate(`/social/fecha/${d.id}`)}
                        className="date-card"
                      >
                        <div className="date-card-title" style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '.5rem', color: '#fff' }}>
                          {d.nombre || parent.nombre}
                        </div>
                        <div className="date-card-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', fontSize: '0.85rem' }}>
                          <span style={{ 
                            padding: '.35rem .7rem', 
                            borderRadius: 999, 
                            background: 'rgba(240,147,251,.15)',
                            border: '1px solid rgba(240,147,251,.25)',
                            color: '#f093fb',
                            fontWeight: 700
                          }}>
                            📅 {new Date(d.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                          {d.hora_inicio && (
                            <span style={{ 
                              padding: '.35rem .7rem', 
                              borderRadius: 999, 
                              background: 'rgba(255,209,102,.15)',
                              border: '1px solid rgba(255,209,102,.25)',
                              color: '#FFD166',
                              fontWeight: 700
                            }}>
                              🕐 {d.hora_inicio}
                            </span>
                          )}
                          {d.lugar && (
                            <span style={{ 
                              padding: '.35rem .7rem', 
                              borderRadius: 999, 
                              background: 'rgba(30,136,229,.15)',
                              border: '1px solid rgba(30,136,229,.25)',
                              color: '#1E88E5',
                              fontWeight: 700
                            }}>
                              📍 {d.lugar}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '2rem',
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,.15)',
                  background: 'rgba(255,255,255,.05)',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,.6)'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📅</div>
                  <p style={{ margin: 0 }}>Aún no hay fechas programadas</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* CONTENIDO */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.25rem' }}>
          <style>{`
            .content-two-col {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2rem;
              align-items: start;
            }
            
            @media (max-width: 1024px) {
              .content-two-col {
                grid-template-columns: 1fr !important;
                gap: 1.5rem !important;
              }
            }
          `}</style>

          {/* Primera fila: Dos columnas */}
          <div className="content-two-col" style={{ marginBottom: '2rem' }}>
            {/* Columna 1: Descripción + Ritmos/Zonas */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Descripción */}
              {parent.descripcion && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  className="glass-card-container"
                >
                  <h3 style={{
                    fontSize: '1.5rem', fontWeight: 900, marginBottom: '.75rem',
                    background: 'linear-gradient(135deg, #1E88E5, #FF3D57)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                  }}>
                    📝 Descripción
                  </h3>
                  <p style={{ lineHeight: 1.7, fontSize: '1.05rem', color: 'rgba(255,255,255,.92)', margin: 0 }}>
                    {parent.descripcion}
                  </p>
                </motion.div>
              )}

              {/* Ritmos / Zonas */}
              {(selectedCatalogIds.length > 0 || getZonaNombres().length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  aria-label="Ritmos y zonas del evento"
                  className="glass-card-container"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center',
                      background: 'linear-gradient(135deg, #1E88E5, #FF3D57)',
                      color: '#fff', boxShadow: '0 10px 24px rgba(30,136,229,.35)'
                    }}>🎵</div>
                    <div>
                      <h3 style={{
                        margin: 0, fontSize: '1.25rem', fontWeight: 900,
                        color: '#fff'
                      }}>
                        Enfoque Musical y Zonas
                      </h3>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {selectedCatalogIds.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                          <strong style={{ fontSize: '.95rem' }}>🎵 Ritmos</strong>
                        </div>
                        <div>
                          <RitmosChips selected={selectedCatalogIds} onChange={() => { }} readOnly />
                        </div>
                      </div>
                    )}

                    {getZonaNombres().length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                          <strong style={{ fontSize: '.95rem' }}>📍 Zonas</strong>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
                          {getZonaNombres().map((zona) => (
                            <span
                              key={zona}
                              style={{
                                padding: '.5rem .85rem',
                                borderRadius: 999,
                                border: '1px solid rgba(255,255,255,.28)',
                                background: 'rgba(255,255,255,.10)',
                                fontWeight: 800
                              }}
                            >
                              {zona}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Columna 2: Flyer del Event Parent */}
            {avatarUrl && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="glass-card-container"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    display: 'grid', placeItems: 'center',
                    background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                    boxShadow: '0 10px 28px rgba(229,57,53,.35)', fontSize: '1.25rem'
                  }}>🎟️</div>
                  <div>
                    <h3 style={{
                      margin: 0, fontSize: '1.25rem', fontWeight: 900,
                      background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                      Imagen Principal
                    </h3>
                  </div>
                </div>

                <div style={{
                  width: '100%',
                  aspectRatio: '4 / 5',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,.15)',
                  boxShadow: '0 12px 32px rgba(0,0,0,.4)',
                  background: 'linear-gradient(135deg, rgba(229,57,53,.12), rgba(251,140,0,.12))'
                }}>
                  <ImageWithFallback
                    src={avatarUrl}
                    alt={`${parent.nombre} imagen principal`}
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Próximas Fechas (Slider) */}
          {dates && dates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="glass-card-container"
              aria-label="Próximas fechas"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                  boxShadow: '0 10px 28px rgba(30,136,229,.35)', fontSize: '1.35rem'
                }}>📅</div>
                <div>
                  <h3 style={{
                    margin: 0, fontSize: '1.5rem', fontWeight: 900,
                    background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                  }}>
                    Próximas Fechas
                  </h3>
                  <p style={{ margin: 0, opacity: .85 }}>{dates.length} fecha{dates.length !== 1 ? 's' : ''} programada{dates.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <DateFlyerSlider items={dateItems} onOpen={(href: string) => navigate(href)} />
            </motion.div>
          )}

          {/* Ubicaciones */}
          {(parent as any).ubicaciones && Array.isArray((parent as any).ubicaciones) && (parent as any).ubicaciones.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="glass-card-container"
            >
              <UbicacionesLive
                ubicaciones={(parent as any).ubicaciones}
                title="📍 Ubicaciones del Evento"
              />
            </motion.div>
          )}

          {/* FAQ */}
          {parent.faq && Array.isArray(parent.faq) && parent.faq.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="glass-card-container"
              aria-label="Preguntas frecuentes"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  background: 'linear-gradient(135deg, #FB8C00, #FF7043)',
                  boxShadow: '0 10px 28px rgba(251,140,0,.35)', fontSize: '1.35rem'
                }}>❓</div>
                <div>
                  <h3 style={{
                    margin: 0, fontSize: '1.5rem', fontWeight: 900,
                    background: 'linear-gradient(135deg, #FF7043, #FB8C00)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                  }}>
                    Preguntas Frecuentes
                  </h3>
                  <p style={{ margin: 0, opacity: .85 }}>
                    {parent.faq.length} pregunta{parent.faq.length !== 1 ? 's' : ''} frecuente{parent.faq.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '.85rem' }}>
                {parent.faq.map((faq: any, index: number) => (
                  <div
                    key={index}
                    className="faq-item"
                    style={{
                      padding: '1rem 1.25rem',
                      background: 'rgba(255,255,255,.07)',
                      border: '1px solid rgba(255,255,255,.14)',
                      borderRadius: 14
                    }}
                  >
                    <h4 style={{ margin: 0, marginBottom: '.35rem', fontSize: '1.05rem', fontWeight: 800 }}>
                      {faq.pregunta || faq.q}
                    </h4>
                    <p style={{ margin: 0, opacity: .92, lineHeight: 1.6 }}>
                      {faq.respuesta || faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Galería  */}
          {carouselPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="glass-card-container"
              aria-label="Galería de fotos"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                  boxShadow: '0 10px 28px rgba(229,57,53,.35)', fontSize: '1.35rem'
                }}>📷</div>
                <div>
                  <h3 style={{
                    margin: 0, fontSize: '1.5rem', fontWeight: 900,
                    background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                  }}>
                    Galería de Fotos
                  </h3>
                  <p style={{ margin: 0, opacity: .85 }}>
                    {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <CarouselComponent photos={carouselPhotos} />
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
