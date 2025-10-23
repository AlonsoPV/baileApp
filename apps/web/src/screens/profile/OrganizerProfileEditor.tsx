import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer, useUpsertMyOrganizer, useSubmitOrganizerForReview } from "../../hooks/useOrganizer";
import { useParentsByOrganizer, useDeleteParent, useDatesByParent } from "../../hooks/useEvents";
import { useOrganizerMedia } from "../../hooks/useOrganizerMedia";
import { MediaUploader } from "../../components/MediaUploader";
import { MediaGrid } from "../../components/MediaGrid";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useToast } from "../../components/Toast";
import ProfileToolbar from "../../components/profile/ProfileToolbar";
import { Chip } from "../../components/profile/Chip";
import { useTags } from "../../hooks/useTags";
import { useHydratedForm } from "../../hooks/useHydratedForm";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import { supabase } from "../../lib/supabase";
import { PhotoManagementSection } from "../../components/profile/PhotoManagementSection";
import { VideoManagementSection } from "../../components/profile/VideoManagementSection";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

// Componente para mostrar un evento con sus fechas
function EventParentCard({ parent, onDelete, isDeleting }: any) {
  const navigate = useNavigate();
  const { data: dates } = useDatesByParent(parent.id);
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '16px',
        background: `${colors.dark}aa`,
        borderRadius: '12px',
        border: `1px solid ${colors.light}22`,
      }}
    >
      {/* Header del evento */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '4px' }}>
            {parent.nombre}
          </h4>
          <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '8px' }}>
            {parent.descripcion}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => navigate(`/events/${parent.id}/edit`)}
            style={{
              padding: '6px 12px',
              background: colors.blue,
              color: colors.light,
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => onDelete(parent.id)}
            disabled={isDeleting}
            style={{
              padding: '6px 12px',
              background: colors.coral,
              color: colors.light,
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1
            }}
          >
            {isDeleting ? '⏳' : '🗑️'} Eliminar
          </button>
        </div>
      </div>

      {/* Fechas del evento */}
      {dates && dates.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              color: colors.light,
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: expanded ? '12px' : '0'
            }}
          >
            <span>📅 {dates.length} fecha{dates.length > 1 ? 's' : ''}</span>
            <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              ▼
            </span>
          </button>
          
          {expanded && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dates.map((date: any) => (
                <div key={date.id} style={{
                  padding: '8px 12px',
                  background: `${colors.light}11`,
                  borderRadius: '6px',
                  border: `1px solid ${colors.light}22`
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                    {new Date(date.fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    {date.hora_inicio} - {date.hora_fin}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function OrganizerProfileEditor() {
  const navigate = useNavigate();
  const { data: org, isLoading } = useMyOrganizer();
  const upsert = useUpsertMyOrganizer();
  const submit = useSubmitOrganizerForReview();
  const { data: parents } = useParentsByOrganizer(org?.id);
  const deleteParent = useDeleteParent();
  const { media, add, remove } = useOrganizerMedia();
  const { showToast } = useToast();
  
  // Estados para carga de media
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  // Función para subir archivo
  const uploadFile = async (file: File, slot: string, kind: "photo" | "video") => {
    setUploading(prev => ({ ...prev, [slot]: true }));
    
    try {
      await add.mutateAsync({ file, slot });
      showToast(`${kind === 'photo' ? 'Foto' : 'Video'} subido correctamente`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast('Error al subir el archivo', 'error');
    } finally {
      setUploading(prev => ({ ...prev, [slot]: false }));
    }
  };

  // Función para eliminar archivo
  const removeFile = async (slot: string) => {
    try {
      // Buscar el media item por slot
      const mediaItem = media.find(m => m.slot === slot);
      if (mediaItem) {
        await remove.mutateAsync(mediaItem.id);
        showToast('Archivo eliminado', 'success');
      } else {
        showToast('No se encontró el archivo', 'error');
      }
    } catch (error) {
      console.error('Error removing file:', error);
      showToast('Error al eliminar el archivo', 'error');
    }
  };
  
  // Cargar tags
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter(tag => tag.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter(tag => tag.tipo === 'zona') || [];

  // Usar formulario hidratado con borrador persistente
  const { form, setField, setNested, hydrated } = useHydratedForm({
    draftKey: `draft:org:${org?.id || 'new'}`,
    serverData: org,
    defaults: {
      nombre_publico: "",
      bio: "",
      ritmos: [] as number[],
      zonas: [] as number[],
      redes_sociales: {
        instagram: "",
        facebook: "",
        whatsapp: ""
      },
      respuestas: {
        musica_tocaran: "",
        hay_estacionamiento: ""
      }
    },
    preferDraft: true
  });

  // Funciones para toggle de chips
  const toggleRitmo = (id: number) => {
    const newRitmos = form.ritmos.includes(id) 
      ? form.ritmos.filter(r => r !== id) 
      : [...form.ritmos, id];
    setField('ritmos', newRitmos);
  };

  const toggleZona = (id: number) => {
    const newZonas = form.zonas.includes(id) 
      ? form.zonas.filter(z => z !== id) 
      : [...form.zonas, id];
    setField('zonas', newZonas);
  };

  // Función para guardar
  const handleSave = async () => {
    try {
      console.log("🚀 [OrganizerProfileEditor] ===== INICIANDO GUARDADO =====");
      console.log("📤 [OrganizerProfileEditor] Datos a enviar:", form);
      console.log("📱 [OrganizerProfileEditor] Redes sociales:", form.redes_sociales);
      console.log("📝 [OrganizerProfileEditor] Nombre público:", form.nombre_publico);
      console.log("📄 [OrganizerProfileEditor] Bio:", form.bio);
      console.log("🎵 [OrganizerProfileEditor] Ritmos:", form.ritmos);
      console.log("📍 [OrganizerProfileEditor] Zonas:", form.zonas);
      console.log("💬 [OrganizerProfileEditor] Respuestas:", form.respuestas);
      
      await upsert.mutateAsync(form);
      console.log("✅ [OrganizerProfileEditor] Guardado exitoso");
      showToast('Organizador actualizado ✅', 'success');
    } catch (err: any) {
      console.error("❌ [OrganizerProfileEditor] Error al guardar:", err);
      showToast('Error al guardar', 'error');
    }
  };

  // Función para enviar para revisión
  const handleSubmitForReview = async () => {
    try {
      await submit.mutateAsync();
      showToast('Enviado para revisión ✅', 'success');
    } catch (err: any) {
      console.error('Error submitting for review:', err);
      showToast('Error al enviar para revisión', 'error');
    }
  };

  // Función para eliminar evento
  const handleDeleteEvent = async (parentId: string) => {
    try {
      await deleteParent.mutateAsync(parentId);
      showToast('Evento eliminado', 'success');
    } catch (err: any) {
      console.error('Error deleting event:', err);
      showToast('Error al eliminar evento', 'error');
    }
  };

  // Función para obtener badge de estado
  const getEstadoBadge = () => {
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      borrador: { bg: '#94A3B8', text: 'Borrador', icon: '📝' },
      en_revision: { bg: colors.orange, text: 'En Revisión', icon: '⏳' },
      aprobado: { bg: '#10B981', text: 'Aprobado', icon: '✅' },
      rechazado: { bg: colors.coral, text: 'Rechazado', icon: '❌' },
    };

    const badge = badges[org.estado_aprobacion] || badges.borrador;

    return (
      <span
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          background: `${badge.bg}cc`,
          border: `2px solid ${badge.bg}`,
          color: colors.light,
          fontSize: '0.875rem',
          fontWeight: '700',
          boxShadow: `0 2px 8px ${badge.bg}66`,
        }}
      >
        {badge.icon} {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.dark,
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Cargando perfil del organizador...</div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.dark,
        color: colors.light,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <div>No se encontró el perfil del organizador</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.dark,
      color: colors.light,
      padding: '2rem',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header con botón Volver */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              color: colors.light,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.2s'
            }}
          >
            ← Volver
          </button>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            margin: '0',
            flex: '1 1 0%',
            textAlign: 'center'
          }}>
            ✏️ Editar Organizador
          </h1>
          <div style={{ width: '100px' }}></div>
        </div>

        {/* Componente de navegación flotante */}
        <ProfileNavigationToggle
          currentView="edit"
          profileType="organizer"
          onSave={handleSave}
          isSaving={upsert.isPending}
          saveDisabled={!form.nombre_publico?.trim()}
        />

        {/* Información del Organizador */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            🏢 Información del Organizador
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Nombre Público
              </label>
              <input
                type="text"
                value={form.nombre_publico}
                onChange={(e) => setField('nombre_publico', e.target.value)}
                placeholder="Nombre de tu organización"
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
                Biografía
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setField('bio', e.target.value)}
                placeholder="Cuéntanos sobre tu organización..."
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
          </div>
        </div>

        {/* Ritmos y Zonas */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            🎵 Ritmos y Zonas
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: colors.light }}>
                🎶 Ritmos que Organizas
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {ritmoTags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.nombre}
                    active={form.ritmos.includes(tag.id)}
                    onClick={() => toggleRitmo(tag.id)}
                    variant="ritmo"
                  />
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: colors.light }}>
                📍 Zonas donde Organizas
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {zonaTags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.nombre}
                    active={form.zonas.includes(tag.id)}
                    onClick={() => toggleZona(tag.id)}
                    variant="zona"
                  />
                ))}
              </div>
            </div>
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

        {/* Información para Asistentes */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            💬 Información para Asistentes
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                🎵 ¿Qué música tocarán?
              </label>
              <textarea
                value={form.respuestas.musica_tocaran}
                onChange={(e) => setNested('respuestas.musica_tocaran', e.target.value)}
                placeholder="Describe el tipo de música que tocarán..."
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
                🅿️ ¿Hay estacionamiento?
              </label>
              <textarea
                value={form.respuestas.hay_estacionamiento}
                onChange={(e) => setNested('respuestas.hay_estacionamiento', e.target.value)}
                placeholder="Información sobre estacionamiento..."
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

        {/* Mis Eventos */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            📅 Mis Eventos
          </h2>
          
          {parents && parents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {parents.map((parent: any) => (
                <EventParentCard
                  key={parent.id}
                  parent={parent}
                  onDelete={handleDeleteEvent}
                  isDeleting={deleteParent.isPending}
                />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No tienes eventos creados</div>
              <div style={{ opacity: 0.7 }}>Crea tu primer evento para comenzar</div>
            </div>
          )}
        </div>

        {/* Estado y Acciones */}
        <div style={{
          marginBottom: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            ⚙️ Estado y Acciones
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              Estado: {getEstadoBadge()}
            </span>
          </div>
          
          {org.estado_aprobacion === "borrador" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitForReview}
              disabled={submit.isPending}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: submit.isPending ? `${colors.light}33` : colors.blue,
                color: colors.light,
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: submit.isPending ? 'not-allowed' : 'pointer',
                boxShadow: `0 4px 16px ${colors.blue}66`,
              }}
            >
              {submit.isPending ? '⏳ Enviando...' : '📤 Enviar para Revisión'}
            </motion.button>
          )}
        </div>

        {/* Botón Discreto: Crear Evento - Centro Abajo */}
        <div style={{
          position: 'fixed',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          pointerEvents: 'auto',
        }}>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/events/new')}
            style={{
              padding: '12px 24px',
              borderRadius: '25px',
              background: `${colors.dark}dd`,
              backdropFilter: 'blur(10px)',
              color: colors.light,
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: `1px solid ${colors.light}33`,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>📅</span>
            Crear Evento
          </motion.button>
        </div>

        {/* Sección de Fotos */}
        <PhotoManagementSection
          media={media}
          uploading={uploading}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="📷 Gestión de Fotos"
          description="La foto P1 se mostrará como tu avatar principal en el banner del perfil"
          slots={['p1']}
          isMainPhoto={true}
        />

        {/* Sección de Fotos Adicionales */}
        <PhotoManagementSection
          media={media}
          uploading={uploading}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="📷 Fotos Adicionales (p4-p10)"
          description="Estas fotos aparecerán en la galería de tu perfil"
          slots={['p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']}
          isMainPhoto={false}
        />

        {/* Sección de Videos */}
        <VideoManagementSection
          media={media}
          uploading={uploading}
          uploadFile={uploadFile}
          removeFile={removeFile}
          title="🎥 Gestión de Videos"
          description="Los videos aparecerán en la sección de videos de tu perfil"
          slots={['v1', 'v2', 'v3']}
        />
      </div>
    </div>
  );
}
