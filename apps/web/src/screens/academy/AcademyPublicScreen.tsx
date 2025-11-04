import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAcademyPublic } from '../../hooks/useAcademy';
import { useTags } from '../../hooks/useTags';
import SocialMediaSection from '../../components/profile/SocialMediaSection';
import { Chip } from '../../components/profile/Chip';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { ProfileNavigationToggle } from '../../components/profile/ProfileNavigationToggle';
import ImageWithFallback from '../../components/ImageWithFallback';
import ClasesLive from '../../components/events/ClasesLive';
import UbicacionesLive from '../../components/locations/UbicacionesLive';
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from '../../utils/mediaSlots';
import { RITMOS_CATALOG } from '@/lib/ritmosCatalog';

export default function AcademyPublicScreen() {
  const { academyId } = useParams();
  const id = Number(academyId);
  const { data: academy, isLoading } = useAcademyPublic(id);
  const { data: allTags } = useTags();

  const media = (academy as any)?.media || [];
  const carouselPhotos = PHOTO_SLOTS
    .map(slot => getMediaBySlot(media as any, slot)?.url)
    .filter(Boolean) as string[];
  const videos = VIDEO_SLOTS
    .map(slot => getMediaBySlot(media as any, slot)?.url)
    .filter(Boolean) as string[];

  const getRitmoNombres = () => {
    const names: string[] = [];
    if (allTags) {
      const tagToName = (ids?: number[]) => (ids || [])
        .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo')?.nombre)
        .filter(Boolean) as string[];
      if (Array.isArray((academy as any)?.ritmos) && (academy as any).ritmos.length) {
        names.push(...tagToName((academy as any).ritmos));
      } else if (Array.isArray((academy as any)?.estilos) && (academy as any).estilos.length) {
        names.push(...tagToName((academy as any).estilos));
      }
    }
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
    if (!allTags || !(academy as any)?.zonas) return [];
    return ((academy as any).zonas as number[])
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona')?.nombre)
      .filter(Boolean) as string[];
  };

  if (isLoading) {
    return (
      <div style={{
        padding: spacing[12], textAlign: 'center', color: colors.light,
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
        <p style={{ fontSize: typography.fontSize.lg }}>Cargando academia...</p>
      </div>
    );
  }

  if (!academy) {
    return (
      <div style={{
        padding: spacing[12], textAlign: 'center', color: colors.light,
        background: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>❌</div>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>Academia no disponible</h2>
        <p style={{ marginBottom: spacing[6], opacity: 0.7, fontSize: typography.fontSize.lg }}>
          Esta academia no existe o no está aprobada
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .academy-container { width: 100%; max-width: 900px; margin: 0 auto; }
        .academy-banner { width: 100%; max-width: 900px; margin: 0 auto; position: relative; }
        .glass-card-container {
          opacity: 1; margin-bottom: 2rem; padding: 2rem; text-align: center;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
          border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px; backdrop-filter: blur(10px);
        }
        .section-title { font-size: 1.5rem; font-weight: 800; margin: 0 0 1rem 0;
          background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: flex; align-items: center; gap: .5rem;
        }
        .academy-banner-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; align-items: center; }
        .academy-banner-avatar { width: 200px; height: 200px; border-radius: 50%; overflow: hidden; border: 6px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8); background: linear-gradient(135deg, #1E88E5, #FF7043); display: flex; align-items: center; justify-content: center; font-size: 4rem; font-weight: 700; color: white; }
        @media (max-width: 768px) {
          .academy-container { max-width: 100% !important; padding: 1rem !important; }
          .academy-banner { border-radius: 16px !important; padding: 1.5rem 1rem !important; margin: 0 !important; }
          .academy-banner-grid { grid-template-columns: 1fr !important; text-align: center; gap: 1.5rem !important; justify-items: center !important; }
          .glass-card-container { padding: 1rem !important; margin-bottom: 1rem !important; border-radius: 16px !important; }
        }
        @media (max-width: 480px) {
          .academy-banner h1 { font-size: 1.75rem !important; }
          .academy-banner-avatar { width: 150px !important; height: 150px !important; }
          .glass-card-container { padding: 0.75rem !important; border-radius: 12px !important; }
        }
      `}</style>

      <div className="academy-container">
        {/* Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          <ProfileNavigationToggle currentView="live" profileType="academy" />
        </div>

        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="academy-banner glass-card-container"
          style={{ position: 'relative', margin: '0 auto', overflow: 'hidden' }}
        >
          <div className="academy-banner-grid">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="academy-banner-avatar">
                {getMediaBySlot(media as any, 'cover')?.url || getMediaBySlot(media as any, 'p1')?.url ? (
                  <img
                    src={getMediaBySlot(media as any, 'cover')?.url || getMediaBySlot(media as any, 'p1')?.url || ''}
                    alt="Logo de la academia"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem', fontWeight: '700', color: 'white' }}>
                    {(academy as any)?.nombre_publico?.[0]?.toUpperCase() || '🎓'}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h1 style={{ fontSize: '3rem', display: 'inline', fontWeight: '800', color: 'white', margin: '0 0 0.5rem 0', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                {(academy as any)?.nombre_publico}
              </h1>
              <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>
                Academia de Baile
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {getRitmoNombres().map((nombre) => (
                  <Chip key={`r-${nombre}`} label={nombre} icon="🎵" variant="ritmo" />
                ))}
                {getZonaNombres().map((nombre) => (
                  <Chip key={`z-${nombre}`} label={nombre} icon="📍" variant="zona" />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        {(academy as any)?.bio && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-card-container">
            <h3 className="section-title">💬 Sobre Nosotros</h3>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{(academy as any).bio}</p>
          </motion.section>
        )}

        {/* Clases & Tarifas */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="glass-card-container" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #E53935, #FB8C00, #FFD166)', opacity: 0.9 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #E53935, #FB8C00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)' }}>🎓</div>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>Nuestras clases</h2>
              <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500', color: 'rgba(255, 255, 255, 0.9)' }}>
                Horarios, costos y ubicaciones
              </p>
            </div>
          </div>
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

        {/* Ubicaciones */}
        {Array.isArray((academy as any)?.ubicaciones) && (academy as any).ubicaciones.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="glass-card-container">
            <UbicacionesLive ubicaciones={(academy as any).ubicaciones} />
          </motion.section>
        )}

        {/* Redes Sociales */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="glass-card-container">
          <h3 className="section-title">🌐 Redes Sociales</h3>
          <SocialMediaSection respuestas={{ redes: (academy as any)?.redes_sociales }} redes_sociales={(academy as any)?.redes_sociales} availablePlatforms={['instagram','facebook','whatsapp','tiktok','youtube']} />
        </motion.section>

        {/* Galería de Fotos */}
        {carouselPhotos.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }} className="glass-card-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #E53935, #FB8C00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'], boxShadow: '0 8px 24px rgba(229, 57, 53, 0.4)' }}>📷</div>
              <div>
                <h3 className="section-title" style={{ margin: 0 }}>Galería de Fotos</h3>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0, fontWeight: '500' }}>{carouselPhotos.length} foto{carouselPhotos.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing[4] }}>
              {carouselPhotos.map((src, index) => (
                <div key={index} style={{ borderRadius: borderRadius.xl, overflow: 'hidden', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <ImageWithFallback src={src} alt={`Imagen ${index + 1}`} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="glass-card-container">
            <h3 className="section-title">🎥 Videos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {videos.map((video, index) => (
                <div key={index} style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.1)' }}>
                  <video src={video} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </>
  );
}