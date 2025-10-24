import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import EventCreateForm from "../../components/events/EventCreateForm";
import { useCreateEventDate } from "../../hooks/useEventDate";
import { useEventParent } from "../../hooks/useEventParent";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function OrganizerEventDateCreateScreen() {
  const navigate = useNavigate();
  const { parentId } = useParams<{ parentId: string }>();
  const parentIdNum = parentId ? parseInt(parentId) : undefined;
  
  const { data: parent, isLoading } = useEventParent(parentIdNum);
  const createDate = useCreateEventDate();

  const handleSubmit = async (values: any) => {
    if (!parentIdNum) {
      throw new Error('ID del social no válido');
    }

    const payload = {
      parent_id: parentIdNum,
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
    
    console.log('[OrganizerEventDateCreateScreen] Payload:', payload);
    console.log('[OrganizerEventDateCreateScreen] Values:', values);

    const newDate = await createDate.mutateAsync(payload);
    return newDate;
  };

  const handleSuccess = (dateId: number) => {
    // Redirigir a la vista pública de la fecha creada
    navigate(`/social/fecha/${dateId}`);
  };

  const handleCancel = () => {
    if (parentIdNum) {
      navigate(`/social/${parentIdNum}`);
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
          <p>Cargando social...</p>
        </div>
      </div>
    );
  }

  if (!parent) {
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
            Social no encontrado
          </h2>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>
            El social que buscas no existe o no tienes permisos para crear fechas
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
      {/* Header con info del social */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto 32px auto',
        padding: '0 24px',
        color: colors.light,
      }}>
        <div style={{
          padding: '20px',
          background: `${colors.dark}33`,
          borderRadius: '12px',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>
            📅 Nueva Fecha para: {parent.nombre}
          </h2>
          <p style={{ opacity: 0.7, margin: 0 }}>
            {parent.descripcion || 'Sin descripción'}
          </p>
        </div>
      </div>

      <EventCreateForm
        mode="date"
        parentId={parentIdNum!}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showHeader={false}
      />
    </div>
  );
}
