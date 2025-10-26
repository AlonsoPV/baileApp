import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyBrand, useUpsertBrand, useSubmitBrandForReview } from '../../hooks/useBrand';
import { useTags } from '../../hooks/useTags';
import { useHydratedForm } from '../../hooks/useHydratedForm';
import { getDraftKey } from '../../utils/draftKeys';
import { useRoleChange } from '../../hooks/useRoleChange';
import { useAuth } from '../../hooks/useAuth';
import { ProfileNavigationToggle } from '../../components/profile/ProfileNavigationToggle';
import { Chip } from '../../components/profile/Chip';
import { PhotoManagementSection } from '../../components/profile/PhotoManagementSection';
import { VideoManagementSection } from '../../components/profile/VideoManagementSection';
import SocialMediaSection from '../../components/profile/SocialMediaSection';
import ProductsEditor from '../../components/brand/ProductsEditor';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import ImageWithFallback from '../../components/ImageWithFallback';

export default function BrandProfileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: brand, isLoading } = useMyBrand();
  const upsert = useUpsertBrand();
  const submit = useSubmitBrandForReview();
  const { data: allTags } = useTags();
  
  // Hook para cambio de rol
  useRoleChange();

  const { form, setField, setNested, setAll } = useHydratedForm({
    draftKey: getDraftKey(user?.id, 'brand'),
    serverData: brand,
    defaults: {
      nombre_publico: "",
      bio: "",
      ritmos: [] as number[],
      zonas: [] as number[],
      redes_sociales: {
        instagram: "",
        tiktok: "",
        youtube: "",
        facebook: "",
        whatsapp: "",
        web: ""
      },
      media: [] as any[],
      productos: [] as any[]
    } as any
  });

  const handleSave = async () => {
    try {
      console.log("🚀 [BrandProfileEditor] ===== INICIANDO GUARDADO =====");
      console.log("📝 [BrandProfileEditor] Datos del formulario:", form);
      
      await upsert.mutateAsync({
        id: brand?.id,
        nombre_publico: form.nombre_publico,
        bio: form.bio,
        ritmos: form.ritmos,
        zonas: form.zonas,
        redes_sociales: form.redes_sociales,
        media: form.media,
        productos: form.productos,
      });
      
      console.log("✅ [BrandProfileEditor] Guardado exitoso");
    } catch (error) {
      console.error("❌ [BrandProfileEditor] Error al guardar:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (brand?.id) {
      try {
        await submit.mutateAsync(brand.id);
        console.log("✅ [BrandProfileEditor] Enviado a revisión");
      } catch (error) {
        console.error("❌ [BrandProfileEditor] Error al enviar a revisión:", error);
      }
    }
  };

  // Obtener nombres de tags
  const getRitmoNombres = () => {
    if (!allTags || !form.ritmos) return [];
    return form.ritmos
      .map(id => allTags.find(tag => tag.id === id && tag.tipo === 'ritmo'))
      .filter(Boolean)
      .map(tag => tag!.nombre);
  };

  const getZonaNombres = () => {
    if (!allTags || !form.zonas) return [];
    return form.zonas
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
        {/* Navigation Toggle */}
        <ProfileNavigationToggle
          currentView="edit"
          profileType="brand"
          onSave={handleSave}
          isSaving={upsert.isPending}
          saveDisabled={!form.nombre_publico?.trim()}
        />

        {/* Contenido principal */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[8] }}>
          {/* Información básica */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: borderRadius['2xl'],
            padding: spacing[8],
            marginBottom: spacing[8],
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing[6],
              color: colors.light
            }}>
              🏷️ Información de la Marca
            </h2>

            <div style={{ display: 'grid', gap: spacing[6] }}>
              {/* Nombre público */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  marginBottom: spacing[2],
                  color: colors.light
                }}>
                  Nombre de la marca *
                </label>
                <input
                  type="text"
                  value={form.nombre_publico || ''}
                  onChange={(e) => setField('nombre_publico', e.target.value)}
                  placeholder="Ej: Mi Marca de Baile"
                  style={{
                    width: '100%',
                    padding: spacing[3],
                    borderRadius: borderRadius.lg,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: colors.light,
                    fontSize: typography.fontSize.base
                  }}
                />
              </div>

              {/* Bio */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  marginBottom: spacing[2],
                  color: colors.light
                }}>
                  Descripción de la marca
                </label>
                <textarea
                  value={form.bio || ''}
                  onChange={(e) => setField('bio', e.target.value)}
                  placeholder="Cuéntanos sobre tu marca..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: spacing[3],
                    borderRadius: borderRadius.lg,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: colors.light,
                    fontSize: typography.fontSize.base,
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Ritmos y Zonas */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: borderRadius['2xl'],
            padding: spacing[8],
            marginBottom: spacing[8],
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing[6],
              color: colors.light
            }}>
              🎵 Ritmos y Zonas
            </h2>

            <div style={{ display: 'grid', gap: spacing[6] }}>
              {/* Ritmos seleccionados */}
              {getRitmoNombres().length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    marginBottom: spacing[3],
                    color: colors.light
                  }}>
                    Ritmos seleccionados:
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
                    {getRitmoNombres().map((nombre) => (
                      <Chip 
                        key={`r-${nombre}`} 
                        label={nombre} 
                        icon="🎵" 
                        variant="ritmo" 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Zonas seleccionadas */}
              {getZonaNombres().length > 0 && (
                <div>
                  <h3 style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    marginBottom: spacing[3],
                    color: colors.light
                  }}>
                    Zonas seleccionadas:
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2] }}>
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
              )}

              <p style={{
                fontSize: typography.fontSize.sm,
                color: colors.light,
                opacity: 0.7,
                fontStyle: 'italic'
              }}>
                Los ritmos y zonas se configuran desde el perfil principal
              </p>
            </div>
          </div>

          {/* Redes Sociales */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: borderRadius['2xl'],
            padding: spacing[8],
            marginBottom: spacing[8],
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <SocialMediaSection
              respuestas={form}
              redes_sociales={form.redes_sociales}
              onRedesChange={(redes) => setField('redes_sociales', redes)}
              title="Redes Sociales"
              availablePlatforms={['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp', 'web']}
            />
          </div>

          {/* Gestión de Media */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: borderRadius['2xl'],
            padding: spacing[8],
            marginBottom: spacing[8],
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              marginBottom: spacing[6],
              color: colors.light
            }}>
              📷 Galería de Media
            </h2>

            <div style={{ display: 'grid', gap: spacing[6] }}>
              <PhotoManagementSection
                media={form.media || []}
                onMediaChange={(media) => setField('media', media)}
                uploading={{}}
                onAddMedia={() => {}}
                onRemoveMedia={() => {}}
              />

              <VideoManagementSection
                media={form.media || []}
                onMediaChange={(media) => setField('media', media)}
                uploading={{}}
                onAddMedia={() => {}}
                onRemoveMedia={() => {}}
              />
            </div>
          </div>

          {/* Productos */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: borderRadius['2xl'],
            padding: spacing[8],
            marginBottom: spacing[8],
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <ProductsEditor
              value={form.productos || []}
              onChange={(productos) => setField('productos', productos)}
            />
          </div>

          {/* Estado de aprobación */}
          {brand && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius['2xl'],
              padding: spacing[6],
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                marginBottom: spacing[3],
                color: colors.light
              }}>
                Estado de Aprobación
              </h3>
              <p style={{
                fontSize: typography.fontSize.base,
                color: brand.estado_aprobacion === 'aprobado' ? colors.green : colors.orange,
                marginBottom: spacing[4]
              }}>
                {brand.estado_aprobacion === 'aprobado' ? '✅ Aprobado' : 
                 brand.estado_aprobacion === 'en_revision' ? '⏳ En revisión' : 
                 brand.estado_aprobacion === 'rechazado' ? '❌ Rechazado' : '📝 Borrador'}
              </p>
              
              {brand.estado_aprobacion === 'borrador' && (
                <button
                  onClick={handleSubmitReview}
                  disabled={submit.isPending}
          style={{
                    padding: `${spacing[3]} ${spacing[6]}`,
                    borderRadius: borderRadius.lg,
                    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                    color: 'white',
                    border: 'none',
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    cursor: 'pointer',
                    opacity: submit.isPending ? 0.6 : 1
                  }}
                >
                  {submit.isPending ? 'Enviando...' : 'Enviar a Revisión'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}