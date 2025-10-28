import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAcademyMy, useUpsertAcademy } from "../../hooks/useAcademy";
import { useAcademyMedia } from "../../hooks/useAcademyMedia";
import { useTags } from "../../hooks/useTags";
import { useHydratedForm } from "../../hooks/useHydratedForm";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { PhotoManagementSection } from "../../components/profile/PhotoManagementSection";
import { VideoManagementSection } from "../../components/profile/VideoManagementSection";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import FAQEditor from "../../components/common/FAQEditor";
import SocialMediaSection from "../../components/profile/SocialMediaSection";
import CostosyHorarios from './CostosyHorarios';
import { getDraftKey } from "../../utils/draftKeys";
import { useRoleChange } from "../../hooks/useRoleChange";
import { useAuth } from "@/contexts/AuthProvider";
import '@/styles/organizer.css';

const colors = {
  primary: '#E53935',
  secondary: '#FB8C00',
  blue: '#1E88E5',
  coral: '#FF7043',
  light: '#F5F5F5',
  dark: '#1A1A1A',
  orange: '#FF9800'
};

export default function AcademyProfileEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: academy, isLoading } = useAcademyMy();
  const { data: allTags } = useTags();
  const { media, add, remove } = useAcademyMedia();
  const upsert = useUpsertAcademy();

  // Hook para cambio de rol
  useRoleChange();

  const { form, setField, setNested, setAll } = useHydratedForm({
    draftKey: getDraftKey(user?.id, 'academy'),
    serverData: academy,
    defaults: {
      nombre_publico: "",
      bio: "",
      estilos: [] as number[],
      redes_sociales: {
        instagram: "",
        facebook: "",
        whatsapp: ""
      },
      respuestas: {
        redes: {
          instagram: "",
          facebook: "",
          whatsapp: ""
        },
        dato_curioso: "",
        gusta_bailar: ""
      },
      faq: [] as any[]
    } as any
  });

  const handleSave = async () => {
    try {
      console.log("🚀 [AcademyProfileEditor] ===== INICIANDO GUARDADO =====");
      console.log("📤 [AcademyProfileEditor] Datos a enviar:", form);
      console.log("📱 [AcademyProfileEditor] Redes sociales:", form.redes_sociales);
      console.log("📝 [AcademyProfileEditor] Nombre público:", form.nombre_publico);
      console.log("📄 [AcademyProfileEditor] Bio:", form.bio);
      console.log("🎵 [AcademyProfileEditor] Estilos:", form.estilos);

      await upsert.mutateAsync(form);
      console.log("✅ [AcademyProfileEditor] Guardado exitoso");
    } catch (error) {
      console.error("❌ [AcademyProfileEditor] Error guardando:", error);
    }
  };

  const toggleEstilo = (estiloId: number) => {
    const currentEstilos = form.estilos || [];
    const newEstilos = currentEstilos.includes(estiloId)
      ? currentEstilos.filter(id => id !== estiloId)
      : [...currentEstilos, estiloId];
    setField('estilos', newEstilos);
  };

  const uploadFile = async (file: File, slot: string) => {
    try {
      await add.mutateAsync({ file, slot });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const removeFile = async (slot: string) => {
    try {
      const mediaItem = getMediaBySlot(media as unknown as MediaSlotItem[], slot);
      if (mediaItem && 'id' in mediaItem) {
        await remove.mutateAsync((mediaItem as any).id);
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }
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

  return (
    <div className="org-editor" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header con botón volver + título centrado + toggle (diseño organizer) */}
        <div className="org-editor__header">
          <button className="org-editor__back" onClick={() => navigate(-1)}>← Volver</button>
          <h1 className="org-editor__title">✏️ Editar Academia</h1>
          <div style={{ width: 100 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          <ProfileNavigationToggle
            currentView="edit"
            profileType="academy"
            onSave={handleSave}
            isSaving={upsert.isPending}
            saveDisabled={!form.nombre_publico?.trim()}
            editHref="/profile/academy/edit"
            liveHref="/profile/academy"
          />
        </div>

        {/* Información Básica */}
        <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            📚 Información Básica
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                🎓 Nombre de la Academia *
              </label>
              <input
                type="text"
                value={form.nombre_publico}
                onChange={(e) => setField('nombre_publico', e.target.value)}
                placeholder="Ej: Academia de Baile Moderno"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                📝 Descripción
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setField('bio', e.target.value)}
                placeholder="Cuéntanos sobre tu academia, su historia, metodología y lo que la hace especial..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: `${colors.dark}cc`,
                  border: `1px solid ${colors.light}33`,
                  color: colors.light,
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        </div>

        {/* Estilos de Baile */}
        <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            🎵 Estilos que Enseñamos
          </h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {allTags?.filter(tag => tag.tipo === 'ritmo').map(tag => (
              <Chip
                key={tag.id}
                label={tag.nombre}
                active={form.estilos?.includes(tag.id) || false}
                onClick={() => toggleEstilo(tag.id)}
                variant="ritmo"
              />
            ))}
          </div>
        </div>

        {/* Redes Sociales */}
        <div
          id="organizer-social-networks"
          data-test-id="organizer-social-networks"
          style={{
            marginBottom: '3rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            📱 Redes Sociales
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                📸 Instagram
              </label>
              <input
                type="text"
                value={form.redes_sociales.instagram}
                onChange={(e) => setNested('redes_sociales.instagram', e.target.value)}
                placeholder="@tu_organizacion"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                👥 Facebook
              </label>
              <input
                type="text"
                value={form.redes_sociales.facebook}
                onChange={(e) => setNested('redes_sociales.facebook', e.target.value)}
                placeholder="Página o perfil"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                💬 WhatsApp
              </label>
              <input
                type="text"
                value={form.redes_sociales.whatsapp}
                onChange={(e) => setNested('redes_sociales.whatsapp', e.target.value)}
                placeholder="Número de teléfono"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>
        </div>

        {/* Maestros Invitados */}
        <InvitedMastersSection
          masters={[]} // TODO: Conectar con datos reales en el siguiente sprint
          title="🎭 Maestros Invitados"
          showTitle={true}
          isEditable={true}
          availableUserMasters={[]} // TODO: Obtener usuarios con perfil de maestro
          onAddMaster={() => {
            // TODO: Implementar modal para agregar maestro externo
            console.log('Agregar maestro externo');
          }}
          onAssignUserMaster={() => {
            // TODO: Implementar modal para asignar usuario maestro
            console.log('Asignar usuario maestro');
          }}
          onEditMaster={(master) => {
            // TODO: Implementar modal para editar maestro
            console.log('Editar maestro:', master);
          }}
          onRemoveMaster={(masterId) => {
            // TODO: Implementar confirmación y eliminación
            console.log('Eliminar maestro:', masterId);
          }}
        />

        {/* Información para Estudiantes */}
        <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            💬 Información para Estudiantes
          </h2>

          <FAQEditor value={(form as any).faq || []} onChange={(v: any) => setField('faq' as any, v as any)} />
        </div>

        {/* Vista previa: Horarios y Costos */}
        <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            🗓️ Vista previa de horarios y costos
          </h2>
          <CostosyHorarios
            title="Horarios & Costos"
            date={{ cronograma: (form as any)?.cronograma || [], costos: (form as any)?.costos || [] }}
            ubicacion={{
              nombre: (form as any)?.ubicaciones?.[0]?.nombre,
              direccion: (form as any)?.ubicaciones?.[0]?.direccion,
              ciudad: (form as any)?.ubicaciones?.[0]?.ciudad,
              referencias: (form as any)?.ubicaciones?.[0]?.referencias,
            }}
          />
        </div>

        {/* Gestión de Fotos */}
        <PhotoManagementSection
          media={media}
          uploading={{ p1: add.isPending }}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="📷 Gestión de Fotos"
          description="Sube fotos de tu academia, instalaciones, clases y eventos"
          slots={['p1']}
          isMainPhoto={true}
        />

        {/* Fotos Adicionales */}
        <PhotoManagementSection
          media={media}
          uploading={Object.fromEntries(PHOTO_SLOTS.slice(3).map(slot => [slot, add.isPending]))}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="📷 Fotos Adicionales (p4-p10)"
          description="Más fotos para mostrar diferentes aspectos de tu academia"
          slots={PHOTO_SLOTS.slice(3)} // p4-p10
        />

        {/* Gestión de Videos */}
        <VideoManagementSection
          media={media}
          uploading={Object.fromEntries(VIDEO_SLOTS.map(slot => [slot, add.isPending]))}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="🎥 Gestión de Videos"
          description="Videos promocionales, clases de muestra, testimonios"
          slots={[...VIDEO_SLOTS]}
        />
      </div>
    </div>
  );
}
