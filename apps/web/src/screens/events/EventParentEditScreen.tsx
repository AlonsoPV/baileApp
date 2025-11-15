import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useCreateParent, useUpdateParent, useParentsByOrganizer } from "../../hooks/useEvents";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useToast } from "../../components/Toast";
import UbicacionesEditor from "../../components/locations/UbicacionesEditor";
import { useOrganizerLocations } from "../../hooks/useOrganizerLocations";
import OrganizerLocationPicker from "../../components/locations/OrganizerLocationPicker";
import RitmosChips from "@/components/RitmosChips";
import ImageWithFallback from "../../components/ImageWithFallback";
import { useEventParentMedia } from "../../hooks/useEventParentMedia";

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
  const { data: orgLocations = [] } = useOrganizerLocations(org?.id);
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

  // Media (solo en modo edición con ID existente)
  const parentMedia = isEdit && idParam ? useEventParentMedia(Number(idParam)) : (null as any);
  const avatarMedia = parentMedia?.media?.find((m: any) => m.slot === 'avatar');

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
          Foto de avatar del evento
        </label>
        {!isEdit && (
          <div style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Crea el evento para habilitar la subida de la foto de avatar.
          </div>
        )}
        {isEdit && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ width: 128, height: 128, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)' }}>
                {avatarMedia?.url ? (
                  <ImageWithFallback src={avatarMedia.url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#fff', opacity: 0.7 }}>🖼️</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <label style={{
                  padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer', background: 'rgba(255,255,255,0.06)'
                }}>
                  Subir imagen
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const sizeMB = file.size / (1024 * 1024);
                      const MAX_IMAGE_SIZE_MB = 5;
                      if (file.type.startsWith('image/') && sizeMB > MAX_IMAGE_SIZE_MB) {
                        alert(`La imagen supera el límite de ${MAX_IMAGE_SIZE_MB} MB`);
                        e.currentTarget.value = '';
                        return;
                      }
                      parentMedia?.add?.mutate({ file, slot: 'avatar' } as any);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                {avatarMedia && (
                  <button
                    type="button"
                    onClick={() => parentMedia?.remove?.mutate(avatarMedia.id)}
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#F5F5F5', cursor: 'pointer' }}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              Recomendado: imagen cuadrada (1:1), mínimo 600×600px.
            </div>
          </div>
        )}
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
        {orgLocations.length > 4 && (
          <div style={{ marginBottom: 12 }}>
            <OrganizerLocationPicker
              organizerId={org?.id}
              onPick={(u) => {
                const add = {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                  nombre: u.nombre || '',
                  direccion: u.direccion || '',
                  referencias: u.referencias || '',
                  zonaIds: Array.isArray(u.zona_ids) ? u.zona_ids : []
                };
                const next = Array.isArray(form.ubicaciones) ? [...form.ubicaciones, add] : [add];
                setForm({ ...form, ubicaciones: next });
              }}
              title="Buscar y agregar ubicación guardada"
            />
          </div>
        )}
        {orgLocations.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Usar mis ubicaciones guardadas</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {orgLocations.map((u: any) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    const add = {
                      id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
                      nombre: u.nombre || '',
                      direccion: u.direccion || '',
                      referencias: u.referencias || '',
                      zonaIds: Array.isArray(u.zona_ids) ? u.zona_ids : []
                    };
                    const next = Array.isArray(form.ubicaciones) ? [...form.ubicaciones, add] : [add];
                    setForm({ ...form, ubicaciones: next });
                  }}
                  style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontSize: 12 }}
                >
                  ➕ {u.nombre || 'Ubicación'}
                </button>
              ))}
            </div>
          </div>
        )}
        <UbicacionesEditor
          value={form.ubicaciones}
          onChange={(ubicaciones) => setForm({...form, ubicaciones})}
          title="Ubicaciones del evento"
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