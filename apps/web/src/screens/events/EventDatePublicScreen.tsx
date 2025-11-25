import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEventDate } from "../../hooks/useEventDate";
import { useEventParent } from "../../hooks/useEventParent";
import { useTags } from "../../hooks/useTags";
import { useEventRSVP } from "../../hooks/useRSVP";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useAuth } from "@/contexts/AuthProvider";
import { motion } from "framer-motion";
import ShareButton from "../../components/events/ShareButton";
import RSVPButtons from "../../components/rsvp/RSVPButtons";
import ImageWithFallback from "../../components/ImageWithFallback";
import AddToCalendarWithStats from "../../components/AddToCalendarWithStats";
import RequireLogin from "@/components/auth/RequireLogin";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import RitmosChips from "../../components/RitmosChips";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import SeoHead from "@/components/SeoHead";
import { SEO_BASE_URL, SEO_LOGO_URL } from "@/lib/seoConfig";
import { calculateNextDateWithTime } from "../../utils/calculateRecurringDates";
import { FaWhatsapp } from "react-icons/fa";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

function buildWhatsAppUrl(phone?: string | null, message?: string | null) {
  if (!phone) return undefined;
  const cleanedPhone = phone.replace(/[^\d]/g, ''); // usar solo dígitos en el número
  if (!cleanedPhone) return undefined;

  const text = typeof message === 'string' ? message : '';
  const trimmed = text.trim();

  // Si no hay mensaje guardado, solo abrimos el chat sin texto prellenado
  if (!trimmed) {
    return `https://wa.me/${cleanedPhone}`;
  }

  const encoded = encodeURIComponent(trimmed);
  return `https://wa.me/${cleanedPhone}?text=${encoded}`;
}

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

export default function EventDatePublicScreen() {
  const params = useParams<{ dateId?: string; id?: string }>();
  const dateIdParam = params.dateId ?? params.id;
  const navigate = useNavigate();
  const dateIdNum = dateIdParam ? parseInt(dateIdParam) : undefined;

  const { user } = useAuth();
  const { data: date, isLoading } = useEventDate(dateIdNum);
  const { data: parent } = useEventParent(date?.parent_id);
  const { data: myOrganizer } = useMyOrganizer();
  const { data: ritmos } = useTags('ritmo');
  const { data: zonas } = useTags('zona');

  // Verificar si el usuario es propietario
  const isOwner = React.useMemo(() => {
    if (!user || !myOrganizer || !parent) return false;

    // Comparar user_id del organizador con user_id del parent
    const organizerUserId = (myOrganizer as any).user_id;
    const parentUserId = (parent as any).user_id;

    return organizerUserId === parentUserId;
  }, [user, myOrganizer, parent]);

  // Hook de RSVP
  const {
    userStatus,
    stats,
    toggleInterested,
    isUpdating
  } = useEventRSVP(dateIdNum);

  const interestedCount = (() => {
    try {
      const anyStats: any = stats as any;
      // our RPC returns { interesado, total }
      const val = anyStats?.interesado ?? anyStats?.interested ?? anyStats?.count ?? anyStats?.total ?? 0;
      return typeof val === 'number' ? val : parseInt(String(val || 0), 10) || 0;
    } catch {
      return 0;
    }
  })();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Cargando fecha...</p>
        </div>
      </div>
    );
  }

  if (!date) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            Fecha no encontrada
          </h2>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>
            La fecha que buscas no existe o no está disponible
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
    if (!dateStr) return '';
    const safeDate = (() => {
      const plain = String(dateStr).split('T')[0];
      const [year, month, day] = plain.split('-').map((part) => parseInt(part, 10));
      if (
        Number.isFinite(year) &&
        Number.isFinite(month) &&
        Number.isFinite(day)
      ) {
        // Colocar el día a mediodía en UTC para evitar desfases al formatear en CDMX
        return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      }
      const parsed = new Date(dateStr);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    })();

    return safeDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Mexico_City'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const segments = timeStr.split(':');
    const hours = segments[0] ?? '00';
    const minutes = segments[1] ?? '00';
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  const dateName = date.nombre || parent?.nombre || 'Fecha de baile';
  const formattedDate = formatDate(date.fecha || date.fecha_inicio || '');
  const locationName = date.lugar || date.ciudad || (parent as any)?.ciudad || getZonaName((date.zonas || [])[0]) || 'México';
  const ritmosList = Array.isArray(date.ritmos)
    ? date.ritmos.map((id: number) => getRitmoName(id)).slice(0, 3).join(', ')
    : '';
  const seoDescription = `${dateName} el ${formattedDate}${locationName ? ` en ${locationName}` : ''}${ritmosList ? ` · Ritmos: ${ritmosList}` : ''}.`;
  const seoImage =
    date.flyer_url ||
    getMediaBySlot(date.media as any, 'p1')?.url ||
    getMediaBySlot(parent?.media as any, 'p1')?.url ||
    SEO_LOGO_URL;
  const dateUrl = `${SEO_BASE_URL}/social/fecha/${dateIdParam ?? date.id}`;

  return (
    <>
      <SeoHead
        section="event"
        title={`${dateName} | ${formattedDate}`}
        description={seoDescription}
        image={seoImage}
        url={dateUrl}
        keywords={[
          dateName,
          formattedDate,
          locationName,
          ritmosList,
          'evento de baile',
          'Dónde Bailar',
        ].filter(Boolean) as string[]}
      />
      <div className="date-public-root" style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)`,
        padding: '24px 0',
      }}>
        <style>{`
        .date-public-root { padding: 24px 0; }
        .date-public-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        
        /* Responsividad general */
        @media (max-width: 768px) {
          .date-public-root { padding: 16px 0 !important; }
          .date-public-inner { padding: 0 16px !important; }
          .two-col-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
        }
        
        @media (max-width: 480px) {
          .date-public-root { padding: 12px 0 !important; }
          .date-public-inner { padding: 0 12px !important; }
        }
        
        /* Responsividad de secciones */
        @media (max-width: 768px) {
          .social-header-card {
            padding: 1rem !important;
          }
          
          .social-header-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .chip {
            font-size: 0.85rem !important;
            padding: 0.4rem 0.7rem !important;
          }
          
          .event-card {
            padding: 8px 12px 10px !important;
            border-radius: 18px !important;
          }
          .event-card__body {
            padding: 6px 8px !important;
            border-radius: 14px !important;
          }
          .event-title {
            -webkit-line-clamp: 2 !important;
            line-height: 1.25 !important;
          }
          
          /* RSVP Section Responsive */
          .rsvp-section {
            padding: 1.25rem !important;
            margin-bottom: 1.25rem !important;
          }
          
          .rsvp-grid {
            gap: 0.85rem !important;
          }
          
          .card {
            padding: 0.85rem !important;
          }
          
          .headline {
            font-size: 1.1rem !important;
          }
          
          .cta-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .cta-row > * {
            width: 100% !important;
          }
        }
        
        @media (max-width: 480px) {
          .social-header-card {
            padding: 0.85rem !important;
          }
          
          h1 {
            font-size: 1.5rem !important;
          }
          
          .chip {
            font-size: 0.8rem !important;
            padding: 0.35rem 0.6rem !important;
          }
          
          /* RSVP Section Mobile */
          .rsvp-section {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            border-radius: 16px !important;
          }
          
          .card {
            padding: 0.75rem !important;
            border-radius: 12px !important;
          }
          
          .headline {
            font-size: 1rem !important;
          }
          
          .subtle {
            font-size: 0.8rem !important;
          }
        }
      `}</style>
        <div className="date-public-inner">


          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="social-header"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <style>{`
    .social-header-card {
      position: relative;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(40,30,45,0.92), rgba(30,20,40,0.92));
      border: 1px solid rgba(240,147,251,0.18);
      box-shadow: 0 10px 28px rgba(0,0,0,0.35);
      padding: 1.25rem 1.25rem 1rem;
    }
    .social-header-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
    @media (min-width: 768px) {
       .social-header-grid { grid-template-columns: 1.3fr 1fr; }
    }
    .event-title {
      margin: 0;
      font-size: clamp(2.1rem, 4vw, 3rem);
      line-height: 1.2;
      font-weight: 900;
      letter-spacing: -0.01em;
      color: rgb(255, 255, 255);
      text-transform: none;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-word;
      text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px,
                   rgba(0, 0, 0, 0.6) 0px 0px 8px,
                   rgba(0, 0, 0, 0.8) -1px -1px 0px,
                   rgba(0, 0, 0, 0.8) 1px -1px 0px,
                   rgba(0, 0, 0, 0.8) -1px 1px 0px,
                   rgba(0, 0, 0, 0.8) 1px 1px 0px;
    }
    .chip {
      display:inline-flex;
      align-items:center;
      gap:.45rem;
      padding:.55rem .95rem;
      border-radius:12px;
      font-weight:700;
      font-size:.92rem;
      background:rgba(255,255,255,0.05);
      border:1.5px solid rgba(255,255,255,0.12);
      color:#f4f4f5;
      box-shadow:0 6px 18px rgba(0,0,0,0.18);
      backdrop-filter: blur(8px);
      transition: all 0.2s ease;
    }
    .chip-date { 
      background:linear-gradient(135deg, rgba(240,147,251,.18), rgba(152,71,255,0.16));
      border-color:rgba(240,147,251,.38);
      color:#f5d6ff;
    }
    .chip-time { 
      background:linear-gradient(135deg, rgba(255,209,102,.18), rgba(255,159,67,0.14));
      border-color:rgba(255,209,102,.38);
      color:#FFE6A8;
    }
    .chip-location {
      background:linear-gradient(135deg, rgba(30,136,229,0.14), rgba(0,188,212,0.1));
      border-color:rgba(30,136,229,0.32);
      color:#d4f0ff;
    }
    .chip-whatsapp {
      background: linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.16));
      border-color: rgba(34,197,94,0.38);
      color: #bbf7d0;
    }
    .chip-link {
      text-decoration: none;
      color: inherit;
    }
    .chip-link:hover {
      transform: translateY(-2px);
      box-shadow:0 10px 26px rgba(240,147,251,.28);
    }
    /* Event Cards - Nuevo diseño */
    .event-section-dance {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 100%;
    }
    .event-card {
      border-radius: 22px;
      border: 1px solid rgba(38, 34, 58, 0.8);
      background: radial-gradient(circle at top, rgba(36, 28, 58, 0.95) 0%, rgba(18, 13, 34, 0.95) 50%, rgba(7, 5, 19, 0.95) 100%);
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.7);
      padding: 10px 14px 12px;
      transition: all 0.16s ease;
    }
    .event-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 22px 50px rgba(0, 0, 0, 0.8);
    }
    .event-card--cost {
      background: radial-gradient(circle at top, rgba(43, 25, 55, 0.95) 0%, rgba(18, 11, 33, 0.95) 45%, rgba(7, 5, 19, 0.95) 100%);
    }
    .event-card__header {
      padding-bottom: 8px;
    }
    .event-card__title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .event-card__icon {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.35);
      font-size: 14px;
    }
    .event-card__title span:first-of-type + div > span {
      font-size: 15px;
      font-weight: 700;
      color: #f7f5ff;
    }
    .event-card__body {
      border-radius: 18px;
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(19, 15, 37, 0.95));
      border: 1px solid rgba(38, 34, 58, 0.8);
      padding: 8px 10px;
    }
    .event-card__body--cost {
      background: linear-gradient(145deg, rgba(23, 18, 40, 0.95), rgba(16, 10, 31, 0.95));
    }
    /* Event Rows - Cronograma */
    .event-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 4px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      transition: all 0.16s ease;
    }
    .event-row:last-child {
      border-bottom: none;
    }
    .event-row:hover {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
    }
    .event-row__left {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      flex: 1;
    }
    .event-row__info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .event-row__title {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: #f7f5ff;
    }
    .event-row__subtitle {
      margin: 1px 0 0;
      font-size: 11px;
      color: rgba(166, 162, 194, 0.8);
    }
    .event-row__right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
    }
    .event-row__time {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 9px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(148, 163, 184, 0.5);
      color: #f7f5ff;
      white-space: nowrap;
    }
    /* Cost Rows */
    .cost-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 7px 2px;
      font-size: 13px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      transition: all 0.16s ease;
    }
    .cost-row:last-child {
      border-bottom: none;
    }
    .cost-row:hover {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 12px;
    }
    .cost-row__label {
      color: #f7f5ff;
      font-weight: 500;
    }
    .cost-row__pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      border: 1px solid rgba(59, 53, 83, 0.8);
      background: rgba(29, 22, 48, 0.9);
      padding: 4px 10px;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35);
    }
    .cost-row__pill-tag {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(166, 162, 194, 0.8);
    }
    .cost-row__pill-price {
      font-weight: 700;
      color: #facc6b;
    }
    .cost-row__pill--highlight {
      background: linear-gradient(120deg, #fb7185, #f97316);
      border-color: transparent;
    }
    .cost-row__pill--highlight .cost-row__pill-tag {
      color: #0f0a14;
    }
    .cost-row__pill--highlight .cost-row__pill-price {
      color: #111827;
    }
    .cost-row--free .cost-row__label {
      font-weight: 600;
    }
    .cost-row__pill--free {
      background: rgba(34, 197, 94, 0.15);
      border-color: #4ade80;
      color: #4ade80;
      font-weight: 700;
      padding: 4px 12px;
    }
    /* Responsive */
    @media (max-width: 640px) {
      .event-row {
        flex-direction: column;
        align-items: flex-start;
      }
      .event-row__right {
        align-items: flex-start;
      }
    }
  `}</style>

            <div className="social-header-card">
              <div className="social-header-grid">
                {/* Columna izquierda */}
                <div style={{ display: 'grid', gap: '.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => navigate('/explore')}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 999,
                        border: '1px solid rgba(240,147,251,0.28)',
                        background: 'rgba(240,147,251,0.10)',
                        color: '#f093fb',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ← Volver
                    </button>
                  </div>

                  <h1 className="event-title">
                    {date.nombre || `Fecha: ${formatDate(date.fecha)}`}
                  </h1>

                  {date.biografia && (
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: '1rem', lineHeight: 1.5 }}>
                      {date.biografia}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="chip chip-date">📅 {formatDate(date.fecha)}</span>
                    {date.hora_inicio && (
                      <span className="chip chip-time">
                        🕐 {formatTime(date.hora_inicio)}{date.hora_fin ? ` — ${formatTime(date.hora_fin)}` : ''}
                      </span>
                    )}
                    {date.lugar && (
                      <a
                        className="chip chip-location chip-link"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${date.lugar ?? ''} ${date.direccion ?? ''} ${date.ciudad ?? ''}`.trim()
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📍 {date.lugar}
                      </a>
                    )}
                    {date.telefono_contacto && (
                      <a
                        className="chip chip-whatsapp chip-link"
                        href={buildWhatsAppUrl(
                          (date as any).telefono_contacto,
                          (date as any).mensaje_contacto ?? null
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaWhatsapp size={18} />
                      </a>
                    )}
                  </div>

                  {/* Ritmos & Zonas (zonas agrupadas en chips padres colapsables) */}
                  {(Array.isArray(date.ritmos) && date.ritmos.length > 0) || (Array.isArray(date.zonas) && date.zonas.length > 0) ? (
                    <div style={{ marginTop: '.75rem' }}>
                      {Array.isArray(date.ritmos) && date.ritmos.length > 0 && (
                        <div style={{ marginBottom: '.5rem' }}>
                          <RitmosChips
                            selected={date.ritmos.map((id: number) => String(id))}
                            onChange={() => { }}
                            readOnly
                          />
                        </div>
                      )}
                      {Array.isArray(date.zonas) && date.zonas.length > 0 && zonas && (
                        <ZonaGroupedChips
                          mode="display"
                          selectedIds={date.zonas as number[]}
                          allTags={zonas as any}
                          autoExpandSelectedParents={false}
                        />
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Columna derecha */}
                <div style={{ display: 'grid', gap: '.85rem', alignContent: 'start' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.5rem', flexWrap: 'wrap' }}>
                    {isOwner && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/social/fecha/${dateIdNum}/edit`)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 999,
                          border: '1px solid rgba(30,136,229,0.4)',
                          background: 'linear-gradient(135deg, rgba(30,136,229,0.2), rgba(0,188,212,0.2))',
                          color: '#1E88E5',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 12px rgba(30,136,229,0.2)'
                        }}
                      >
                        ✏️ Editar
                      </motion.button>
                    )}
                    <ShareButton
                      url={typeof window !== 'undefined' ? window.location.href : ''}
                      title={date.nombre || `Fecha: ${formatDate(date.fecha)}`}
                      text={`¡Mira esta fecha: ${date.nombre || formatDate(date.fecha)}!`}
                    />
                  </div>

                  <div className="event-section-dance">
                    {Array.isArray(date.cronograma) && date.cronograma.length > 0 && (
                      <article className="event-card event-card--schedule">
                        <header className="event-card__header">
                          <div className="event-card__title">
                            <span className="event-card__icon">🗓️</span>
                            <div>
                              <span>Cronograma</span>
                            </div>
                          </div>
                        </header>
                        <div className="event-card__body">
                          {date.cronograma.slice(0, 4).map((it: any, i: number) => (
                            <div key={i} className="event-row">
                              <div className="event-row__left">
                                <div className="event-row__info">
                                  <p className="event-row__title">{it.titulo || it.tipo}</p>
                                  {it.instructor && (
                                    <p className="event-row__subtitle">por {it.instructor}</p>
                                  )}
                                </div>
                              </div>
                              <div className="event-row__right">
                                <span className="event-row__time">
                                  {it.inicio}{it.fin ? ` – ${it.fin}` : ''}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </article>
                    )}

                    {Array.isArray(date.costos) && date.costos.length > 0 && (
                      <article className="event-card event-card--cost">
                        <header className="event-card__header">
                          <div className="event-card__title">
                            <span className="event-card__icon">💰</span>
                            <div>
                              <span>Costos</span>
                            </div>
                          </div>
                        </header>
                        <div className="event-card__body event-card__body--cost">
                          {date.costos.slice(0, 4).map((c: any, i: number) => {
                            const isFree = c.precio === 0 || c.precio === null || c.precio === undefined;
                            const isHighlight = c.tipo === 'taquilla' || c.tipo === 'puerta' || c.nombre?.toLowerCase().includes('puerta');
                            return (
                              <div key={i} className={`cost-row ${isFree ? 'cost-row--free' : ''}`}>
                                <span className="cost-row__label">{c.nombre || c.tipo}</span>
                                {isFree ? (
                                  <span className="cost-row__pill cost-row__pill--free">Gratis</span>
                                ) : (
                                  <span className={`cost-row__pill ${isHighlight ? 'cost-row__pill--highlight' : ''}`}>
                                    <span className="cost-row__pill-tag">
                                      {c.tipo === 'preventa' || c.tipo === 'online' ? 'Online' : c.tipo === 'taquilla' || c.tipo === 'puerta' ? 'En puerta' : c.tipo || 'General'}
                                    </span>
                                    <span className="cost-row__pill-price">
                                      ${c.precio.toLocaleString()}
                                    </span>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.header>

          {/* RSVP Y CALENDARIO - Ahora primero con fondo CTA */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            aria-label="Asistencia y calendario"
            className="rsvp-section"
            style={{
              padding: '1.5rem',
              marginBottom: '1.5rem',
              borderRadius: 20,
              border: '2px solid rgba(30,136,229,0.3)',
              background: 'linear-gradient(135deg, rgba(30,136,229,0.15) 0%, rgba(0,188,212,0.12) 50%, rgba(240,147,251,0.10) 100%)',
              boxShadow: '0 12px 32px rgba(30,136,229,0.25), 0 4px 16px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(16px)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Efecto de brillo CTA */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 50%, rgba(30,136,229,0.15) 0%, transparent 60%)',
              pointerEvents: 'none'
            }} />

            <style>{`
     .rsvp-grid { 
       display:grid; 
       grid-template-columns: 1fr; 
       gap: 1rem; 
       align-items:center; 
       position: relative; 
       z-index: 1; 
     }
     
    .card { 
      border-radius:14px; 
      padding:1rem; 
      background:rgba(255,255,255,0.04); 
      border:1px solid rgba(255,255,255,0.10);
      width: 100%;
      box-sizing: border-box;
    }
    
    .metrics { 
      display:flex; 
      align-items:center; 
      gap:.75rem; 
      flex-wrap:wrap;
      justify-content: center;
    }
    
    .chip-count {
      padding:.5rem .85rem; 
      border-radius:999px; 
      font-weight:900; 
      font-size:.95rem;
      background:linear-gradient(135deg, rgba(30,136,229,.28), rgba(0,188,212,.28));
      border:1px solid rgba(30,136,229,.45); 
      color:#fff; 
      box-shadow:0 8px 22px rgba(30,136,229,.30);
      white-space: nowrap;
    }
    
    .avatars { 
      display:flex; 
      align-items:center;
      flex-wrap: wrap;
    }
    
    .avatar {
      width:28px; 
      height:28px; 
      border-radius:999px; 
      overflow:hidden; 
      border:1px solid rgba(255,255,255,.25);
      display:grid; 
      place-items:center; 
      font-size:.75rem; 
      font-weight:800; 
      color:#0b0d10;
      background:linear-gradient(135deg,#f093fb,#FFD166);
      flex-shrink: 0;
    }
    
    .avatar + .avatar { margin-left:-8px }
    
    .muted { 
      color:rgba(255,255,255,.75); 
      font-size:.9rem;
      text-align: center;
      width: 100%;
    }
    
    .cta-row { 
      display:flex; 
      gap:.75rem; 
      flex-wrap:wrap; 
      align-items:center; 
      justify-content:center;
      width: 100%;
    }
    
    .btn-ghost {
      display:inline-flex; 
      align-items:center; 
      gap:.5rem; 
      padding:.6rem .95rem; 
      border-radius:999px;
      border:1px solid rgba(255,255,255,.18); 
      background:rgba(255,255,255,.06); 
      color:#fff; 
      font-weight:800;
      white-space: nowrap;
      min-width: fit-content;
    }
    
    .btn-ghost:hover { 
      border-color:rgba(255,255,255,.28); 
      background:rgba(255,255,255,.1);
      transform: translateY(-2px);
      transition: all 0.2s;
    }
    
    .headline { 
      margin:0; 
      font-size:1.25rem; 
      font-weight:900; 
      color:#fff; 
      letter-spacing:-0.01em;
      text-align: center;
    }
    
    .subtle { 
      font-size:.85rem; 
      color:rgba(255,255,255,.6);
      text-align: center;
      line-height: 1.4;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .rsvp-grid {
        gap: 0.85rem;
      }
      
      .card {
        padding: 0.85rem;
      }
      
      .headline {
        font-size: 1.1rem;
      }
      
      .chip-count {
        font-size: 0.85rem;
        padding: 0.4rem 0.7rem;
      }
      
      .cta-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
      }
      
      .cta-row > * {
        width: 100%;
        justify-content: center;
      }
    }
    
    @media (max-width: 480px) {
      .card {
        padding: 0.75rem;
        border-radius: 12px;
      }
      
      .headline {
        font-size: 1rem;
      }
      
      .subtle {
        font-size: 0.8rem;
      }
      
      .chip-count {
        font-size: 0.8rem;
        padding: 0.35rem 0.6rem;
      }
      
      .btn-ghost {
        padding: 0.5rem 0.8rem;
        font-size: 0.9rem;
      }
    }
  `}</style>

            {/* Auth guard util */}


            <div className="rsvp-grid">
              {/* Columna izquierda: RSVP + prueba social */}
              <div className="card" aria-label="Confirmar asistencia">
                <div style={{ display: 'grid', gap: '.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '.75rem' }}>
                    <h3 className="headline">🎯 Asistencia</h3>
                  </div>

                  {/* Botones RSVP */}
                  <RequireLogin>
                    <RSVPButtons
                      currentStatus={userStatus}
                      onStatusChange={toggleInterested}
                      disabled={isUpdating}
                      interestedCount={interestedCount}
                    />
                  </RequireLogin>

                  {/* Prueba social + microcopy */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>


                    {/* Estado actual del usuario */}
                    <div className="subtle" aria-live="polite">
                      {userStatus === 'interesado' ? '✅ Este evento es de tu interés' : 'Marca "Me interesa" para añadirlo a tus eventos'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fila 2: Agregar a calendario (solo si interesado) */}
              {userStatus === 'interesado' && (
                <div className="card" aria-label="Agregar evento a calendario">
                  <div style={{ display: 'grid', gap: '.75rem', justifyItems: 'center', textAlign: 'center' }}>
                    <h3 className="headline">🗓️ Calendario</h3>


                    <div className="cta-row">
                      <RequireLogin>
                        <AddToCalendarWithStats
                          eventId={date.id}
                          title={date.nombre || `Fecha: ${formatDate(date.fecha)}`}
                          description={date.biografia || parent?.descripcion || undefined}
                          location={date.lugar || date.ciudad || date.direccion || undefined}
                          start={(() => {
                            // Si tiene dia_semana, calcular la próxima fecha basada en el día de la semana
                            if ((date as any).dia_semana !== null && (date as any).dia_semana !== undefined && typeof (date as any).dia_semana === 'number') {
                              const horaInicio = (date.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
                              return calculateNextDateWithTime((date as any).dia_semana, horaInicio);
                            }
                            // Si no tiene dia_semana, usar la fecha específica
                            const fechaStr = (date.fecha || '').split('T')[0] || '';
                            const h = (date.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
                            const d = new Date(`${fechaStr}T${h}:00`);
                            return isNaN(d.getTime()) ? new Date() : d;
                          })()}
                          end={(() => {
                            // Si tiene dia_semana, calcular la próxima fecha basada en el día de la semana
                            if ((date as any).dia_semana !== null && (date as any).dia_semana !== undefined && typeof (date as any).dia_semana === 'number') {
                              const horaFin = (date.hora_fin || date.hora_inicio || '23:00').split(':').slice(0, 2).join(':');
                              const startDate = calculateNextDateWithTime((date as any).dia_semana, (date.hora_inicio || '20:00').split(':').slice(0, 2).join(':'));
                              const [hora, minutos] = horaFin.split(':').map(Number);
                              const endDate = new Date(startDate);
                              endDate.setHours(hora || 23, minutos || 0, 0, 0);
                              return endDate;
                            }
                            // Si no tiene dia_semana, usar la fecha específica
                            const fechaStr = (date.fecha || '').split('T')[0] || '';
                            const h = (date.hora_fin || date.hora_inicio || '23:00').split(':').slice(0, 2).join(':');
                            const d = new Date(`${fechaStr}T${h}:00`);
                            if (isNaN(d.getTime())) { const t = new Date(); t.setHours(t.getHours() + 2); return t; }
                            return d;
                          })()}
                          diaSemana={(date as any).dia_semana !== null && (date as any).dia_semana !== undefined ? (date as any).dia_semana : undefined}
                          showAsIcon={false}
                        />
                      </RequireLogin>

                      {/* botón compartir removido en contenedor calendario */}
                    </div>


                  </div>
                </div>
              )}
            </div>
          </motion.section>

          {/* UBICACIONES Y REQUISITOS - Ahora después de RSVP */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            aria-label="Ubicación y requisitos"
            className="ubicacion-requisitos-section"
            style={{
              padding: '1.25rem',
              marginBottom: '1.25rem',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
              boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <style>{`
    .ur-col { display:grid; grid-template-columns: 1fr; gap: 1.25rem; }
    .card{
      border-radius:16px;
      padding:1.25rem;
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.10);
      backdrop-filter:blur(12px);
    }
    .loc{
      border-color:rgba(240,147,251,0.22);
      background:linear-gradient(135deg,rgba(240,147,251,.1),rgba(240,147,251,.05));
      box-shadow:0 8px 24px rgba(240,147,251,0.1);
    }
    .req{
      border-color:rgba(255,209,102,0.22);
      background:linear-gradient(135deg,rgba(255,209,102,.1),rgba(255,209,102,.05));
      box-shadow:0 8px 24px rgba(255,209,102,0.1);
    }
    .loc-inline{
      display:grid;
      grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));
      gap:0.75rem;
      align-items:stretch;
    }
    .loc-chip{
      display:flex;
      align-items:flex-start;
      gap:0.75rem;
      padding:0.875rem 1rem;
      border-radius:14px;
      font-weight:600;
      background:linear-gradient(135deg, rgba(240,147,251,0.15), rgba(245,87,108,0.1));
      border:1px solid rgba(240,147,251,0.35);
      color:#fff;
      font-size:0.9rem;
      box-shadow:0 4px 16px rgba(240,147,251,0.2);
      transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position:relative;
      overflow:hidden;
      line-height:1.5;
    }
    .loc-chip::before{
      content:'';
      position:absolute;
      top:0;
      left:-100%;
      width:100%;
      height:100%;
      background:linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
      transition:left 0.6s ease;
    }
    .loc-chip:hover::before{
      left:100%;
    }
    .loc-chip:hover{
      transform:translateY(-3px);
      box-shadow:0 8px 24px rgba(240,147,251,0.35);
      border-color:rgba(240,147,251,0.55);
      background:linear-gradient(135deg, rgba(240,147,251,0.22), rgba(245,87,108,0.15));
    }
    .loc-chip-icon{
      font-size:1.25rem;
      line-height:1;
      flex-shrink:0;
      margin-top:0.125rem;
      filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
    .loc-chip-content{
      flex:1;
      min-width:0;
      display:flex;
      flex-direction:column;
      gap:0.25rem;
    }
    .loc-chip b{
      color:#f7d9ff;
      font-weight:800;
      font-size:0.85rem;
      letter-spacing:0.02em;
      text-transform:uppercase;
      display:block;
      margin-bottom:0.125rem;
    }
    .loc-chip .muted{
      color:rgba(255,255,255,0.92);
      font-weight:500;
      font-size:0.9rem;
      line-height:1.5;
      word-break:break-word;
    }
    .row{display:grid;grid-template-columns:22px 1fr;gap:.5rem;align-items:start;color:rgba(255,255,255,.92)}
    .row+.row{margin-top:.5rem}
    .muted{color:rgba(255,255,255,.72);font-weight:500}
    .divider{
      height:1px;
      background:linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
      margin:1rem 0;
      border:none;
    }
    .actions{
      display:flex;
      gap:0.75rem;
      flex-wrap:wrap;
      margin-top:0.5rem;
    }
    .btn{
      display:inline-flex;
      align-items:center;
      gap:0.65rem;
      padding:0.75rem 1.25rem;
      border-radius:12px;
      font-weight:700;
      letter-spacing:0.01em;
      font-size:0.9rem;
      transition:all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      cursor:pointer;
      text-decoration:none;
    }
    .btn-maps{
      border:1px solid rgba(240,147,251,.5);
      color:#f7d9ff;
      background:linear-gradient(135deg, rgba(240,147,251,.25), rgba(240,147,251,.15));
      box-shadow:0 6px 20px rgba(240,147,251,.3);
      flex:1;
      min-width:200px;
      justify-content:center;
    }
    .btn-maps:hover{
      transform:translateY(-2px);
      border-color:rgba(240,147,251,.7);
      box-shadow:0 10px 30px rgba(240,147,251,.4);
      background:linear-gradient(135deg, rgba(240,147,251,.3), rgba(240,147,251,.2));
    }
    .pin{
      width:24px;
      height:24px;
      display:grid;
      place-items:center;
      border-radius:50%;
      background:linear-gradient(135deg,#f093fb,#f5576c);
      color:#fff;
      font-size:0.85rem;
      box-shadow:0 4px 12px rgba(245,87,108,.4);
      flex-shrink:0;
    }
    .btn-copy{
      border:1px solid rgba(255,255,255,.25);
      color:#fff;
      background:rgba(255,255,255,.08);
      flex:1;
      min-width:200px;
      justify-content:center;
    }
    .btn-copy:hover{
      border-color:rgba(255,255,255,.35);
      background:rgba(255,255,255,.12);
      transform:translateY(-2px);
      box-shadow:0 6px 20px rgba(255,255,255,.15);
    }
    
    /* Responsive Design - Adaptación progresiva */
    @media (max-width: 768px) {
      .ubicacion-requisitos-section {
        padding: 1rem !important;
        margin-bottom: 1rem !important;
        border-radius: 16px !important;
      }
      .ubicacion-requisitos-title {
        font-size: 1.15rem !important;
        margin-bottom: 0.75rem !important;
      }
      .ur-col { gap: 1rem; }
      .card { padding: 1rem; border-radius: 14px; }
      .loc-inline { 
        grid-template-columns: 1fr;
        gap: 0.65rem;
      }
      .loc-chip { 
        padding: 0.75rem 0.9rem; 
        font-size: 0.85rem;
        gap: 0.65rem;
        box-shadow: 0 4px 16px rgba(240,147,251,0.2);
      }
      .loc-chip:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(240,147,251,0.3);
      }
      .loc-chip-icon {
        font-size: 1.15rem;
      }
      .loc-chip b { 
        font-size: 0.8rem; 
      }
      .loc-chip .muted {
        font-size: 0.85rem;
      }
      .divider { margin: 0.875rem 0; }
      .actions { 
        gap: 0.65rem; 
        flex-direction: column; 
      }
      .actions .btn { 
        width: 100%;
        min-width: unset;
        justify-content: center;
        padding: 0.65rem 1.1rem;
        font-size: 0.85rem;
      }
      .pin { width: 22px; height: 22px; font-size: 0.8rem; }
      .req p { font-size: 0.85rem !important; line-height: 1.6 !important; }
    }
    
    @media (max-width: 480px) {
      .ubicacion-requisitos-section {
        padding: 0.875rem !important;
        margin-bottom: 0.875rem !important;
        border-radius: 14px !important;
      }
      .ubicacion-requisitos-title {
        font-size: 1.05rem !important;
        margin-bottom: 0.625rem !important;
      }
      .ur-col { gap: 0.875rem; }
      .card { padding: 0.875rem; border-radius: 12px; }
      .loc-inline { 
        gap: 0.6rem;
      }
      .loc-chip { 
        padding: 0.7rem 0.85rem; 
        font-size: 0.8rem;
        gap: 0.6rem;
        box-shadow: 0 4px 16px rgba(240,147,251,0.2);
      }
      .loc-chip:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(240,147,251,0.3);
      }
      .loc-chip-icon {
        font-size: 1.1rem;
      }
      .loc-chip b { 
        font-size: 0.75rem; 
      }
      .loc-chip .muted {
        font-size: 0.8rem;
      }
      .divider { margin: 0.75rem 0; }
      .actions { 
        gap: 0.6rem; 
        flex-direction: column; 
      }
      .actions .btn { 
        padding: 0.6rem 1rem;
        font-size: 0.8rem;
        gap: 0.6rem;
        width: 100%;
        min-width: unset;
        justify-content: center;
      }
      .pin { width: 20px; height: 20px; font-size: 0.75rem; }
      .req div { font-size: 0.8rem !important; margin-bottom: 0.5rem !important; }
      .req p { font-size: 0.8rem !important; line-height: 1.5 !important; }
    }
    
    @media (max-width: 360px) {
      .ubicacion-requisitos-section {
        padding: 0.75rem !important;
        border-radius: 12px !important;
      }
      .ubicacion-requisitos-title {
        font-size: 1rem !important;
        margin-bottom: 0.5rem !important;
      }
      .card { padding: 0.75rem; border-radius: 12px; }
      .loc-chip { 
        padding: 0.65rem 0.75rem; 
        font-size: 0.75rem;
        gap: 0.55rem;
      }
      .loc-chip-icon {
        font-size: 1rem;
      }
      .loc-chip b { 
        font-size: 0.7rem; 
      }
      .loc-chip .muted {
        font-size: 0.75rem;
      }
      .actions .btn { 
        padding: 0.55rem 0.9rem;
        font-size: 0.75rem;
        gap: 0.55rem;
      }
      .pin { width: 18px; height: 18px; font-size: 0.7rem; }
    }
  `}</style>

            <h3 className="ubicacion-requisitos-title" style={{ margin: 0, marginBottom: '.9rem', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff' }}>
              📍 Ubicación y requisitos
            </h3>

            <div className="ur-col">
              {/* Fila 1: Ubicación */}
              <div className="card loc" aria-label="Ubicación">
                {date.lugar || date.direccion || date.ciudad || date.referencias ? (
                  <>
                    <div className="loc-inline">
                      {date.lugar && (
                        <div className="loc-chip">
                          <span className="loc-chip-icon">🏷️</span>
                          <div className="loc-chip-content">
                            <b>Lugar</b>
                            <span className="muted">{date.lugar}</span>
                          </div>
                        </div>
                      )}
                      {date.direccion && (
                        <div className="loc-chip">
                          <span className="loc-chip-icon">🧭</span>
                          <div className="loc-chip-content">
                            <b>Dirección</b>
                            <span className="muted">{date.direccion}</span>
                          </div>
                        </div>
                      )}
                      {date.ciudad && (
                        <div className="loc-chip">
                          <span className="loc-chip-icon">🏙️</span>
                          <div className="loc-chip-content">
                            <b>Ciudad</b>
                            <span className="muted">{date.ciudad}</span>
                          </div>
                        </div>
                      )}
                      {date.referencias && (
                        <div className="loc-chip">
                          <span className="loc-chip-icon">📌</span>
                          <div className="loc-chip-content">
                            <b>Referencias</b>
                            <span className="muted">{date.referencias}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {(date.lugar || date.direccion || date.ciudad) && <div className="divider" />}
                    <div className="actions">
                      {(date.direccion || date.lugar || date.ciudad) && (
                        <a
                          className="btn btn-maps"
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${date.lugar ?? ''} ${date.direccion ?? ''} ${date.ciudad ?? ''}`.trim()
                          )}`}
                          target="_blank" rel="noopener noreferrer"
                          aria-label="Abrir ubicación en Google Maps (nueva pestaña)"
                        >
                          <span className="pin">📍</span> Ver en Maps <span aria-hidden>↗</span>
                        </a>
                      )}
                      {date.direccion && (
                        <button
                          type="button"
                          className="btn btn-copy"
                          onClick={() => {
                            const text = `${date.lugar ?? ''}\n${date.direccion ?? ''}\n${date.ciudad ?? ''}`.trim();
                            navigator.clipboard?.writeText(text).catch(() => { });
                          }}
                          aria-label="Copiar dirección al portapapeles"
                        >
                          📋 Copiar dirección
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="muted">Sin información de ubicación.</div>
                )}
              </div>

              {/* Fila 2: Requisitos */}
              {date.requisitos && (
                <div className="card req" aria-label="Requisitos">
                  <div style={{ fontWeight: 800, marginBottom: '.6rem' }}>📋 Requisitos</div>
                  <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(255,255,255,0.92)', fontWeight: 500 }}>
                    {date.requisitos}
                  </p>
                </div>
              )}
            </div>
          </motion.section>

          {/* Flyer de la Fecha - Ahora después de Ubicación y requisitos */}
          {date.flyer_url && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                marginBottom: '2rem',
                padding: '2.5rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '24px',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
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
                    background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)'
                  }}>
                    🎟️
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
                      Flyer del Evento
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      opacity: 0.8,
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      Promocional de la fecha
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <img
                    src={date.flyer_url}
                    alt={`Flyer de ${date.nombre || parent?.nombre || "Social"}`}
                    style={{
                      width: '100%',
                      maxWidth: '520px',
                      borderRadius: '16px',
                      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
                      aspectRatio: '4 / 5',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </div>
            </motion.section>
          )}



          {/* Galería de Fotos de la Fecha */}
          {(() => {
            // Obtener fotos del carrusel usando los media slots
            const carouselPhotos = PHOTO_SLOTS
              .map(slot => getMediaBySlot(date.media as any, slot)?.url)
              .filter(Boolean) as string[];

            return carouselPhotos.length > 0 && (
              <motion.section
                id="date-photo-gallery"
                data-test-id="date-photo-gallery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  marginBottom: '2rem',
                  padding: '2.5rem',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  borderRadius: '24px',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
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
                        Fotos de la fecha
                      </p>
                    </div>
                    <div style={{
                      padding: '0.75rem 1.5rem',
                      background: 'linear-gradient(135deg, rgba(229, 57, 53, 0.2), rgba(251, 140, 0, 0.2))',
                      borderRadius: '25px',
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: colors.light,
                      border: '1px solid rgba(229, 57, 53, 0.3)',
                      boxShadow: '0 4px 16px rgba(229, 57, 53, 0.2)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <CarouselComponent photos={carouselPhotos} />
                </div>
              </motion.section>
            );
          })()}

          {/* Sección de Videos de la Fecha */}
          {(() => {
            // Obtener videos
            const videos = VIDEO_SLOTS
              .map(slot => getMediaBySlot(date.media as any, slot)?.url)
              .filter(Boolean) as string[];

            return videos.length > 0 && (
              <motion.section
                id="date-video-gallery"
                data-test-id="date-video-gallery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{
                  marginBottom: '2rem',
                  padding: '2.5rem',
                  background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1) 0%, rgba(0, 188, 212, 0.05) 50%, rgba(255, 255, 255, 0.08) 100%)',
                  borderRadius: '24px',
                  border: '2px solid rgba(30, 136, 229, 0.2)',
                  boxShadow: '0 12px 40px rgba(30, 136, 229, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
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
                        Videos de la Fecha
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

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                    gap: '2rem',
                    maxWidth: '1200px',
                    margin: '0 auto'
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
                          boxShadow: '0 16px 40px rgba(30, 136, 229, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3)'
                        }}
                        style={{
                          aspectRatio: '16/9',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          border: '2px solid rgba(30, 136, 229, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          background: 'rgba(0, 0, 0, 0.1)',
                          boxShadow: '0 8px 32px rgba(30, 136, 229, 0.2), 0 4px 16px rgba(0, 0, 0, 0.2)'
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
                          top: '1rem',
                          right: '1rem',
                          background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.9), rgba(0, 188, 212, 0.9))',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          boxShadow: '0 4px 16px rgba(30, 136, 229, 0.3)',
                          backdropFilter: 'blur(10px)'
                        }}>
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