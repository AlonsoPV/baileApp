import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useCreateDate, useUpdateDate } from "../../hooks/useEvents";
import { useEventDate } from "../../hooks/useEventDate";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useToast } from "../../components/Toast";
import EventScheduleEditor from "../../components/EventScheduleEditor";
import EventPriceEditor from "../../components/EventPriceEditor";
import AddToCalendarButton from "../../components/AddToCalendarButton";
import DateFlyerUploader from "../../components/events/DateFlyerUploader";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useOrganizerLocations } from "../../hooks/useOrganizerLocations";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

export function EventDateEditScreen() {
  const params = useParams<{ id?: string; dateId?: string; parentId?: string }>();
  const id = params.id ?? params.dateId;
  const parentId = params.parentId;
  const isNew = !!parentId;
  const navigate = useNavigate();
  const create = useCreateDate();
  const update = useUpdateDate();
  const dateIdNum = id ? parseInt(id) : undefined;
  const { data: currentDate } = useEventDate(!isNew ? dateIdNum : undefined);
  const { showToast } = useToast();
  const { data: org } = useMyOrganizer();
  const { data: orgLocations = [] } = useOrganizerLocations((org as any)?.id);

  // For new date, currentDate stays null; for edit, we fetch by dateId

  const [form, setForm] = useState({
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    lugar: "",
    direccion: "",
    ciudad: "",
    referencias: "",
    requisitos: "",
    flyer_url: "",
    estado_publicacion: "borrador" as 'borrador' | 'publicado'
  });
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  useEffect(() => {
    if (currentDate) {
      setForm(prev => {
        // Solo actualizar si hay cambios reales para evitar loops
        const newFlyerUrl = currentDate.flyer_url || "";
        const newForm = {
          fecha: currentDate.fecha,
          hora_inicio: currentDate.hora_inicio || "",
          hora_fin: currentDate.hora_fin || "",
          lugar: currentDate.lugar || "",
          direccion: currentDate.direccion || "",
          ciudad: currentDate.ciudad || "",
          referencias: currentDate.referencias || "",
          requisitos: currentDate.requisitos || "",
          flyer_url: newFlyerUrl,
          estado_publicacion: (currentDate.estado_publicacion as 'borrador' | 'publicado')
        };
        
        // Comparar flyer_url especialmente para detectar cambios
        if (prev.flyer_url !== newFlyerUrl || 
            prev.fecha !== newForm.fecha ||
            prev.referencias !== newForm.referencias ||
            prev.estado_publicacion !== newForm.estado_publicacion) {
          return newForm;
        }
        return prev;
      });
      
      // Preseleccionar ubicación si coincide con alguna guardada
      const match = orgLocations.find((loc) =>
        (loc.nombre || "") === (currentDate.lugar || "") &&
        (loc.direccion || "") === (currentDate.direccion || "") &&
        (loc.ciudad || "") === (currentDate.ciudad || "")
      );
      if (match?.id) {
        setSelectedLocationId(String(match.id));
      }
    }
  }, [currentDate, orgLocations]);

  const applyOrganizerLocationToForm = (loc?: any | null) => {
    if (!loc) return;
    setSelectedLocationId(loc.id ? String(loc.id) : "");
    setForm(prev => ({
      ...prev,
      lugar: loc.nombre || prev.lugar,
      direccion: loc.direccion || prev.direccion,
      ciudad: loc.ciudad || prev.ciudad,
    }));
  };

  const clearLocationSelection = () => {
    setSelectedLocationId("");
    setForm(prev => ({
      ...prev,
      lugar: "",
      direccion: "",
      ciudad: "",
    }));
  };

  const updateManualLocationField = (
    key: 'lugar' | 'direccion' | 'ciudad',
    value: string
  ) => {
    setSelectedLocationId("");
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  async function save() {
    console.log('[EventDateEditScreen] Save called:', { isNew, parentId, id, form });

    if (!form.fecha) {
      showToast('La fecha es obligatoria', 'error');
      return;
    }

    if (!isNew && !id) {
      showToast('ID requerido para actualizar', 'error');
      return;
    }

    try {
      if (isNew) {
        if (!(org as any)?.id) {
          showToast('No se encontró tu perfil de organizador', 'error');
          return;
        }

        console.log('[EventDateEditScreen] Creating new date with organizerId:', (org as any)?.id);
        const result = await create.mutateAsync({
          organizer_id: (org as any)?.id ?? null,
          fecha: form.fecha,
          hora_inicio: form.hora_inicio || null,
          hora_fin: form.hora_fin || null,
          lugar: form.lugar.trim() || null,
          direccion: form.direccion.trim() || null,
          ciudad: form.ciudad.trim() || null,
          referencias: form.referencias.trim() || null,
          requisitos: form.requisitos.trim() || null,
          flyer_url: form.flyer_url?.trim() || null,
          estado_publicacion: form.estado_publicacion
        } as any);
        console.log('[EventDateEditScreen] Date created successfully:', result);
        showToast('Fecha creada ✅', 'success');
      } else {
        console.log('[EventDateEditScreen] Updating date with id:', id);
        const updatePayload = {
          id: Number(id),
          fecha: form.fecha,
          hora_inicio: form.hora_inicio || null,
          hora_fin: form.hora_fin || null,
          lugar: form.lugar.trim() || null,
          direccion: form.direccion.trim() || null,
          ciudad: form.ciudad.trim() || null,
          referencias: form.referencias.trim() || null,
          requisitos: form.requisitos.trim() || null,
          flyer_url: form.flyer_url?.trim() || null,
          estado_publicacion: form.estado_publicacion
        } as any;
        console.log('[EventDateEditScreen] Update payload:', updatePayload);
        const updatedData = await update.mutateAsync(updatePayload);
        console.log('[EventDateEditScreen] Date updated successfully:', updatedData);
        
        // Actualizar el estado local con los datos actualizados de la BD
        if (updatedData) {
          setForm({
            fecha: updatedData.fecha,
            hora_inicio: updatedData.hora_inicio || "",
            hora_fin: updatedData.hora_fin || "",
            lugar: updatedData.lugar || "",
            direccion: updatedData.direccion || "",
            ciudad: updatedData.ciudad || "",
            referencias: updatedData.referencias || "",
            requisitos: updatedData.requisitos || "",
            flyer_url: updatedData.flyer_url || "",
            estado_publicacion: (updatedData.estado_publicacion as 'borrador' | 'publicado')
          });
        }
        
        showToast('Fecha actualizada ✅', 'success');
      }
      navigate('/profile/organizer/edit');
    } catch (err: any) {
      console.error('[EventDateEditScreen] Error saving date:', err);
      showToast(`Error: ${err.message || 'Error al guardar fecha'}`, 'error');
    }
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
          { label: isNew ? 'Nueva Fecha' : 'Editar Fecha', icon: '📅' },
        ]}
      />

      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '32px' }}>
        {isNew ? "📅 Crear" : "📅 Editar"} Fecha
      </h1>

      {/* Fecha y Hora - estilo similar a OrganizerProfileEditor */}
      <div
        className="org-editor-card"
        style={{
          marginBottom: '24px',
          padding: '1.2rem',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
          📅 Fecha y Hora
        </h3>
        <div
          className="org-date-form-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}
        >
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Fecha *
            </label>
            <input
              type="date"
              value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })}
              required
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Hora Inicio
            </label>
            <input
              type="time"
              value={form.hora_inicio}
              onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Hora Fin
            </label>
            <input
              type="time"
              value={form.hora_fin}
              onChange={e => setForm({ ...form, hora_fin: e.target.value })}
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>
      </div>

      {/* Ubicación del Evento - estilo similar a OrganizerProfileEditor */}
      <div
        className="org-editor-card"
        style={{
          marginBottom: '24px',
          padding: '1.2rem',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
          📍 Ubicación del Evento
        </h3>
        {orgLocations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Elegir ubicación existente o ingresa una nueva
            </label>
            <div className="org-date-form-select-wrapper" style={{ position: 'relative' }}>
              <select
                className="org-date-form-select"
                value={selectedLocationId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  if (!nextId) {
                    clearLocationSelection();
                    return;
                  }
                  const found = orgLocations.find((loc) => String(loc.id ?? "") === nextId);
                  applyOrganizerLocationToForm(found);
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  paddingRight: 40,
                  background: '#2b2b2b',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#FFFFFF',
                  outline: 'none',
                  fontSize: 14,
                  borderRadius: 12,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              >
                <option value="" style={{ background: '#2b2b2b', color: '#FFFFFF' }}>
                  — Escribir manualmente —
                </option>
                {orgLocations.map((loc) => (
                  <option
                    key={loc.id}
                    value={String(loc.id)}
                    style={{ color: '#FFFFFF', background: '#2b2b2b' }}
                  >
                    {loc.nombre || loc.direccion || 'Ubicación'}
                  </option>
                ))}
              </select>
              <span
                className="org-date-form-select-arrow"
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                ▼
              </span>
            </div>
          </div>
        )}

        {/* Formulario de ubicación manual */}
        <div
          className="org-date-form-grid-2"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
        >
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Nombre de la ubicación
            </label>
            <input
              type="text"
              value={form.lugar}
              onChange={(e) => updateManualLocationField('lugar', e.target.value)}
              placeholder="Ej: Sede Central / Salón Principal"
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Dirección
            </label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => updateManualLocationField('direccion', e.target.value)}
              placeholder="Calle, número, colonia"
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>
        <div
          className="org-date-form-grid-2"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}
        >
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Ciudad
            </label>
            <input
              type="text"
              value={form.ciudad}
              onChange={(e) => updateManualLocationField('ciudad', e.target.value)}
              placeholder="Ciudad"
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Notas o referencias
            </label>
            <input
              type="text"
              value={form.referencias}
              onChange={e => setForm({ ...form, referencias: e.target.value })}
              placeholder="Ej. Entrada lateral, 2do piso"
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Requisitos / Dresscode
        </label>
        <textarea
          value={form.requisitos}
          onChange={e => setForm({...form, requisitos: e.target.value})}
          rows={3}
          placeholder="Requisitos para participar..."
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

      {/* Flyer del Evento */}
      <div style={{ marginBottom: '24px' }}>
        <DateFlyerUploader
          value={form.flyer_url || null}
          onChange={(url) => setForm({...form, flyer_url: url || ""})}
          dateId={!isNew ? Number(id) : undefined}
          parentId={parentId ? Number(parentId) : undefined}
        />
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '32px',
        padding: '16px',
        background: `${colors.dark}aa`,
        borderRadius: '12px',
        border: `1px solid ${colors.light}22`,
      }}>
        <label style={{ fontWeight: '600', margin: 0 }}>
          Publicado
        </label>
        <input
          type="checkbox"
          checked={form.estado_publicacion === 'publicado'}
          onChange={e => setForm({
            ...form, 
            estado_publicacion: e.target.checked ? 'publicado' : 'borrador'
          })}
          style={{
            width: '20px',
            height: '20px',
            accentColor: colors.coral,
          }}
        />
        <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
          {form.estado_publicacion === 'publicado' 
            ? 'Visible públicamente y permite RSVP' 
            : 'Solo visible para ti'
          }
        </span>
      </div>

      {/* Cronograma del Evento */}
      {!isNew && id ? (
        <EventScheduleEditor eventDateId={parseInt(id)} />
      ) : (
        <div style={{
          padding: '24px',
          background: `${colors.dark}66`,
          borderRadius: '16px',
          border: `1px solid ${colors.light}22`,
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: colors.light,
            marginBottom: '16px'
          }}>
            📅 Cronograma del Evento
          </h2>
          <p style={{
            color: colors.light,
            opacity: 0.7,
            fontSize: '0.875rem',
            margin: 0
          }}>
            El cronograma se podrá configurar después de guardar la fecha del evento.
          </p>
        </div>
      )}

      {/* Costos y Promociones */}
      {!isNew && id ? (
        <EventPriceEditor eventDateId={parseInt(id)} />
      ) : (
        <div style={{
          padding: '24px',
          background: `${colors.dark}66`,
          borderRadius: '16px',
          border: `1px solid ${colors.light}22`,
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: colors.light,
            marginBottom: '16px'
          }}>
            💰 Costos y Promociones
          </h2>
          <p style={{
            color: colors.light,
            opacity: 0.7,
            fontSize: '0.875rem',
            margin: 0
          }}>
            Los costos y promociones se podrán configurar después de guardar la fecha del evento.
          </p>
        </div>
      )}

      {/* Botón Agregar a Calendario - Solo para eventos existentes */}
      {!isNew && id && currentDate && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <AddToCalendarButton event={{
            titulo: `Evento ${currentDate.id}`,
            descripcion: `Evento del ${currentDate.fecha}`,
            fecha: currentDate.fecha,
            hora_inicio: currentDate.hora_inicio,
            hora_fin: currentDate.hora_fin,
            lugar: currentDate.lugar
          }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={save}
          disabled={create.isPending || update.isPending}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px',
            borderRadius: '50px',
            border: 'none',
            background: (create.isPending || update.isPending)
              ? `${colors.light}33` 
              : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '700',
            cursor: (create.isPending || update.isPending) ? 'not-allowed' : 'pointer',
            boxShadow: `0 8px 24px ${colors.blue}66`,
          }}
        >
          {(create.isPending || update.isPending) ? 'Guardando...' : '💾 Guardar'}
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