import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useParentsByOrganizer, useCreateParent, useUpdateParent } from "../../hooks/useEvents";
import EventCreateForm from "../../components/events/EventCreateForm";
import EventDatesSection from "../../components/events/EventDatesSection";
import EventPricingSection from "../../components/events/EventPricingSection";

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

  const currentEvent = isEditing ? events?.find(e => e.id === parseInt(id)) : null;

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
      return await updateMutation.mutateAsync({ id: currentEvent.id, patch: payload });
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
      return await createMutation.mutateAsync(payload);
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
            <EventDatesSection eventId={currentEvent.id} />
          </div>

          {/* Event Pricing Section */}
          <div style={{ marginTop: '48px' }}>
            <EventPricingSection eventId={currentEvent.id} />
          </div>
        </div>
      )}
    </div>
  );
};