import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { ProfileHero } from "../../components/profile/ProfileHero";
import { MediaGrid } from "../../components/MediaGrid";
import { EventInviteStrip } from "../../components/EventInviteStrip";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useParentsByOrganizer, useDatesByParent, useRSVPCounts } from "../../hooks/useEvents";
import { useEventParentsByOrganizer, useEventDatesByOrganizer } from "../../hooks/useEventParentsByOrganizer";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import ProfileToolbar from "../../components/profile/ProfileToolbar";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";

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
  const { data: parents } = useEventParentsByOrganizer(org?.id);
  const { data: eventDates } = useEventDatesByOrganizer(org?.id);
  const { media } = useOrganizerMedia();
  const { data: allTags } = useTags();

  // Debug logs
  console.log('[OrganizerProfileLive] org:', org);
  console.log('[OrganizerProfileLive] parents:', parents);
  console.log('[OrganizerProfileLive] eventDates:', eventDates);
  console.log('[OrganizerProfileLive] parents length:', parents?.length);
  console.log('[OrganizerProfileLive] eventDates length:', eventDates?.length);

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
    if (!allTags || !(org as any)?.estilos) return [];
    return (org as any).estilos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
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

  // Preparar items de "Fechas" (fechas publicadas)
  const getUpcomingDates = () => {
    const upcomingItems: any[] = [];
    
    console.log('[getUpcomingDates] eventDates:', eventDates);
    console.log('[getUpcomingDates] eventDates length:', eventDates?.length);
    
    eventDates?.forEach((date, index) => {
      console.log(`[getUpcomingDates] Processing date ${index}:`, date);
      
      // Usar el nombre específico de la fecha, o un nombre genérico si no existe
      const fechaNombre = (date as any).nombre || `Fecha ${fmtDate(date.fecha)}`;
      
      // Formatear hora si está disponible
      const horaFormateada = date.hora_inicio && date.hora_fin 
        ? `${date.hora_inicio} - ${date.hora_fin}`
        : date.hora_inicio || '';

      const item = {
        nombre: fechaNombre,
        date: fmtDate(date.fecha),
        time: horaFormateada,
        place: date.lugar || date.ciudad || '',
        href: `/social/fecha/${date.id}`,
        cover: Array.isArray(date.media) && date.media.length > 0 
          ? (date.media[0] as any)?.url || date.media[0]
          : undefined,
      };
      
      console.log(`[getUpcomingDates] Created item ${index}:`, item);
      upcomingItems.push(item);
    });

    console.log('[getUpcomingDates] Final upcomingItems:', upcomingItems);
    return upcomingItems;
  };

  const inviteItems = getUpcomingDates();

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
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
        }
        .org-banner-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 3rem;
          align-items: center;
        }
        
        /* Estilos para scroll horizontal */
        .dates-scroll-container {
          display: flex;
          gap: 0;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          scrollbar-width: thin;
          scrollbar-color: #1E88E566 transparent;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
        }
        
        .dates-scroll-container::-webkit-scrollbar {
          height: 8px;
        }
        
        .dates-scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        
        .dates-scroll-container::-webkit-scrollbar-thumb {
          background: #1E88E566;
          border-radius: 4px;
        }
        
        .dates-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #1E88E599;
        }
        
        /* Efectos de hover mejorados */
        .dates-scroll-container > div:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 16px 40px rgba(30, 136, 229, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3);
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
          
          .dates-scroll-container {
            gap: 0.75rem;
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
        <div 
          id="organizer-banner"
          data-test-id="organizer-banner"
          className="org-banner" 
          style={{
            position: 'relative',
            background: '#000000',
            overflow: 'hidden',
            borderRadius: '16px',
            padding: '3rem 2rem'
          }}
        >
          <div className="org-banner-grid">
            {/* Columna 1: Logo del Organizador */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div 
                id="organizer-avatar"
                data-test-id="organizer-avatar"
                className="org-banner-avatar" 
                style={{
                  width: '250px',
                  height: '250px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '6px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
                  background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
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
              <h1 
                id="organizer-name"
                data-test-id="organizer-name"
                style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  margin: 0,
                  color: colors.light,
                  lineHeight: '1.2'
                }}
              >
                {org.nombre_publico}
              </h1>

              {/* Chips de ritmos y zonas */}
              <div 
                id="organizer-chips"
                data-test-id="organizer-chips"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
              >
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
            id="organizer-bio"
            data-test-id="organizer-bio"
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
        {(() => {
          console.log('[OrganizerProfileLive] Organizer data:', org);
          console.log('[OrganizerProfileLive] Organizer respuestas:', (org as any)?.respuestas);
          console.log('[OrganizerProfileLive] Organizer redes_sociales:', (org as any)?.redes_sociales);
          return null;
        })()}
        <div
          id="organizer-social-media"
          data-test-id="organizer-social-media"
        >
          <SocialMediaSection 
            respuestas={(org as any)?.respuestas}
            redes_sociales={(org as any)?.redes_sociales}
            title="📱 Redes Sociales"
            availablePlatforms={['instagram', 'facebook', 'whatsapp']}
            style={{
              marginBottom: '2rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
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
        {console.log('[Render] inviteItems.length:', inviteItems.length)}
        {inviteItems.length > 0 && (
          <motion.section
            id="organizer-upcoming-dates"
            data-test-id="organizer-upcoming-dates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '2rem',
              padding: '2.5rem',
              background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.1) 0%, rgba(255, 61, 87, 0.05) 50%, rgba(255, 255, 255, 0.08) 100%)',
              borderRadius: '24px',
              border: '2px solid rgba(30, 136, 229, 0.2)',
              boxShadow: '0 12px 40px rgba(30, 136, 229, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Efecto de fondo animado */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(30, 136, 229, 0.1) 0%, transparent 70%)',
              animation: 'float 6s ease-in-out infinite',
              zIndex: 0
            }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                  📅
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
                    Próximas Fechas
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    opacity: 0.8,
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    Eventos programados
                  </p>
                </div>
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
                {inviteItems.length} fecha{inviteItems.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Cards de fechas en scroll horizontal */}
            <div className="dates-scroll-container" style={{ 
              position: 'relative', 
              zIndex: 1,
              height: '320px',
              paddingBottom: '1rem'
            }}>
              {inviteItems.map((ev, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.03,
                    boxShadow: '0 16px 40px rgba(30, 136, 229, 0.4), 0 8px 24px rgba(0, 0, 0, 0.3)'
                  }}
                  onClick={() => navigate(ev.href)}
                  style={{
                    minWidth: '380px',
                    maxWidth: '420px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    borderRadius: '24px',
                    border: '2px solid rgba(30, 136, 229, 0.2)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 12px 40px rgba(30, 136, 229, 0.25), 0 6px 20px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '280px',
                    position: 'relative',
                    backdropFilter: 'blur(10px)',
                    marginRight: '1.5rem',
                    scrollSnapAlign: 'start',
                    flexShrink: 0
                  }}
                >
                  {/* Efecto de brillo en hover */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    transition: 'left 0.6s ease',
                    zIndex: 1
                  }} />
                  
                  {/* Header con nombre y fecha */}
                  <div style={{ 
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.15) 0%, rgba(0, 188, 212, 0.1) 100%)',
                    borderBottom: '2px solid rgba(30, 136, 229, 0.2)',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        boxShadow: '0 6px 16px rgba(30, 136, 229, 0.4)'
                      }}>
                        📅
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          color: colors.light,
                          fontWeight: '800',
                          fontSize: '1.3rem',
                          margin: 0,
                          lineHeight: 1.2,
                          background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {ev.nombre}
                        </h3>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      color: colors.blue,
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.75rem 1rem',
                      background: 'rgba(30, 136, 229, 0.1)',
                      borderRadius: '15px',
                      border: '1px solid rgba(30, 136, 229, 0.2)'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>📅</span>
                      {ev.date}
                    </div>
                  </div>

                  {/* Información de la fecha */}
                  <div style={{ 
                    padding: '1.5rem',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {/* Hora (si está disponible) */}
                    {ev.time && (
                      <div style={{
                        fontSize: '1rem',
                        color: colors.light,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>🕐</span>
                        <span style={{ fontWeight: '700' }}>{ev.time}</span>
                      </div>
                    )}
                    
                    {/* Lugar */}
                    {ev.place && (
                      <div style={{
                        fontSize: '1rem',
                        color: colors.light,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span style={{ fontSize: '1.2rem' }}>📍</span>
                        <span style={{ fontWeight: '700' }}>{ev.place}</span>
                      </div>
                    )}

                    {/* CTA */}
                    <div style={{
                      marginTop: 'auto',
                      padding: '1rem 1.25rem',
                      borderRadius: '15px',
                      background: 'linear-gradient(135deg, rgba(30, 136, 229, 0.2), rgba(0, 188, 212, 0.2))',
                      border: '2px solid rgba(30, 136, 229, 0.3)',
                      textAlign: 'center',
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: colors.light,
                      boxShadow: '0 6px 20px rgba(30, 136, 229, 0.25)',
                      transition: 'all 0.3s ease'
                    }}>
                      👁️ Ver detalles
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Mis Sociales */}
        {console.log('[Render] parents.length:', parents?.length)}
        {parents && parents.length > 0 && (
          <motion.section
            id="organizer-social-events"
            data-test-id="organizer-social-events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              marginBottom: '2rem',
              padding: '2.5rem',
              background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.1) 0%, rgba(255, 140, 66, 0.05) 50%, rgba(255, 255, 255, 0.08) 100%)',
              borderRadius: '24px',
              border: '2px solid rgba(255, 61, 87, 0.2)',
              boxShadow: '0 12px 40px rgba(255, 61, 87, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Efecto de fondo animado */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255, 61, 87, 0.1) 0%, transparent 70%)',
              animation: 'float 8s ease-in-out infinite reverse',
              zIndex: 0
            }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FF3D57, #FF8C42)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  boxShadow: '0 8px 24px rgba(255, 61, 87, 0.4)'
                }}>
                  🎭
                </div>
                <div>
                  <h3 style={{
                    fontSize: '1.75rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #FF3D57 0%, #FF8C42 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    margin: 0,
                    lineHeight: 1.2
                  }}>
                    Mis Sociales
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    opacity: 0.8,
                    margin: 0,
                    fontWeight: '500'
                  }}>
                    Eventos sociales organizados
                  </p>
                </div>
              </div>
              <div style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.2), rgba(255, 140, 66, 0.2))',
                borderRadius: '25px',
                fontSize: '1rem',
                fontWeight: '700',
                color: colors.light,
                border: '1px solid rgba(255, 61, 87, 0.3)',
                boxShadow: '0 4px 16px rgba(255, 61, 87, 0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                {parents.length} social{parents.length !== 1 ? 'es' : ''}
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
              {parents.map((parent) => (
                <motion.div
                  key={parent.id}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -4,
                    boxShadow: '0 16px 40px rgba(255, 61, 87, 0.3), 0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}
                  style={{
                    padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    borderRadius: '20px',
                    border: '2px solid rgba(255, 61, 87, 0.2)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(255, 61, 87, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Efecto de brillo en hover */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    transition: 'left 0.6s ease',
                    zIndex: 1
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF3D57, #FF8C42)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        boxShadow: '0 4px 12px rgba(255, 61, 87, 0.3)'
                      }}>
                        🎭
                      </div>
                      <h4 style={{ 
                        fontSize: '1.4rem', 
                        fontWeight: '800', 
                        margin: 0, 
                        color: colors.light,
                        background: 'linear-gradient(135deg, #ffffff 0%, #ffebee 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        {parent.nombre}
                      </h4>
                    </div>
                    
                    {parent.descripcion && (
                      <p style={{ 
                        opacity: 0.9, 
                        marginBottom: '1rem', 
                        lineHeight: 1.6, 
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: colors.light
                      }}>
                        {parent.descripcion}
                      </p>
                    )}
                    
                    {parent.sede_general && (
                      <div style={{ 
                        fontSize: '0.9rem', 
                        opacity: 0.8, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        marginBottom: '1.5rem',
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span style={{ fontSize: '1rem' }}>📍</span>
                        <span style={{ fontWeight: '600' }}>{parent.sede_general}</span>
                      </div>
                    )}
                    
                    {/* Botón mejorado */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/social/${parent.id}`);
                        }}
                        style={{
                          padding: '1rem 2.5rem',
                          background: 'linear-gradient(135deg, rgba(255, 61, 87, 0.2), rgba(255, 140, 66, 0.2))',
                          border: '2px solid rgba(255, 61, 87, 0.3)',
                          borderRadius: '15px',
                          color: colors.light,
                          fontSize: '1rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 8px 24px rgba(255, 61, 87, 0.3)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        📅 Ver próximas fechas
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
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
        {((org as any)?.respuestas?.musica_tocaran || (org as any)?.respuestas?.hay_estacionamiento) && (
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