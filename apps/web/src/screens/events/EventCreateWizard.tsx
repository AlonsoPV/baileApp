import React from "react";
import { useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useCreateParent } from "../../hooks/useEvents";
import EventCreateForm from "../../components/events/EventCreateForm";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function EventCreateWizard() {
  const navigate = useNavigate();
  const { data: organizer } = useMyOrganizer();
  const createParent = useCreateParent();

  const handleSubmit = async (values: any) => {
    if (!(organizer as any)?.id) {
      throw new Error('No tienes organizador creado. Primero debes crear tu perfil de organizador.');
    }

    const payload = {
      nombre: values.nombre,
      descripcion: values.descripcion || null,
      sede_general: values.sede_general || null,
      estilos: values.estilos || [],
      media: values.media || [],
      organizer_id: (organizer as any).id,
    };

    const result = await createParent.mutateAsync(payload);
    
    // Llamar onSuccess con el ID del evento creado
    handleSuccess(result.id);
  };

  const handleSuccess = (eventId: number) => {
    navigate(`/events/${eventId}`);
  };

  const handleCancel = () => {
    navigate('/explore');
  };

  if (!organizer) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center', maxWidth: '600px', padding: '48px 24px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>
            No tienes organizador
          </h2>
          <p style={{ marginBottom: '24px', opacity: 0.7 }}>
            Para crear eventos necesitas tener un perfil de organizador.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
            <button
              onClick={() => navigate('/explore')}
              style={{
                padding: '14px 28px',
                borderRadius: '50px',
                border: `2px solid ${colors.light}33`,
                background: 'transparent',
                color: colors.light,
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              ← Explorar Eventos
            </button>
          </div>
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
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        showHeader={true}
      />
    </div>
  );
}