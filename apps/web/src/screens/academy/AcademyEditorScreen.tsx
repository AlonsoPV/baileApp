import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademyMy, useUpsertAcademy, useSubmitAcademyForReview } from '../../hooks/useAcademy';
import { useTags } from '../../hooks/useTags';
import { useHydratedForm } from '../../hooks/useHydratedForm';
import { getDraftKey } from '../../utils/draftKeys';
import { useRoleChange } from '../../hooks/useRoleChange';
import { useAuth } from '@/contexts/AuthProvider';
import { ProfileNavigationToggle } from '../../components/profile/ProfileNavigationToggle';
import ChipPicker from '../../components/common/ChipPicker';
import { PhotoManagementSection } from '../../components/profile/PhotoManagementSection';
import { VideoManagementSection } from '../../components/profile/VideoManagementSection';
import SocialMediaSection from '../../components/profile/SocialMediaSection';
import UbicacionesEditor from '../../components/academy/UbicacionesEditor';
import HorariosEditor from '../../components/academy/HorariosEditor';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import '@/styles/organizer.css';
import { useAcademyMedia } from '@/hooks/useAcademyMedia';

export default function AcademyEditorScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: academy, isLoading } = useAcademyMy();
  const academyMedia = useAcademyMedia();
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
    <div className="org-editor" style={{ minHeight: '100vh', background: '#000000', color: colors.light, padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header con botón Volver + Título + espacio + toggle */}
        <div className="org-editor__header">
          <button className="org-editor__back" onClick={() => navigate(-1)}>← Volver</button>
          <h1 className="org-editor__title">✏️ Editar Academia</h1>
          <div style={{ width: 100 }} />
        </div>

        {/* Toggle unificado */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: spacing[6] }}>
        <ProfileNavigationToggle
          currentView="edit"
          profileType="academy"
          editHref="/profile/academy/edit"
          liveHref="/profile/academy"
          onSave={handleSave}
          isSaving={upsert.isPending}
          saveDisabled={!form.nombre_publico}
        />
        </div>

        {/* Primer contenedor de información con org-editor__card */}
        <div className="org-editor__card" style={{ marginTop: spacing[6] }}>
          <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>📝 Información Básica</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: spacing[3] }}>
            <input
              className="org-editor__input"
              placeholder="Nombre público"
              value={form.nombre_publico}
              onChange={(e) => setField('nombre_publico', e.target.value)}
            />
            <textarea
              className="org-editor__textarea"
              placeholder="Biografía"
              rows={4}
              value={form.bio || ''}
              onChange={(e) => setField('bio', e.target.value)}
            />
          </div>
        </div>

        {/* Ritmos y Zonas (editable con ChipPicker) */}
        <div className="org-editor__card" style={{ marginTop: spacing[6] }}>
          <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>🎵 Ritmos y Zonas</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
            <ChipPicker tipo="ritmo" selected={form.ritmos} onChange={(v)=>setField('ritmos', v)} label="Ritmos de la academia" />
            <ChipPicker tipo="zona" selected={form.zonas} onChange={(v)=>setField('zonas', v)} label="Zonas donde operan" />
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="org-editor__card" style={{ marginTop: spacing[6] }}>
          <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>🔗 Redes</h2>
          <SocialMediaSection 
            availablePlatforms={['instagram', 'tiktok', 'youtube', 'facebook', 'whatsapp']}
            respuestas={{ redes: form.redes_sociales }}
          />
        </div>

        {/* Ubicaciones */}
        <div className="org-editor__card" style={{ marginTop: spacing[6] }}>
          <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>📍 Ubicaciones</h2>
          <UbicacionesEditor 
            value={form.ubicaciones} 
            onChange={(ubicaciones) => setField('ubicaciones', ubicaciones)} 
          />
        </div>

        {/* Horarios */}
        <div className="org-editor__card" style={{ marginTop: spacing[6] }}>
          <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>🕒 Horarios</h2>
          <HorariosEditor 
            value={form.horarios} 
            onChange={(horarios) => setField('horarios', horarios)} 
          />
        </div>

        {/* Gestión de Media */}
        <div className="org-editor__card" style={{ marginTop: spacing[6] }}>
          <h2 style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing[4],
            color: colors.light
          }}>
            📷 Galería de Medios
          </h2>

          <PhotoManagementSection
            media={academyMedia.media}
            uploading={{}}
            uploadFile={(file, slot)=>academyMedia.add.mutate({ file, slot })}
            removeFile={(slot)=>{
              const item = (academyMedia.media as any[]).find((m:any)=>m.slot===slot);
              if (item) academyMedia.remove.mutate(item.id);
            }}
            title="📷 Fotos de la Academia"
            description="Sube fotos de tus instalaciones, clases y eventos"
            slots={['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']}
          />

          <VideoManagementSection
            media={academyMedia.media}
            uploading={{}}
            uploadFile={(file, slot)=>academyMedia.add.mutate({ file, slot })}
            removeFile={(slot)=>{
              const item = (academyMedia.media as any[]).find((m:any)=>m.slot===slot);
              if (item) academyMedia.remove.mutate(item.id);
            }}
            title="🎥 Videos de la Academia"
            description="Videos de clases, eventos, promocionales"
            slots={['v1', 'v2', 'v3']}
          />
        </div>

        {Array.isArray(academyMedia.media) && academyMedia.media.length > 0 && (
          <div id="user-profile-photo-gallery" className="org-editor__card" style={{ marginTop: spacing[6] }}>
            <h2 style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, marginBottom: spacing[4] }}>📷 Galería</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing[4] }}>
              {(academyMedia.media as any[]).map((item: any, index: number) => (
                <div key={index} style={{ borderRadius: borderRadius.xl, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
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
  );
}
