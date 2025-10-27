import React from 'react';
import { useParams } from 'react-router-dom';
import { ProfileNavigationToggle } from '../../components/profile/ProfileNavigationToggle';
import { useBrandPublic } from '../../hooks/useBrand';
import { useTags } from '../../hooks/useTags';
import SocialMediaSection from '../../components/profile/SocialMediaSection';
import ProductsGrid from '../../components/brand/ProductsGrid';
import { Chip } from '../../components/profile/Chip';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import '@/styles/organizer.css';
import ImageWithFallback from '../../components/ImageWithFallback';

export default function BrandPublicScreen() {
  const { brandId } = useParams();
  const id = Number(brandId);
  const { data: brand, isLoading } = useBrandPublic(id);
  const { data: allTags } = useTags();

  // Obtener nombres de tags
  const getRitmoNombres = () => {
    if (!allTags || !brand?.ritmos) return [];
    return brand.ritmos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !brand?.zonas) return [];
    return brand.zonas
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'zona'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  if (isLoading) {
    return (
      <div style={{
        padding: spacing[12],
        textAlign: 'center',
        color: colors.light,
        background: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>⏳</div>
        <p style={{ fontSize: typography.fontSize.lg }}>Cargando marca...</p>
      </div>
    );
  }

  if (!brand) {
    return (
      <div style={{
        padding: spacing[12],
        textAlign: 'center',
        color: colors.light,
        background: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>❌</div>
        <h2 style={{ fontSize: typography.fontSize['2xl'], marginBottom: spacing[4] }}>
          Marca no disponible
        </h2>
        <p style={{ marginBottom: spacing[6], opacity: 0.7, fontSize: typography.fontSize.lg }}>
          Esta marca no existe o no está aprobada
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: ${typography.fontFamily.primary};
        }
      `}</style>
      
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: colors.light,
        position: 'relative'
      }}>
        <div className="profile-toggle">
          <ProfileNavigationToggle
            currentView="live"
            profileType="brand"
            liveHref={`/marca/${brand.id}`}
            editHref="/profile/brand"
          />
        </div>
        {/* Banner de la marca */}
        <div className="org-banner" style={{
          position: 'relative',
          background: brand.portada_url 
            ? `url(${brand.portada_url}) center/cover`
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
        }}>
          <div className="org-banner-grid">
            {/* Avatar circular grande */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid rgba(255, 255, 255, 0.2)',
                background: 'linear-gradient(135deg, #FF3D57, #FF8C42)',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
              }}>
                {brand.avatar_url ? (
                  <img
                    src={brand.avatar_url}
                    alt={brand.nombre_publico}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem'
                  }}>
                    🏷️
                  </div>
                )}
                <div className="shimmer-effect" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
              </div>
            </div>

            {/* Nombre, bio y chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4], justifyContent: 'center' }}>
              <h1 className="gradient-text" style={{
                fontSize: typography.fontSize['5xl'],
                fontWeight: typography.fontWeight.black,
                margin: 0,
                lineHeight: typography.lineHeight.tight
              }}>
                {brand.nombre_publico}
              </h1>
              {brand.bio && (
                <p style={{ fontSize: typography.fontSize.lg, opacity: 0.9, margin: 0, lineHeight: typography.lineHeight.relaxed }}>
                  {brand.bio}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                {getRitmoNombres().map((nombre) => (
                  <Chip key={`r-${nombre}`} label={nombre} icon="🎵" variant="ritmo" />
                ))}
                {getZonaNombres().map((nombre) => (
                  <Chip key={`z-${nombre}`} label={nombre} icon="📍" variant="zona" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="org-container" style={{ padding: spacing[8] }}>
          {/* Redes Sociales */}
          <div className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
            <SocialMediaSection 
              respuestas={{ redes: brand.redes_sociales }}
              redes_sociales={brand.redes_sociales}
              title="Redes Sociales"
              availablePlatforms={['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp']}
            />
          </div>

          {/* Galería de medios */}
          {Array.isArray(brand.media) && brand.media.length > 0 && (
            <div className="glass-card" style={{ marginBottom: spacing[8], padding: spacing[8], borderRadius: borderRadius['2xl'] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4], marginBottom: spacing[6] }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF3D57, #FF8C42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: typography.fontSize['2xl'] }}>📷</div>
                <div>
                  <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, margin: 0, color: colors.light }}>Galería</h2>
                  <p style={{ fontSize: typography.fontSize.sm, opacity: 0.8, margin: 0, color: colors.light }}>{brand.media.length} elemento{brand.media.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing[4] }}>
                {brand.media.map((item, index) => (
                  <div key={index} style={{ borderRadius: borderRadius.xl, overflow: 'hidden', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {item.type === 'image' ? (
                      <img src={item.url} alt={`Imagen ${index + 1}`} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                    ) : (
                      <video src={item.url} controls style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Productos */}
          <ProductsGrid items={brand.productos || []} />
        </div>
      </div>
    </>
  );
}
