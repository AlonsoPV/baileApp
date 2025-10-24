import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import EventCreateForm from "../../components/events/EventCreateForm";
import { useEventDate } from "../../hooks/useEventDate";
import { useUpdateEventDate } from "../../hooks/useEventDate";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function OrganizerEventDateEditScreen() {
  const navigate = useNavigate();
  const { dateId } = useParams<{ dateId: string }>();
  const dateIdNum = dateId ? parseInt(dateId) : undefined;
  
  const { data: date, isLoading } = useEventDate(dateIdNum);
  const updateDate = useUpdateEventDate();

  const handleSubmit = async (values: any) => {
    if (!dateIdNum) {
      throw new Error('ID de la fecha no válido');
    }

    const patch = {
      nombre: values.nombre || null,
      biografia: values.biografia || null,
      fecha: values.fecha,
      hora_inicio: values.hora_inicio || null,
      hora_fin: values.hora_fin || null,
      lugar: values.lugar || null,
      direccion: values.direccion || null,
      ciudad: values.ciudad || null,
      zona: values.zona || null,
      referencias: values.referencias || null,
      requisitos: values.requisitos || null,
      estilos: values.estilos || [],
      zonas: values.zonas || [],
      cronograma: values.cronograma || [],
      costos: values.costos || [],
      media: values.media || [],
      estado_publicacion: values.estado_publicacion || 'borrador',
    };

    const updatedDate = await updateDate.mutateAsync({ 
      id: dateIdNum, 
      patch 
    });
    return updatedDate;
  };

  const handleSuccess = (eventId: number) => {
    // Redirigir a la vista pública de la fecha actualizada
    navigate(`/social/fecha/${eventId}`);
  };

  const handleCancel = () => {
    if (date?.parent_id) {
      navigate(`/social/${date.parent_id}`);
    } else {
      navigate('/profile/organizer/edit');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Cargando fecha...</p>
        </div>
      </div>
    );
  }

  if (!date) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            Fecha no encontrada
          </h2>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>
            La fecha que buscas no existe o no tienes permisos para editarla
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
        date={date}
        parentId={date.parent_id}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showHeader={true}
      />
    </div>
  );
}
