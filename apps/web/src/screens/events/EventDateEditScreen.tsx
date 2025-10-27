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

  // For new date, currentDate stays null; for edit, we fetch by dateId

  const [form, setForm] = useState({
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    lugar: "",
    direccion: "",
    ciudad: "",
    requisitos: "",
    estado_publicacion: "borrador" as 'borrador' | 'publicado'
  });

  useEffect(() => {
    if (currentDate) {
      setForm({
        fecha: currentDate.fecha,
        hora_inicio: currentDate.hora_inicio || "",
        hora_fin: currentDate.hora_fin || "",
        lugar: currentDate.lugar || "",
        direccion: currentDate.direccion || "",
        ciudad: currentDate.ciudad || "",
        requisitos: currentDate.requisitos || "",
        estado_publicacion: (currentDate.estado_publicacion as 'borrador' | 'publicado')
      });
    }
  }, [currentDate]);

  async function save() {
    console.log('[EventDateEditScreen] Save called:', { isNew, parentId, id, form });

    if (!form.fecha) {
      showToast('La fecha es obligatoria', 'error');
      return;
    }

    if (!parentId && !id) {
      showToast('ID requerido', 'error');
      return;
    }

    try {
      if (isNew) {
        console.log('[EventDateEditScreen] Creating new date with parentId:', parentId);
        const result = await create.mutateAsync({
          parent_id: Number(parentId),
          fecha: form.fecha,
          hora_inicio: form.hora_inicio || null,
          hora_fin: form.hora_fin || null,
          lugar: form.lugar.trim() || null,
          direccion: form.direccion.trim() || null,
          ciudad: form.ciudad.trim() || null,
          requisitos: form.requisitos.trim() || null,
          estado_publicacion: form.estado_publicacion
        });
        console.log('[EventDateEditScreen] Date created successfully:', result);
        showToast('Fecha creada ✅', 'success');
      } else {
        console.log('[EventDateEditScreen] Updating date with id:', id);
        await update.mutateAsync({
          id: Number(id),
          fecha: form.fecha,
          hora_inicio: form.hora_inicio || null,
          hora_fin: form.hora_fin || null,
          lugar: form.lugar.trim() || null,
          direccion: form.direccion.trim() || null,
          ciudad: form.ciudad.trim() || null,
          requisitos: form.requisitos.trim() || null,
          estado_publicacion: form.estado_publicacion
        });
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Fecha *
          </label>
          <input
            type="date"
            value={form.fecha}
            onChange={e => setForm({...form, fecha: e.target.value})}
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

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Hora inicio
          </label>
          <input
            type="time"
            value={form.hora_inicio}
            onChange={e => setForm({...form, hora_inicio: e.target.value})}
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

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Hora fin
          </label>
          <input
            type="time"
            value={form.hora_fin}
            onChange={e => setForm({...form, hora_fin: e.target.value})}
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
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Lugar
          </label>
          <input
            type="text"
            value={form.lugar}
            onChange={e => setForm({...form, lugar: e.target.value})}
            placeholder="Ej: Salón Principal"
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

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
            Ciudad
          </label>
          <input
            type="text"
            value={form.ciudad}
            onChange={e => setForm({...form, ciudad: e.target.value})}
            placeholder="Ej: Ciudad de México"
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
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
          Dirección
        </label>
        <input
          type="text"
          value={form.direccion}
          onChange={e => setForm({...form, direccion: e.target.value})}
          placeholder="Dirección completa"
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

      {/* Cronograma del Evento - Solo para eventos existentes */}
      {!isNew && id && (
        <EventScheduleEditor eventDateId={parseInt(id)} />
      )}

      {/* Costos y Promociones - Solo para eventos existentes */}
      {!isNew && id && (
        <EventPriceEditor eventDateId={parseInt(id)} />
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