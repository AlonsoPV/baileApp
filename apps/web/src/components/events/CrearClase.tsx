import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  purple: '#7C4DFF',
  dark: '#0F1115',
  panel: 'rgba(255,255,255,0.06)',
  line: 'rgba(255,255,255,0.12)',
  soft: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  mut: 'rgba(255,255,255,0.7)',
  ok: '#10B981',
  warn: '#F59E0B',
  err: '#EF4444',
};

export type CrearClaseValue = {
  nombre?: string;
  tipo?: 'clases sueltas' | 'paquetes' | 'coreografia' | 'entrenamiento' | 'otro';
  precio?: number | null;
  regla?: string;
  fechaModo?: 'especifica' | 'semanal';
  fecha?: string;
  diaSemana?: number | null;
  inicio?: string;
  fin?: string;
  ritmoId?: number | null;
  zonaId?: number | null;
  ubicacion?: string;
  ubicacionNombre?: string;
  ubicacionDireccion?: string;
  ubicacionNotas?: string;
  ubicacionId?: string | null;
};

type Tag = { id: number; nombre: string };

type Props = {
  value?: CrearClaseValue;
  editIndex?: number | null;
  editValue?: CrearClaseValue;
  onChange?: (v: CrearClaseValue) => void;
  onSubmit?: (v: CrearClaseValue) => void | Promise<void>;
  onCancel?: () => void;
  ritmos: Tag[];
  zonas: Tag[];
  locations?: Array<{ id?: string; nombre?: string; direccion?: string; referencias?: string }>; // para seleccionar
  title?: string;
  style?: React.CSSProperties;
  className?: string;
};

const card: React.CSSProperties = {
  position: 'relative',
  borderRadius: 20,
  background: 'linear-gradient(135deg, rgba(19,21,27,0.9), rgba(16,18,24,0.9))',
  padding: 20,
  overflow: 'hidden',
  border: `1px solid ${colors.line}`,
  boxShadow: '0 18px 44px rgba(0,0,0,0.45)',
  backdropFilter: 'blur(10px)'
};

const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 };
const label: React.CSSProperties = { fontSize: 12, color: colors.mut, marginBottom: 6, letterSpacing: .2 };

const fieldShell = (invalid = false): React.CSSProperties => ({
  position: 'relative',
  borderRadius: 12,
  border: `1px solid ${invalid ? colors.err+'66' : colors.line}`,
  background: colors.panel,
  transition: 'all .2s ease',
  boxShadow: invalid ? '0 0 0 3px rgba(239,68,68,0.15)' : 'inset 0 0 0 1px rgba(255,255,255,0.02)',
});

const inputBase: React.CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: colors.text,
  padding: '12px 14px 12px 40px',
  fontSize: 14,
};

const leftIcon = (emoji = '🎛️'): React.CSSProperties => ({
  position: 'absolute',
  left: 10,
  top: 9,
  width: 22,
  height: 22,
  borderRadius: 8,
  display: 'grid',
  placeItems: 'center',
  fontSize: 14,
  opacity: .9
});

const chipWrap: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const chip = (active: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  borderRadius: 999,
  border: active ? `1px solid ${colors.blue}` : `1px solid ${colors.soft}`,
  background: active ? 'linear-gradient(135deg, rgba(30,136,229,0.22), rgba(124,77,255,0.18))' : 'rgba(255,255,255,0.04)',
  color: active ? colors.text : colors.mut,
  fontSize: 13,
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all .15s ease',
  boxShadow: active ? '0 6px 16px rgba(30,136,229,0.25)' : 'none'
});

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  margin: '18px 0 10px'
};

const divider: React.CSSProperties = {
  height: 1,
  background: colors.line,
  margin: '10px 0 14px',
  borderRadius: 1
};

const helpText = (warn = false): React.CSSProperties => ({
  fontSize: 12,
  color: warn ? colors.warn : colors.mut,
  marginTop: 6
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
  editIndex,
  editValue,
  onChange,
  onSubmit,
  onCancel,
  ritmos,
  zonas,
  locations,
  title = 'Crear Clase',
  style,
  className
}: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [submitState, setSubmitState] = useState<'idle'|'saving'|'success'|'error'>('idle');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
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
    ubicacion: value?.ubicacion || '',
    ubicacionNombre: value?.ubicacionNombre || '',
    ubicacionDireccion: value?.ubicacionDireccion || '',
    ubicacionNotas: value?.ubicacionNotas || '',
    ubicacionId: value?.ubicacionId ?? null,
  });

  // Synchronize form when editing value changes
  useEffect(() => {
    const effective = editValue || value;
    if (effective) {
      setForm({
        nombre: effective?.nombre || '',
        tipo: effective?.tipo || 'clases sueltas',
        precio: effective?.precio ?? null,
        regla: effective?.regla || '',
        fechaModo: effective?.fechaModo || 'especifica',
        fecha: effective?.fecha || '',
        diaSemana: effective?.diaSemana ?? null,
        inicio: normalizeTime(effective?.inicio),
        fin: normalizeTime(effective?.fin),
        ritmoId: effective?.ritmoId ?? null,
        zonaId: effective?.zonaId ?? null,
        ubicacion: effective?.ubicacion || '',
        ubicacionNombre: effective?.ubicacionNombre || '',
        ubicacionDireccion: effective?.ubicacionDireccion || '',
        ubicacionNotas: effective?.ubicacionNotas || '',
        ubicacionId: effective?.ubicacionId ?? null,
      });
      setIsOpen(true);
      setSelectedLocationId((effective?.ubicacionId as any) || '');
    }
  }, [value, editValue]);

  // Sincronizar campos de ubicación cuando cambia la selección del dropdown
  useEffect(() => {
    if (!locations || !Array.isArray(locations)) return;
    if (selectedLocationId) {
      const sel = locations.find(l => (l.id || '') === selectedLocationId);
      if (sel) {
        setForm(prev => ({
          ...prev,
          ubicacionId: selectedLocationId,
          ubicacionNombre: sel.nombre || '',
          ubicacionDireccion: sel.direccion || '',
          ubicacionNotas: sel.referencias || ''
        }));
      }
    } else {
      // Modo manual
      setForm(prev => ({
        ...prev,
        ubicacionId: null
      }));
    }
  }, [selectedLocationId, locations]);

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

  // Validaciones visuales (solo estilos, sin cambiar estructura)
  const invalid = {
    nombre: !(form.nombre || '').trim(),
    fecha: form.fechaModo === 'especifica' && !form.fecha,
    dia: form.fechaModo === 'semanal' && form.diaSemana === null,
    inicio: !form.inicio,
    fin: !form.fin,
  };

  const completion = useMemo(() => {
    const total = 5;
    let done = 0;
    if (!invalid.nombre) done++;
    if (!invalid.inicio) done++;
    if (!invalid.fin) done++;
    if (form.fechaModo === 'especifica' ? !invalid.fecha : !invalid.dia) done++;
    if (form.ritmoId) done++;
    return Math.round((done / total) * 100);
  }, [invalid, form.fechaModo, form.ritmoId]);

  const isEditing = (editIndex !== null && editIndex !== undefined) || Boolean(editValue);

  const resetForm = () => {
    setForm({
      nombre: '',
      tipo: 'clases sueltas',
      precio: null,
      regla: '',
      fechaModo: 'especifica',
      fecha: '',
      diaSemana: null,
      inicio: '',
      fin: '',
      ritmoId: null,
      zonaId: null,
      ubicacion: '',
      ubicacionNombre: '',
      ubicacionDireccion: '',
      ubicacionNotas: '',
      ubicacionId: null,
    });
    setSelectedLocationId('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...style }} className={className}>
      <div style={{ ...card }}>
        {/* Accent bar / progreso */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background: `linear-gradient(90deg, ${colors.blue}, ${colors.purple})` }} />
        <div style={{ position:'absolute', top:0, left:0, height:4, background: colors.ok, width: `${completion}%`, transition:'width .25s ease' }} />

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#1E88E5,#7C4DFF)', display:'grid', placeItems:'center', boxShadow:'0 10px 24px rgba(30,136,229,0.35)' }}>➕</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: colors.text }}>{title}</h2>
            <div style={{ fontSize: 12, color: colors.mut }}>Completa los campos — {completion}%</div>
          </div>
        </div>

        {isOpen && (
          <>
            {/* NOMBRE + TIPO */}
            <div style={sectionHeader}><span>📝</span><b>Detalles</b></div>
            <div style={row}>
              <div>
                <div style={label}>Nombre</div>
                <div style={fieldShell(invalid.nombre)}>
                  <div style={leftIcon('🏷️')} />
                  <input
                    style={inputBase}
                    placeholder="Ej. Bachata Sensual"
                    value={form.nombre || ''}
                    onChange={(e)=>setField('nombre', e.target.value)}
                  />
                </div>
                {invalid.nombre && <div style={helpText(true)}>Agrega un nombre</div>}
              </div>

              <div>
                <div style={label}>Tipo</div>
                <div style={chipWrap}>
                  {tipos.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={()=>setField('tipo', t)}
                      style={chip(form.tipo === t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PRECIO + REGLA */}
            <div style={sectionHeader}><span>💰</span><b>Precio</b></div>
            <div style={row}>
              <div>
                <div style={label}>Precio (opcional)</div>
                <div style={fieldShell()}>
                  <div style={leftIcon('💵')} />
                  <input
                    style={inputBase}
                    type="number"
                    min={0}
                    step="1"
                    placeholder="Ej. 200"
                    value={form.precio ?? ''}
                    onChange={(e)=>setField('precio', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>
                <div style={helpText()}>Déjalo vacío para marcar como <b>Gratis</b></div>
              </div>

              <div>
                <div style={label}>Regla o condición</div>
                <div style={fieldShell()}>
                  <div style={leftIcon('📋')} />
                  <input
                    style={inputBase}
                    placeholder="Ej. Válido hasta el 15/Nov · 2x1 pareja"
                    value={form.regla || ''}
                    onChange={(e)=>setField('regla', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* FECHA */}
            <div style={sectionHeader}><span>📅</span><b>Fecha</b></div>
            <div style={row}>
              <div>
                <div style={label}>Modo</div>
                <div style={chipWrap}>
                  <button type="button" style={chip(form.fechaModo === 'especifica')} onClick={()=>setField('fechaModo','especifica')}>Específica</button>
                  <button type="button" style={chip(form.fechaModo === 'semanal')} onClick={()=>setField('fechaModo','semanal')}>Semanal</button>
                </div>
              </div>
              <div>
                {form.fechaModo === 'especifica' ? (
                  <>
                    <div style={fieldShell(invalid.fecha)}>
                      <div style={leftIcon('📆')} />
                      <input
                        style={inputBase}
                        type="date"
                        value={form.fecha || ''}
                        onChange={(e)=>setField('fecha', e.target.value)}
                      />
                    </div>
                    {invalid.fecha && <div style={helpText(true)}>Selecciona una fecha</div>}
                  </>
                ) : (
                  <>
                    <div style={chipWrap}>
                      {diasSemana.map(d => (
                        <button
                          type="button"
                          key={d.id}
                          style={chip(form.diaSemana === d.id)}
                          onClick={()=>setField('diaSemana', d.id)}
                        >
                          {d.nombre}
                        </button>
                      ))}
                    </div>
                    {invalid.dia && <div style={helpText(true)}>Elige un día de la semana</div>}
                  </>
                )}
              </div>
            </div>

            {/* HORARIO */}
            <div style={sectionHeader}><span>⏰</span><b>Horario</b></div>
            <div style={row}>
              <div>
                <div style={label}>Hora inicio (HH:MM)</div>
                <div style={fieldShell(invalid.inicio)}>
                  <div style={leftIcon('🟢')} />
                  <input
                    type="time"
                    step={60}
                    style={inputBase}
                    value={form.inicio || ''}
                    onChange={(e)=>setField('inicio', normalizeTime(e.target.value))}
                  />
                </div>
                {invalid.inicio && <div style={helpText(true)}>Indica la hora de inicio</div>}
              </div>

              <div>
                <div style={label}>Hora fin (HH:MM)</div>
                <div style={fieldShell(invalid.fin)}>
                  <div style={leftIcon('🔴')} />
                  <input
                    type="time"
                    step={60}
                    style={inputBase}
                    value={form.fin || ''}
                    onChange={(e)=>setField('fin', normalizeTime(e.target.value))}
                  />
                </div>
                {invalid.fin && <div style={helpText(true)}>Indica la hora de fin</div>}
              </div>
            </div>

            {/* RITMO + ZONA */}
            <div style={sectionHeader}><span>🎶</span><b>Ritmo & Zona</b></div>
            <div style={row}>
          <div>
            <div style={label}>Ritmo</div>
            <div style={chipWrap}>
              {ritmos.map(r => (
                <button
                  type="button"
                  key={r.id}
                  style={chip(form.ritmoId === r.id)}
                  onClick={()=>setField('ritmoId', r.id)}
                  title={r.nombre}
                >
                  {r.nombre}
                </button>
              ))}
            </div>
            {!form.ritmoId && <div style={helpText()}>Sugerencia: elegir un ritmo mejora el descubrimiento</div>}
          </div>

              <div>
                <div style={label}>Zona</div>
                <div style={chipWrap}>
                  {zonas.map(z => (
                    <button
                      type="button"
                      key={z.id}
                      style={chip(form.zonaId === z.id)}
                      onClick={()=>setField('zonaId', z.id)}
                      title={z.nombre}
                    >
                      {z.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* UBICACIÓN */}
            <div style={sectionHeader}><span>📍</span><b>Ubicación</b></div>
            {Array.isArray(locations) && locations.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={label}>Elegir ubicación existente</div>
                <div style={fieldShell()}>
                  <select
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: colors.text,
                      outline: 'none',
                      fontSize: 14,
                      borderRadius: 8,
                      WebkitAppearance: 'none' as any,
                      appearance: 'none' as any
                    }}
                    value={selectedLocationId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setSelectedLocationId(nextId);
                      setField('ubicacionId', nextId || null);
                      const sel = locations.find(l => (l.id || '') === nextId);
                      if (sel && nextId) {
                        setField('ubicacionNombre', sel.nombre || '');
                        setField('ubicacionDireccion', sel.direccion || '');
                        setField('ubicacionNotas', sel.referencias || '');
                      } else {
                        setField('ubicacionNombre', '');
                        setField('ubicacionDireccion', '');
                        setField('ubicacionNotas', '');
                      }
                    }}
                  >
                    <option value="" style={{ color: '#111' }}>— Escribir manualmente —</option>
                    {locations.map((l, i) => (
                      <option key={l.id || i} value={l.id || ''} style={{ color: '#111' }}>{l.nombre || l.direccion || 'Ubicación'}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={label}>Nombre de la ubicación</div>
                <div style={fieldShell()}>
                  <div style={leftIcon('🏢')} />
                  <input
                    style={inputBase}
                    placeholder="Ej. Sede Centro / Salón Principal"
                    value={form.ubicacionNombre || ''}
                    onChange={(e)=>setField('ubicacionNombre', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div style={label}>Dirección</div>
                <div style={fieldShell()}>
                  <div style={leftIcon('📍')} />
                  <input
                    style={inputBase}
                    placeholder="Calle, número, colonia, ciudad"
                    value={form.ubicacionDireccion || ''}
                    onChange={(e)=>setField('ubicacionDireccion', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={label}>Notas o referencias</div>
              <div style={fieldShell()}>
                <div style={leftIcon('📝')} />
                <input
                  style={inputBase}
                  placeholder="Ej. Entrada por la puerta lateral, 2do piso"
                  value={form.ubicacionNotas || ''}
                  onChange={(e)=>setField('ubicacionNotas', e.target.value)}
                />
              </div>
            </div>

            <div style={divider} />
          </>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            onClick={() => {
              setSubmitState('idle');
              resetForm();
              setIsOpen(false);
              onCancel?.();
            }}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              border: `1px solid ${colors.line}`,
              background: 'transparent',
              color: colors.text,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <motion.button
            whileHover={{ y: (!isOpen || (isOpen && submitState === 'idle' && canSubmit)) ? -1 : 0 }}
            whileTap={{ scale: (!isOpen || (isOpen && submitState === 'idle' && canSubmit)) ? 0.98 : 1 }}
            disabled={isOpen ? (submitState === 'saving' || !canSubmit) : false}
            onClick={async ()=> {
              if (!isOpen) { setIsOpen(true); return; }
              if (submitState === 'saving') return;
              try {
                setSubmitState('saving');
                await Promise.resolve(onSubmit?.(form));
                setSubmitState('success');
                // Reiniciar siempre después de éxito (tanto crear como editar)
                resetForm();
                setTimeout(() => { setSubmitState('idle'); setIsOpen(false); }, 2200);
              } catch (e) {
                setSubmitState('error');
                setTimeout(() => setSubmitState('idle'), 2500);
              }
            }}
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              border: `1px solid ${colors.line}`,
              background: submitState === 'saving' ? colors.soft : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.text,
              fontWeight: 800,
              cursor: (!isOpen || (isOpen && submitState === 'idle' && canSubmit)) ? 'pointer' : (submitState === 'saving' ? 'wait' : 'not-allowed'),
              boxShadow: (submitState === 'saving') ? 'none' : '0 10px 24px rgba(30,136,229,0.35)'
            }}
          >
            {(() => {
              if (!isOpen) return 'Crear clase →';
              if (submitState === 'saving') return isEditing ? 'Guardando...' : 'Creando...';
              if (submitState === 'success') return isEditing ? '✅ Clase actualizada' : '✅ Clase creada';
              if (submitState === 'error') return isEditing ? '❌ Error al actualizar' : '❌ Error al crear';
              return isEditing ? 'Guardar cambios' : 'Crear clase →';
            })()}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
