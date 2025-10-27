import React from 'react';
import { useParams } from 'react-router-dom';
import { ProfileNavigationToggle } from '../../components/profile/ProfileNavigationToggle';
import { useBrandPublic } from '../../hooks/useBrand';
import { useTags } from '../../hooks/useTags';
import SocialMediaSection from '../../components/profile/SocialMediaSection';
import ProductsGrid from '../../components/brand/ProductsGrid';
import { Chip } from '../../components/profile/Chip';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
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
        <div style={{ position: 'sticky', top: 80, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
          <ProfileNavigationToggle
            currentView="live"
            profileType="brand"
            liveHref={`/marca/${brand.id}`}
            editHref="/profile/brand"
          />
        </div>
        {/* Banner de la marca */}
        <div style={{
          position: 'relative',
          height: '400px',
          background: brand.portada_url 
            ? `url(${brand.portada_url}) center/cover`
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {/* Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%)'
          }} />
          
          {/* Contenido del banner */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            maxWidth: '800px',
            padding: spacing[8]
          }}>
            {/* Avatar */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              margin: '0 auto',
              marginBottom: spacing[4],
              overflow: 'hidden',
              border: '4px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)'
            }}>
              {brand.avatar_url ? (
                <img
                  src={brand.avatar_url}
                  alt={brand.nombre_publico}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  background: 'linear-gradient(135deg, #FF3D57, #FF8C42)'
                }}>
                  🏷️
                </div>
              )}
            </div>
            
            <h1 style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.black,
              margin: 0,
              marginBottom: spacing[2],
              background: 'linear-gradient(135deg, #FF3D57 0%, #FF8C42 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {brand.nombre_publico}
            </h1>
            
            {brand.bio && (
              <p style={{
                fontSize: typography.fontSize.lg,
                opacity: 0.9,
                margin: 0,
                lineHeight: typography.lineHeight.relaxed
              }}>
                {brand.bio}
              </p>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[8] }}>
          {/* Chips de ritmos y zonas */}
          <div style={{ marginBottom: spacing[8] }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], justifyContent: 'center' }}>
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
          </div>

          {/* Redes Sociales */}
          <div style={{ marginBottom: spacing[8] }}>
            <SocialMediaSection 
              respuestas={{ redes: brand.redes_sociales }}
              redes_sociales={brand.redes_sociales}
              title="Redes Sociales"
              availablePlatforms={['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp']}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: borderRadius['2xl'],
                padding: spacing[6],
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>

          {/* Galería de medios */}
          {Array.isArray(brand.media) && brand.media.length > 0 && (
            <div style={{ marginBottom: spacing[8] }}>
              <h2 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[6],
                color: colors.light
              }}>
                📷 Galería
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: spacing[4]
              }}>
                {brand.media.map((item, index) => (
                  <div key={index} style={{
                    borderRadius: borderRadius.xl,
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={`Imagen ${index + 1}`}
                        style={{
                          width: '100%',
                          aspectRatio: '16/9',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        style={{
                          width: '100%',
                          aspectRatio: '16/9',
                          objectFit: 'cover'
                        }}
                      />
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
