import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEventDate } from "../../hooks/useEventDate";
import { useEventParent } from "../../hooks/useEventParent";
import { useTags } from "../../hooks/useTags";
import { useEventRSVP } from "../../hooks/useRSVP";
import { motion } from "framer-motion";
import ShareButton from "../../components/events/ShareButton";
import RSVPButtons from "../../components/rsvp/RSVPButtons";
import ImageWithFallback from "../../components/ImageWithFallback";
import AddToCalendarWithStats from "../../components/AddToCalendarWithStats";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import RitmosChips from "../../components/RitmosChips";

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

  const { data: date, isLoading } = useEventDate(dateIdNum);
  const { data: parent } = useEventParent(date?.parent_id);
  const { data: ritmos } = useTags('ritmo');
  const { data: zonas } = useTags('zona');

  // Hook de RSVP
  const {
    userStatus,
    stats,
    toggleInterested,
    isUpdating
  } = useEventRSVP(dateIdNum);

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
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="date-public-root" style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, #0a0a0a, #1a1a1a, #2a1a2a)`,
      padding: '24px 0',
    }}>
      <style>{`
        .date-public-root { padding: 24px 0; }
        .date-public-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        @media (max-width: 768px) {
          .date-public-root { padding: 16px 0 !important; }
          .date-public-inner { padding: 0 16px !important; }
          .two-col-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
        }
        @media (max-width: 480px) {
          .date-public-root { padding: 12px 0 !important; }
          .date-public-inner { padding: 0 12px !important; }
        }
      `}</style>
      <div className="date-public-inner">
        
      /*** ⬇️ REEMPLAZA el header grande por este bloque compacto ***/
<motion.header
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  className="social-header"
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    marginBottom: '1.25rem',
  }}
>
  <style>{`
    .social-header-card {
      position: relative;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(40,30,45,0.92), rgba(30,20,40,0.92));
      border: 1px solid rgba(240,147,251,0.18);
      box-shadow: 0 8px 28px rgba(0,0,0,0.35);
      padding: 1rem;
    }
    .social-header-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    @media (min-width: 768px) {
      .social-header-grid {
        grid-template-columns: 1.25fr 1fr;
      }
    }
    .chip {
      display:inline-flex;align-items:center;gap:.5rem;
      padding:.4rem .75rem;border-radius:999px;font-weight:700;font-size:.85rem
    }
    .chip-date{background:rgba(240,147,251,.12);border:1px solid rgba(240,147,251,.25);color:#f093fb}
    .chip-time{background:rgba(255,209,102,.12);border:1px solid rgba(255,209,102,.25);color:#FFD166}
    .mini-card {
      border-radius:12px; padding:.75rem; 
      background: rgba(255,255,255,0.04);
      border:1px solid rgba(255,255,255,0.08);
    }
    .list-compact { display:grid; gap:.5rem }
    .list-compact li { display:flex; justify-content:space-between; gap:.75rem; font-size:.9rem }
  `}</style>

  <div className="social-header-card">
    <div className="social-header-grid">
      {/* Columna izquierda */}
      <div style={{display:'grid', gap:'.75rem'}}>
        <div style={{display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap'}}>
          <button
            onClick={() => navigate(`/social/${date.parent_id}`)}
            style={{
              padding: '8px 12px', borderRadius: '999px',
              border: '1px solid rgba(240,147,251,0.28)',
              background: 'rgba(240,147,251,0.10)', color:'#f093fb',
              fontWeight:700, cursor:'pointer'
            }}
          >
            ← Volver
          </button>
          <span className="chip chip-date">✅ Verificado</span>
        </div>

        <h1 style={{
          margin:0, fontSize:'1.8rem', lineHeight:1.2, fontWeight:800,
          background:'linear-gradient(135deg,#f093fb,#FFD166)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'
        }}>
          {date.nombre || `Fecha: ${formatDate(date.fecha)}`}
        </h1>

        {date.biografia && (
          <p style={{margin:0, color:'rgba(255,255,255,0.82)', fontSize:'.95rem', lineHeight:1.4}}>
            {date.biografia}
          </p>
        )}

        {/* Chips fecha/hora compactos */}
        <div style={{display:'flex', gap:'.5rem', flexWrap:'wrap'}}>
          <span className="chip chip-date">📅 {formatDate(date.fecha)}</span>
          {date.hora_inicio && (
            <span className="chip chip-time">
              🕐 {formatTime(date.hora_inicio)}{date.hora_fin ? ` — ${formatTime(date.hora_fin)}` : ''}
            </span>
          )}
        </div>

        {/* RSVP + Add to Calendar (compacto) */}
        <div style={{display:'flex', gap:'.75rem', alignItems:'center', flexWrap:'wrap'}}>
          <RSVPButtons currentStatus={userStatus} onStatusChange={toggleInterested} disabled={isUpdating} />
          <AddToCalendarWithStats
            eventId={date.id}
            title={date.nombre || `Fecha: ${formatDate(date.fecha)}`}
            description={date.biografia || parent?.descripcion || undefined}
            location={date.lugar || date.ciudad || date.direccion || undefined}
            start={(() => {
              const fechaStr = (date.fecha || '').split('T')[0] || '';
              const h = (date.hora_inicio || '20:00').split(':').slice(0,2).join(':');
              const d = new Date(`${fechaStr}T${h}:00`);
              return isNaN(d.getTime()) ? new Date() : d;
            })()}
            end={(() => {
              const fechaStr = (date.fecha || '').split('T')[0] || '';
              const h = (date.hora_fin || date.hora_inicio || '23:00').split(':').slice(0,2).join(':');
              const d = new Date(`${fechaStr}T${h}:00`);
              if (isNaN(d.getTime())) { const t=new Date(); t.setHours(t.getHours()+2); return t; }
              return d;
            })()}
            showAsIcon
          />
        </div>
      </div>

      {/* Columna derecha */}
      <div style={{display:'grid', gap:'.75rem', alignContent:'start'}}>
        <div style={{display:'flex', justifyContent:'flex-end'}}>
          <ShareButton
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={date.nombre || `Fecha: ${formatDate(date.fecha)}`}
            text={`¡Mira esta fecha: ${date.nombre || formatDate(date.fecha)}!`}
          />
        </div>

        {/* Resumen compacto Cronograma */}
        {Array.isArray(date.cronograma) && date.cronograma.length > 0 && (
          <div className="mini-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.5rem'}}>
              <strong>📅 Cronograma</strong>
              <span style={{opacity:.7, fontSize:'.85rem'}}>{date.cronograma.length} item(s)</span>
            </div>
            <ul className="list-compact" style={{margin:0, padding:0, listStyle:'none'}}>
              {date.cronograma.slice(0,4).map((it:any, i:number) => (
                <li key={i}>
                  <span style={{opacity:.9}}>
                    {it.tipo === 'clase' ? '📚' : it.tipo === 'show' ? '🎭' : '🗂️'} {it.titulo || it.tipo}
                  </span>
                  <span style={{opacity:.7}}>{it.inicio}{it.fin ? ` - ${it.fin}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resumen compacto Costos */}
        {Array.isArray(date.costos) && date.costos.length > 0 && (
          <div className="mini-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.5rem'}}>
              <strong>💰 Costos</strong>
              <span style={{opacity:.7, fontSize:'.85rem'}}>{date.costos.length} opción(es)</span>
            </div>
            <ul className="list-compact" style={{margin:0, padding:0, listStyle:'none'}}>
              {date.costos.slice(0,4).map((c:any, i:number) => (
                <li key={i}>
                  <span style={{opacity:.9}}>{c.nombre || c.tipo}</span>
                  <span style={{fontWeight:700, color:'#FFD166'}}>
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

/*** ⬇️ AÑADE estas dos secciones COMPACTAS justo después del header ***/
<section style={{display:'grid', gridTemplateColumns:'1fr', gap:'1rem', marginBottom:'1.25rem'}}>
  <div className="mini-card" style={{display:'grid', gap:'.5rem'}}>
    <strong>📍 Ubicación y Requisitos</strong>
    <div style={{display:'grid', gap:'.25rem', fontSize:'.95rem', color:'rgba(255,255,255,0.9)'}}>
      {date.lugar && <div>• <b>Lugar:</b> {date.lugar}</div>}
      {date.direccion && <div>• <b>Dirección:</b> {date.direccion}</div>}
      {date.ciudad && <div>• <b>Ciudad:</b> {date.ciudad}</div>}
      {date.referencias && <div>• <b>Referencias:</b> {date.referencias}</div>}
      {date.requisitos && <div>• <b>Requisitos:</b> {date.requisitos}</div>}
      {(!date.lugar && !date.direccion && !date.ciudad && !date.referencias && !date.requisitos) && (
        <div style={{opacity:.7}}>Sin información adicional.</div>
      )}
    </div>
  </div>

  {date.flyer_url && (
    <div className="mini-card" style={{display:'grid', gap:'.75rem'}}>
      <strong>🎟️ Flyer del Evento</strong>
      <div style={{display:'grid', placeItems:'center'}}>
        <img
          src={date.flyer_url}
          alt={`Flyer de ${date.nombre || parent?.nombre || "Social"}`}
          style={{
            width:'100%', maxWidth:420, aspectRatio:'4/5', objectFit:'cover',
            borderRadius:16, boxShadow:'0 12px 32px rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.12)'
          }}
        />
      </div>
    </div>
  )}
</section>


        {/* Flyer de la Fecha */}
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

        {/* RSVP Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(40, 30, 45, 0.8), rgba(30, 20, 40, 0.8))',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(240, 147, 251, 0.2)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(240, 147, 251, 0.1)',
            overflow: 'hidden'
          }}
        >
          {/* Top gradient bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)',
            opacity: 0.8
          }} />

          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #f093fb, #FFD166)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🎯 ¿Vas a asistir?
          </h2>

          <RSVPButtons
            currentStatus={userStatus}
            onStatusChange={toggleInterested}
            disabled={isUpdating}
          />

          {/* Estadísticas de RSVP */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(240, 147, 251, 0.1)',
                borderRadius: '1rem',
                border: '1px solid rgba(240, 147, 251, 0.2)',
                textAlign: 'center',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{
                fontSize: '1rem',
                color: '#f093fb',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                {stats.interesado} persona{stats.interesado !== 1 ? 's' : ''} interesada{stats.interesado !== 1 ? 's' : ''}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Total: {stats.total} visualizaciones
              </div>
            </motion.div>
          )}
        </motion.div>

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
  );
}