import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useCreateParent, useUpdateParent, useParentsByOrganizer } from "../../hooks/useEvents";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useToast } from "../../components/Toast";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function EventParentEditScreen() {
  const params = useParams<{ id?: string; parentId?: string }>();
  const idParam = params.id ?? params.parentId;
  const isEdit = !!idParam;
  const navigate = useNavigate();
  const { data: org } = useMyOrganizer();
  const { data: parents } = useParentsByOrganizer(org?.id);
  const create = useCreateParent();
  const update = useUpdateParent();
  const { showToast } = useToast();

  const currentEvent = isEdit ? parents?.find(p => p.id === parseInt(idParam!)) : null;

  console.log('[EventParentEditScreen] Debug:', {
    id: idParam,
    isEdit,
    parentsCount: parents?.length,
    currentEvent,
    organizerId: org?.id
  });

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    sede_general: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentEvent) {
      setForm({
        nombre: currentEvent.nombre,
        descripcion: currentEvent.descripcion || "",
        sede_general: currentEvent.sede_general || ""
      });
    }
  }, [currentEvent]);

  async function save() {
    console.log('[EventParentEditScreen] Save called:', { isEdit, id: idParam, form });
    
    if (!org?.id) {
      showToast('No tienes organizador creado', 'error');
      return;
    }

    if (!form.nombre.trim()) {
      showToast('El nombre del evento es obligatorio', 'error');
      return;
    }

    setIsLoading(true);

    try {
      if (!isEdit) {
        console.log('[EventParentEditScreen] Creating new event');
        const p = await create.mutateAsync({
          organizer_id: org.id,
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          sede_general: form.sede_general.trim() || null
        });
        console.log('[EventParentEditScreen] Event created:', p);
        showToast('Evento creado ✅', 'success');
        navigate(`/events/parent/${p.id}/edit`);
      } else {
        console.log('[EventParentEditScreen] Updating event:', idParam);
        await update.mutateAsync({
          id: Number(idParam),
          patch: {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            sede_general: form.sede_general.trim() || null
          }
        });
        console.log('[EventParentEditScreen] Event updated successfully');
        showToast('Evento actualizado ✅', 'success');
        navigate('/profile/organizer/edit');
      }
    } catch (err: any) {
      console.error('[EventParentEditScreen] Error saving event:', err);
      showToast(`Error: ${err.message || 'Error al guardar evento'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  if (!org) {
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
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/app/profile', icon: '🏠' },
          { label: 'Organizador', href: '/profile/organizer/edit', icon: '🎤' },
          { label: isEdit ? 'Editar Evento' : 'Nuevo Evento', icon: '📅' },
        ]}
      />

      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '32px' }}>
        {isEdit ? "✏️ Editar" : "➕ Crear"} Evento Padre
      </h1>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Nombre *
        </label>
        <input
          type="text"
          value={form.nombre}
          onChange={e => setForm({...form, nombre: e.target.value})}
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

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Descripción
        </label>
        <textarea
          value={form.descripcion}
          onChange={e => setForm({...form, descripcion: e.target.value})}
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

      <div style={{ marginBottom: '32px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Sede general
        </label>
        <input
          type="text"
          value={form.sede_general}
          onChange={e => setForm({...form, sede_general: e.target.value})}
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

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={save}
          disabled={isLoading}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px',
            borderRadius: '50px',
            border: 'none',
            background: isLoading
              ? `${colors.light}33` 
              : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '700',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: `0 8px 24px ${colors.blue}66`,
          }}
        >
          {isLoading ? 'Guardando...' : '💾 Guardar'}
        </motion.button>

        <motion.button
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
    </div>
  );
}