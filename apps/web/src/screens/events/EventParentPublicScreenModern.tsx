import React, { useState } from "react";
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
import RitmosChips from "../../components/RitmosChips";

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
                color: colors.gray[50],
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
                color: colors.gray[50],
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
                color: colors.gray[50],
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

// Slider responsivo para mostrar flyers de fechas
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
    <div style={{ display: 'grid', placeItems: 'center', gap: '1.5rem', width: '100%' }}>
      <style>{`
        @media (max-width: 640px) {
          .dfs-wrap { width: 100% !important; max-width: 100% !important; }
          .dfs-controls { width: 100% !important; }
        }
        .dfs-flyer-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dfs-flyer-card:hover {
          transform: translateY(-8px) scale(1.02);
        }
      `}</style>
      <motion.div
        key={idx}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        onClick={() => onOpen(ev.href)}
        style={{ 
          position: 'relative', 
          borderRadius: 24, 
          cursor: 'pointer', 
          overflow: 'hidden', 
          border: '1px solid rgba(255,255,255,0.2)', 
          boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
          backdropFilter: 'blur(20px)'
        }}
        className="dfs-wrap dfs-flyer-card"
      >
        <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'linear-gradient(135deg, rgba(30,136,229,0.2) 0%, rgba(255,61,87,0.2) 100%)', borderRadius: 20, overflow: 'hidden' }}>
            {ev.flyer ? (
              <img 
                src={ev.flyer} 
                alt={ev.nombre} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  display: 'block',
                  transition: 'transform 0.4s ease'
                }} 
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(30,136,229,0.3) 0%, rgba(255,61,87,0.3) 100%)',
                color: '#fff',
                fontSize: '3rem'
              }}>
                📅
              </div>
            )}
            <div style={{ 
              position: 'absolute', 
              left: 0, 
              right: 0, 
              bottom: 0, 
              padding: '1.5rem', 
              background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.0) 100%)', 
              color: '#fff' 
            }}>
              <div style={{ 
                fontSize: '1.35rem', 
                fontWeight: 900, 
                marginBottom: '0.75rem', 
                textShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 20px rgba(30,136,229,0.3)',
                lineHeight: 1.2,
                letterSpacing: '-0.02em'
              }}>
                {ev.nombre}
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '0.5rem', 
                fontSize: '0.9rem', 
                marginBottom: '1rem' 
              }}>
                {ev.date && (
                  <span style={{ 
                    border: '1px solid rgba(255,255,255,0.25)', 
                    background: 'linear-gradient(135deg, rgba(30,136,229,0.3), rgba(0,188,212,0.3))', 
                    padding: '0.5rem 1rem', 
                    borderRadius: 999,
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    📅 {ev.date}
                  </span>
                )}
                {ev.time && (
                  <span style={{ 
                    border: '1px solid rgba(255,255,255,0.25)', 
                    background: 'linear-gradient(135deg, rgba(255,61,87,0.3), rgba(255,140,66,0.3))', 
                    padding: '0.5rem 1rem', 
                    borderRadius: 999,
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    🕒 {ev.time}
                  </span>
                )}
                {ev.place && (
                  <span style={{ 
                    border: '1px solid rgba(255,255,255,0.25)', 
                    background: 'linear-gradient(135deg, rgba(255,140,66,0.3), rgba(229,57,53,0.3))', 
                    padding: '0.5rem 1rem', 
                    borderRadius: 999,
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    📍 {ev.place}
                  </span>
                )}
                {ev.price && (
                  <span style={{ 
                    border: '1px solid rgba(255,255,255,0.25)', 
                    background: 'linear-gradient(135deg, rgba(76,175,80,0.3), rgba(139,195,74,0.3))', 
                    padding: '0.5rem 1rem', 
                    borderRadius: 999,
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    💰 {ev.price}
                  </span>
                )}
              </div>
              {/* Botón de calendario */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                marginTop: '0.75rem',
                position: 'relative',
                zIndex: 5
              }} onClick={(e) => e.stopPropagation()}>
                <AddToCalendarWithStats
                  eventId={ev.id}
                  title={ev.nombre}
                  description={ev.biografia || ev.parentDescripcion}
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
        <div className="dfs-controls" style={{ 
          width: '100%', 
          maxWidth: 420, 
          display: 'flex', 
          justifyContent: 'space-between',
          gap: '1rem',
          margin: '0 auto'
        }}>
          <motion.button 
            type="button" 
            onClick={() => setIdx((p) => (p - 1 + items.length) % items.length)} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              padding: '1rem 1.5rem', 
              borderRadius: 16, 
              border: '1px solid rgba(255,255,255,0.25)', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))', 
              color: '#fff', 
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.95rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(15px)',
              transition: 'all 0.3s ease'
            }}
          >
            ‹ Anterior
          </motion.button>
          <motion.button 
            type="button" 
            onClick={() => setIdx((p) => (p + 1) % items.length)} 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              padding: '1rem 1.5rem', 
              borderRadius: 16, 
              border: '1px solid rgba(255,255,255,0.25)', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))', 
              color: '#fff', 
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.95rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(15px)',
              transition: 'all 0.3s ease'
            }}
          >
            Siguiente ›
          </motion.button>
        </div>
      )}
    </div>
  );
};

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
  
  // Verificar si el usuario es el dueño del social
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
        {/* Efectos de fondo animados */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '100px',
          height: '100px',
          background: colors.gradients.primary,
          borderRadius: '50%',
          opacity: 0.1,
          animation: 'float 3s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '60px',
          height: '60px',
          background: colors.gradients.secondary,
          borderRadius: '50%',
          opacity: 0.15,
          animation: 'float 4s ease-in-out infinite reverse'
        }} />
        
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
              boxShadow: colors.shadows.glow,
              transition: transitions.normal
            }}
          >
            🔍 Explorar Eventos
          </motion.button>
        </div>
      </div>
    );
  }

  // Obtener fotos del carrusel
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(parent.media as any, slot)?.url)
    .filter(Boolean) as string[];

  // Obtener videos
  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(parent.media as any, slot)?.url)
    .filter(Boolean) as string[];

  // Construir items para el slider de fechas
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

  // Obtener nombres de ritmos y zonas
  const getRitmoNombres = () => {
    if (!ritmos || !parent.estilos) return [];
    return parent.estilos
      .map(id => ritmos.find(ritmo => ritmo.id === id))
      .filter(Boolean)
      .map(ritmo => ritmo!.nombre);
  };

  const getZonaNombres = () => {
    if (!zonas || !parent.zonas) return [];
    return parent.zonas
      .map(id => zonas.find(zona => zona.id === id))
      .filter(Boolean)
      .map(zona => zona!.nombre);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: ${typography.fontFamily.primary};
        }
        
        .social-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, ${colors.dark[500]} 0%, ${colors.dark[400]} 100%);
        }
        
        .social-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, ${colors.primary[500]}20 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, ${colors.secondary[500]}20 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, ${colors.accent[500]}10 0%, transparent 50%);
          animation: float 6s ease-in-out infinite;
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
          padding: 2.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          backdrop-filter: blur(20px);
          transition: all 0.3s ease;
        }

        .glass-card-container:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }

        .social-hero-modern {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(11, 13, 16, 0.95), rgba(18, 22, 27, 0.9));
          padding: 5rem 3rem;
          text-align: center;
          border-radius: 32px;
          margin: 2rem auto;
          max-width: 1400px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }
        
        .social-hero-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(30, 136, 229, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(255, 61, 87, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 50% 50%, rgba(255, 140, 66, 0.08) 0%, transparent 70%);
          animation: float 8s ease-in-out infinite;
        }
        
        .social-hero-modern::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
          animation: shimmer 8s linear infinite;
        }
        
        .social-hero-content {
          position: relative;
          z-index: 2;
        }
        
        .social-hero-title {
          font-size: 4.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #1E88E5 0%, #00BCD4 50%, #FF3D57 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1.5rem;
          text-shadow: 0 0 40px rgba(30, 136, 229, 0.3);
          letter-spacing: -0.03em;
          line-height: 1.1;
        }
        
        .social-hero-description {
          font-size: 1.35rem;
          opacity: 0.95;
          max-width: 800px;
          margin: 0 auto 3rem;
          line-height: 1.7;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        
        .social-hero-actions {
          display: flex;
          gap: 1.25rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .social-hero-actions button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .social-hero-actions button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .social-hero-actions button:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .social-main-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem;
          position: relative;
          z-index: 1;
        }
        
        .social-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .social-info-section {
          padding: 2rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .social-info-section:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
          border-color: rgba(255, 255, 255, 0.25);
        }
        
        .social-info-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.98);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .social-info-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        
        .social-info-chip {
          padding: 0.625rem 1rem;
          background: linear-gradient(135deg, rgba(30, 136, 229, 0.25), rgba(255, 61, 87, 0.25));
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }
        
        .social-info-chip:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }
        
        .social-description-section {
          margin-bottom: 3rem;
          padding: 3rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          backdrop-filter: blur(20px);
        }
        
        .social-description-title {
          font-size: 2rem;
          font-weight: 900;
          margin-bottom: 1.25rem;
          background: linear-gradient(135deg, #1E88E5 0%, #FF3D57 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          letter-spacing: -0.02em;
        }
        
        .social-description-text {
          line-height: 1.8;
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.92);
          font-weight: 400;
        }
        
        .social-faq-section {
          margin-bottom: 3rem;
          padding: 3rem;
          background: linear-gradient(135deg, rgba(255, 140, 66, 0.08) 0%, rgba(255, 112, 67, 0.05) 50%, rgba(255, 255, 255, 0.08) 100%);
          border-radius: 28px;
          border: 1px solid rgba(255, 140, 66, 0.2);
          box-shadow: 0 12px 40px rgba(255, 140, 66, 0.2), 0 4px 16px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
        }
        
        .social-faq-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .social-faq-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FB8C00, #FF7043);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 0 12px 32px rgba(251, 140, 0, 0.5);
          animation: float 4s ease-in-out infinite;
        }
        
        .social-faq-title {
          font-size: 2rem;
          font-weight: 900;
          background: linear-gradient(135deg, #FF7043 0%, #FB8C00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        
        .social-faq-subtitle {
          font-size: 1rem;
          opacity: 0.85;
          margin: 0.25rem 0 0 0;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .social-faq-item {
          padding: 1.5rem 2rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          margin-bottom: 1.25rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        .social-faq-item:hover {
          transform: translateX(4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 140, 66, 0.3);
        }
        
        .social-faq-question {
          font-size: 1.25rem;
          font-weight: 800;
          margin: 0;
          margin-bottom: 0.75rem;
          color: rgba(255, 255, 255, 0.98);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .social-faq-answer {
          font-size: 1.05rem;
          opacity: 0.9;
          margin: 0;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.92);
          font-weight: 400;
        }
        
        .social-gallery-section {
          margin-bottom: 3rem;
          padding: 3rem;
          background: linear-gradient(135deg, rgba(229, 57, 53, 0.08) 0%, rgba(251, 140, 0, 0.05) 50%, rgba(255, 255, 255, 0.08) 100%);
          border-radius: 28px;
          border: 1px solid rgba(229, 57, 53, 0.2);
          box-shadow: 0 12px 40px rgba(229, 57, 53, 0.2), 0 4px 16px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
        }
        
        .social-gallery-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .social-gallery-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E53935, #FB8C00);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 0 12px 32px rgba(229, 57, 53, 0.5);
          animation: float 4s ease-in-out infinite;
        }
        
        .social-gallery-title {
          font-size: 2rem;
          font-weight: 900;
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        
        .social-gallery-subtitle {
          font-size: 1rem;
          opacity: 0.85;
          margin: 0.25rem 0 0 0;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .social-dates-section {
          margin-bottom: 3rem;
          padding: 3rem;
          background: linear-gradient(135deg, rgba(30, 136, 229, 0.12) 0%, rgba(0, 188, 212, 0.08) 50%, rgba(255, 255, 255, 0.1) 100%);
          border-radius: 28px;
          border: 1px solid rgba(30, 136, 229, 0.25);
          box-shadow: 0 12px 40px rgba(30, 136, 229, 0.25), 0 4px 16px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
        }
        
        .social-dates-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .social-dates-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1E88E5, #00BCD4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          box-shadow: 0 12px 32px rgba(30, 136, 229, 0.5);
          animation: float 4s ease-in-out infinite;
        }
        
        .social-dates-title {
          font-size: 2rem;
          font-weight: 900;
          background: linear-gradient(135deg, #1E88E5 0%, #00BCD4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        
        .social-dates-subtitle {
          font-size: 1rem;
          opacity: 0.85;
          margin: 0.25rem 0 0 0;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .social-dates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }
        
        .social-date-card {
          padding: 2rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(15px);
        }
        
        .social-date-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 16px 48px rgba(30, 136, 229, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
          border-color: rgba(30, 136, 229, 0.4);
        }
        
        .social-date-title {
          font-size: 1.35rem;
          font-weight: 800;
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.98);
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .social-date-info {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        
        .social-date-info-item {
          font-size: 0.95rem;
          color: rgba(30, 136, 229, 0.95);
          font-weight: 700;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }
        
        .social-date-info-item.gray {
          color: rgba(255, 255, 255, 0.75);
        }

        /* Responsivo móvil */
        @media (max-width: 768px) {
          .social-hero-modern {
            padding: 2rem 1rem !important;
            margin: 1rem auto !important;
            border-radius: 16px !important;
          }
          
          .social-hero-title {
            font-size: 2.5rem !important;
            line-height: 1.2 !important;
            margin-bottom: 1rem !important;
          }
          
          .social-hero-description {
            font-size: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          
          .social-hero-actions {
            flex-direction: column !important;
            align-items: center !important;
          }
          
          .social-hero-actions button {
            width: 100% !important;
            max-width: 300px !important;
            font-size: 0.9rem !important;
            padding: 12px 20px !important;
          }
          
          .social-main-content {
            padding: 1rem !important;
          }
          
          .social-info-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .social-info-section {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          
          .social-info-title {
            font-size: 1.125rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          .social-info-chips {
            justify-content: center !important;
          }
          
          .social-info-chip {
            font-size: 0.8rem !important;
            padding: 0.375rem 0.625rem !important;
          }
          
          .social-description-section {
            padding: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 16px !important;
          }
          
          .social-description-title {
            font-size: 1.5rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .social-description-text {
            font-size: 1rem !important;
          }
          
          .social-faq-section {
            padding: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 16px !important;
          }
          
          .social-faq-header {
            flex-direction: column !important;
            text-align: center !important;
            gap: 0.75rem !important;
            margin-bottom: 1rem !important;
          }
          
          .social-faq-title {
            font-size: 1.5rem !important;
          }
          
          .social-faq-item {
            padding: 0.75rem 1rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .social-faq-question {
            font-size: 1rem !important;
          }
          
          .social-faq-answer {
            font-size: 0.9rem !important;
          }
          
          .social-gallery-section {
            padding: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 16px !important;
          }
          
          .social-gallery-header {
            flex-direction: column !important;
            text-align: center !important;
            gap: 0.75rem !important;
            margin-bottom: 1rem !important;
          }
          
          .social-gallery-title {
            font-size: 1.5rem !important;
          }
          
          .social-dates-section {
            padding: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 16px !important;
          }
          
          .social-dates-header {
            flex-direction: column !important;
            text-align: center !important;
            gap: 0.75rem !important;
            margin-bottom: 1rem !important;
          }
          
          .social-dates-title {
            font-size: 1.5rem !important;
          }
          
          .social-dates-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .social-date-card {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          
          .social-date-title {
            font-size: 1rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          .glass-card-container {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            border-radius: 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          .social-hero-modern {
            padding: 1.5rem 0.75rem !important;
            border-radius: 12px !important;
          }
          
          .social-hero-title {
            font-size: 2rem !important;
          }
          
          .social-hero-description {
            font-size: 0.9rem !important;
          }
          
          .social-main-content {
            padding: 0.75rem !important;
          }
          
          .social-info-section {
            padding: 0.75rem !important;
            border-radius: 8px !important;
          }
          
          .social-info-title {
            font-size: 1rem !important;
          }
          
          .social-info-chip {
            font-size: 0.75rem !important;
            padding: 0.25rem 0.5rem !important;
          }
          
          .social-description-section {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          
          .social-description-title {
            font-size: 1.25rem !important;
          }
          
          .social-description-text {
            font-size: 0.9rem !important;
          }
          
          .social-faq-section {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          
          .social-faq-title {
            font-size: 1.25rem !important;
          }
          
          .social-faq-item {
            padding: 0.625rem 0.875rem !important;
          }
          
          .social-faq-question {
            font-size: 0.9rem !important;
          }
          
          .social-faq-answer {
            font-size: 0.8rem !important;
          }
          
          .social-gallery-section {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          
          .social-gallery-title {
            font-size: 1.25rem !important;
          }
          
          .social-dates-section {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          
          .social-dates-title {
            font-size: 1.25rem !important;
          }
          
          .social-date-card {
            padding: 0.75rem !important;
            border-radius: 8px !important;
          }
          
          .social-date-title {
            font-size: 0.9rem !important;
          }
          
          .social-date-info-item {
            font-size: 0.8rem !important;
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
        position: 'relative',
        overflow: 'hidden'
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

        {/* Hero Section */}
        <motion.div
          className="social-hero-modern"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="social-hero-content">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="social-hero-title"
            >
              {parent.nombre}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="social-hero-description"
            >
              {parent.biografia || 'Descubre más sobre este evento especial'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="social-hero-actions"
            >
              {isOwner && (
                <motion.button
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/social/${parent.id}/edit`)}
                  style={{
                    padding: '1.125rem 2.5rem',
                    borderRadius: borderRadius.full,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'linear-gradient(135deg, rgba(255,61,87,0.9), rgba(255,140,66,0.9))',
                    color: colors.gray[50],
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(255,61,87,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(20px)',
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 2 }}>✏️</span>
                  <span style={{ position: 'relative', zIndex: 2 }}>Editar Social</span>
                </motion.button>
              )}
              
              <motion.div
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <ShareButton 
                  url={window.location.href}
                  title={parent.nombre}
                  style={{
                    padding: '1.125rem 2.5rem',
                    borderRadius: borderRadius.full,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'linear-gradient(135deg, rgba(30,136,229,0.9), rgba(0,188,212,0.9))',
                    color: colors.gray[50],
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(30,136,229,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                    backdropFilter: 'blur(20px)',
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div className="social-main-content">
          {/* Información del Evento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="social-info-grid"
          >
              {/* Ritmos */}
              {(((parent as any).ritmos_seleccionados && (parent as any).ritmos_seleccionados.length > 0) || getRitmoNombres().length > 0) && (
                <div className="social-info-section">
                  <h3 className="social-info-title">
                    🎵 Ritmos
                  </h3>
                  <RitmosChips
                    selected={(parent as any).ritmos_seleccionados || []}
                    onChange={() => {}}
                  />
                </div>
              )}

              {/* Zonas */}
              {getZonaNombres().length > 0 && (
                <div className="social-info-section">
                  <h3 className="social-info-title">
                    📍 Zonas
                  </h3>
                  <div className="social-info-chips">
                    {getZonaNombres().map((zona) => (
                      <span key={zona} className="social-info-chip">
                        {zona}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </motion.div>

          {/* Descripción */}
          {parent.descripcion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="social-description-section"
            >
              <h3 className="social-description-title">
                📝 Descripción
              </h3>
              <p className="social-description-text">
                {parent.descripcion}
              </p>
            </motion.div>
          )}

          {/* Ubicaciones */}
          {(parent as any).ubicaciones && Array.isArray((parent as any).ubicaciones) && (parent as any).ubicaciones.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="social-faq-section"
            >
              <div className="social-faq-header">
                <div className="social-faq-icon">
                  ❓
                </div>
                <div>
                  <h3 className="social-faq-title">
                    Preguntas Frecuentes
                  </h3>
                  <p className="social-faq-subtitle">
                    {parent.faq.length} pregunta{parent.faq.length !== 1 ? 's' : ''} frecuente{parent.faq.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
                {parent.faq.map((faq: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="social-faq-item"
                    style={{ position: 'relative' }}
                  >
                    <h4 className="social-faq-question">
                      <span style={{ 
                        display: 'inline-flex',
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(255,140,66,0.3), rgba(255,112,67,0.3))',
                        border: '2px solid rgba(255,140,66,0.5)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '0.75rem',
                        fontSize: '1rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 12px rgba(255,140,66,0.3)',
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </span>
                      {faq.pregunta || faq.q}
                    </h4>
                    <p className="social-faq-answer">
                      {faq.respuesta || faq.a}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Galería de Fotos */}
          {carouselPhotos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="social-gallery-section"
            >
              <div className="social-gallery-header">
                <div className="social-gallery-icon">
                  📷
                </div>
                <div>
                  <h3 className="social-gallery-title">
                    Galería de Fotos
                  </h3>
                  <p className="social-gallery-subtitle">
                    {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            
              <CarouselComponent photos={carouselPhotos} />
            </motion.div>
          )}

          {/* Próximas Fechas */}
          {dates && dates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="social-dates-section"
            >
              <div className="social-dates-header">
                <div className="social-dates-icon">
                  📅
                </div>
                <div>
                  <h3 className="social-dates-title">
                    Próximas Fechas
                  </h3>
                  <p className="social-dates-subtitle">
                    {dates.length} fecha{dates.length !== 1 ? 's' : ''} programada{dates.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <DateFlyerSlider items={dateItems} onOpen={(href: string) => navigate(href)} />
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

