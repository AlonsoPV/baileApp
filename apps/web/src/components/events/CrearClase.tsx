import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
  green: '#10B981',
};

export type CrearClaseValue = {
  nombre?: string;
  tipo?: 'clases sueltas' | 'paquetes' | 'coreografia' | 'entrenamiento' | 'otro';
  precio?: number | null;
  regla?: string;
  fechaModo?: 'especifica' | 'semanal';
  fecha?: string;           // YYYY-MM-DD si especifica
  diaSemana?: number | null; // 0-6 si semanal (0 = domingo)
  inicio?: string;          // HH:MM
  fin?: string;             // HH:MM
  ritmoId?: number | null;
  zonaId?: number | null;
};

type Tag = { id: number; nombre: string };

type Props = {
  value?: CrearClaseValue;
  onChange?: (v: CrearClaseValue) => void;
  onSubmit?: (v: CrearClaseValue) => void;
  onCancel?: () => void;
  ritmos: Tag[];
  zonas: Tag[];
  title?: string;
  style?: React.CSSProperties;
  className?: string;
};

const card: React.CSSProperties = {
  position: 'relative',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.04)',
  padding: 16,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(8px)'
};

const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const label: React.CSSProperties = { fontSize: 12, opacity: 0.8, marginBottom: 6 };
const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: '#fff',
  outline: 'none'
};
const pillWrap: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const pill = (active: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  borderRadius: 999,
  border: `1px solid ${active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.16)'}`,
  background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
  fontSize: 13,
  cursor: 'pointer',
  userSelect: 'none'
});

const normalizeTime = (t?: string) => {
  if (!t) return '';
  const [hh = '', mm = ''] = t.split(':');
  return `${hh.padStart(2,'0')}:${(mm||'00').padStart(2,'0')}`;
};

const tipos: Array<NonNullable<CrearClaseValue['tipo']>> = [
  'clases sueltas','paquetes','coreografia','entrenamiento','otro'
];
const diasSemana = [
  { id: 0, nombre: 'Domingo' },
  { id: 1, nombre: 'Lunes' },
  { id: 2, nombre: 'Martes' },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' },
  { id: 5, nombre: 'Viernes' },
  { id: 6, nombre: 'Sábado' },
];

export default function CrearClase({
  value,
  onChange,
  onSubmit,
  onCancel,
  ritmos,
  zonas,
  title = 'Crear Clase',
  style,
  className
}: Props) {
  const [form, setForm] = useState<CrearClaseValue>({
    nombre: value?.nombre || '',
    tipo: value?.tipo || 'clases sueltas',
    precio: value?.precio ?? null,
    regla: value?.regla || '',
    fechaModo: value?.fechaModo || 'especifica',
    fecha: value?.fecha || '',
    diaSemana: value?.diaSemana ?? null,
    inicio: normalizeTime(value?.inicio),
    fin: normalizeTime(value?.fin),
    ritmoId: value?.ritmoId ?? null,
    zonaId: value?.zonaId ?? null,
  });

  const setField = (k: keyof CrearClaseValue, v: any) => {
    const next = { ...form, [k]: v };
    setForm(next);
    onChange?.(next);
  };

  const canSubmit = useMemo(() => {
    const nombreOk = (form.nombre || '').trim().length > 0;
    const horarioOk = Boolean(form.inicio && form.fin);
    const fechaOk = form.fechaModo === 'especifica' ? Boolean(form.fecha) : form.diaSemana !== null;
    return nombreOk && horarioOk && fechaOk;
  }, [form]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ ...style }} className={className}>
      <div style={{ ...card, padding: 20 }}>
        <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18, fontWeight: 800, color: colors.light }}>{title}</h2>

        {/* Nombre y Tipo */}
        <div style={row}>
          <div>
            <div style={label}>Nombre</div>
            <input style={input} placeholder="Ej. Bachata Sensual" value={form.nombre || ''} onChange={(e)=>setField('nombre', e.target.value)} />
          </div>
          <div>
            <div style={label}>Tipo</div>
            <div style={pillWrap}>
              {tipos.map(t => (
                <div key={t} style={pill(form.tipo === t)} onClick={()=>setField('tipo', t)}>{t}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Precio y Regla */}
        <div style={row}>
          <div>
            <div style={label}>Precio (opcional)</div>
            <input style={input} type="number" min={0} step="1" placeholder="Ej. 200" value={form.precio ?? ''} onChange={(e)=>setField('precio', e.target.value === '' ? null : Number(e.target.value))} />
          </div>
          <div>
            <div style={label}>Regla o condición</div>
            <input style={input} placeholder="Ej. Válido hasta el 15/Nov · 2x1 pareja" value={form.regla || ''} onChange={(e)=>setField('regla', e.target.value)} />
          </div>
        </div>

        {/* Fecha */}
        <div style={{ ...row, gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <div style={label}>Fecha</div>
            <div style={pillWrap}>
              <div style={pill(form.fechaModo === 'especifica')} onClick={()=>setField('fechaModo','especifica')}>Específica</div>
              <div style={pill(form.fechaModo === 'semanal')} onClick={()=>setField('fechaModo','semanal')}>Semanal</div>
            </div>
          </div>
          <div>
            {form.fechaModo === 'especifica' ? (
              <input type="date" style={input} value={form.fecha || ''} onChange={(e)=>setField('fecha', e.target.value)} />
            ) : (
              <div style={pillWrap}>
                {diasSemana.map(d => (
                  <div key={d.id} style={pill(form.diaSemana === d.id)} onClick={()=>setField('diaSemana', d.id)}>{d.nombre}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Horario */}
        <div style={row}>
          <div>
            <div style={label}>Hora inicio (HH:MM)</div>
            <input type="time" step={60} style={input} value={form.inicio || ''} onChange={(e)=>setField('inicio', normalizeTime(e.target.value))} />
          </div>
          <div>
            <div style={label}>Hora fin (HH:MM)</div>
            <input type="time" step={60} style={input} value={form.fin || ''} onChange={(e)=>setField('fin', normalizeTime(e.target.value))} />
          </div>
        </div>

        {/* Ritmo y Zona */}
        <div style={row}>
          <div>
            <div style={label}>Ritmo</div>
            <div style={pillWrap}>
              {ritmos.map(r => (
                <div key={r.id} style={pill(form.ritmoId === r.id)} onClick={()=>setField('ritmoId', r.id)}>{r.nombre}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={label}>Zona</div>
            <div style={pillWrap}>
              {zonas.map(z => (
                <div key={z.id} style={pill(form.zonaId === z.id)} onClick={()=>setField('zonaId', z.id)}>{z.nombre}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onCancel} style={{ ...input, width: 'auto', padding: '10px 16px', cursor: 'pointer', background: 'transparent', borderColor: 'rgba(255,255,255,0.16)' }}>Cancelar</button>
          <button disabled={!canSubmit} onClick={()=> canSubmit && onSubmit?.(form)} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: canSubmit ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})` : 'rgba(255,255,255,0.12)', color:'#fff', fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>Crear</button>
        </div>
      </div>
    </motion.div>
  );
}


