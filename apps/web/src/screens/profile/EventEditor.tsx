import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useParentsByOrganizer, useCreateParent, useUpdateParent } from "../../hooks/useEvents";
import { useEventParentMedia } from "../../hooks/useEventParentMedia";
import { useToast } from "../../components/Toast";
import EventCreateForm from "../../components/events/EventCreateForm";
import EventDatesSection from "../../components/events/EventDatesSection";
import EventPricingSection from "../../components/events/EventPricingSection";
import { PhotoManagementSection } from "../../components/profile/PhotoManagementSection";
import { VideoManagementSection } from "../../components/profile/VideoManagementSection";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export const EventEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const { data: organizer } = useMyOrganizer();
  const { data: events } = useParentsByOrganizer(organizer?.id);
  const createMutation = useCreateParent();
  const updateMutation = useUpdateParent();
  const { showToast } = useToast();

  const currentEvent = isEditing ? events?.find(e => e.id === parseInt(id)) : null;
  
  // Media management
  const { media, add, remove } = useEventParentMedia(currentEvent?.id);
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
      const mediaItem = media.find(m => (m as any).slot === slot);
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

  const handleSubmit = async (values: any) => {
    if (!organizer?.id) {
      throw new Error('No tienes organizador creado');
    }

    if (isEditing && currentEvent) {
      // Update existing event
      const payload = {
        nombre: values.nombre,
        descripcion: values.descripcion || null,
        sede_general: values.sede_general || null,
        estilos: values.estilos || [],
        media: values.media || [],
      };
      await updateMutation.mutateAsync({ id: currentEvent.id, patch: payload });
    } else {
      // Create new event
      const payload = {
        nombre: values.nombre,
        descripcion: values.descripcion || null,
        sede_general: values.sede_general || null,
        estilos: values.estilos || [],
        media: values.media || [],
        organizer_id: organizer.id,
      };
      await createMutation.mutateAsync(payload);
    }
  };

  const handleSuccess = (eventId: number) => {
    navigate(`/profile/organizer/events/${eventId}`);
  };

  const handleCancel = () => {
    if (isEditing && currentEvent) {
      navigate(`/profile/organizer/events/${currentEvent.id}`);
    } else {
      // Para crear nuevo evento, volver al perfil del organizador donde se pueden ver los eventos
      navigate('/profile/organizer/edit');
    }
  };

  if (!organizer) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
          No tienes organizador
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          Primero debes crear tu perfil de organizador
        </p>
        <button
          onClick={() => navigate('/profile/organizer/edit')}
          style={{
            padding: '14px 28px',
            borderRadius: '50px',
            border: 'none',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(30,136,229,0.5)',
          }}
        >
          🎤 Crear Organizador
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
      padding: '24px 0',
    }}>
      {/* EventCreateForm for basic info */}
      <EventCreateForm
        mode="parent"
        parent={currentEvent}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showHeader={true}
      />

      {/* Additional sections for editing existing events */}
      {isEditing && currentEvent && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 24px',
        }}>
          {/* Event Dates Section */}
          <div style={{ marginTop: '48px' }}>
            <EventDatesSection eventId={currentEvent.id} eventName={currentEvent.nombre} />
          </div>

          {/* Event Pricing Section */}
          <div style={{ marginTop: '48px' }}>
            <EventPricingSection eventId={currentEvent.id} eventName={currentEvent.nombre} />
          </div>

          {/* Photo Management Section */}
          <div style={{ marginTop: '48px' }}>
            <PhotoManagementSection
              media={media}
              uploading={uploading}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title="📷 Galería de Fotos del Social"
              description="Sube fotos promocionales de tu social"
              slots={['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']}
              isMainPhoto={false}
            />
          </div>

          {/* Video Management Section */}
          <div style={{ marginTop: '48px' }}>
            <VideoManagementSection
              media={media}
              uploading={uploading}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title="🎥 Videos del Social"
              description="Sube videos promocionales y demostraciones"
              slots={['v1', 'v2', 'v3']}
            />
          </div>
        </div>
      )}
    </div>
  );
};