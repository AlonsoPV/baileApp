import React from "react";
import { EventParent, EventDate, EventSchedule, EventPrice } from "../../types/events";
import { useTags } from "../../hooks/useTags";
import EventScheduleEditor from "../EventScheduleEditor";
import EventPriceEditor from "../EventPriceEditor";
import { Chip } from "../profile/Chip";
import DateFlyerUploader from "./DateFlyerUploader";

type Props = {
  mode: "create" | "edit";
  parent?: Partial<EventParent>;
  date?: Partial<EventDate>;
  schedules?: EventSchedule[];
  prices?: EventPrice[];
  onChangeParent: (patch: Partial<EventParent>) => void;
  onChangeDate: (patch: Partial<EventDate>) => void;
  onSaveParent: () => Promise<void>;
  onSaveDate: () => Promise<void>;
  dateId?: number | null;
  onFinish?: () => void;
  isLoading?: boolean;
};

export default function EventForm(props: Props) {
  const { ritmos, zonas } = useTags();
  const p = props.parent || {};
  const d = props.date || {};

  function toggleEstiloParent(id: number) {
    const arr = p.estilos ?? [];
    const exists = arr.includes(id);
    props.onChangeParent({ estilos: exists ? arr.filter(x => x !== id) : [...arr, id] });
  }

  function toggleZonaDate(id: number) {
    const arr = d.zonas ?? [];
    const exists = arr.includes(id);
    props.onChangeDate({ zonas: exists ? arr.filter(x => x !== id) : [...arr, id] });
  }

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '1.5rem', color: 'white' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
        {props.mode === "create" ? "Crear evento" : "Editar evento"}
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'rgba(163, 163, 163, 1)', marginBottom: '1.5rem' }}>
        La misma información aplica para crear, editar y visualizar.
      </p>

      {/* BLOQUE: EVENTO PADRE */}
      <section style={{
        marginBottom: '2rem',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        background: 'rgba(23, 23, 23, 0.4)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Información del evento
        </h2>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Nombre *</label>
          <input
            style={{
              width: '100%',
              background: 'rgba(38, 38, 38, 1)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              outline: 'none'
            }}
            placeholder="Ej: Social Copacabana"
            value={p.nombre || ""}
            onChange={(e) => props.onChangeParent({ nombre: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Descripción</label>
          <textarea
            style={{
              width: '100%',
              background: 'rgba(38, 38, 38, 1)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              outline: 'none',
              minHeight: '80px',
              resize: 'vertical'
            }}
            placeholder="Descripción general del evento"
            value={p.descripcion || ""}
            onChange={(e) => props.onChangeParent({ descripcion: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Sede general</label>
          <input
            style={{
              width: '100%',
              background: 'rgba(38, 38, 38, 1)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              outline: 'none'
            }}
            placeholder="Ej: Salón Principal"
            value={p.sede_general || ""}
            onChange={(e) => props.onChangeParent({ sede_general: e.target.value })}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '600' }}>
            🎵 Ritmos / Estilos
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {ritmos?.map(r => (
              <Chip
                key={r.id}
                label={r.nombre}
                icon="🎵"
                variant="ritmo"
                active={(p.estilos || []).includes(r.id)}
                onClick={() => toggleEstiloParent(r.id)}
              />
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(163, 163, 163, 1)', marginTop: '0.5rem' }}>
            Selecciona los ritmos que se bailarán en este evento
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            onClick={props.onSaveParent}
            disabled={props.isLoading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: props.isLoading
                ? 'rgba(115, 115, 115, 1)'
                : 'linear-gradient(to right, rgb(59, 130, 246), rgb(236, 72, 153))',
              color: 'white',
              cursor: props.isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: props.isLoading ? 0.6 : 1
            }}
          >
            {props.isLoading ? 'Guardando...' : 'Guardar evento'}
          </button>
        </div>
      </section>

      {/* BLOQUE: FECHA/EDICIÓN */}
      <section style={{
        marginBottom: '2rem',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        background: 'rgba(23, 23, 23, 0.4)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          Fecha y ubicación
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Fecha *</label>
            <input
              type="date"
              style={{
                width: '100%',
                background: 'rgba(38, 38, 38, 1)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
              value={d.fecha || ""}
              onChange={(e) => props.onChangeDate({ fecha: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Hora inicio</label>
            <input
              type="time"
              style={{
                width: '100%',
                background: 'rgba(38, 38, 38, 1)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
              value={d.hora_inicio || ""}
              onChange={(e) => props.onChangeDate({ hora_inicio: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Hora fin</label>
            <input
              type="time"
              style={{
                width: '100%',
                background: 'rgba(38, 38, 38, 1)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
              value={d.hora_fin || ""}
              onChange={(e) => props.onChangeDate({ hora_fin: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Lugar</label>
            <input
              style={{
                width: '100%',
                background: 'rgba(38, 38, 38, 1)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
              placeholder="Ej: Salón Principal"
              value={d.lugar || ""}
              onChange={(e) => props.onChangeDate({ lugar: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Ciudad</label>
            <input
              style={{
                width: '100%',
                background: 'rgba(38, 38, 38, 1)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
              placeholder="Ej: Ciudad de México"
              value={d.ciudad || ""}
              onChange={(e) => props.onChangeDate({ ciudad: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Dirección</label>
            <input
              style={{
                width: '100%',
                background: 'rgba(38, 38, 38, 1)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                outline: 'none'
              }}
              placeholder="Dirección completa"
              value={d.direccion || ""}
              onChange={(e) => props.onChangeDate({ direccion: e.target.value })}
            />
          </div>
        </div>

        {/* Uploader de Flyer (4:5 recomendado) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <DateFlyerUploader
            value={(d as any).flyer_url || (d as any).portada_url || null}
            onChange={(url)=> props.onChangeDate({ flyer_url: url } as any)}
            dateId={(props.dateId as any) || undefined}
            parentId={(p as any).id || undefined}
          />
        </div>

        {/* Selector de Zonas */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '600' }}>
            📍 Zonas
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {zonas?.map(z => (
              <Chip
                key={z.id}
                label={z.nombre}
                icon="📍"
                variant="zona"
                active={(d.zonas || []).includes(z.id)}
                onClick={() => toggleZonaDate(z.id)}
              />
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(163, 163, 163, 1)', marginTop: '0.5rem' }}>
            Selecciona las zonas/barrios donde se realizará el evento
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            Requisitos / Dresscode
          </label>
          <textarea
            style={{
              width: '100%',
              background: 'rgba(38, 38, 38, 1)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              outline: 'none',
              minHeight: '80px',
              resize: 'vertical'
            }}
            placeholder="Requisitos para participar..."
            value={d.requisitos || ""}
            onChange={(e) => props.onChangeDate({ requisitos: e.target.value })}
          />
        </div>

        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '0.5rem',
          marginBottom: '1rem',
          cursor: 'pointer'
        }}>
          <input
            type="checkbox"
            checked={(d.estado_publicacion || "borrador") === "publicado"}
            onChange={(e) => props.onChangeDate({
              estado_publicacion: e.target.checked ? "publicado" : "borrador" as const
            })}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span>Publicado (visible para todos)</span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={props.onSaveDate}
            disabled={props.isLoading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: props.isLoading
                ? 'rgba(115, 115, 115, 1)'
                : 'linear-gradient(to right, rgb(59, 130, 246), rgb(236, 72, 153))',
              color: 'white',
              cursor: props.isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: props.isLoading ? 0.6 : 1
            }}
          >
            {props.isLoading ? 'Guardando...' : 'Guardar edición'}
          </button>
        </div>
      </section>

      {/* BLOQUE: CRONOGRAMA */}
      {props.dateId && (
        <section style={{
          marginBottom: '2rem',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          background: 'rgba(23, 23, 23, 0.4)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            📅 Cronograma
          </h2>
          <EventScheduleEditor eventDateId={props.dateId} />
        </section>
      )}

      {/* BLOQUE: PRECIOS */}
      {props.dateId && (
        <section style={{
          marginBottom: '2rem',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          background: 'rgba(23, 23, 23, 0.4)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            💰 Costos y Promociones
          </h2>
          <EventPriceEditor eventDateId={props.dateId} />
        </section>
      )}

      {props.onFinish && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={props.onFinish}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'rgb(22, 163, 74)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ✅ Finalizar
          </button>
        </div>
      )}
    </div>
  );
}

