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

export default function EventParentPublicScreen() {
  const { parentId } = useParams<{ parentId: string }>();
  const navigate = useNavigate();
  const parentIdNum = parentId ? parseInt(parentId) : undefined;
  
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
          padding: 2rem;
          text-align: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px;
          backdrop-filter: blur(10px);
          transform: none;
        }

        .social-hero-modern {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(18, 18, 18, 0.9), rgba(18, 18, 18, 0.7));
          padding: 4rem 2rem;
          text-align: center;
          border-radius: 24px;
          margin: 2rem auto;
          max-width: 1200px;
        }
        
        .social-hero-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(30, 136, 229, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 61, 87, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 140, 66, 0.05) 0%, transparent 50%);
          animation: float 6s ease-in-out infinite;
        }
        
        .social-hero-content {
          position: relative;
          z-index: 2;
        }
        
        .social-hero-title {
          font-size: 4rem;
          font-weight: 900;
          background: linear-gradient(135deg, #1E88E5, #FF3D57);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 1.5rem;
          text-shadow: 0 4px 20px rgba(30, 136, 229, 0.3);
          letter-spacing: -0.02em;
        }
        
        .social-hero-description {
          font-size: 1.25rem;
          opacity: 0.9;
          max-width: 700px;
          margin: 0 auto 2.5rem;
          line-height: 1.6;
          font-weight: 500;
          color: rgba(245, 245, 245, 0.95);
        }
        
        .social-hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .social-main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          position: relative;
          z-index: 1;
        }
        
        .social-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .social-info-section {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .social-info-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: rgba(245, 245, 245, 0.95);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .social-info-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .social-info-chip {
          padding: 0.5rem 0.75rem;
          background: linear-gradient(135deg, rgba(30, 136, 229, 0.2), rgba(255, 61, 87, 0.2));
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(245, 245, 245, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .social-description-section {
          margin-bottom: 2rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .social-description-title {
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 1rem;
          color: rgba(245, 245, 245, 0.95);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .social-description-text {
          line-height: 1.6;
          font-size: 1.125rem;
          color: rgba(245, 245, 245, 0.9);
        }
        
        .social-faq-section {
          margin-bottom: 2rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .social-faq-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .social-faq-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FB8C00, #FF7043);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 8px 24px rgba(251, 140, 0, 0.4);
        }
        
        .social-faq-title {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #FF7043 0%, #FB8C00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          line-height: 1.2;
        }
        
        .social-faq-subtitle {
          font-size: 0.9rem;
          opacity: 0.8;
          margin: 0;
          font-weight: 500;
        }
        
        .social-faq-item {
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          margin-bottom: 1rem;
        }
        
        .social-faq-question {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0;
          margin-bottom: 0.5rem;
          color: rgba(245, 245, 245, 0.95);
        }
        
        .social-faq-answer {
          font-size: 1rem;
          opacity: 0.85;
          margin: 0;
          line-height: 1.6;
          color: rgba(245, 245, 245, 0.9);
        }
        
        .social-gallery-section {
          margin-bottom: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .social-gallery-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .social-gallery-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E53935, #FB8C00);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 8px 24px rgba(229, 57, 53, 0.4);
        }
        
        .social-gallery-title {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          line-height: 1.2;
        }
        
        .social-gallery-subtitle {
          font-size: 0.9rem;
          opacity: 0.8;
          margin: 0;
          font-weight: 500;
        }
        
        .social-dates-section {
          margin-bottom: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(30, 136, 229, 0.1) 0%, rgba(0, 188, 212, 0.05) 50%, rgba(255, 255, 255, 0.08) 100%);
          border-radius: 20px;
          border: 1px solid rgba(30, 136, 229, 0.2);
          box-shadow: 0 8px 32px rgba(30, 136, 229, 0.15), 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        
        .social-dates-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .social-dates-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1E88E5, #00BCD4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          box-shadow: 0 8px 24px rgba(30, 136, 229, 0.4);
        }
        
        .social-dates-title {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #1E88E5 0%, #00BCD4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
          line-height: 1.2;
        }
        
        .social-dates-subtitle {
          font-size: 0.9rem;
          opacity: 0.8;
          margin: 0;
          font-weight: 500;
        }
        
        .social-dates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .social-date-card {
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        
        .social-date-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .social-date-title {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: rgba(245, 245, 245, 0.95);
        }
        
        .social-date-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .social-date-info-item {
          font-size: 0.875rem;
          color: rgba(30, 136, 229, 0.8);
          font-weight: 600;
        }
        
        .social-date-info-item.gray {
          color: rgba(245, 245, 245, 0.7);
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/social/${parent.id}/edit`)}
                  style={{
                    padding: `${spacing[4]} ${spacing[8]}`,
                    borderRadius: borderRadius.full,
                    border: 'none',
                    background: colors.gradients.secondary,
                    color: colors.gray[50],
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    cursor: 'pointer',
                    boxShadow: colors.shadows.glow,
                    transition: transitions.normal,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2]
                  }}
                >
                  ✏️ Editar Social
                </motion.button>
              )}
              
              <ShareButton 
                url={window.location.href}
                title={parent.nombre}
                style={{
                  padding: `${spacing[4]} ${spacing[8]}`,
                  borderRadius: borderRadius.full,
                  border: 'none',
                  background: colors.gradients.deep,
                  color: colors.gray[50],
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  cursor: 'pointer',
                  boxShadow: colors.shadows.glow,
                  transition: transitions.normal,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2]
                }}
              />
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
              {getRitmoNombres().length > 0 && (
                <div className="social-info-section">
                  <h3 className="social-info-title">
                    🎵 Ritmos
                  </h3>
                  <div className="social-info-chips">
                    {getRitmoNombres().map((ritmo) => (
                      <span key={ritmo} className="social-info-chip">
                        {ritmo}
                      </span>
                    ))}
                  </div>
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="social-faq-item"
                  >
                    <h4 className="social-faq-question">
                      {faq.pregunta}
                    </h4>
                    <p className="social-faq-answer">
                      {faq.respuesta}
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
              
              <div className="social-dates-grid">
                {dates.map((date: any, index: number) => (
                  <motion.div
                    key={date.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -4
                    }}
                    onClick={() => navigate(`/social/fecha/${date.id}`)}
                    className="social-date-card"
                  >
                    <h4 className="social-date-title">
                      {date.nombre || 'Fecha del evento'}
                    </h4>
                    <div className="social-date-info">
                      <p className="social-date-info-item">
                        📅 {new Date(date.fecha).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {date.hora_inicio && (
                        <p className="social-date-info-item gray">
                          🕐 {date.hora_inicio}{date.hora_fin ? ` - ${date.hora_fin}` : ''}
                        </p>
                      )}
                      {date.lugar && (
                        <p className="social-date-info-item gray">
                          📍 {date.lugar}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}

