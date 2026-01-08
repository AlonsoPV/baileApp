import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EventForm from "../../components/events/EventForm";
import { useMyOrganizer, useUpsertMyOrganizer } from "../../hooks/useOrganizer";
import { useCreateParent, useCreateDate } from "../../hooks/useEvents";
import { useToast } from "../../components/Toast";
import { Breadcrumbs } from "../../components/Breadcrumbs";

export default function EventCreateScreen() {
  const nav = useNavigate();
  const { data: organizer } = useMyOrganizer();
  const upsertOrganizer = useUpsertMyOrganizer();
  const createParent = useCreateParent();
  const createDate = useCreateDate();
  const { showToast } = useToast();

  const [parent, setParent] = useState({
    nombre: "",
    descripcion: "",
    sede_general: "",
    estilos: [] as number[]
  });

  const [date, setDate] = useState<Partial<import('../../types/events').EventDate>>({
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    lugar: "",
    ciudad: "",
    direccion: "",
    requisitos: "",
    estado_publicacion: "borrador"
  });

  const [parentId, setParentId] = useState<number | null>(null);
  const [dateId, setDateId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSaveParent() {
    console.log('[EventCreateScreen] onSaveParent called');
    
    if (!parent.nombre.trim()) {
      showToast('El nombre del evento es obligatorio', 'error');
      return;
    }

    // Resolver organizer_id (evita esperar refetch; el mutateAsync ya regresa el id)
    let orgId: number | null = (organizer as any)?.id ?? null;
    if (!orgId) {
      try {
        const createdId = await upsertOrganizer.mutateAsync({ nombre_publico: "Mi Social" });
        // useUpsertMyOrganizer retorna id (number)
        orgId = typeof createdId === 'number' ? createdId : null;
      } catch (err: any) {
        console.error('[EventCreateScreen] Error creating organizer:', err);
        showToast('Error al crear organizador', 'error');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (!orgId) {
        showToast('No se pudo obtener el ID del organizador', 'error');
        return;
      }

      console.log('[EventCreateScreen] Creating parent with orgId:', orgId);
      const p = await createParent.mutateAsync({
        organizer_id: orgId,
        nombre: parent.nombre.trim(),
        descripcion: parent.descripcion.trim() || null,
        sede_general: parent.sede_general.trim() || null,
        estilos: parent.estilos
      });

      console.log('[EventCreateScreen] Parent created:', p);
      setParentId(p.id);
      showToast('Evento creado ✅', 'success');
    } catch (err: any) {
      console.error('[EventCreateScreen] Error creating parent:', err);
      showToast(`Error: ${err.message || 'Error al crear evento'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function onSaveDate() {
    console.log('[EventCreateScreen] onSaveDate called');
    
    if (!parentId) {
      showToast('Primero debes guardar el evento', 'error');
      return;
    }

    if (!date.fecha) {
      showToast('La fecha es obligatoria', 'error');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[EventCreateScreen] Creating date with parentId:', parentId);
      const d = await createDate.mutateAsync({
        parent_id: parentId,
        fecha: date.fecha,
        hora_inicio: date.hora_inicio || null,
        hora_fin: date.hora_fin || null,
        lugar: date.lugar || null,
        ciudad: date.ciudad || null,
        direccion: date.direccion || null,
        requisitos: date.requisitos || null,
        // ✅ guardar flyer + selecciones del form (evita guardar y luego hacer updates extra)
        flyer_url: (date as any).flyer_url || null,
        zonas: (date as any).zonas || [],
        estilos: (date as any).estilos || parent.estilos || [],
        estado_publicacion: date.estado_publicacion
      });

      console.log('[EventCreateScreen] Date created:', d);
      setDateId(d.id);
      showToast('Fecha creada ✅', 'success');
    } catch (err: any) {
      console.error('[EventCreateScreen] Error creating date:', err);
      showToast(`Error: ${err.message || 'Error al crear fecha'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  function finish() {
    if (dateId) {
      nav(`/events/date/${dateId}`);
    } else if (parentId) {
      nav(`/events/parent/${parentId}/dates`);
    } else {
      nav("/profile/organizer/edit");
    }
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/', icon: '🏠' },
            { label: 'Organizador', href: '/profile/organizer/edit', icon: '🎤' },
            { label: 'Crear Evento', icon: '✨' },
          ]}
        />
      </div>

      <EventForm
        mode="create"
        parent={parent}
        date={date}
        onChangeParent={(patch) => setParent(prev => ({ ...prev, ...patch }))}
        onChangeDate={(patch) => setDate(prev => ({ ...prev, ...patch }))}
        onSaveParent={onSaveParent}
        onSaveDate={onSaveDate}
        dateId={dateId}
        onFinish={finish}
        isLoading={isLoading}
      />
    </div>
  );
}

