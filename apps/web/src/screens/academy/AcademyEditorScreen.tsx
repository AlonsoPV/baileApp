import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademyMy, useUpsertAcademy, useSubmitAcademyForReview } from '../../hooks/useAcademy';
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
import UbicacionesEditor from '../../components/academy/UbicacionesEditor';
import HorariosEditor from '../../components/academy/HorariosEditor';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';

export default function AcademyEditorScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: academy, isLoading } = useAcademyMy();
  const upsert = useUpsertAcademy();
  const submit = useSubmitAcademyForReview();
  const { data: allTags } = useTags();
  
  // Hook para cambio de rol
  useRoleChange();

  const { form, setField, setNested, setAll } = useHydratedForm({
    draftKey: getDraftKey(user?.id, 'academy'),
    serverData: academy,
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
      ubicaciones: [] as any[],
      horarios: [] as any[],
      media: [] as any[]
    } as any
  });

  const handleSave = async () => {
    try {
      console.log("🚀 [AcademyEditorScreen] ===== INICIANDO GUARDADO =====");
      console.log("📝 [AcademyEditorScreen] Datos del formulario:", form);
      
      await upsert.mutateAsync({
        id: academy?.id,
        nombre_publico: form.nombre_publico,
        bio: form.bio,
        ritmos: form.ritmos,
        zonas: form.zonas,
        redes_sociales: form.redes_sociales,
        ubicaciones: form.ubicaciones,
        horarios: form.horarios,
        media: form.media,
      });
      
      console.log("✅ [AcademyEditorScreen] Guardado exitoso");
    } catch (error) {
      console.error("❌ [AcademyEditorScreen] Error al guardar:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (academy?.id) {
      try {
        await submit.mutateAsync(academy.id);
        console.log("✅ [AcademyEditorScreen] Enviado a revisión");
      } catch (error) {
        console.error("❌ [AcademyEditorScreen] Error al enviar a revisión:", error);
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
        <p style={{ fontSize: typography.fontSize.lg }}>Cargando academia...</p>
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
        padding: spacing[8],
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header con botón Volver */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing[8]
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                borderRadius: borderRadius.lg,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: colors.light,
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                transition: 'all 0.2s ease'
              }}
            >
              ← Volver
            </button>
            
            <ProfileNavigationToggle
              currentView="edit"
              profileType="academy"
              onSave={handleSave}
              isSaving={upsert.isPending}
              saveDisabled={!form.nombre_publico}
            />
          </div>

          {/* Banner de la academia */}
          <div style={{
            position: 'relative',
            height: '300px',
            borderRadius: borderRadius['2xl'],
            overflow: 'hidden',
            marginBottom: spacing[8],
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 2
            }}>
              <h1 style={{
                fontSize: typography.fontSize['4xl'],
                fontWeight: typography.fontWeight.black,
                margin: 0,
                background: 'linear-gradient(135deg, #FF3D57 0%, #FF8C42 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: spacing[2]
              }}>
                {form.nombre_publico || 'Mi Academia'}
              </h1>
              <p style={{
                fontSize: typography.fontSize.lg,
                opacity: 0.8,
                margin: 0
              }}>
                {form.bio || 'Edita tu perfil de academia'}
              </p>
            </div>
          </div>

          {/* Formulario */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: borderRadius['2xl'],
            padding: spacing[8],
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* Información básica */}
            <div style={{ marginBottom: spacing[8] }}>
              <h2 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[6],
                color: colors.light
              }}>
                📝 Información Básica
              </h2>
              
              <div style={{ marginBottom: spacing[4] }}>
                <label style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  marginBottom: spacing[2],
                  color: colors.light
                }}>
                  Nombre de la academia *
                </label>
                <input
                  type="text"
                  value={form.nombre_publico}
                  onChange={(e) => setField('nombre_publico', e.target.value)}
                  placeholder="Nombre de tu academia"
                  style={{
                    width: '100%',
                    padding: `${spacing[3]} ${spacing[4]}`,
                    borderRadius: borderRadius.lg,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: colors.light,
                    fontSize: typography.fontSize.base
                  }}
                />
              </div>

              <div style={{ marginBottom: spacing[4] }}>
                <label style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  marginBottom: spacing[2],
                  color: colors.light
                }}>
                  Biografía
                </label>
                <textarea
                  value={form.bio || ''}
                  onChange={(e) => setField('bio', e.target.value)}
                  placeholder="Cuéntanos sobre tu academia..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: `${spacing[3]} ${spacing[4]}`,
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

            {/* Ritmos y Zonas */}
            <div style={{ marginBottom: spacing[8] }}>
              <h2 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[6],
                color: colors.light
              }}>
                🎵 Ritmos y Zonas
              </h2>
              
              <div style={{ marginBottom: spacing[4] }}>
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

              <div style={{ marginBottom: spacing[4] }}>
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
            </div>

            {/* Redes Sociales */}
            <div style={{ marginBottom: spacing[8] }}>
              <SocialMediaSection 
                respuestas={form}
                redes_sociales={form.redes_sociales}
                title="Redes Sociales"
                availablePlatforms={['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp', 'web']}
                isEditable={true}
                onUpdate={(redes) => setField('redes_sociales', redes)}
              />
            </div>

            {/* Ubicaciones */}
            <div style={{ marginBottom: spacing[8] }}>
              <UbicacionesEditor 
                value={form.ubicaciones} 
                onChange={(ubicaciones) => setField('ubicaciones', ubicaciones)} 
              />
            </div>

            {/* Horarios */}
            <div style={{ marginBottom: spacing[8] }}>
              <HorariosEditor 
                value={form.horarios} 
                onChange={(horarios) => setField('horarios', horarios)} 
              />
            </div>

            {/* Gestión de Media */}
            <div style={{ marginBottom: spacing[8] }}>
              <h2 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                marginBottom: spacing[6],
                color: colors.light
              }}>
                📷 Galería de Medios
              </h2>
              
              <PhotoManagementSection
                media={form.media}
                uploading={{}}
                uploadFile={() => {}}
                removeFile={() => {}}
                title="📷 Fotos de la Academia"
                description="Sube fotos de tus instalaciones, clases y eventos"
                slots={['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']}
              />

              <VideoManagementSection
                media={form.media}
                uploading={{}}
                uploadFile={() => {}}
                removeFile={() => {}}
                title="🎥 Videos de la Academia"
                description="Videos de clases, eventos, promocionales"
                slots={['v1', 'v2', 'v3']}
              />
            </div>

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              gap: spacing[4],
              justifyContent: 'flex-end',
              marginTop: spacing[8]
            }}>
              <button
                onClick={handleSave}
                disabled={upsert.isPending || !form.nombre_publico}
                style={{
                  padding: `${spacing[3]} ${spacing[6]}`,
                  borderRadius: borderRadius.lg,
                  background: 'linear-gradient(135deg, #1E88E5, #00BCD4)',
                  border: 'none',
                  color: colors.light,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: upsert.isPending || !form.nombre_publico ? 'not-allowed' : 'pointer',
                  opacity: upsert.isPending || !form.nombre_publico ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {upsert.isPending ? 'Guardando...' : '💾 Guardar'}
              </button>
              
              {academy?.id && (
                <button
                  onClick={handleSubmitReview}
                  disabled={submit.isPending}
                  style={{
                    padding: `${spacing[3]} ${spacing[6]}`,
                    borderRadius: borderRadius.lg,
                    background: 'linear-gradient(135deg, #FF8C42, #FFD166)',
                    border: 'none',
                    color: colors.light,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    cursor: submit.isPending ? 'not-allowed' : 'pointer',
                    opacity: submit.isPending ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {submit.isPending ? 'Enviando...' : '📤 Enviar a revisión'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
