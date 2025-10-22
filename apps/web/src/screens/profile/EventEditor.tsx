import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useParentsByOrganizer, useCreateParent, useUpdateParent } from "../../hooks/useEvents";
import { useTags } from "../../hooks/useTags";
import { useToast } from "../../components/Toast";

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
  const { ritmos } = useTags('ritmo');
  const { showToast } = useToast();

  const currentEvent = isEditing ? events?.find(e => e.id === parseInt(id)) : null;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [sedeGeneral, setSedeGeneral] = useState('');
  const [estilosSeleccionados, setEstilosSeleccionados] = useState<number[]>([]);

  useEffect(() => {
    if (currentEvent) {
      setNombre(currentEvent.nombre);
      setDescripcion(currentEvent.descripcion || '');
      setSedeGeneral(currentEvent.sede_general || '');
      setEstilosSeleccionados(currentEvent.estilos || []);
    }
  }, [currentEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      showToast('El nombre del evento es obligatorio', 'error');
      return;
    }

    if (!organizer?.id) {
      showToast('No tienes organizador creado', 'error');
      return;
    }

    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        sede_general: sedeGeneral.trim() || null,
        estilos: estilosSeleccionados,
        organizer_id: organizer.id,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: parseInt(id!), patch: payload });
        showToast('Evento actualizado ✅', 'success');
      } else {
        await createMutation.mutateAsync(payload);
        showToast('Evento creado ✅', 'success');
      }

      navigate('/profile/organizer/edit');
    } catch (err: any) {
      showToast('Error al guardar evento', 'error');
    }
  };

  const toggleEstilo = (estiloId: number) => {
    setEstilosSeleccionados(prev => 
      prev.includes(estiloId)
        ? prev.filter(id => id !== estiloId)
        : [...prev, estiloId]
    );
  };

  const getEstadoBadge = () => {
    if (!currentEvent) return null;
    
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      borrador: { bg: '#94A3B8', text: 'Borrador', icon: '📝' },
      en_revision: { bg: colors.orange, text: 'En Revisión', icon: '⏳' },
      aprobado: { bg: '#10B981', text: 'Aprobado', icon: '✅' },
      rechazado: { bg: colors.coral, text: 'Rechazado', icon: '❌' },
    };

    const badge = badges[currentEvent.estado_aprobacion] || badges.borrador;

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
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>{badge.icon}</span>
        {badge.text}
      </span>
    );
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
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
        </motion.button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      color: colors.light,
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0 }}>
          {isEditing ? '✏️ Editar Evento' : '➕ Nuevo Evento'}
        </h1>
        {getEstadoBadge()}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Nombre */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Nombre del Evento *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej: Festival de Salsa 2025"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: `${colors.dark}cc`,
              border: `1px solid ${colors.light}33`,
              color: colors.light,
              fontSize: '1rem',
            }}
          />
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            placeholder="Describe tu evento..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: `${colors.dark}cc`,
              border: `1px solid ${colors.light}33`,
              color: colors.light,
              fontSize: '1rem',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Sede General */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Sede General
          </label>
          <input
            type="text"
            value={sedeGeneral}
            onChange={(e) => setSedeGeneral(e.target.value)}
            placeholder="Ej: Centro de Convenciones"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: `${colors.dark}cc`,
              border: `1px solid ${colors.light}33`,
              color: colors.light,
              fontSize: '1rem',
            }}
          />
        </div>

        {/* Estilos */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>
            Estilos de Baile
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            {ritmos?.map((ritmo) => (
              <motion.button
                key={ritmo.id}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleEstilo(ritmo.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: estilosSeleccionados.includes(ritmo.id)
                    ? `linear-gradient(135deg, ${colors.coral}, ${colors.orange})`
                    : `${colors.dark}cc`,
                  border: `2px solid ${estilosSeleccionados.includes(ritmo.id) ? colors.coral : `${colors.light}33`}`,
                  color: colors.light,
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                🎵 {ritmo.nombre}
              </motion.button>
            ))}
          </div>
          <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: '8px' }}>
            Seleccionados: {estilosSeleccionados.length}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={createMutation.isPending || updateMutation.isPending}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '16px',
              borderRadius: '50px',
              border: 'none',
              background: (createMutation.isPending || updateMutation.isPending)
                ? `${colors.light}33` 
                : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: (createMutation.isPending || updateMutation.isPending) ? 'not-allowed' : 'pointer',
              boxShadow: `0 8px 24px ${colors.blue}66`,
            }}
          >
            {(createMutation.isPending || updateMutation.isPending) 
              ? 'Guardando...' 
              : (isEditing ? '💾 Actualizar Evento' : '✨ Crear Evento')
            }
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/profile/organizer/edit')}
            style={{
              padding: '16px 24px',
              borderRadius: '50px',
              border: `2px solid ${colors.light}33`,
              background: 'transparent',
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            ← Volver
          </motion.button>
        </div>
      </form>
    </div>
  );
};