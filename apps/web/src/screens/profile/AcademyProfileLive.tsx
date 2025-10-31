import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAcademyMy } from "../../hooks/useAcademy";
import { useAcademyMedia } from "../../hooks/useAcademyMedia";
import { useTags } from "../../hooks/useTags";
import { fmtDate, fmtTime } from "../../utils/format";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import CostosyHorarios from './CostosyHorarios';
import ClasesLive from '../../components/events/ClasesLive';
import CrearClase from "../../components/events/CrearClase";
import { useUpsertAcademy } from "../../hooks/useAcademy";
import UbicacionesLive from "../../components/locations/UbicacionesLive";

// Componente FAQ Accordion
const FAQAccordion: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      marginBottom: '0.75rem',
      overflow: 'hidden',
      background: 'rgba(255, 255, 255, 0.02)'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '1rem 1.5rem',
          background: 'transparent',
          border: 'none',
          color: 'white',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '1rem',
          fontWeight: '600',
          transition: 'all 0.2s'
        }}
      >
        <span>{question}</span>
        <span style={{
          fontSize: '1.25rem',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: '0 1.5rem 1rem 1.5rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6
          }}
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
};
{/* sección eliminada: contenía referencias a variables no definidas (parents, spacing, typography) y no pertenece a Academy */ }
// Componente Carousel para fotos
const CarouselComponent: React.FC<{ photos: string[] }> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (photos.length === 0) return null;

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <>
      <div style={{
        position: 'relative',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* Imagen principal */}
        <div style={{
          position: 'relative',
          aspectRatio: '16/9',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 1,
            transform: 'none'
          }}>
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
          </div>

          {/* Contador */}
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
              transition: '0.2s'
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
              transition: '0.2s'
            }}
          >
            ›
          </button>
        </div>

        {/* Miniaturas */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => goToPhoto(index)}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: index === currentIndex ? '3px solid #E53935' : '2px solid rgba(255, 255, 255, 0.3)',
                cursor: 'pointer',
                background: 'transparent',
                padding: 0,
                transition: '0.2s'
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
            </button>
          ))}
        </div>
      </div>

      {/* Pantalla completa */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer'
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div style={{
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
          </div>
        </div>
      )}
    </>
  );
};

const colors = {
  primary: '#E53935',
  secondary: '#FB8C00',
  blue: '#1E88E5',
  coral: '#FF7043',
  light: '#F5F5F5',
  dark: '#1A1A1A',
  orange: '#FF9800'
};

export default function AcademyProfileLive() {
  const navigate = useNavigate();
  const { data: academy, isLoading } = useAcademyMy();
  const { media } = useAcademyMedia();
  const { data: allTags } = useTags();
  const upsert = useUpsertAcademy();

  // Obtener fotos del carrusel usando los media slots
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot)?.url)
    .filter(Boolean) as string[];

  // Obtener videos
  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(media as unknown as MediaSlotItem[], slot)?.url)
    .filter(Boolean) as string[];

  // Get rhythm names from either numeric tag IDs (ritmos/estilos) or catalog IDs (ritmos_seleccionados)
  const getRitmoNombres = () => {
    const names: string[] = [];
    if (allTags) {
      const tagToName = (ids?: number[]) => (ids || [])
        .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo')?.nombre)
        .filter(Boolean) as string[];
      // Prefer explicit ritmos, then estilos
      if (Array.isArray((academy as any)?.ritmos) && (academy as any).ritmos.length) {
        names.push(...tagToName((academy as any).ritmos));
      } else if (Array.isArray((academy as any)?.estilos) && (academy as any).estilos.length) {
        names.push(...tagToName((academy as any).estilos));
      }
    }
    // If no tag-based names, fallback to catalog IDs stored in ritmos_seleccionados
    if (names.length === 0 && Array.isArray((academy as any)?.ritmos_seleccionados)) {
      const labelById = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelById.set(i.id, i.label)));
      const extra = ((academy as any).ritmos_seleccionados as string[])
        .map(id => labelById.get(id))
        .filter(Boolean) as string[];
      names.push(...extra);
    }
    return names;
  };

  const getZonaNombres = () => {
    if (!allTags || !academy?.zonas) return [];
    return academy.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona')?.nombre)
      .filter(Boolean);
  };

  console.log('[AcademyProfileLive] Academy data:', academy);
  console.log('[AcademyProfileLive] Academy redes_sociales:', academy?.redes_sociales);

  if (isLoading) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
        <p>Cargando academia...</p>
      </div>
    );
  }

  if (!academy) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
          No tienes perfil de academia
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          Crea uno para dar clases
        </p>
        <p style={{ marginBottom: '16px', opacity: 0.8, fontSize: '0.95rem' }}>
          Para crear tu rol ve a edición y guarda tu nombre.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile/academy/edit')}
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
          🎓 Crear Academia
        </motion.button>
      </div>
    );
  }



  return (
    <>
      <style>{`
        .academy-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .academy-banner {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
        }
        .glass-card-container {
          opacity: 1;
          margin-bottom: 2rem;
          padding: 2rem;
          text-align: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px;
          backdrop-filter: blur(10px);
          transform: none;
        }
        .academy-banner-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          align-items: center;
        }
        .academy-banner-avatar {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          overflow: hidden;
          border: 6px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
          background: linear-gradient(135deg, #1E88E5, #FF7043);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          font-weight: 700;
          color: white;
        }
        .academy-banner-avatar-fallback {
          font-size: 6rem;
        }
        @media (max-width: 768px) {
          .academy-container {
            max-width: 100% !important;
            padding: 1rem !important;
          }
          .academy-banner {
            border-radius: 16px !important;
            padding: 1.5rem 1rem !important;
            margin: 0 !important;
          }
          .academy-banner-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
            gap: 1.5rem !important;
            justify-items: center !important;
          }
          .academy-banner h1 {
            font-size: 2rem !important;
            line-height: 1.2 !important;
          }
          .academy-banner-avatar {
            width: 180px !important;
            height: 180px !important;
          }
          .academy-banner-avatar-fallback {
            font-size: 4rem !important;
          }
          .glass-card-container {
            padding: 1rem !important;
            margin-bottom: 1rem !important;
            border-radius: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .academy-banner h1 {
            font-size: 1.75rem !important;
          }
          .academy-banner-avatar {
            width: 150px !important;
            height: 150px !important;
          }
          .academy-banner-avatar-fallback {
            font-size: 3.5rem !important;
          }
          .glass-card-container {
            padding: 0.75rem !important;
            border-radius: 12px !important;
          }
        }
        
        /* Responsive styles for sections */
        .academy-section {
          margin-bottom: 2rem;
          padding: 2rem;
        }
        .academy-videos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .academy-container {
            padding: 1rem !important;
          }
          .academy-section {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
          }
          .academy-section h2, .academy-section h3 {
            font-size: 1.25rem !important;
            margin-bottom: 1rem !important;
          }
          .academy-videos-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .academy-section {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 12px !important;
          }
          .academy-section h2, .academy-section h3 {
            font-size: 1.1rem !important;
          }
          .academy-videos-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>

      <div className="academy-container">
        {/* Navigation Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="academy"
          />
        </div>

        {/* Banner Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="academy-banner glass-card-container"
          style={{
            position: 'relative',
            margin: '0 auto',
            overflow: 'hidden'
          }}
        >
          <div className="academy-banner-grid">
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <div className="academy-banner-avatar">
                {getMediaBySlot(media as unknown as MediaSlotItem[], 'cover')?.url || getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url ? (
                  <img
                    src={getMediaBySlot(media as unknown as MediaSlotItem[], 'cover')?.url || getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url || ''}
                    alt="Logo de la academia"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className="academy-banner-avatar-fallback" style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '6rem',
                    fontWeight: '700',
                    color: 'white'
                  }}>
                    {academy.nombre_publico?.[0]?.toUpperCase() || '🎓'}
                  </div>
                )}
              </div>
            </div>

            <div>

              <h1 style={{
                fontSize: '3rem',
                display: 'inline',
                fontWeight: '800',
                color: 'white',
                margin: '0 0 0.5rem 0',
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}>
                {academy.nombre_publico}
              </h1>
              {(academy as any)?.estado_aprobacion === 'aprobado' && (
                <span style={{
                  marginLeft: 12,
                  border: '1px solid rgb(255 255 255 / 40%)',
                  background: 'rgb(25 25 25 / 70%)',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  color: '#9be7a1',
                  whiteSpace: 'nowrap',
                  verticalAlign: 'middle',
                  display: 'inline-block'
                }}>
                  ✅ Verificado
                </span>
              )}
              <p style={{
                fontSize: '1.25rem',
                color: 'rgba(255, 255, 255, 0.9)',
                margin: '0 0 1.5rem 0',
                lineHeight: 1.4
              }}>
                Academia de Baile
              </p>

              {/* Chips de Ritmos y Zonas dentro del banner */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {getRitmoNombres().map((ritmo, index) => (
                  <Chip
                    key={`ritmo-${index}`}
                    label={ritmo}
                    active={true}
                    variant="ritmo"
                    style={{
                      background: 'rgba(229, 57, 53, 0.2)',
                      border: '1px solid #E53935',
                      color: '#E53935',
                      fontWeight: '600'
                    }}
                  />
                ))}
                {getZonaNombres().map((zona, index) => (
                  <Chip
                    key={`zona-${index}`}
                    label={zona}
                    active={true}
                    variant="zona"
                    style={{
                      background: 'rgba(25, 118, 210, 0.2)',
                      border: '1px solid #1976D2',
                      color: '#90CAF9',
                      fontWeight: '600'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contenido Principal */}
        <div style={{ padding: '2rem 0' }}>
          {/* Bio */}
          {academy.bio && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 1rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📚 Sobre Nosotros
              </h2>
              <p style={{
                fontSize: '1.1rem',
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0
              }}>
                {academy.bio}
              </p>
            </motion.section>
          )}

          {/* Ritmos de Baile */}
          {/*   {academy.ritmos && academy.ritmos.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 1.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎵 Estilos que Enseñamos
              </h2>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                {getRitmoNombres().map((ritmo, index) => (
                  <Chip
                    key={index}
                    label={ritmo}
                    active={true}
                    variant="ritmo"
                    style={{
                      background: 'rgba(229, 57, 53, 0.2)',
                      border: '1px solid #E53935',
                      color: '#E53935',
                      fontWeight: '600'
                    }}
                  />
                ))}
              </div>
            </motion.section>
          )} */}
          {/* Clases & Tarifas (visualización) */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="academy-section"
            style={{
              marginBottom: '2rem',
              padding: '2.5rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: '24px',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Top gradient bar */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #E53935, #FB8C00, #FFD166)',
              opacity: 0.9
            }} />

            {/* Header destacado */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 1
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)'
              }}>
                🎓
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.75rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  Nuestras clases
                </h2>
                <p style={{
                  fontSize: '0.9rem',
                  opacity: 0.8,
                  margin: '0.25rem 0 0 0',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  Horarios, costos y ubicaciones
                </p>
              </div>
            </div>

            {/* Contenido de clases */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <ClasesLive
                title=""
                cronograma={(academy as any)?.cronograma || []}
                costos={(academy as any)?.costos || []}
                ubicacion={{
                  nombre: (academy as any)?.ubicaciones?.[0]?.nombre,
                  direccion: (academy as any)?.ubicaciones?.[0]?.direccion,
                  ciudad: (academy as any)?.ubicaciones?.[0]?.ciudad,
                  referencias: (academy as any)?.ubicaciones?.[0]?.referencias
                }}
                showCalendarButton={true}
              />
            </div>
          </motion.section>

          {/* Ubicaciones (live) */}
          {Array.isArray((academy as any)?.ubicaciones) && (academy as any).ubicaciones.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <UbicacionesLive ubicaciones={(academy as any).ubicaciones} />
            </motion.section>
          )}


          {/* FAQ estilo Organizer (si hay FAQ en el perfil) */}
          {Array.isArray((academy as any)?.faq) && (academy as any).faq.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              style={{
                marginBottom: '2rem',
                marginTop: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #FB8C00, #FF7043)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 24px rgba(251, 140, 0, 0.4)' }}>❓</div>
                <div>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: '800', background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, lineHeight: 1.2 }}>Información para Estudiantes</h3>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500' }}>Preguntas frecuentes</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(academy as any).faq.map((faq: any, index: number) => (
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} style={{ padding: '1rem 1.25rem', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem' }}>{faq.q}</h4>
                    <p style={{ fontSize: '1rem', opacity: 0.85, margin: 0, lineHeight: 1.6 }}>{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
          {/* Redes Sociales */}
          <SocialMediaSection
            respuestas={{ redes: academy.redes_sociales }}
            redes_sociales={academy.redes_sociales}
            title="Redes Sociales"
            availablePlatforms={['instagram', 'facebook', 'whatsapp']}
            style={{
              marginBottom: '2rem',
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              borderRadius: '20px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          />

          {/* Maestros Invitados */}
          <InvitedMastersSection
            masters={[]} // TODO: Conectar con datos reales en el siguiente sprint
            title="🎭 Maestros Invitados"
            showTitle={true}
            isEditable={false}
          />

          {/* Foto Principal */}
          {getMediaBySlot(media as unknown as MediaSlotItem[], 'p1') && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
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
                height: 'auto',
                aspectRatio: '16/9',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}>
                <ImageWithFallback
                  alt="Foto principal"
                  src={getMediaBySlot(media as unknown as MediaSlotItem[], 'p1')?.url || ''}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              id="user-profile-photo-gallery"
              data-baile-id="user-profile-photo-gallery"
              data-test-id="user-profile-photo-gallery"
              style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                opacity: 1,
                transform: 'none'
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
                  gap: '0.5rem',
                  margin: 0
                }}>
                  📷 Galería de Fotos
                </h3>
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'rgba(245, 245, 245, 0.9)'
                }}>
                  {carouselPhotos.length} fotos
                </div>
              </div>
              <CarouselComponent photos={carouselPhotos} />
            </motion.section>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="academy-section"
              style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #E53935 0%, #FB8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 1.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎥 Videos
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}
                className="academy-videos-grid"
              >
                {videos.map((video, index) => (
                  <div
                    key={index}
                    style={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '16/9',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
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
                  </div>
                ))}
              </div>
            </motion.section>
          )}


        </div>
      </div>
    </>
  );
}
