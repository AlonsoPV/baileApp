import React, { useCallback, useRef, useState } from "react";
import { EventParent, EventDate, EventSchedule, EventPrice } from "../../types/events";
import { useTags } from "../../hooks/useTags";
import ScheduleEditor from "./ScheduleEditor";
import { Chip } from "../profile/Chip";
import DateFlyerUploader from "./DateFlyerUploader";
import { calculateNextDateWithTime } from "../../utils/calculateRecurringDates";

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
  const flyerUploadPromiseRef = useRef<Promise<string> | null>(null);
  const [isFlyerUploading, setIsFlyerUploading] = useState(false);

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

  const handleSaveDate = useCallback(async () => {
    // Si el usuario seleccionó un flyer y aún se está subiendo,
    // esperamos aquí para que la fecha se cree/guarde con `flyer_url`.
    const pending = flyerUploadPromiseRef.current;
    if (pending) {
      try {
        await pending;
      } catch {
        // El uploader ya muestra el error; no guardamos para evitar "guardar sin flyer" accidental.
        return;
      }
    }
    await props.onSaveDate();
  }, [props]);

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
              disabled={typeof (d as any)?.dia_semana === 'number'}
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

          {/* Recurrente semanal (dia_semana) */}
          <div style={{ gridColumn: '1 / -1' }}>
            {(() => {
              const isRecurrentWeekly = typeof (d as any)?.dia_semana === 'number';
              const dayLabels = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
              let nextYmd: string | null = null;
              if (isRecurrentWeekly) {
                try {
                  const horaInicioStr = (d as any)?.hora_inicio || '20:00';
                  const next = calculateNextDateWithTime((d as any).dia_semana, horaInicioStr);
                  const y = next.getFullYear();
                  const m = String(next.getMonth() + 1).padStart(2, '0');
                  const dd = String(next.getDate()).padStart(2, '0');
                  nextYmd = `${y}-${m}-${dd}`;
                } catch {
                  nextYmd = null;
                }
              }

              const makeDiaSemanaFromFecha = (fechaValue: any): number | null => {
                try {
                  if (!fechaValue) return null;
                  const plain = String(fechaValue).split('T')[0];
                  const [y, m, dd] = plain.split('-').map((n) => parseInt(n, 10));
                  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(dd)) return null;
                  const dt = new Date(y, m - 1, dd);
                  const day = dt.getDay();
                  return typeof day === 'number' && day >= 0 && day <= 6 ? day : null;
                } catch {
                  return null;
                }
              };

              return (
                <div
                  style={{
                    padding: '0.85rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(0,0,0,0.18)',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isRecurrentWeekly}
                        onChange={(e) => {
                          const next = e.target.checked;
                          if (!next) {
                            props.onChangeDate({ dia_semana: null } as any);
                            return;
                          }
                          const fromFecha = makeDiaSemanaFromFecha((d as any)?.fecha);
                          props.onChangeDate({ dia_semana: (fromFecha ?? 5) } as any);
                        }}
                        style={{ width: 18, height: 18 }}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>🔁 Recurrente semanal</span>
                    </label>

                    <label style={{ fontSize: '0.8rem', color: 'rgba(163, 163, 163, 1)', fontWeight: 700, opacity: isRecurrentWeekly ? 1 : 0.7 }}>
                      Día (recurrente)
                      <select
                        disabled={!isRecurrentWeekly}
                        value={isRecurrentWeekly ? String((d as any).dia_semana) : ''}
                        onChange={(e) => props.onChangeDate({ dia_semana: parseInt(e.target.value, 10) } as any)}
                        style={{
                          width: '100%',
                          marginTop: 6,
                          background: 'rgba(38, 38, 38, 1)',
                          borderRadius: '0.5rem',
                          padding: '0.6rem 0.75rem',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          outline: 'none',
                          opacity: isRecurrentWeekly ? 1 : 0.6,
                          cursor: isRecurrentWeekly ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <option value="" disabled>Selecciona…</option>
                        {dayLabels.map((lbl, idx) => (
                          <option key={idx} value={String(idx)}>{lbl}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {isRecurrentWeekly && (
                    <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'rgba(163, 163, 163, 1)' }}>
                      Próxima ocurrencia aprox.: <b style={{ color: '#fff' }}>{nextYmd || '—'}</b> · La fecha queda bloqueada; edita el día.
                    </div>
                  )}
                </div>
              );
            })()}
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
            onUploadPromiseChange={(promise) => {
              flyerUploadPromiseRef.current = promise;
              setIsFlyerUploading(!!promise);
            }}
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
            onClick={handleSaveDate}
            disabled={props.isLoading || isFlyerUploading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: props.isLoading
                ? 'rgba(115, 115, 115, 1)'
                : 'linear-gradient(to right, rgb(59, 130, 246), rgb(236, 72, 153))',
              color: 'white',
              cursor: props.isLoading || isFlyerUploading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              opacity: props.isLoading || isFlyerUploading ? 0.6 : 1
            }}
          >
            {props.isLoading ? 'Guardando...' : isFlyerUploading ? 'Subiendo flyer...' : 'Guardar edición'}
          </button>
        </div>
      </section>

      {/* BLOQUE: CRONOGRAMA Y COSTOS (estado en date para que se guarden al crear/editar la fecha) */}
      <section style={{
        marginBottom: '2rem',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        background: 'rgba(23, 23, 23, 0.4)'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
          📅 Cronograma y costos
        </h2>
        <ScheduleEditor
          schedule={(d.cronograma as any) || []}
          onChangeSchedule={(cronograma) => props.onChangeDate({ cronograma })}
          costos={(d.costos as any) || []}
          onChangeCostos={(costos) => props.onChangeDate({ costos })}
          ritmos={ritmos}
          zonas={zonas}
          eventFecha={d.fecha || ''}
        />
      </section>

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

