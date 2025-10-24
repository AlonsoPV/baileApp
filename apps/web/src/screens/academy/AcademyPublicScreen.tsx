import React, { useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { useAcademyMy } from "../../hooks/useAcademyMy";
import { useAcademyMedia } from "../../hooks/useAcademyMedia";
import { useListClassParentsByAcademy } from "../../hooks/useClassParent";
import { useTags } from "../../hooks/useTags";
import { ProfileShell } from "../../components/profile/ProfileShell";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";

const colors = {
  primary: '#E53935',
  secondary: '#FB8C00',
  blue: '#1E88E5',
  coral: '#FF7043',
  light: '#F5F5F5',
  dark: '#1A1A1A',
  orange: '#FF9800'
};

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
          aspectRatio: '16 / 9',
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

export default function AcademyPublicScreen() {
  const { academyId } = useParams();
  const { data: academy, isLoading } = useAcademyMy();
  const { media } = useAcademyMedia();
  const { data: allTags } = useTags();
  const { data: classes } = useListClassParentsByAcademy(academy?.id || 0);
  const [activeTab, setActiveTab] = useState<'info' | 'clases' | 'media'>('info');

  // Obtener fotos del carrusel usando los media slots
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(media, slot)?.url)
    .filter(Boolean) as string[];

  // Obtener videos
  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(media, slot)?.url)
    .filter(Boolean) as string[];

  // Get tag names from IDs
  const getEstiloNombres = () => {
    if (!allTags || !academy?.estilos) return [];
    return academy.estilos
      .map(id => allTags.find(tag => tag.id === id)?.nombre)
      .filter(Boolean);
  };

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
          Academia no encontrada
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          Esta academia no existe o no está disponible
        </p>
      </div>
    );
  }

  // Preparar chips de estado
  const statusChip = (
    <span
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        background: academy.estado_aprobacion === 'aprobado' ? '#10B981cc' : `${colors.orange}cc`,
        border: `2px solid ${academy.estado_aprobacion === 'aprobado' ? '#10B981' : colors.orange}`,
        color: colors.light,
        fontSize: '0.875rem',
        fontWeight: '700',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 2px 10px ${academy.estado_aprobacion === 'aprobado' ? '#10B981' : colors.orange}66`,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {academy.estado_aprobacion === 'aprobado' ? '✅' : '⏳'} {academy.estado_aprobacion}
    </span>
  );

  // Preparar chips de estilos
  const estiloChips = getEstiloNombres().map(estilo => ({
    label: estilo,
    active: true,
    variant: 'ritmo' as const
  }));

  return (
    <>
      {/* Navigation Toggle */}
      <ProfileNavigationToggle 
        currentView="live" 
        profileType="academy" 
      />

      <ProfileShell
        bannerGradient="linear-gradient(135deg, #E53935 0%, #FB8C00 100%)"
        avatar={getMediaBySlot(media, 'cover')?.url || getMediaBySlot(media, 'p1')?.url}
        avatarFallback={academy.nombre_publico?.[0]?.toUpperCase() || '🎓'}
        title={academy.nombre_publico}
        subtitle="Academia de Baile"
        statusChip={statusChip}
        chips={estiloChips}
        actions={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.open('/profile/academy/edit', '_blank')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '25px',
              color: 'white',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ✏️ Editar Academia
          </motion.button>
        }
      >
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          {[
            { id: 'info', label: '📚 Información', icon: '📚' },
            { id: 'clases', label: '🎓 Clases', icon: '🎓' },
            { id: 'media', label: '📷 Media', icon: '📷' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '1rem 1.5rem',
                background: activeTab === tab.id 
                  ? 'rgba(229, 57, 53, 0.2)' 
                  : 'transparent',
                border: 'none',
                borderRadius: '12px 12px 0 0',
                color: activeTab === tab.id ? colors.primary : 'rgba(255, 255, 255, 0.7)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <>
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

            {/* Redes Sociales */}
            <SocialMediaSection 
              respuestas={academy.respuestas}
              redes_sociales={academy.redes_sociales}
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

            {/* Maestros Invitados */}
            <InvitedMastersSection 
              masters={[]} // TODO: Conectar con datos reales
              title="🎭 Maestros Invitados"
              showTitle={true}
              isEditable={false}
            />
          </>
        )}

        {activeTab === 'clases' && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
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
              🎓 Nuestras Clases
            </h2>
            
            {classes && classes.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {classes.map((clase, index) => (
                  <motion.div
                    key={clase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '1.5rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: 'white',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {clase.nombre}
                    </h3>
                    {clase.descripcion && (
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        margin: '0 0 1rem 0',
                        lineHeight: 1.5
                      }}>
                        {clase.descripcion}
                      </p>
                    )}
                    {clase.sede_general && (
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        margin: '0 0 1rem 0',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        📍 {clase.sede_general}
                      </p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(`/clases/${clase.id}`, '_blank')}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #E53935, #FB8C00)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)'
                      }}
                    >
                      Ver Clase
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                <p style={{ margin: 0, fontSize: '1.1rem' }}>
                  Aún no hay clases disponibles
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                  Las clases aparecerán aquí cuando estén disponibles
                </p>
              </div>
            )}
          </motion.section>
        )}

        {activeTab === 'media' && (
          <>
            {/* Foto Principal */}
            {getMediaBySlot(media, 'p1') && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'center'
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
                    src={getMediaBySlot(media, 'p1')?.url || ''}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </motion.section>
            )}

            {/* Galería de Fotos */}
            {carouselPhotos.length > 0 && (
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
                  📷 Galería de Fotos
                </h3>
                <CarouselComponent photos={carouselPhotos} />
              </motion.section>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
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
                }}>
                  {videos.map((video, index) => (
                    <div
                      key={index}
                      style={{
                        aspectRatio: '16 / 9',
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
          </>
        )}
      </ProfileShell>
    </>
  );
}
