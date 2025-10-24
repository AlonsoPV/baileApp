import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useDatesByParent, useCreateDate, useUpdateDate } from "../../hooks/useEvents";
import EventCreateForm from "../../components/events/EventCreateForm";

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

  const currentDate = isEditing ? dates?.find(d => d.id === parseInt(id)) : null;
  const parentIdNum = parentId ? parseInt(parentId) : currentDate?.parent_id;

  const handleSubmit = async (values: any) => {
    if (!parentIdNum) {
      throw new Error('ID del evento padre no válido');
    }

    if (isEditing && currentDate) {
      // Update existing date
      const payload = {
        fecha: values.fecha,
        hora_inicio: values.hora_inicio || null,
        hora_fin: values.hora_fin || null,
        lugar: values.lugar || null,
        direccion: values.direccion || null,
        ciudad: values.ciudad || null,
        zona: values.zona || null,
        estilos: values.estilos || [],
        requisitos: values.requisitos || null,
        cronograma: values.cronograma || [],
        costos: values.costos || [],
        media: values.media || [],
        estado_publicacion: values.estado_publicacion || 'borrador',
      };
      return await updateMutation.mutateAsync({ id: currentDate.id, patch: payload });
    } else {
      // Create new date
      const payload = {
        parent_id: parentIdNum,
        fecha: values.fecha,
        hora_inicio: values.hora_inicio || null,
        hora_fin: values.hora_fin || null,
        lugar: values.lugar || null,
        direccion: values.direccion || null,
        ciudad: values.ciudad || null,
        zona: values.zona || null,
        estilos: values.estilos || [],
        requisitos: values.requisitos || null,
        cronograma: values.cronograma || [],
        costos: values.costos || [],
        media: values.media || [],
        estado_publicacion: values.estado_publicacion || 'borrador',
      };
      return await createMutation.mutateAsync(payload);
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
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
      padding: '24px 0',
    }}>
      <EventCreateForm
        mode="date"
        date={currentDate}
        parentId={parentIdNum}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showHeader={true}
      />
    </div>
  );
};