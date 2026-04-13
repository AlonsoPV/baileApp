import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EventForm from "../../components/events/EventForm";
import { useQueryClient } from "@tanstack/react-query";
import { useEventFullByDateId } from "../../hooks/useEventFull";
import { useUpdateParent, useUpdateDate } from "../../hooks/useEvents";
import { useToast } from "../../components/Toast";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import type { EventParent, EventDate } from "../../types/events";
import { mergeWhatsappIntoUpdatePatch } from "../../utils/eventWhatsapp";

export default function EventEditScreen() {
  const { dateId } = useParams();
  const id = Number(dateId);
  const nav = useNavigate();
  const qc = useQueryClient();
  const q = useEventFullByDateId(id);
  const { showToast } = useToast();

  const updateParent = useUpdateParent();
  const updateDate = useUpdateDate();

  const [parent, setParent] = useState<Partial<EventParent>>(q.data?.parent || {});
  const [date, setDate] = useState<Partial<EventDate>>(q.data?.date || {});
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
      const datePatch: Record<string, unknown> = {
        id: q.data.date.id,
        nombre: (date as any).nombre || null,
        biografia: (date as any).biografia || null,
        djs: (date as any).djs || null,
        fecha: date.fecha,
        hora_inicio: date.hora_inicio || null,
        hora_fin: date.hora_fin || null,
        lugar: date.lugar || null,
        ciudad: date.ciudad || null,
        direccion: date.direccion || null,
        referencias: (date as any).referencias || null,
        requisitos: date.requisitos || null,
        estilos: Array.isArray((date as any).estilos) ? (date as any).estilos : [],
        ritmos_seleccionados: Array.isArray((date as any).ritmos_seleccionados) ? (date as any).ritmos_seleccionados : [],
        zonas: Array.isArray((date as any).zonas) ? (date as any).zonas : [],
        cronograma: Array.isArray((date as any).cronograma) ? (date as any).cronograma : [],
        costos: Array.isArray((date as any).costos) ? (date as any).costos : [],
        flyer_url: (date as any).flyer_url || null,
        estado_publicacion: date.estado_publicacion || "borrador"
      };
      // No campos de WhatsApp en EventForm: no marcamos toques; no re-enviar contacto salvo que exista UI dedicada.
      mergeWhatsappIntoUpdatePatch(datePatch, date as any, { phone: false, message: false });

      await updateDate.mutateAsync(datePatch as any);

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
    <div>
      {/* Breadcrumbs */}
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: '🏠' },
            { label: 'Organizador', href: '/profile/organizer/edit', icon: '🎤' },
            { label: q.data?.parent?.nombre || 'Evento', href: `/events/parent/${q.data?.parent?.id}`, icon: '🎉' },
            { label: 'Editar', icon: '✏️' },
          ]}
        />
      </div>

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
    </div>
  );
}

