import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useCreateParent, useUpdateParent, useParentsByOrganizer } from "../../hooks/useEvents";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useToast } from "../../components/Toast";
import UbicacionesEditor from "../../components/academy/UbicacionesEditor";
import RitmosChips from "@/components/RitmosChips";

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
    sede_general: "",
    ubicaciones: [] as any[],
    ritmos_seleccionados: [] as string[]
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentEvent) {
      setForm({
        nombre: currentEvent.nombre,
        descripcion: currentEvent.descripcion || "",
        sede_general: currentEvent.sede_general || "",
        ubicaciones: (currentEvent as any).ubicaciones || [],
        ritmos_seleccionados: ((currentEvent as any).ritmos_seleccionados || []) as string[]
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
          sede_general: form.sede_general.trim() || null,
          ubicaciones: form.ubicaciones,
          ritmos_seleccionados: form.ritmos_seleccionados
        } as any);
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
            sede_general: form.sede_general.trim() || null,
            ubicaciones: form.ubicaciones,
            ritmos_seleccionados: form.ritmos_seleccionados
          } as any
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
    <div className="parent-edit parent-edit-container" style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      color: colors.light,
    }}>
      <style>{`
        .parent-edit-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .parent-edit-card {
          margin-bottom: 2rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .parent-edit-field {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }
        
        .parent-edit-input {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #F5F5F5;
          font-size: 1rem;
        }
        
        .parent-edit-textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #F5F5F5;
          font-size: 1rem;
          resize: vertical;
        }
        
        .parent-edit-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .parent-edit-container { padding: 16px !important; }
          .parent-edit-card { padding: 1.5rem !important; margin-bottom: 1.5rem !important; }
          .parent-edit h1 { font-size: 1.5rem !important; }
          .parent-edit-field { font-size: 0.9rem !important; margin-bottom: 0.75rem !important; }
          .parent-edit-input, .parent-edit-textarea { font-size: 0.95rem !important; padding: 10px !important; }
          .parent-edit-actions { flex-direction: column !important; }
          .parent-edit-actions > * { width: 100% !important; min-width: 0 !important; }
        }
        @media (max-width: 480px) {
          .parent-edit-container { padding: 12px !important; }
          .parent-edit-card { padding: 1rem !important; margin-bottom: 1rem !important; }
          .parent-edit h1 { font-size: 1.25rem !important; }
          .parent-edit-field { font-size: 0.8rem !important; margin-bottom: 0.5rem !important; }
          .parent-edit-input, .parent-edit-textarea { font-size: 0.8rem !important; padding: 8px !important; }
        }
      `}</style>
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

      <div className="parent-edit-card">
        <label className="parent-edit-field">
          Nombre *
        </label>
        <input
          type="text"
          value={form.nombre}
          onChange={e => setForm({...form, nombre: e.target.value})}
          placeholder="Ej: Festival de Salsa 2025"
          className="parent-edit-input"
        />
      </div>

      <div className="parent-edit-card">
        <label className="parent-edit-field">
          Descripción
        </label>
        <textarea
          value={form.descripcion}
          onChange={e => setForm({...form, descripcion: e.target.value})}
          rows={4}
          placeholder="Describe tu evento..."
          className="parent-edit-textarea"
        />
      </div>

      <div className="parent-edit-card">
        <label className="parent-edit-field">
          Sede general
        </label>
        <input
          type="text"
          value={form.sede_general}
          onChange={e => setForm({...form, sede_general: e.target.value})}
          placeholder="Ej: Centro de Convenciones"
          className="parent-edit-input"
        />
      </div>

      <div className="parent-edit-card">
        <label className="parent-edit-field">
          Estilos que bailarán
        </label>
        <div style={{ marginTop: 8 }}>
          <RitmosChips
            selected={form.ritmos_seleccionados}
            onChange={(ids) => setForm({ ...form, ritmos_seleccionados: ids })}
          />
        </div>
      </div>

      <div className="parent-edit-card">
        <UbicacionesEditor
          value={form.ubicaciones}
          onChange={(ubicaciones) => setForm({...form, ubicaciones})}
        />
      </div>

      <div className="parent-edit-actions">
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