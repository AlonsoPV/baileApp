import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EventForm from "../../components/events/EventForm";
import { useQueryClient } from "@tanstack/react-query";
import { useEventFullByDateId } from "../../hooks/useEventFull";
import { useUpdateParent, useUpdateDate } from "../../hooks/useEvents";
import { useToast } from "../../components/Toast";

export default function EventEditScreen() {
  const { dateId } = useParams();
  const id = Number(dateId);
  const nav = useNavigate();
  const qc = useQueryClient();
  const q = useEventFullByDateId(id);
  const { showToast } = useToast();

  const updateParent = useUpdateParent();
  const updateDate = useUpdateDate();

  const [parent, setParent] = useState(q.data?.parent || {});
  const [date, setDate] = useState(q.data?.date || {});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('[EventEditScreen] Data loaded:', {
      hasParent: !!q.data?.parent,
      hasDate: !!q.data?.date,
      parentId: q.data?.parent?.id,
      dateId: q.data?.date?.id
    });

    if (q.data) {
      setParent(q.data.parent);
      setDate(q.data.date);
    }
  }, [q.data?.parent?.id, q.data?.date?.id]);

  async function onSaveParent() {
    console.log('[EventEditScreen] onSaveParent called');
    
    if (!q.data?.parent?.id) {
      showToast('No se encontró el evento', 'error');
      return;
    }

    if (!parent.nombre?.trim()) {
      showToast('El nombre del evento es obligatorio', 'error');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[EventEditScreen] Updating parent:', q.data.parent.id);
      await updateParent.mutateAsync({
        id: q.data.parent.id,
        patch: {
          nombre: parent.nombre.trim(),
          descripcion: parent.descripcion?.trim() || null,
          sede_general: parent.sede_general?.trim() || null,
          estilos: parent.estilos || []
        }
      });

      await qc.invalidateQueries({ queryKey: ["event-full", id] });
      console.log('[EventEditScreen] Parent updated successfully');
      showToast('Evento actualizado ✅', 'success');
    } catch (err: any) {
      console.error('[EventEditScreen] Error updating parent:', err);
      showToast(`Error: ${err.message || 'Error al actualizar evento'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function onSaveDate() {
    console.log('[EventEditScreen] onSaveDate called');
    
    if (!q.data?.date?.id) {
      showToast('No se encontró la fecha', 'error');
      return;
    }

    if (!date.fecha) {
      showToast('La fecha es obligatoria', 'error');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[EventEditScreen] Updating date:', q.data.date.id);
      await updateDate.mutateAsync({
        id: q.data.date.id,
        fecha: date.fecha,
        hora_inicio: date.hora_inicio || null,
        hora_fin: date.hora_fin || null,
        lugar: date.lugar || null,
        ciudad: date.ciudad || null,
        direccion: date.direccion || null,
        requisitos: date.requisitos || null,
        estado_publicacion: date.estado_publicacion || "borrador"
      });

      await qc.invalidateQueries({ queryKey: ["event-full", id] });
      console.log('[EventEditScreen] Date updated successfully');
      showToast('Fecha actualizada ✅', 'success');
    } catch (err: any) {
      console.error('[EventEditScreen] Error updating date:', err);
      showToast(`Error: ${err.message || 'Error al actualizar fecha'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  if (q.isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            borderTop: '3px solid #FF3D57',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Cargando evento...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!q.data) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
            Evento no encontrado
          </h2>
          <button
            onClick={() => nav('/profile/organizer/edit')}
            style={{
              padding: '12px 24px',
              borderRadius: '25px',
              border: 'none',
              background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(236, 72, 153))',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Volver al perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <EventForm
      mode="edit"
      parent={parent}
      date={date}
      onChangeParent={(patch) => setParent(prev => ({ ...prev, ...patch }))}
      onChangeDate={(patch) => setDate(prev => ({ ...prev, ...patch }))}
      onSaveParent={onSaveParent}
      onSaveDate={onSaveDate}
      dateId={id}
      onFinish={() => nav(`/events/date/${id}`)}
      isLoading={isLoading}
    />
  );
}

