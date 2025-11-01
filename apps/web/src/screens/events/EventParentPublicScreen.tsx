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
import RitmosChips from "../../components/RitmosChips";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";
import AddToCalendarWithStats from "../../components/AddToCalendarWithStats";
import RSVPButtons from "../../components/rsvp/RSVPButtons";
import { useEventRSVP } from "../../hooks/useRSVP";

// Componente de Carrusel (copiado del OrganizerProfileLive)
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
        borderRadius: '16px',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(0, 0, 0, 0.1)'
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
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
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
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
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
          gap: '0.5rem',
          marginTop: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {photos.map((photo, index) => (
            <motion.button
              key={index}
              onClick={() => goToPhoto(index)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: currentIndex === index ? '3px solid #E53935' : '2px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                background: 'transparent',
                padding: 0,
                transition: 'all 0.2s'
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
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div style={{
            position: 'relative',
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

            {/* Botón de cerrar */}
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
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
                fontSize: '1.5rem',
                fontWeight: 'bold'
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

// Slider responsivo para mostrar flyers de fechas
const DateFlyerSlider: React.FC<{ items: any[]; onOpen: (href: string) => void }> = ({ items, onOpen }) => {
  const [idx, setIdx] = React.useState(0);
  if (!items?.length) return null;
  const ev = items[idx % items.length];
  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: '0.75rem' }}>
      <style>{`
        @media (max-width: 640px) {
          .dfs-wrap { width: 100% !important; max-width: 100% !important; }
          .dfs-controls { width: 100% !important; }
        }
      `}</style>
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onOpen(ev.href)}
        style={{ position: 'relative', borderRadius: 16, cursor: 'pointer', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
        className="dfs-wrap"
      >
        <div style={{ width: 360, maxWidth: '85vw' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: 'rgba(0,0,0,0.25)' }}>
            {ev.flyer && (
              <img src={ev.flyer} alt={ev.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px', background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 100%)', color: '#fff' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 6, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{ev.nombre}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: '0.85rem' }}>
                {ev.date && <span style={{ border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 999 }}>📅 {ev.date}</span>}
                {ev.time && <span style={{ border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 999 }}>🕒 {ev.time}</span>}
                {ev.place && <span style={{ border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 999 }}>📍 {ev.place}</span>}
                {ev.price && <span style={{ border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 999 }}>💰 {ev.price}</span>}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {items.length > 1 && (
        <div className="dfs-controls" style={{ width: 360, maxWidth: '85vw', display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={() => setIdx((p) => (p - 1 + items.length) % items.length)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' }}>‹ Anterior</button>
          <button type="button" onClick={() => setIdx((p) => (p + 1) % items.length)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer' }}>Siguiente ›</button>
        </div>
      )}
    </div>
  );
};

export default function EventParentPublicScreen() {
  const params = useParams<{ parentId?: string; id?: string }>();
  const parentIdParam = params.parentId ?? params.id;
  const navigate = useNavigate();
  const parentIdNum = parentIdParam ? parseInt(parentIdParam) : undefined;

  const { data: parent, isLoading } = useEventParent(parentIdNum);
  const { data: dates } = useEventDatesByParent(parentIdNum);
  const { data: ritmos } = useTags('ritmo');
  const { data: zonas } = useTags('zona');
  const { data: organizer } = useMyOrganizer();

  // Verificar si el usuario es el dueño del social
  const isOwner = organizer?.id === parent?.organizer_id;

  // Próxima fecha (si existe)
  const nextDate = Array.isArray(dates) && dates.length > 0 ? dates[0] as any : undefined;
  const nextDateId = nextDate?.id as number | undefined;
  const rsvp = useEventRSVP(nextDateId);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.darkBase}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
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
          background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.1), rgba(30, 136, 229, 0.1))',
          borderRadius: '50%',
          animation: 'float 3s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1), rgba(255, 140, 66, 0.1))',
          borderRadius: '50%',
          animation: 'float 4s ease-in-out infinite reverse'
        }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ fontSize: '3rem', marginBottom: '1rem' }}
          >
            ⏳
          </motion.div>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>Cargando social...</p>
        </div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.darkBase}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            Social no encontrado
          </h2>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>
            El social que buscas no existe o no está disponible
          </p>
          <button
            onClick={() => navigate('/explore')}
            style={{
              padding: '14px 28px',
              borderRadius: '50px',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            🔍 Explorar Eventos
          </button>
        </div>
      </div>
    );
  }

  const getRitmoName = (id: number) => {
    return ritmos?.find(r => r.id === id)?.nombre || `Ritmo ${id}`;
  };

  const getZonaName = (id: number) => {
    return zonas?.find(z => z.id === id)?.nombre || `Zona ${id}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
    return { nombre: d.nombre || parent?.nombre, date: formatDate(d.fecha), time: hora, place: d.lugar || d.ciudad || '', flyer, price, href: `/social/fecha/${d.id}` };
  });

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        
        .glass-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .shimmer-effect {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        .social-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem 4rem;
        }
        
        .social-header {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(18, 18, 18, 0.86), rgba(18, 18, 18, 0.6));
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 32px;
          border: 1px solid rgba(245, 245, 245, 0.13);
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        }
        .social-header::before {
          content: '';
          position: absolute;
          top: -20%;
          left: -10%;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle at center, rgba(30, 136, 229, 0.18), transparent 60%);
          filter: blur(6px);
          border-radius: 50%;
        }
        .social-header::after {
          content: '';
          position: absolute;
          bottom: -15%;
          right: -10%;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle at center, rgba(255, 61, 87, 0.16), transparent 60%);
          filter: blur(6px);
          border-radius: 50%;
        }
        
        .social-header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        
        .social-title-section {
          flex: 1;
        }
        
        .social-actions {
          margin-left: 24px;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .social-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .social-section {
          background: rgba(18, 18, 18, 0.4);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid rgba(245, 245, 245, 0.13);
        }
        
        .social-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .social-gallery {
          margin-bottom: 2rem;
          padding: 2.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 24px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .social-gallery-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .social-gallery-count {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, rgba(229, 57, 53, 0.2), rgba(251, 140, 0, 0.2));
          border-radius: 25px;
          font-size: 1rem;
          font-weight: 700;
          color: #F5F5F5;
          border: 1px solid rgba(229, 57, 53, 0.3);
          box-shadow: 0 4px 16px rgba(229, 57, 53, 0.2);
          backdrop-filter: blur(10px);
        }
        
        .social-video-gallery {
          margin-bottom: 2rem;
          padding: 2.5rem;
          background: linear-gradient(135deg, rgba(30, 136, 229, 0.1) 0%, rgba(0, 188, 212, 0.05) 50%, rgba(255, 255, 255, 0.08) 100%);
          border-radius: 24px;
          border: 2px solid rgba(30, 136, 229, 0.2);
          box-shadow: 0 12px 40px rgba(30, 136, 229, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
        }
        
        .social-video-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .social-video-item {
          aspect-ratio: 16/9;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid rgba(30, 136, 229, 0.3);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          background: rgba(0, 0, 0, 0.1);
          box-shadow: 0 8px 32px rgba(30, 136, 229, 0.2), 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        
        .social-video-label {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, rgba(30, 136, 229, 0.9), rgba(0, 188, 212, 0.9));
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          box-shadow: 0 4px 16px rgba(30, 136, 229, 0.3);
          backdrop-filter: blur(10px);
        }

        /* Responsivo móvil */
        @media (max-width: 768px) {
          .social-container {
            padding: 0 1rem 2rem !important;
          }
          
          .social-header {
            padding: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 16px !important;
          }
          
          .social-header-content {
            flex-direction: column !important;
            gap: 1rem !important;
            margin-bottom: 1rem !important;
          }
          
          .social-title-section {
            width: 100% !important;
          }
          
          .social-actions {
            margin-left: 0 !important;
            width: 100% !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
          }
          
          .social-actions button {
            flex: 1 !important;
            min-width: 0 !important;
            font-size: 0.9rem !important;
            padding: 10px 16px !important;
          }
          
          .social-header h1 {
            font-size: 2rem !important;
            line-height: 1.2 !important;
            margin-bottom: 0.75rem !important;
          }
          
          .social-header p {
            font-size: 1rem !important;
            margin-bottom: 0.75rem !important;
          }
          
          .social-chips {
            justify-content: center !important;
            margin-bottom: 1rem !important;
          }
          
          .social-chips span {
            font-size: 0.8rem !important;
            padding: 6px 12px !important;
          }
          
          .social-section {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 12px !important;
          }
          
          .social-section-header {
            flex-direction: column !important;
            gap: 1rem !important;
            align-items: stretch !important;
            margin-bottom: 1rem !important;
          }
          
          .social-section-header h2 {
            font-size: 1.5rem !important;
            text-align: center !important;
          }
          
          .social-section-header button {
            width: 100% !important;
            font-size: 0.9rem !important;
            padding: 10px 16px !important;
          }
          
          .social-gallery {
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
          
          .social-gallery-header h3 {
            font-size: 1.5rem !important;
          }
          
          .social-gallery-count {
            font-size: 0.9rem !important;
            padding: 0.5rem 1rem !important;
          }
          
          .social-video-gallery {
            padding: 1.5rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 16px !important;
          }
          
          .social-video-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .glass-card {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
          }
          
          .dfs-wrap {
            width: 100% !important;
            max-width: 100% !important;
          }
          
          .dfs-controls {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
        
        @media (max-width: 480px) {
          .social-container {
            padding: 0 0.75rem 1.5rem !important;
          }
          
          .social-header {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          
          .social-header h1 {
            font-size: 1.75rem !important;
          }
          
          .social-header p {
            font-size: 0.9rem !important;
          }
          
          .social-chips span {
            font-size: 0.75rem !important;
            padding: 4px 8px !important;
          }
          
          .social-section {
            padding: 0.75rem !important;
            border-radius: 8px !important;
          }
          
          .social-section-header h2 {
            font-size: 1.25rem !important;
          }
          
          .social-gallery {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          
          .social-gallery-header h3 {
            font-size: 1.25rem !important;
          }
          
          .social-video-gallery {
            padding: 1rem !important;
            border-radius: 12px !important;
          }
          
          .glass-card {
            padding: 0.75rem !important;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.darkBase}, #0f0f23, #1a1a2e)`,
        color: colors.light,
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* Contenido Principal */}
        <div className="social-container">
          {/* Navegación de Secciones */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              marginBottom: '3rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1rem',
              color: colors.light,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #FF3D57, #1E88E5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              📋 Información del Social
            </h2>
            <p style={{
              textAlign: 'center',
              opacity: 0.8,
              fontSize: '1rem',
              margin: 0
            }}>
              Toda la información que necesitas saber sobre este social
            </p>
          </motion.div> */}

          {/* Header Mejorado */}
          <div className="social-header">
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
              {/* Columna izquierda */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(-1)}
                    style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ← Volver
                  </motion.button>
                  {(((parent as any)?.profiles_organizer?.estado_aprobacion === 'aprobado') || ((parent as any)?.estado_aprobacion === 'aprobado')) && (
                    <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(46, 204, 113, 0.18)', border: '1px solid rgba(46,204,113,0.35)', color: '#2ecc71', fontWeight: 800, fontSize: 12 }}>✅ Verificado</span>
                  )}
                </div>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, marginBottom: 10, color: '#fff', lineHeight: 1.2 }}>{parent.nombre}</h1>
                {parent.descripcion && (
                  <p style={{ margin: 0, marginBottom: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{parent.descripcion}</p>
                )}
                {nextDate && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', padding: '6px 10px', borderRadius: 999, fontSize: 12, color: '#fff' }}>📅 {new Date(nextDate.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
                    {(nextDate.hora_inicio || nextDate.hora_fin) && (
                      <span style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', padding: '6px 10px', borderRadius: 999, fontSize: 12, color: '#fff' }}>🕒 {nextDate.hora_inicio || ''}{nextDate.hora_fin ? ` - ${nextDate.hora_fin}` : ''}</span>
                    )}
                  </div>
                )}
                {nextDate && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <RSVPButtons currentStatus={rsvp.userStatus} onStatusChange={rsvp.toggleInterested} disabled={rsvp.isUpdating} />
                    <AddToCalendarWithStats
                      eventId={nextDate.id}
                      title={nextDate.nombre || parent.nombre}
                      description={nextDate.biografia || parent.descripcion}
                      location={nextDate.lugar || nextDate.ciudad || nextDate.direccion}
                      start={(() => { try { const f = nextDate.fecha?.split('T')[0]; const hi = (nextDate.hora_inicio || '20:00').slice(0,5); return new Date(`${f}T${hi}:00`); } catch { return new Date(); } })()}
                      end={(() => { try { const f = nextDate.fecha?.split('T')[0]; const hf = (nextDate.hora_fin || nextDate.hora_inicio || '23:59').slice(0,5); return new Date(`${f}T${hf}:00`); } catch { const d = new Date(); d.setHours(d.getHours()+2); return d; } })()}
                      showAsIcon={false}
                    />
                  </div>
                )}
              </div>
              {/* Columna derecha */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                  <ShareButton url={typeof window !== 'undefined' ? window.location.href : ''} title={parent.nombre} />
                </div>
                {nextDate && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {(Array.isArray(nextDate.cronograma) && nextDate.cronograma.length > 0) && (
                      <div style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', borderRadius: 12, color: '#fff' }}>
                        <div style={{ fontWeight: 800, marginBottom: 6 }}>📅 Cronograma</div>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>{nextDate.cronograma.length} elemento{nextDate.cronograma.length !== 1 ? 's' : ''}</div>
                      </div>
                    )}
                    {(Array.isArray(nextDate.costos) && nextDate.costos.length > 0) && (
                      <div style={{ padding: '10px 12px', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', borderRadius: 12, color: '#fff' }}>
                        <div style={{ fontWeight: 800, marginBottom: 6 }}>💰 Costos y Promociones</div>
                        <div style={{ fontSize: 13, opacity: 0.9 }}>{nextDate.costos.length} opción{nextDate.costos.length !== 1 ? 'es' : ''}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ubicación y Requisitos (compacto) */}
          {nextDate && (nextDate.lugar || nextDate.direccion || nextDate.ciudad || nextDate.requisitos) && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="social-section"
              style={{ padding: 16, marginBottom: 16, borderRadius: 14 }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, marginBottom: 10, color: '#fff' }}>📍 Ubicación y Requisitos</h3>
              {(nextDate.lugar || nextDate.ciudad || nextDate.direccion) && (
                <div style={{ marginBottom: nextDate.requisitos ? 8 : 0, color: 'rgba(255,255,255,0.92)' }}>
                  {[nextDate.lugar, nextDate.direccion, nextDate.ciudad].filter(Boolean).join(' • ')}
                </div>
              )}
              {nextDate.requisitos && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>📋 {nextDate.requisitos}</div>
              )}
            </motion.section>
          )}

          {/* Flyer del evento (compacto) */}
          {nextDate?.flyer_url && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="social-section"
              style={{ padding: 16, marginBottom: 16, borderRadius: 14 }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, marginBottom: 10, color: '#fff' }}>🖼️ Flyer del Evento</h3>
              <div style={{ display: 'grid', placeItems: 'center' }}>
                <img src={nextDate.flyer_url} alt={`Flyer de ${nextDate.nombre || parent.nombre}`} style={{ width: '100%', maxWidth: 420, borderRadius: 12, boxShadow: '0 10px 28px rgba(0,0,0,0.35)', aspectRatio: '4 / 5', objectFit: 'cover' }} />
              </div>
            </motion.section>
          )}

          {/* FAQ Section - Estilo Organizer */}
          {parent.faq && parent.faq.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card"
              style={{
                marginBottom: '2rem',
                padding: '2rem',
                borderRadius: '20px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FB8C00, #FF7043)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  boxShadow: '0 8px 24px rgba(251, 140, 0, 0.4)'
                }}>
                  ❓
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.75rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #FF7043 0%, #FB8C00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0,
                    lineHeight: 1.2
                  }}>
                    Información para Asistentes
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    opacity: 0.8,
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    Preguntas frecuentes
                  </p>
                </div>
              </div>
              {/* Sede General */}
              {parent.sede_general && (
                <div style={{
                  padding: '16px',
                  background: `${colors.light}11`,
                  borderRadius: '12px',
                  border: `1px solid ${colors.light}22`,
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: colors.light,
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    📍 Ubicación
                  </h3>
                  <p style={{
                    fontSize: '1rem',
                    color: colors.light,
                    opacity: 0.9,
                    margin: 0,
                  }}>
                    {parent.sede_general}
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {parent.faq.map((faq: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    style={{
                      padding: '1rem 1.25rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    <h4 style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      margin: 0,
                      marginBottom: '0.5rem'
                    }}>
                      {faq.q}
                    </h4>
                    <p style={{
                      fontSize: '1rem',
                      opacity: 0.85,
                      margin: 0,
                      lineHeight: 1.6
                    }}>
                      {faq.a}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Fechas Section */}
          <div className="social-section">
            <div className="social-section-header">
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: '600',
                color: colors.light,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                📅 Fechas Disponibles
              </h2>
{/* Agregar nueva fecha */}
              <button
                onClick={() => navigate(`/social/${parentIdNum}/fecha/nueva`)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '25px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                  color: colors.light,
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ➕ Agregar Fecha
              </button>
            </div>

            {dates && dates.length > 0 ? (
              <>
                <DateFlyerSlider items={dateItems} onOpen={(href: string) => navigate(href)} />
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.light,
                opacity: 0.6,
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
                <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
                  No hay fechas programadas aún
                </p>
                <p style={{ fontSize: '0.9rem' }}>
                  Haz clic en "Agregar Fecha" para crear la primera
                </p>
              </div>
            )}
          </div>

          {/* Galería de Fotos del Social */}
          {(() => {
            // Obtener fotos del carrusel usando los media slots
            const carouselPhotos = PHOTO_SLOTS
              .map(slot => getMediaBySlot(parent.media as any, slot)?.url)
              .filter(Boolean) as string[];

            return carouselPhotos.length > 0 && (
              <motion.section
                id="social-photo-gallery"
                data-test-id="social-photo-gallery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="social-gallery"
              >
                <div style={{
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div className="social-gallery-header">
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)'
                    }}>
                      📷
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '1.75rem',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        margin: 0,
                        lineHeight: 1.2
                      }}>
                        Galería de Fotos
                      </h3>
                      <p style={{
                        fontSize: '0.9rem',
                        opacity: 0.8,
                        margin: 0,
                        fontWeight: '500'
                      }}>
                        Fotos del social
                      </p>
                    </div>
                    <div className="social-gallery-count">
                      {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <CarouselComponent photos={carouselPhotos} />
                </div>
              </motion.section>
            );
          })()}

          {/* Sección de Videos del Social */}
          {(() => {
            // Obtener videos
            const videos = VIDEO_SLOTS
              .map(slot => getMediaBySlot(parent.media as any, slot)?.url)
              .filter(Boolean) as string[];

            return videos.length > 0 && (
              <motion.section
                id="social-video-gallery"
                data-test-id="social-video-gallery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="social-video-gallery"
              >
                <div style={{
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '2rem'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      boxShadow: '0 8px 24px rgba(30, 136, 229, 0.4)'
                    }}>
                      🎥
                    </div>
                    <div>
                      <h3 style={{
                        fontSize: '1.75rem',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #1E88E5 0%, #00BCD4 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        margin: 0,
                        lineHeight: 1.2
                      }}>
                        Videos del Social
                      </h3>
                      <p style={{
                        fontSize: '0.9rem',
                        opacity: 0.8,
                        margin: 0,
                        fontWeight: '500'
                      }}>
                        Videos promocionales y demostraciones
                      </p>
                    </div>
                    <div style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.2), rgba(0, 188, 212, 0.2))',
                      borderRadius: '25px',
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: colors.light,
                      border: '1px solid rgba(30, 136, 229, 0.3)',
                      boxShadow: '0 4px 16px rgba(30, 136, 229, 0.2)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {videos.length} video{videos.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="social-video-grid">
                    {videos.map((video, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{
                          scale: 1.05,
                          y: -8,
                          boxShadow: '0 16px 40px rgba(30, 136, 229, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3)'
                        }}
                        className="social-video-item"
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
                        <div className="social-video-label">
                          🎥 Video {index + 1}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.section>
            );
          })()}
        </div>
      </div>
    </>
  );
}