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
import SeoHead from "@/components/SeoHead";
import { SEO_BASE_URL, SEO_LOGO_URL } from "@/lib/seoConfig";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

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
    
    console.log('🔐 [EventDatePublicScreen] Verificando propiedad:', {
      currentUserId: user.id,
      organizerUserId,
      parentUserId,
      isOwner: organizerUserId === parentUserId
    });
    
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
  const locationName = date.lugar || date.ciudad || parent?.ciudad || getZonaName((date.zonas || [])[0]) || 'México';
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
          
          .mini-card {
            padding: 0.85rem !important;
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
      line-height: 1.1;
      font-weight: 900;
      letter-spacing: -0.01em;
      color: #fff;
      text-transform: none;
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
    .chip-link {
      text-decoration: none;
      color: inherit;
    }
    .chip-link:hover {
      transform: translateY(-2px);
      box-shadow:0 10px 26px rgba(240,147,251,.28);
    }
    .mini-card {
      border-radius:14px; padding:1rem; 
      background: rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.08);
    }
    .list-compact { display:grid; gap:.6rem }
    .list-compact li { display:flex; justify-content:space-between; gap:.75rem; font-size:.95rem }
  `}</style>

          <div className="social-header-card">
            <div className="social-header-grid">
              {/* Columna izquierda */}
              <div style={{ display: 'grid', gap: '.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate(`/social/${date.parent_id}`)}
                    style={{
                      padding: '8px 12px', borderRadius: 999,
                      border: '1px solid rgba(240,147,251,0.28)',
                      background: 'rgba(240,147,251,0.10)', color: '#f093fb',
                      fontWeight: 700, cursor: 'pointer'
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

                <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
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
                </div>
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

                {Array.isArray(date.cronograma) && date.cronograma.length > 0 && (
                  <div className="mini-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                      <strong>📅 Cronograma</strong>
                    </div>
                    <ul className="list-compact" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {date.cronograma.slice(0, 4).map((it: any, i: number) => (
                        <li key={i}>
                          <span style={{ opacity: .9 }}>
                            {it.tipo === 'clase' ? '📚' : it.tipo === 'show' ? '🎭' : '🗂️'} {it.titulo || it.tipo}
                          </span>
                          <span style={{ opacity: .7 }}>{it.inicio}{it.fin ? ` - ${it.fin}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(date.costos) && date.costos.length > 0 && (
                  <div className="mini-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
                      <strong>💰 Costos</strong>
                    </div>
                    <ul className="list-compact" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {date.costos.slice(0, 4).map((c: any, i: number) => (
                        <li key={i}>
                          <span style={{ opacity: .9 }}>{c.nombre || c.tipo}</span>
                          <span style={{ fontWeight: 700, color: '#FFD166' }}>
                            {c.precio !== undefined && c.precio !== null ? `$${c.precio.toLocaleString()}` : 'Gratis'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
                          const fechaStr = (date.fecha || '').split('T')[0] || '';
                          const h = (date.hora_inicio || '20:00').split(':').slice(0, 2).join(':');
                          const d = new Date(`${fechaStr}T${h}:00`);
                          return isNaN(d.getTime()) ? new Date() : d;
                        })()}
                        end={(() => {
                          const fechaStr = (date.fecha || '').split('T')[0] || '';
                          const h = (date.hora_fin || date.hora_inicio || '23:00').split(':').slice(0, 2).join(':');
                          const d = new Date(`${fechaStr}T${h}:00`);
                          if (isNaN(d.getTime())) { const t = new Date(); t.setHours(t.getHours() + 2); return t; }
                          return d;
                        })()}
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
    .ur-col { display:grid; grid-template-columns: 1fr; gap: 1rem; }
    .card{border-radius:14px;padding:1rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10)}
    .loc{border-color:rgba(240,147,251,0.22);background:linear-gradient(135deg,rgba(240,147,251,.08),rgba(240,147,251,.04))}
    .req{border-color:rgba(255,209,102,0.22);background:linear-gradient(135deg,rgba(255,209,102,.08),rgba(255,209,102,.04))}
    .loc-inline{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
    .loc-chip{display:inline-flex;align-items:center;gap:.4rem;padding:.45rem .75rem;border-radius:999px;font-weight:800;
      background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#fff}
    .row{display:grid;grid-template-columns:22px 1fr;gap:.5rem;align-items:start;color:rgba(255,255,255,.92)}
    .row+.row{margin-top:.5rem}
    .muted{color:rgba(255,255,255,.72);font-weight:500}
    .divider{height:1px;background:rgba(255,255,255,.12);margin:.75rem 0}
    .actions{display:flex;gap:.5rem;flex-wrap:wrap}
    .btn{display:inline-flex;align-items:center;gap:.55rem;padding:.6rem .95rem;border-radius:999px;font-weight:800;letter-spacing:.01em}
    .btn-maps{border:1px solid rgba(240,147,251,.4);color:#f7d9ff;
      background:radial-gradient(120% 120% at 0% 0%,rgba(240,147,251,.18),rgba(240,147,251,.08));
      box-shadow:0 6px 18px rgba(240,147,251,.20)
    }
    .btn-maps:hover{transform:translateY(-1px);border-color:rgba(240,147,251,.6);
      box-shadow:0 10px 26px rgba(240,147,251,.28)}
    .pin{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;
      background:linear-gradient(135deg,#f093fb,#f5576c);color:#fff;font-size:.9rem;
      box-shadow:0 4px 10px rgba(245,87,108,.35)}
    .btn-copy{border:1px solid rgba(255,255,255,.18);color:#fff;background:rgba(255,255,255,.06)}
    .btn-copy:hover{border-color:rgba(255,255,255,.28);background:rgba(255,255,255,.1)}
  `}</style>

          <h3 style={{ margin: 0, marginBottom: '.9rem', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#fff' }}>
            📍 Ubicación y requisitos
          </h3>

          <div className="ur-col">
            {/* Fila 1: Ubicación */}
            <div className="card loc" aria-label="Ubicación">
              {date.lugar || date.direccion || date.ciudad || date.referencias ? (
                <>
                  <div className="loc-inline">
                    {date.lugar && (
                      <span className="loc-chip">🏷️ <b>Lugar:</b> <span className="muted">{date.lugar}</span></span>
                    )}
                    {date.direccion && (
                      <span className="loc-chip">🧭 <b>Dirección:</b> <span className="muted">{date.direccion}</span></span>
                    )}
                    {date.ciudad && (
                      <span className="loc-chip">🏙️ <b>Ciudad:</b> <span className="muted">{date.ciudad}</span></span>
                    )}
                    {date.referencias && (
                      <span className="loc-chip">📌 <b>Referencias:</b> <span className="muted">{date.referencias}</span></span>
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