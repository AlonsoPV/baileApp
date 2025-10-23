import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { ProfileHero } from "../../components/profile/ProfileHero";
import { MediaGrid } from "../../components/MediaGrid";
import { EventInviteStrip } from "../../components/EventInviteStrip";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useParentsByOrganizer, useDatesByParent, useRSVPCounts } from "../../hooks/useEvents";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import ProfileToolbar from "../../components/profile/ProfileToolbar";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";

// Componente FAQ Accordion
const FAQAccordion: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '1.25rem',
          background: 'transparent',
          border: 'none',
          color: colors.light,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '1.1rem',
          fontWeight: '600',
          textAlign: 'left',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: colors.light,
            transition: 'all 0.3s ease'
          }}
        >
          ▼
        </motion.span>
      </button>
      
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
          padding: '0 1.25rem 1.25rem 1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <p style={{
            lineHeight: 1.6,
            opacity: 0.9,
            fontSize: '1rem',
            margin: 0,
            color: colors.light
          }}>
            {answer}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente de Carrusel (copiado del UserProfileLive)
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

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function OrganizerProfileLive() {
  const navigate = useNavigate();
  const { data: org, isLoading } = useMyOrganizer();
  const { data: parents } = useParentsByOrganizer(org?.id);
  const { media } = useOrganizerMedia();
  const { data: allTags } = useTags();

  // Obtener fotos del carrusel usando los media slots
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(media, slot))
    .filter(Boolean) as string[];

  // Obtener videos
  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(media, slot))
    .filter(Boolean) as string[];

  // Get tag names from IDs
  const getRitmoNombres = () => {
    if (!allTags || !org?.ritmos) return [];
    return org.ritmos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !org?.zonas) return [];
    return org.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Cargando organizador...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
          No tienes perfil de organizador
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          Crea uno para organizar eventos
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile/organizer/edit')}
          style={{
            padding: '14px 28px',
            borderRadius: '50px',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(30,136,229,0.5)',
          }}
        >
          🎤 Crear Organizador
        </motion.button>
      </div>
    );
  }

  // Preparar chips de estado
  const statusChip = (
    <span
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        background: org.estado_aprobacion === 'aprobado' ? '#10B981cc' : `${colors.orange}cc`,
        border: `2px solid ${org.estado_aprobacion === 'aprobado' ? '#10B981' : colors.orange}`,
        color: colors.light,
        fontSize: '0.875rem',
        fontWeight: '700',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 2px 10px ${org.estado_aprobacion === 'aprobado' ? '#10B981' : colors.orange}66`,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {org.estado_aprobacion === 'aprobado' ? '✅' : '⏳'} {org.estado_aprobacion}
    </span>
  );

  // Preparar items de "Próximos eventos" (fechas publicadas)
  const getUpcomingDates = () => {
    const upcomingItems: any[] = [];
    
    parents?.forEach(parent => {
      // Aquí podrías usar useDatesByParent para cada parent, pero por simplicidad usamos mock
      upcomingItems.push({
        title: parent.nombre,
        date: 'Próximamente',
        place: parent.sede_general || '',
        href: `/events/parent/${parent.id}`,
        cover: Array.isArray(parent.media) && parent.media.length > 0 
          ? (parent.media[0] as any)?.url || parent.media[0]
          : undefined,
      });
    });

    return upcomingItems.slice(0, 3);
  };

  const inviteItems = getUpcomingDates();

  return (
    <>
      <style>{`
        .org-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .org-banner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .org-banner-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 3rem;
          align-items: center;
        }
        @media (max-width: 768px) {
          .org-container {
            max-width: 100% !important;
          }
          .org-banner {
            border-radius: 0 !important;
            padding: 2rem 1rem !important;
          }
          .org-banner-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
            justify-items: center !important;
            text-align: center !important;
          }
          .org-banner-grid h1 {
            font-size: 2rem !important;
          }
          .org-banner-avatar {
            width: 180px !important;
            height: 180px !important;
          }
          .org-banner-avatar-fallback {
            font-size: 4rem !important;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: colors.dark,
        color: colors.light,
        width: '100%'
      }}>
        {/* Profile Toolbar - Toggle y Edición */}
        <div className="org-container" style={{
          padding: '1rem'
        }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="organizer"
          />
        </div>

        {/* Banner Principal */}
        <div className="org-banner" style={{
          position: 'relative',
          background: '#000000',
          overflow: 'hidden',
          borderRadius: '16px',
          padding: '3rem 2rem'
        }}>
          <div className="org-banner-grid">
            {/* Columna 1: Logo del Organizador */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div className="org-banner-avatar" style={{
                width: '250px',
                height: '250px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '6px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
              }}>
                {media[0]?.url ? (
                  <img
                    src={media[0].url}
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
                    fontWeight: '700',
                    color: 'white'
                  }}>
                    {org.nombre_publico?.[0]?.toUpperCase() || '🎤'}
                  </div>
                )}
              </div>
            </div>

            {/* Columna 2: Nombre, Chips y Estado */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              justifyContent: 'center'
            }}>
              <h1 style={{
                fontSize: '3rem',
                fontWeight: '800',
                margin: 0,
                color: colors.light,
                lineHeight: '1.2'
              }}>
                {org.nombre_publico}
              </h1>

              {/* Chips de ritmos y zonas */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {getRitmoNombres().map((nombre) => (
                  <Chip 
                    key={`r-${nombre}`} 
                    label={nombre} 
                    icon="🎵" 
                    variant="ritmo" 
                  />
                ))}
                {getZonaNombres().map((nombre) => (
                  <Chip 
                    key={`z-${nombre}`} 
                    label={nombre} 
                    icon="📍" 
                    variant="zona" 
                  />
                ))}
              </div>

              {/* Estado del organizador */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {statusChip}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="org-container" style={{ 
          padding: '2rem'
        }}>
        {/* Biografía */}
        {org.bio && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              💬 Sobre nosotros
            </h3>
            <p style={{ lineHeight: 1.6, opacity: 0.85, fontSize: '1rem' }}>
              {org.bio}
            </p>
          </motion.section>
        )}

        {/* Redes Sociales */}
        {(org.redes_sociales?.instagram || org.redes_sociales?.facebook || org.redes_sociales?.whatsapp) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              marginBottom: '2rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📱 Redes Sociales
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {org.redes_sociales?.instagram && (
                <motion.a
                  href={org.redes_sociales.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 4px 16px rgba(233, 30, 99, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>📷</span>
                  Instagram
                </motion.a>
              )}
              
              {org.redes_sociales?.facebook && (
                <motion.a
                  href={org.redes_sociales.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, #1877F2 0%, #0D47A1 100%)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 4px 16px rgba(24, 119, 242, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>📘</span>
                  Facebook
                </motion.a>
              )}
              
              {org.redes_sociales?.whatsapp && (
                <motion.a
                  href={`https://wa.me/${org.redes_sociales.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, y: -2 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: '0 4px 16px rgba(37, 211, 102, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>💬</span>
                  WhatsApp
                </motion.a>
              )}
            </div>
          </motion.section>
        )}

        {/* Próximos Eventos del Organizador */}
        {inviteItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '700' }}>
              🎫 Nuestros Próximos Eventos
            </h3>
            <p style={{ marginBottom: '1.5rem', opacity: 0.7, fontSize: '0.9rem' }}>
              {inviteItems.length} {inviteItems.length === 1 ? 'evento' : 'eventos'} próximos
            </p>

            <div
              style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '20px',
                padding: '24px',
                background: `${colors.dark}aa`,
                borderRadius: '0 0 16px 16px',
                border: `1px solid ${colors.coral}33`,
                borderTop: 'none',
                scrollbarWidth: 'thin',
                scrollbarColor: `${colors.coral} ${colors.dark}`,
              }}
            >
              {inviteItems.map((ev, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  style={{ minWidth: '300px' }}
                >
                  <motion.div
                    onClick={() => navigate(ev.href)}
                    style={{
                      display: 'block',
                      background: `${colors.dark}ee`,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: colors.light,
                      border: `2px solid ${colors.coral}44`,
                      boxShadow: `0 4px 16px ${colors.coral}33`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    whileHover={{ 
                      borderColor: colors.coral,
                      boxShadow: `0 12px 32px ${colors.coral}66`
                    }}
                  >
                    {/* Cover Image */}
                    <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                      {ev.cover ? (
                        <>
                          <img
                            src={ev.cover}
                            alt={ev.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          {/* Gradient Overlay */}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(to bottom, transparent, ${colors.dark}aa)`,
                          }} />
                        </>
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem',
                        }}>
                          🎉
                        </div>
                      )}

                      {/* Date Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: colors.coral,
                        color: colors.light,
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        textTransform: 'uppercase',
                      }}>
                        {ev.date}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '16px' }}>
                      <h3 style={{
                        color: colors.light,
                        fontWeight: '700',
                        fontSize: '1.2rem',
                        marginBottom: '8px',
                        lineHeight: 1.2,
                      }}>
                        {ev.title}
                      </h3>
                      {ev.place && (
                        <div style={{
                          fontSize: '0.875rem',
                          color: `${colors.light}99`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <span style={{ fontSize: '1rem' }}>📍</span>
                          {ev.place}
                        </div>
                      )}

                      {/* CTA */}
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        borderRadius: '12px',
                        background: `${colors.coral}22`,
                        border: `1px solid ${colors.coral}44`,
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: colors.coral,
                      }}>
                        👁️ Ver evento
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Mis Eventos */}
        {parents && parents.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              marginBottom: '2rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📅 Mis Eventos
              </h3>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: colors.light
              }}>
                {parents.length} evento{parents.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {parents.map((parent) => (
                <motion.div
                  key={parent.id}
                  whileHover={{ scale: 1.01, y: -2 }}
                  onClick={() => navigate(`/events/parent/${parent.id}`)}
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: colors.light }}>
                    {parent.nombre}
                  </h4>
                  {parent.descripcion && (
                    <p style={{ opacity: 0.8, marginBottom: '0.75rem', lineHeight: 1.5, fontSize: '0.9rem' }}>
                      {parent.descripcion}
                    </p>
                  )}
                  {parent.sede_general && (
                    <p style={{ fontSize: '0.875rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📍 {parent.sede_general}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Foto Principal */}
        {getMediaBySlot(media, 'p1') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'center',
              opacity: 1,
              transform: 'none'
            }}
          >
            <div style={{
              width: '100%',
              maxWidth: '500px',
              aspectRatio: '4 / 3',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid rgba(255, 255, 255, 0.1)'
            }}>
              <ImageWithFallback
                alt="Foto principal"
                src={getMediaBySlot(media, 'p1')!}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          </motion.section>
        )}

        {/* Video Principal */}
        {getMediaBySlot(media, 'v1') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'center',
              opacity: 1,
              transform: 'none'
            }}
          >
            <div style={{
              width: '100%',
              maxWidth: '600px',
              aspectRatio: '16 / 9',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid rgba(255, 255, 255, 0.1)'
            }}>
              <video
                src={getMediaBySlot(media, 'v1')!}
                controls
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          </motion.section>
        )}

        {/* Galería de Fotos Mejorada */}
        {carouselPhotos.length > 0 && (
          <motion.section
            id="organizer-profile-photo-gallery"
            data-baile-id="organizer-profile-photo-gallery"
            data-test-id="organizer-profile-photo-gallery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              marginBottom: '2rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📷 Galería de Fotos
              </h3>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: colors.light
              }}>
                {carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <CarouselComponent photos={carouselPhotos} />
          </motion.section>
        )}

        {/* Sección de Videos */}
        {videos.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              marginBottom: '2rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #1E88E5 0%, #00BCD4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎥 Videos
              </h3>
              <div style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: colors.light
              }}>
                {videos.length} video{videos.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              maxWidth: '1000px',
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
                    y: -5,
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                  }}
                  style={{
                    aspectRatio: '16/9',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    background: 'rgba(0, 0, 0, 0.1)'
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
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    Video {index + 1}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Información para Asistentes - FAQ */}
        {(org.respuestas?.musica_tocaran || org.respuestas?.hay_estacionamiento) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              marginBottom: '2rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #1E88E5 0%, #00BCD4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ❓ Información para Asistentes
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* FAQ Item: Música */}
              {org.respuestas?.musica_tocaran && (
                <FAQAccordion
                  question="🎵 ¿Qué música tocarán?"
                  answer={org.respuestas.musica_tocaran}
                />
              )}
              
              {/* FAQ Item: Estacionamiento */}
              {org.respuestas?.hay_estacionamiento && (
                <FAQAccordion
                  question="🅿️ ¿Hay estacionamiento?"
                  answer={org.respuestas.hay_estacionamiento}
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