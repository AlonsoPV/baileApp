import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useDatesByParent, useCreateDate, useUpdateDate } from "../../hooks/useEvents";
import { useEventDateMedia } from "../../hooks/useEventDateMedia";
import { useToast } from "../../components/Toast";
import EventCreateForm from "../../components/events/EventCreateForm";
import { PhotoManagementSection } from "../../components/profile/PhotoManagementSection";
import { VideoManagementSection } from "../../components/profile/VideoManagementSection";
import { ensureMaxVideoDuration } from "../../utils/videoValidation";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export const EventDateEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id, parentId } = useParams<{ id: string; parentId: string }>();
  const isEditing = !!id;
  
  const { data: organizer } = useMyOrganizer();
  const { data: dates } = useDatesByParent(parentId ? parseInt(parentId) : undefined);
  const createMutation = useCreateDate();
  const updateMutation = useUpdateDate();
  const { showToast } = useToast();

  const currentDate = isEditing ? dates?.find(d => d.id === parseInt(id)) : null;
  const parentIdNum = parentId ? parseInt(parentId) : currentDate?.parent_id;
  
  // Media management
  const { media, add, remove } = useEventDateMedia(currentDate?.id);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  // Función para subir archivo
  const uploadFile = async (file: File, slot: string, kind: "photo" | "video") => {
    if (kind === 'video') {
      try {
        await ensureMaxVideoDuration(file, 25);
      } catch (error) {
        console.error('[EventDateEditor] Video demasiado largo:', error);
        showToast(
          error instanceof Error ? error.message : 'El video debe durar máximo 25 segundos',
          'error'
        );
        return;
      }
    }

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
    if (!parentIdNum) {
      throw new Error('ID del evento padre no válido');
    }

    if (isEditing && currentDate) {
      // Update existing date
      const payload = {
        nombre: values.nombre || null,
        biografia: values.biografia || null,
        djs: values.djs || null,
        telefono_contacto: values.telefono_contacto || null,
        mensaje_contacto: values.mensaje_contacto || null,
        fecha: values.fecha,
        dia_semana: typeof values.dia_semana === 'number' ? values.dia_semana : null,
        hora_inicio: values.hora_inicio || null,
        hora_fin: values.hora_fin || null,
        lugar: values.lugar || null,
        direccion: values.direccion || null,
        ciudad: values.ciudad || null,
        zona: values.zona || null,
        estilos: values.estilos || [],
        ritmos_seleccionados: values.ritmos_seleccionados || [],
        zonas: values.zonas || [],
        ubicaciones: values.ubicaciones || [],
        referencias: values.referencias || null,
        requisitos: values.requisitos || null,
        cronograma: values.cronograma || [],
        costos: values.costos || [],
        media: values.media || [],
        flyer_url: values.flyer_url || null,
        estado_publicacion: values.estado_publicacion || 'borrador',
      };
      await updateMutation.mutateAsync({ id: currentDate.id, ...payload });
    } else {
      // Create new date
      const payload = {
        organizer_id: organizer?.id ?? null,
        parent_id: parentIdNum,
        nombre: values.nombre || null,
        biografia: values.biografia || null,
        djs: values.djs || null,
        telefono_contacto: values.telefono_contacto || null,
        mensaje_contacto: values.mensaje_contacto || null,
        fecha: values.fecha,
        dia_semana: typeof values.dia_semana === 'number' ? values.dia_semana : null,
        hora_inicio: values.hora_inicio || null,
        hora_fin: values.hora_fin || null,
        lugar: values.lugar || null,
        direccion: values.direccion || null,
        ciudad: values.ciudad || null,
        zona: values.zona || null,
        estilos: values.estilos || [],
        ritmos_seleccionados: values.ritmos_seleccionados || [],
        zonas: values.zonas || [],
        ubicaciones: values.ubicaciones || [],
        referencias: values.referencias || null,
        requisitos: values.requisitos || null,
        cronograma: values.cronograma || [],
        costos: values.costos || [],
        media: values.media || [],
        flyer_url: values.flyer_url || null,
        estado_publicacion: values.estado_publicacion || 'borrador',
      };
      await createMutation.mutateAsync(payload);
    }
  };

  const handleSuccess = (dateId: number) => {
    if (parentIdNum) {
      navigate(`/profile/organizer/events/${parentIdNum}`);
    } else {
      navigate('/profile/organizer/edit');
    }
  };

  const handleCancel = () => {
    if (parentIdNum) {
      navigate(`/profile/organizer/events/${parentIdNum}`);
    } else {
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

  if (!parentIdNum) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        color: colors.light,
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
          Evento padre no encontrado
        </h2>
        <p style={{ marginBottom: '24px', opacity: 0.7 }}>
          No se pudo determinar el evento padre para esta fecha
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
          ← Volver al Organizador
        </button>
      </div>
    );
  }

  return (
    <div className="date-editor-container" style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
      padding: '24px 0',
    }}>
      <style>{`
        .date-editor-container { padding: 24px 0; }
        .date-editor-inner { max-width: 800px; margin: 0 auto; padding: 0 24px; }
        .date-media-section { margin-top: 48px; }

        @media (max-width: 768px) {
          .date-editor-container { padding: 16px 0 !important; }
          .date-editor-inner { padding: 0 16px !important; }
          .date-media-section { margin-top: 24px !important; }
        }
        @media (max-width: 480px) {
          .date-editor-container { padding: 12px 0 !important; }
          .date-editor-inner { padding: 0 12px !important; }
        }
      `}</style>
      <EventCreateForm
        mode="date"
        date={currentDate}
        parentId={parentIdNum}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showHeader={true}
      />

      {/* Additional sections for editing existing dates */}
      {isEditing && currentDate && (
        <div className="date-editor-inner">
          {/* Photo Management Section */}
          <div className="date-media-section">
            <PhotoManagementSection
              media={media}
              uploading={uploading}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title="📷 Galería de Fotos de la Fecha"
              description="Sube fotos promocionales de esta fecha específica"
              slots={['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']}
              isMainPhoto={false}
            />
          </div>

          {/* Video Management Section */}
          <div className="date-media-section">
            <VideoManagementSection
              media={media}
              uploading={uploading}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title="🎥 Videos de la Fecha"
              description="Sube videos promocionales y demostraciones de esta fecha"
              slots={['v1', 'v2', 'v3']}
            />
          </div>
        </div>
      )}
    </div>
  );
};