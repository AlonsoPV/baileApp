import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import EventCreateForm from "../../components/events/EventCreateForm";
import { useEventParent } from "../../hooks/useEventParent";
import { useUpdateEventParent } from "../../hooks/useEventParent";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function OrganizerEventParentEditScreen() {
  const navigate = useNavigate();
  const { parentId } = useParams<{ parentId: string }>();
  const parentIdNum = parentId ? parseInt(parentId) : undefined;
  
  const { data: parent, isLoading } = useEventParent(parentIdNum);
  const updateParent = useUpdateEventParent();

  const handleSubmit = async (values: any) => {
    if (!parentIdNum) {
      throw new Error('ID del social no válido');
    }

    const patch = {
      nombre: values.nombre,
      biografia: values.biografia || null,
      descripcion: values.descripcion || null,
      estilos: values.estilos || [],
      zonas: values.zonas || [],
      sede_general: values.sede_general || null,
      faq: values.faq || [],
      media: values.media || [],
      ubicaciones: values.ubicaciones || [],
    };
    
    console.log('[OrganizerEventParentEditScreen] Patch:', patch);
    console.log('[OrganizerEventParentEditScreen] FAQ value:', values.faq);

    const updatedEvent = await updateParent.mutateAsync({ 
      id: parentIdNum, 
      patch 
    });
    return updatedEvent;
  };

  const handleSuccess = (eventId: number) => {
    // Redirigir a la vista pública del social actualizado
    navigate(`/social/${eventId}`);
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
            El social que buscas no existe o no tienes permisos para editarlo
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
        mode="parent"
        parent={parent}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showHeader={true}
      />
    </div>
  );
}
