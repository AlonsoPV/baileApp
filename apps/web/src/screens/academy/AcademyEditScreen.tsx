import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAcademyMy, useUpsertAcademy, useSubmitAcademyForReview } from "../../hooks/useAcademyMy";
import { useAcademyMedia } from "../../hooks/useAcademyMedia";
import { useTags } from "../../hooks/useTags";
import { useHydratedForm } from "../../hooks/useHydratedForm";
import { Chip } from "../../components/profile/Chip";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import { PhotoManagementSection } from "../../components/profile/PhotoManagementSection";
import { VideoManagementSection } from "../../components/profile/VideoManagementSection";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import { getDraftKey } from "../../utils/draftKeys";
import { useRoleChange } from "../../hooks/useRoleChange";
import { useAuth } from "../../hooks/useAuth";

const colors = {
  primary: '#E53935',
  secondary: '#FB8C00',
  blue: '#1E88E5',
  coral: '#FF7043',
  light: '#F5F5F5',
  dark: '#1A1A1A',
  orange: '#FF9800'
};

export default function AcademyEditScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: academy, isLoading } = useAcademyMy();
  const { data: allTags } = useTags();
  const { media, add, remove } = useAcademyMedia();
  const upsert = useUpsertAcademy();
  const submitForReview = useSubmitAcademyForReview();
  
  // Hook para cambio de rol
  useRoleChange();

  const { form, setField, setNested, setAll } = useHydratedForm({
    key: getDraftKey(user?.id, 'academy'),
    serverData: academy,
    defaults: {
      nombre_publico: "",
      bio: "",
      sede_general: "",
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
      }
    }
  });

  const handleSave = async () => {
    try {
      console.log("🚀 [AcademyEditScreen] ===== INICIANDO GUARDADO =====");
      console.log("📤 [AcademyEditScreen] Datos a enviar:", form);

      await upsert.mutateAsync(form);
      console.log("✅ [AcademyEditScreen] Guardado exitoso");
    } catch (error) {
      console.error("❌ [AcademyEditScreen] Error guardando:", error);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      console.log("🚀 [AcademyEditScreen] Enviando a revisión...");
      await submitForReview.mutateAsync();
      console.log("✅ [AcademyEditScreen] Enviado a revisión exitosamente");
    } catch (error) {
      console.error("❌ [AcademyEditScreen] Error enviando a revisión:", error);
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
      const mediaItem = media.find(m => m.slot === slot);
      if (mediaItem) {
        await remove.mutateAsync(mediaItem.id);
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
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.dark} 0%, #2C2C2C 100%)`,
      color: colors.light,
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Navigation Toggle */}
        <ProfileNavigationToggle 
          currentView="edit" 
          profileType="academy" 
          onSave={handleSave}
          isSaving={upsert.isPending}
          saveDisabled={!form.nombre_publico?.trim()}
        />

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          padding: '2rem 0',
          borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 1rem 0'
          }}>
            🎓 Editar Academia
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0
          }}>
            Configura la información de tu academia
          </p>
        </div>

        {/* Información Básica */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
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
                📝 Descripción
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setField('bio', e.target.value)}
                placeholder="Cuéntanos sobre tu academia, su historia, metodología y lo que la hace especial..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                🏢 Sede General
              </label>
              <input
                type="text"
                value={form.sede_general}
                onChange={(e) => setField('sede_general', e.target.value)}
                placeholder="Dirección principal de la academia"
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

        {/* Estilos de Baile */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
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
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
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
                placeholder="@tu_academia"
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
                📘 Facebook
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
                📱 WhatsApp
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
          masters={[]} // TODO: Conectar con datos reales
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
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            💬 Información para Estudiantes
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                ❓ ¿Qué necesito para empezar?
              </label>
              <textarea
                value={form.respuestas?.dato_curioso || ''}
                onChange={(e) => setNested('respuestas.dato_curioso', e.target.value)}
                placeholder="Información sobre requisitos, materiales, etc."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                🎯 ¿Por qué elegir nuestra academia?
              </label>
              <textarea
                value={form.respuestas?.gusta_bailar || ''}
                onChange={(e) => setNested('respuestas.gusta_bailar', e.target.value)}
                placeholder="Ventajas, metodología, experiencia, etc."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: colors.light,
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        {/* Gestión de Fotos */}
        <PhotoManagementSection
          media={media}
          uploading={add.isPending}
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
          uploading={add.isPending}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="📷 Fotos Adicionales (p4-p10)"
          description="Más fotos para mostrar diferentes aspectos de tu academia"
          slots={['p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']}
        />

        {/* Gestión de Videos */}
        <VideoManagementSection
          media={media}
          uploading={add.isPending}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="🎥 Gestión de Videos"
          description="Videos promocionales, clases de muestra, testimonios"
          slots={['v1', 'v2', 'v3']}
        />

        {/* Botón Enviar a Revisión */}
        {academy?.estado_aprobacion === 'borrador' && (
          <div style={{
            marginTop: '3rem',
            padding: '2rem',
            background: 'rgba(255, 193, 7, 0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              color: '#FFC107',
              margin: '0 0 1rem 0'
            }}>
              🚀 ¿Listo para publicar tu academia?
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 1.5rem 0'
            }}>
              Envía tu academia a revisión para que sea aprobada y visible públicamente
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitForReview}
              disabled={submitForReview.isPending}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #FFC107, #FF8F00)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: submitForReview.isPending ? 'not-allowed' : 'pointer',
                opacity: submitForReview.isPending ? 0.6 : 1,
                boxShadow: '0 8px 24px rgba(255, 193, 7, 0.3)'
              }}
            >
              {submitForReview.isPending ? '⏳ Enviando...' : '📤 Enviar a Revisión'}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
