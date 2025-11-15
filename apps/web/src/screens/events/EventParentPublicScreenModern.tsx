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
import EventCard from "../../components/explore/cards/EventCard";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import SeoHead from "@/components/SeoHead";
import { SEO_BASE_URL, SEO_LOGO_URL } from "@/lib/seoConfig";
import { fmtDateTime } from "../../utils/format";

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
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              cursor: 'zoom-in',
              background: 'rgba(0,0,0,0.3)'
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
              priority
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

  const parentName = (parent as any)?.nombre || (parent as any)?.titulo || (parent as any)?.slug || 'Evento social';
  const parentCity =
    (parent as any)?.ciudad ||
    (parent as any)?.zonas?.[0]?.nombre ||
    (parent as any)?.zonas_nombres?.[0] ||
    'México';
  const ritmosDescription =
    selectedCatalogIds.slice(0, 3).join(', ') ||
    (((parent as any)?.ritmos || (parent as any)?.estilos || []).slice(0, 3).join(', '));
  const parentDescription =
    (parent as any)?.biografia ||
    (parent as any)?.descripcion ||
    `Descubre ${parentName}, social de baile en ${parentCity} con ritmos como ${ritmosDescription || 'salsa y bachata'}.`;
  const parentImage = avatarUrl || carouselPhotos[0] || SEO_LOGO_URL;
  const parentUrl = `${SEO_BASE_URL}/social/${parentIdParam ?? parent.id}`;

  return (
    <>
      <SeoHead
        section="event"
        title={`${parentName} | Social de baile`}
        description={parentDescription}
        image={parentImage}
        url={parentUrl}
        keywords={[
          parentName,
          'social de baile',
          parentCity,
          ritmosDescription,
          'Dónde Bailar',
        ].filter(Boolean) as string[]}
      />
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
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, 
            rgba(11,13,16,.98) 0%, 
            rgba(18,22,27,.95) 50%, 
            rgba(30,20,40,.96) 100%);
          padding: 3rem 2.5rem;
          border-radius: 32px;
          margin: 1.5rem auto 0;
          max-width: 1400px;
          border: 2px solid rgba(240,147,251,.15);
          box-shadow: 
            0 20px 60px rgba(0,0,0,.6),
            0 0 0 1px rgba(240,147,251,.1) inset,
            0 4px 20px rgba(240,147,251,.15);
          backdrop-filter: blur(20px);
        }
        
        .social-hero-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #f093fb, #f5576c, #FFD166, #1E88E5);
          opacity: 0.9;
        }
        
        .social-hero-title {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 900;
          margin-bottom: 1.25rem;
          letter-spacing: -0.04em;
          line-height: 1.05;
          color: rgb(255, 255, 255);
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px,
                       rgba(0, 0, 0, 0.6) 0px 0px 8px,
                       rgba(0, 0, 0, 0.8) -1px -1px 0px,
                       rgba(0, 0, 0, 0.8) 1px -1px 0px,
                       rgba(0, 0, 0, 0.8) -1px 1px 0px,
                       rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }
        
        .social-hero-description {
          font-size: clamp(1rem, 2vw, 1.15rem);
          opacity: .92;
          max-width: 820px;
          margin: 0 0 1.25rem;
          line-height: 1.7;
          color: rgba(255,255,255,.9);
          font-weight: 400;
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
          {/* Efectos decorativos de fondo */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(30,136,229,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(240,147,251,0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          
          <style>{`
            .social-hero-content {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2.5rem;
              align-items: center;
              position: relative;
              z-index: 1;
            }
            
            @media (max-width: 1024px) {
              .social-hero-content {
                grid-template-columns: 1fr !important;
                gap: 2rem !important;
              }
            }
            
            @media (max-width: 768px) {
              .social-hero-modern {
                padding: 2rem 1.5rem !important;
              }
              
              .social-hero-content {
                gap: 1.5rem !important;
              }
            }
            
            @media (max-width: 480px) {
              .social-hero-modern {
                padding: 1.5rem 1rem !important;
              }
              
              .social-hero-content {
                gap: 1.25rem !important;
              }
              
              .social-hero-title {
                font-size: 2rem !important;
                letter-spacing: -0.03em !important;
                margin-bottom: 1rem !important;
              }
              
              .social-hero-description {
                font-size: 0.95rem !important;
              }
            }
          `}</style>
          
          <div className="social-hero-content">
            {/* Columna 1: Nombre, Bio, Descripción, Ritmos/Zonas, Botones */}
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
                style={{ textAlign: 'left', marginBottom: '1.25rem' }}
              >
                {parent.biografia || 'Descubre más sobre este evento especial'}
              </motion.p>

              {/* Info rápida de la próxima fecha (hijo) */}
              {nextDate && (
                <div className="info-strip" style={{ marginBottom: '1.25rem' }}>
                  {nextDate.fecha && (
                    <span className="info-chip">
                      📅 {fmtDateTime(nextDate.fecha, nextDate.hora_inicio)}
                    </span>
                  )}
                  {(nextDate.lugar || nextDate.ciudad || nextDate.direccion) && (
                    <span className="info-chip">
                      📍 {[nextDate.lugar, nextDate.ciudad].filter(Boolean).join(' • ') || nextDate.direccion}
                    </span>
                  )}
                </div>
              )}

              {/* Ritmos y Zonas (zonas agrupadas en chips padres colapsables) */}
              {(selectedCatalogIds.length > 0 || (parent as any)?.zonas?.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="chips-container"
                  style={{
                    marginBottom: '1.5rem',
                    padding: '1rem 1.25rem',
                    borderRadius: 16,
                    border: '1px solid rgba(240,147,251,.15)',
                    background: 'linear-gradient(135deg, rgba(240,147,251,.08), rgba(30,136,229,.06))',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <style>{`
                    .chips-container {
                      position: relative;
                      overflow: hidden;
                    }
                    
                    @media (max-width: 768px) {
                      .chips-container {
                        padding: 0.85rem 1rem !important;
                        gap: 0.75rem !important;
                      }
                    }
                    
                    @media (max-width: 480px) {
                      .chips-container {
                        padding: 0.75rem 0.85rem !important;
                        gap: 0.5rem !important;
                        border-radius: 14px !important;
                      }
                      
                      .chips-container span {
                        font-size: 0.8rem !important;
                        padding: 0.4rem 0.7rem !important;
                      }
                    }
                  `}</style>
                  
                  {selectedCatalogIds.length > 0 && (
                    <div>
                      <RitmosChips selected={selectedCatalogIds} onChange={() => { }} readOnly />
                    </div>
                  )}

                  {(parent as any)?.zonas && Array.isArray((parent as any).zonas) && zonas && (
                    <ZonaGroupedChips
                      mode="display"
                      selectedIds={(parent as any).zonas as number[]}
                      allTags={zonas as any}
                      autoExpandSelectedParents={false}
                      style={{ marginTop: '0.25rem' }}
                    />
                  )}
                </motion.div>
              )}

              {/* Acciones */}
              <style>{`
                .action-buttons {
                  display: flex;
                  gap: 1rem;
                  flex-wrap: wrap;
                  margin-top: 1.5rem;
                }
                
                .action-buttons button,
                .action-buttons > div > button {
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  position: relative;
                  overflow: hidden;
                }
                
                .action-buttons button::before,
                .action-buttons > div > button::before {
                  content: '';
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  width: 0;
                  height: 0;
                  border-radius: 50%;
                  background: rgba(255,255,255,.2);
                  transform: translate(-50%, -50%);
                  transition: width 0.6s, height 0.6s;
                }
                
                .action-buttons button:hover::before,
                .action-buttons > div > button:hover::before {
                  width: 300px;
                  height: 300px;
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
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/social/${parent.id}/edit`)}
                    style={{
                      padding: '1rem 1.75rem',
                      borderRadius: borderRadius.full,
                      border: '2px solid rgba(255,61,87,0.4)',
                      background: 'linear-gradient(135deg, rgba(255,61,87,.95), rgba(255,140,66,.95))',
                      color: colors.gray[50],
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      cursor: 'pointer',
                      boxShadow: '0 10px 30px rgba(255,61,87,.4), 0 4px 12px rgba(0,0,0,.3)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span style={{ position: 'relative', zIndex: 1 }}>✏️ Editar Social</span>
                  </motion.button>
                )}

                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <ShareButton
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                    title={parent.nombre}
                    style={{
                      padding: '1rem 1.75rem',
                      borderRadius: borderRadius.full,
                      border: '2px solid rgba(30,136,229,0.4)',
                      background: 'linear-gradient(135deg, rgba(30,136,229,.95), rgba(0,188,212,.95))',
                      color: colors.gray[50],
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      cursor: 'pointer',
                      boxShadow: '0 10px 30px rgba(30,136,229,.4), 0 4px 12px rgba(0,0,0,.3)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Columna 2: Próximas Fechas */}
            <div>
              <style>{`
                .dates-container {
                  padding: 1.75rem;
                  border-radius: 24px;
                  border: 2px solid rgba(30,136,229,.3);
                  background: linear-gradient(135deg, 
                    rgba(30,136,229,.18) 0%, 
                    rgba(0,188,212,.14) 50%, 
                    rgba(240,147,251,.10) 100%);
                  box-shadow: 
                    0 16px 40px rgba(30,136,229,.35),
                    0 0 0 1px rgba(30,136,229,.2) inset,
                    0 4px 20px rgba(0,0,0,.3);
                  backdrop-filter: blur(16px);
                  position: relative;
                  overflow: hidden;
                }
                
                .dates-container::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 3px;
                  background: linear-gradient(90deg, #1E88E5, #00BCD4, #f093fb);
                  opacity: 0.8;
                }
                
                .dates-header {
                  position: relative;
                  z-index: 1;
                  padding-bottom: 1rem;
                  border-bottom: 2px solid rgba(255,255,255,.1);
                  margin-bottom: 1.25rem;
                }
                
                .dates-grid {
                  display: flex;
                  flex-direction: column;
                  gap: 1.5rem;
                  max-height: 600px;
                  overflow-y: auto;
                  padding-right: .5rem;
                  position: relative;
                  z-index: 1;
                  width: 100%;
                  max-width: 350px;
                  margin: 0 auto;
                }
                
                /* Custom scrollbar */
                .dates-grid::-webkit-scrollbar {
                  width: 8px;
                }
                
                .dates-grid::-webkit-scrollbar-track {
                  background: rgba(255,255,255,.05);
                  border-radius: 10px;
                }
                
                .dates-grid::-webkit-scrollbar-thumb {
                  background: linear-gradient(135deg, #1E88E5, #00BCD4);
                  border-radius: 10px;
                  border: 2px solid rgba(255,255,255,.1);
                }
                
                .dates-grid::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(135deg, #00BCD4, #f093fb);
                }
                
                @media (max-width: 768px) {
                  .dates-container {
                    padding: 1.5rem !important;
                    border-radius: 20px !important;
                  }
                  
                  .dates-grid {
                    max-height: 500px !important;
                    gap: 1rem !important;
                    max-width: 100% !important;
                  }
                  
                  .dates-header {
                    padding-bottom: 0.75rem !important;
                    margin-bottom: 1rem !important;
                  }
                }
                
                @media (max-width: 480px) {
                  .dates-container {
                    padding: 1.25rem !important;
                    border-radius: 18px !important;
                  }
                  
                  .dates-grid {
                    max-height: 400px !important;
                    gap: 0.75rem !important;
                    max-width: 100% !important;
                  }
                  
                  .dates-header {
                    padding-bottom: 0.5rem !important;
                    margin-bottom: 0.75rem !important;
                  }
                }
              `}</style>
              
              {/* Acciones del owner (crear fecha / editar social) */}
              {isOwner && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/social/${parent.id}/fecha/nueva`)}
                    style={{
                      padding: '0.75rem 1.4rem',
                      borderRadius: 999,
                      border: '2px solid rgba(30,136,229,0.4)',
                      background: 'linear-gradient(135deg, rgba(30,136,229,.95), rgba(0,188,212,.95))',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 8px 22px rgba(30,136,229,.45)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span>📅</span>
                    <span>Crear nueva fecha</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/social/${parent.id}/edit`)}
                    style={{
                      padding: '0.75rem 1.4rem',
                      borderRadius: 999,
                      border: '2px solid rgba(255,61,87,0.4)',
                      background: 'linear-gradient(135deg, rgba(255,61,87,.95), rgba(255,140,66,.95))',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 8px 22px rgba(255,61,87,.45)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span>✏️</span>
                    <span>Editar social</span>
                  </motion.button>
                </div>
              )}

              {(() => {
                // Filtrar solo fechas futuras (incluyendo hoy) evitando problemas de zona horaria
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const parseLocalYmd = (value: string) => {
                  const plain = String(value).split('T')[0];
                  const [y, m, d] = plain.split('-').map((n) => parseInt(n, 10));
                  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
                    const fallback = new Date(value);
                    return Number.isNaN(fallback.getTime()) ? null : fallback;
                  }
                  return new Date(y, m - 1, d);
                };
                
                const futureDates = (dates || []).filter((d: any) => {
                  try {
                    const dateObj = parseLocalYmd(d.fecha);
                    if (!dateObj) return false;
                    dateObj.setHours(0, 0, 0, 0);
                    return dateObj >= today;
                  } catch {
                    return false;
                  }
                });
                
                return futureDates.length > 0 ? (
                  <div className="dates-container">
                    <div className="dates-header">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                          <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            display: 'grid', placeItems: 'center',
                            background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                            boxShadow: '0 10px 28px rgba(30,136,229,.5)',
                            fontSize: '1.5rem',
                            border: '2px solid rgba(30,136,229,.3)'
                          }}>📅</div>
                          <div>
                            <h3 style={{
                              margin: 0, fontSize: '1.5rem', fontWeight: 900,
                              background: 'linear-gradient(135deg, #fff, rgba(255,255,255,.85))',
                              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                              letterSpacing: '-0.02em',
                              lineHeight: 1.2
                            }}>
                              Próximas Fechas
                            </h3>
                            <p style={{ 
                              margin: 0, 
                              fontSize: '0.9rem',
                              color: 'rgba(255,255,255,.75)',
                              fontWeight: 600
                            }}>
                              {futureDates.length} fecha{futureDates.length !== 1 ? 's' : ''} próxima{futureDates.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        
                        {/* Badge decorativo */}
                        <div style={{
                          padding: '0.5rem 1rem',
                          borderRadius: 999,
                          background: 'rgba(255,255,255,.08)',
                          border: '1px solid rgba(255,255,255,.15)',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          color: '#fff',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,.2)'
                        }}>
                          🎉 Disponibles
                        </div>
                      </div>
                    </div>

                    <div className="dates-grid">
                      {futureDates.map((d: any) => (
                        <motion.div 
                          key={d.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <EventCard item={d} />
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
                    <p style={{ margin: 0 }}>Aún no hay fechas próximas</p>
                  </div>
                );
              })()}
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

          {/* Imagen Principal - Más pequeña y centrada */}
          {avatarUrl && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div style={{
                width: '100%',
                maxWidth: '500px',
                padding: '1.5rem',
                borderRadius: 24,
                border: '2px solid rgba(229,57,53,.25)',
                background: 'linear-gradient(135deg, rgba(229,57,53,.12), rgba(251,140,0,.08))',
                boxShadow: '0 16px 40px rgba(229,57,53,.3), 0 4px 16px rgba(0,0,0,.3)',
                backdropFilter: 'blur(12px)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', justifyContent: 'center' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    display: 'grid', placeItems: 'center',
                    background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                    boxShadow: '0 10px 28px rgba(229,57,53,.4)',
                    fontSize: '1.25rem',
                    border: '2px solid rgba(229,57,53,.3)'
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
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '2px solid rgba(255,255,255,.2)',
                  boxShadow: '0 16px 40px rgba(0,0,0,.5)',
                  background: 'linear-gradient(135deg, rgba(229,57,53,.15), rgba(251,140,0,.15))'
                }}>
                <ImageWithFallback
                  src={avatarUrl}
                  alt={`${parent.nombre} imagen principal`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                </div>
              </div>
            </motion.div>
          )}

          {/* Próximas Fechas (Slider) - COMENTADO: Ya se muestra en el Hero */}
          {/* {dates && dates.length > 0 && (
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
          )} */}

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
