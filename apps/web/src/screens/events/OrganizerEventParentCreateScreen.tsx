import React from "react";
import { useNavigate } from "react-router-dom";
import EventCreateForm from "../../components/events/EventCreateForm";
import { useCreateEventParent } from "../../hooks/useEventParent";
import { useMyOrganizer } from "../../hooks/useOrganizer";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export default function OrganizerEventParentCreateScreen() {
  const navigate = useNavigate();
  const { data: organizer } = useMyOrganizer();
  const createParent = useCreateEventParent();

  const handleSubmit = async (values: any) => {
    if (!organizer?.id) {
      throw new Error('No tienes organizador creado');
    }

    const payload = {
      organizer_id: organizer.id,
      nombre: values.nombre,
      biografia: values.biografia || null,
      estilos: values.estilos || [],
      zonas: values.zonas || [],
      sede_general: values.sede_general || null,
      /* faq: values.faq || [], */
      media: values.media || [],
      ubicaciones: values.ubicaciones || [],
    };
    
    console.log('[OrganizerEventParentCreateScreen] Payload:', payload);
    console.log('[OrganizerEventParentCreateScreen] FAQ value:', values.faq);

    const newEvent = await createParent.mutateAsync(payload);
    return newEvent;
  };

  const handleSuccess = (eventId: number) => {
    // Redirigir a la vista pública del social creado
    navigate(`/social/${eventId}`);
  };

  const handleCancel = () => {
    navigate('/profile/organizer/edit');
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
    <EventCreateForm
      mode="parent"
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      showHeader={true}
    />
  );
}
