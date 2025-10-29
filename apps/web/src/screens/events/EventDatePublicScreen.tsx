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
      {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'relative',
            borderRadius: '1.5rem',
            background: 'linear-gradient(135deg, rgba(40, 30, 45, 0.95), rgba(30, 20, 40, 0.95))',
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid rgba(240, 147, 251, 0.2)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(240, 147, 251, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Top gradient bar */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)',
            opacity: 0.9
          }} />

          {/* Decorative corner accent */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '60px',
            height: '60px',
            background: 'radial-gradient(circle, rgba(240, 147, 251, 0.2), transparent)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/social/${date.parent_id}`)}
          style={{
                    padding: '10px 16px',
                    borderRadius: '25px',
                    border: '1px solid rgba(240, 147, 251, 0.3)',
                    background: 'rgba(240, 147, 251, 0.1)',
                    color: '#f093fb',
                    fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.2s'
                  }}
                >
                  ← Volver al Social
        </motion.button>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '25px',
                    background: date.estado_publicacion === 'publicado' 
                      ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2))'
                      : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    border: '1px solid rgba(240, 147, 251, 0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {date.estado_publicacion === 'publicado' ? '🌐 Público' : '📝 Borrador'}
                </motion.div>
              </div>

        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '800', 
                background: 'linear-gradient(135deg, #f093fb, #FFD166)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '1rem',
          lineHeight: 1.2,
        }}>
                {date.nombre || `Fecha: ${formatDate(date.fecha)}`}
        </h1>

              {date.biografia && (
                <p style={{
                  fontSize: '1.1rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.6,
                  marginBottom: '1.5rem',
                }}>
                  {date.biografia}
                </p>
              )}

              {/* Fecha y Hora */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
              }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
                  fontSize: '1.1rem',
                  color: '#fff',
                  fontWeight: '600',
                  padding: '8px 16px',
                  background: 'rgba(240, 147, 251, 0.1)',
                  borderRadius: '20px',
                  border: '1px solid rgba(240, 147, 251, 0.2)'
                }}>
                  📅 {formatDate(date.fecha)}
        </div>

                {date.hora_inicio && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
                    fontSize: '1.1rem',
                    color: '#fff',
                    fontWeight: '600',
                    padding: '8px 16px',
                    background: 'rgba(255, 209, 102, 0.1)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 209, 102, 0.2)'
                  }}>
                    🕐 {formatTime(date.hora_inicio)}
                    {date.hora_fin && ` - ${formatTime(date.hora_fin)}`}
          </div>
        )}
              </div>
            </div>

            <div style={{ marginLeft: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <AddToCalendarWithStats
                eventId={date.id}
                title={date.nombre || `Fecha: ${formatDate(date.fecha)}`}
                description={date.biografia || parent?.descripcion || undefined}
                location={date.lugar || date.ciudad || date.direccion || undefined}
                start={(() => {
                  if (!date.fecha) return new Date();
                  const horaInicio = date.hora_inicio || '20:00';
                  return new Date(`${date.fecha}T${horaInicio}:00`);
                })()}
                end={(() => {
                  if (!date.fecha) return new Date();
                  const horaFin = date.hora_fin || date.hora_inicio || '23:59';
                  return new Date(`${date.fecha}T${horaFin}:00`);
                })()}
                showAsIcon={true}
              />
              <ShareButton
                url={window.location.href}
                title={date.nombre || `Fecha: ${formatDate(date.fecha)}`}
                text={`¡Mira esta fecha: ${date.nombre || formatDate(date.fecha)}!`}
              />
            </div>
          </div>

          {/* Chips de Ritmos y Zonas */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '1.5rem' }}>
            {date.estilos?.map((ritmoId: number) => (
              <motion.span
                key={ritmoId}
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '25px',
                  background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.2), rgba(245, 87, 108, 0.2))',
                  color: '#f093fb',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  border: '1px solid rgba(240, 147, 251, 0.3)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 16px rgba(240, 147, 251, 0.2)'
                }}
              >
                🎵 {getRitmoName(ritmoId)}
              </motion.span>
            ))}
            
            {date.zonas?.map((zonaId: number) => (
              <motion.span
                key={zonaId}
                whileHover={{ scale: 1.05 }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '25px',
                  background: 'linear-gradient(135deg, rgba(255, 209, 102, 0.2), rgba(255, 140, 66, 0.2))',
                  color: '#FFD166',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  border: '1px solid rgba(255, 209, 102, 0.3)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 16px rgba(255, 209, 102, 0.2)'
                }}
              >
                📍 {getZonaName(zonaId)}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Contenedor responsive 2x2: Ubicación | Requisitos  y  Cronograma | Costos */}
        <style>{`
          .two-col-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 2rem; }
          @media (min-width: 768px) { .two-col-grid { grid-template-columns: 1fr 1fr; } }
        `}</style>
        <div className="two-col-grid">
          {/* Ubicación */}
          {(date.lugar || date.direccion || date.ciudad) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                position: 'relative',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(40, 30, 45, 0.8), rgba(30, 20, 40, 0.8))',
                borderRadius: '1.25rem',
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
                background: 'linear-gradient(90deg, #f093fb, #f5576c)',
                opacity: 0.8
              }} />
              
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #f093fb, #FFD166)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📍 Ubicación
              </h3>
              {date.lugar && (
                <p style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', fontWeight: '600' }}>{date.lugar}</p>
              )}
              {date.direccion && (
                <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem' }}>{date.direccion}</p>
              )}
              {date.ciudad && (
                <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>{date.ciudad}</p>
              )}
              {date.referencias && (
                <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '1rem', fontStyle: 'italic', padding: '0.75rem', background: 'rgba(240, 147, 251, 0.1)', borderRadius: '12px', border: '1px solid rgba(240, 147, 251, 0.2)' }}>💡 {date.referencias}</p>
              )}
            </motion.div>
          )}

          {/* Requisitos */}
          {date.requisitos && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                position: 'relative',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(40, 30, 45, 0.8), rgba(30, 20, 40, 0.8))',
                borderRadius: '1.25rem',
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
                background: 'linear-gradient(90deg, #FFD166, #FF8C42)',
                opacity: 0.8
              }} />
              
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #FFD166, #FF8C42)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
                gap: '8px'
              }}>
                📋 Requisitos
              </h3>
              <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6, margin: 0 }}>{date.requisitos}</p>
            </motion.div>
          )}

          {/* Cronograma */}
          {date.cronograma && date.cronograma.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(40, 30, 45, 0.8), rgba(30, 20, 40, 0.8))',
                borderRadius: '1.25rem',
                padding: '1.5rem',
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
                background: 'linear-gradient(90deg, #1E88E5, #00BCD4)',
                opacity: 0.8
              }} />
              
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📅 Cronograma
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {date.cronograma.map((item: any, index: number) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: index * 0.1 }}
                    style={{ 
                      padding: '1.25rem', 
                      background: 'rgba(30, 136, 229, 0.1)', 
                      borderRadius: '1rem', 
                      border: '1px solid rgba(30, 136, 229, 0.2)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', minWidth: '40px' }}>
                      {item.tipo === 'clase' ? '📚' : item.tipo === 'show' ? '🎭' : '📋'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', marginBottom: '0.5rem' }}>{item.titulo}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>🕐 {item.inicio} - {item.fin}</span>
                        {item.nivel && (
                          <span style={{ padding: '4px 8px', borderRadius: '12px', background: 'rgba(30, 136, 229, 0.2)', color: '#1E88E5', fontSize: '0.8rem', fontWeight: '600', border: '1px solid rgba(30, 136, 229, 0.3)' }}>{item.nivel}</span>
          )}
        </div>
      </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Costos */}
          {date.costos && date.costos.length > 0 && (
            <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
          style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(40, 30, 45, 0.8), rgba(30, 20, 40, 0.8))',
                borderRadius: '1.25rem',
                padding: '1.5rem',
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
                background: 'linear-gradient(90deg, #FFD166, #FF8C42)',
                opacity: 0.8
              }} />
              
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
                background: 'linear-gradient(135deg, #FFD166, #FF8C42)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💰 Costos y Promociones
          </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {date.costos.map((costo: any, index: number) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.1 }}
              style={{
                      padding: '1.25rem', 
                      background: 'rgba(255, 209, 102, 0.1)', 
                      borderRadius: '1rem', 
                      border: '1px solid rgba(255, 209, 102, 0.2)', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff', marginBottom: '0.5rem' }}>{costo.nombre}</h3>
                      {costo.regla && (
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>{costo.regla}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.5rem' }}>
                        {costo.tipo === 'preventa' ? '🎫' : costo.tipo === 'taquilla' ? '💰' : '🎁'}
                      </span>
                      <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#FFD166' }}>
                        {costo.precio !== undefined && costo.precio !== null ? `$${costo.precio.toLocaleString()}` : 'Gratis'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

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