// ScheduleEditorPlus.tsx
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import RitmosChips from "../RitmosChips";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

type ScheduleItem = {
  tipo: 'clase' | 'paquete' | 'coreografia' | 'show' | 'otro';
  titulo?: string;
  ritmoId?: number | null;
  zonaId?: number | null;
  inicio: string;  // HH:MM
  fin: string;     // HH:MM
  fecha?: string;  // YYYY-MM-DD
  ubicacion?: string;  // texto libre
  nivel?: string;
  referenciaCosto?: string; // enlaza con costos.nombre (normalizado)
};

type RitmoTag = { id: number; nombre: string };
type ZonaTag = { id: number; nombre: string };

type CostoItem = {
  nombre?: string; // etiqueta y clave de referencia
  tipo?: 'Taquilla' | 'Preventa' | 'Promoción' | 'Otro';
  precio?: number | null;
  regla?: string;
};

type MetaState = {
  ritmoId?: number | null;
  zonaId?: number | null;
  ubicacion?: string;
};

type Props = {
  // Cronograma
  schedule: ScheduleItem[];
  onChangeSchedule: (value: ScheduleItem[]) => void;

  // Costos/Promos
  costos: CostoItem[];
  onChangeCostos: (value: CostoItem[]) => void;

  // Chips
  ritmos?: RitmoTag[];
  zonas?: ZonaTag[];

  // Metadatos compartidos (opcional: útil para setear por defecto)
  selectedRitmoId?: number | null;
  selectedZonaId?: number | null;
  ubicacion?: string;
  eventFecha?: string; // ✅ Fecha del evento para heredar

  onMetaChange?: (meta: MetaState) => void;
  onSaveCosto?: (index: number) => void; // ✅ Callback para guardar costo individual

  labelSchedule?: string;
  labelCostos?: string;
  style?: React.CSSProperties;
  className?: string;
};

const tiposCosto: NonNullable<CostoItem['tipo']>[] = [
  'Taquilla', 'Preventa', 'Promoción', 'Otro'
];

const niveles = ['Inicial', 'Intermedio', 'Avanzado', 'Todos'] as const;

const normalizeTime = (t?: string) => {
  if (!t) return '';
  const [hh = '', mm = ''] = t.split(':');
  return `${hh.padStart(2,'0')}:${(mm||'00').padStart(2,'0')}`;
};

const card: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  background: `${colors.dark}66`,
  border: `1px solid ${colors.light}22`,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  background: `${colors.dark}cc`,
  border: `1px solid ${colors.light}33`,
  color: colors.light,
  fontSize: '0.9rem',
  outline: 'none',
};

const pillWrap: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const pill = (active: boolean): React.CSSProperties => ({
  padding: '6px 10px',
  borderRadius: 999,
  border: `1px solid ${active ? colors.blue : `${colors.light}33`}`,
  background: active ? `${colors.blue}33` : 'transparent',
  color: colors.light,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600
});

export default function ScheduleEditorPlus({
  schedule,
  onChangeSchedule,
  costos,
  onChangeCostos,
  ritmos = [],
  zonas = [],
  selectedRitmoId = null,
  selectedZonaId = null,
  ubicacion = '',
  eventFecha = '',
  onMetaChange,
  onSaveCosto,
  labelSchedule = "Cronograma",
  labelCostos = "Costos y Promociones",
  style,
  className,
}: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [meta, setMeta] = useState<MetaState>({
    ritmoId: selectedRitmoId ?? null,
    zonaId: selectedZonaId ?? null,
    ubicacion: ubicacion ?? '',
  });

  const setMetaField = (patch: MetaState) => {
    const next = { ...meta, ...patch };
    setMeta(next);
    onMetaChange?.(next);
  };

  const [newItem, setNewItem] = useState<ScheduleItem>({
    tipo: 'clase',
    titulo: '',
    ritmoId: selectedRitmoId ?? null,
    zonaId: selectedZonaId ?? null,
    inicio: '',
    fin: '',
    fecha: eventFecha || '', // ✅ Usar fecha del evento
    ubicacion: ubicacion ?? '',
    nivel: '',
    referenciaCosto: ''
  });
  
  // Actualizar fecha cuando cambie eventFecha
  React.useEffect(() => {
    if (eventFecha) {
      setNewItem(prev => ({ ...prev, fecha: eventFecha }));
    }
  }, [eventFecha]);

  const addItem = () => {
    const hasTitulo = (newItem.titulo && newItem.titulo.trim()) || newItem.ritmoId;
    if (hasTitulo && newItem.inicio && newItem.fin) {
      const titleFromRitmo = newItem.ritmoId ? (ritmos.find(r=>r.id===newItem.ritmoId)?.nombre || '') : '';
      const finalTitulo = (newItem.titulo && newItem.titulo.trim()) || titleFromRitmo;
      const next = [...schedule, {
        ...newItem,
        titulo: finalTitulo,
        inicio: normalizeTime(newItem.inicio),
        fin: normalizeTime(newItem.fin),
      }];
      onChangeSchedule(next);
      setNewItem({
        tipo: 'clase',
        titulo: '',
        ritmoId: meta.ritmoId ?? null,
        zonaId: meta.zonaId ?? null,
        inicio: '',
        fin: '',
        fecha: '',
        ubicacion: meta.ubicacion ?? '',
        nivel: '',
        referenciaCosto: ''
      });
      setIsAdding(false);
    }
  };

  const updateItem = (index: number, field: keyof ScheduleItem, v: any) => {
    const next = [...schedule];
    next[index] = {
      ...next[index],
      [field]: field === 'inicio' || field === 'fin' ? normalizeTime(v) : v
    };
    onChangeSchedule(next);
  };

  const removeItem = (index: number) => {
    onChangeSchedule(schedule.filter((_, i) => i !== index));
  };

  const startEdit = (i: number) => setEditingIndex(i);
  const finishEdit = () => setEditingIndex(null);

  // ====== Costos ======
  const setCosto = (idx: number, patch: Partial<CostoItem>) => {
    const next = [...costos];
    next[idx] = { ...next[idx], ...patch };
    onChangeCostos(next);
  };

  const addCosto = () => {
    onChangeCostos([
      ...costos,
      { nombre: '', tipo: 'Otro', precio: null, regla: '' }
    ]);
  };

  const removeCosto = (idx: number) => {
    onChangeCostos(costos.filter((_, i) => i !== idx));
  };

  const costoNombres = useMemo(() => (costos || []).map(c => (c.nombre || '').trim()).filter(Boolean), [costos]);

  return (
    <div style={{ ...style }} className={className}>
      {/* === Metadatos globales para “defaults” (compacto) === */}
      {/* <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <div style={{ marginBottom: 6, fontSize: 12, color: colors.light, opacity: 0.85 }}>Ritmo</div>
            <RitmosChips
              selected={(() => {
                if (!meta.ritmoId) return [];
                const tag = (ritmos || []).find(r => r.id === meta.ritmoId);
                if (!tag) return [];
                const match = RITMOS_CATALOG.flatMap(g => g.items).find(i => i.label === tag.nombre);
                return match ? [match.id] : [];
              })()}
              onChange={(ids) => {
                const first = ids[0];
                if (!first) { setMetaField({ ritmoId: null }); return; }
                const catalogLabel = RITMOS_CATALOG.flatMap(g => g.items).find(i => i.id === first)?.label;
                const tagId = (ritmos || []).find(r => r.nombre === catalogLabel)?.id ?? null;
                setMetaField({ ritmoId: tagId });
              }}
            />
          </div> */}
       {/*    <div>
            <div style={{ marginBottom: 6, fontSize: 12, color: colors.light, opacity: 0.85 }}>Ubicación (texto)</div>
            <input
              style={input}
              placeholder="Ej. Estudio Central, Av. Reforma 123, CDMX"
              value={meta.ubicacion || ''}
              onChange={(e)=> setMetaField({ ubicacion: e.target.value })}
            />
          </div> */}
        {/* </div> */}
      {/* </div> */}

      {/* === Cronograma === */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.light }}>{labelSchedule}</label>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsAdding(true);
              setNewItem(s => ({
                ...s,
                ritmoId: meta.ritmoId ?? null,
                zonaId: meta.zonaId ?? null,
                ubicacion: meta.ubicacion ?? '',
              }));
            }}
            style={{
              padding: '8px 16px', borderRadius: 20, border: 'none',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'
            }}
          >➕ Agregar Actividad</motion.button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {schedule.map((item, index) => (
            <div key={index} style={card}>
              {editingIndex === index ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {/* tipo y nivel */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Tipo</div>
                      <select
                        value={item.tipo}
                        onChange={(e)=> updateItem(index, 'tipo', e.target.value as ScheduleItem['tipo'])}
                        style={input}
                      >
                        <option value="clase">📚 Clase</option>
                        <option value="paquete">🧾 Paquete</option>
                        <option value="coreografia">🎬 Coreografía</option>
                        <option value="show">🎭 Show</option>
                        <option value="otro">📋 Otro</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Nivel (opcional)</div>
                      <input
                        type="text"
                        value={item.nivel || ''}
                        onChange={(e)=> updateItem(index, 'nivel', e.target.value)}
                        placeholder="Ej: Principiante, Intermedio"
                        style={input}
                      />
                    </div>
                  </div>

                  {/* Ritmo (RitmosChips) */}
                  <div>
                    <div style={{ marginBottom: 6, fontSize: 12, color: colors.light, opacity: 0.85 }}>Ritmo</div>
                    <RitmosChips
                      selected={(() => {
                        if (!item.ritmoId) return [];
                        const tag = (ritmos || []).find(r => r.id === item.ritmoId);
                        if (!tag) return [];
                        const match = RITMOS_CATALOG.flatMap(g => g.items).find(i => i.label === tag.nombre);
                        return match ? [match.id] : [];
                      })()}
                      onChange={(ids) => {
                        const first = ids[0];
                        const catalogLabel = first ? RITMOS_CATALOG.flatMap(g => g.items).find(i => i.id === first)?.label : undefined;
                        const tagId = catalogLabel ? (ritmos || []).find(r => r.nombre === catalogLabel)?.id ?? null : null;
                        updateItem(index, 'ritmoId', tagId);
                      }}
                    />
                  </div>

                  {/* título manual */}
                  <input
                    type="text"
                    value={item.titulo || ''}
                    onChange={(e)=> updateItem(index, 'titulo', e.target.value)}
                    placeholder="Título (opcional si eliges un ritmo)"
                    style={input}
                  />

                  {/* fecha, horario */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Fecha</div>
                      <input
                        type="date"
                        value={item.fecha || ''}
                        onChange={(e)=> updateItem(index, 'fecha', e.target.value)}
                        style={input}
                      />
                    </div>
                    <div />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Inicio (HH:MM)</div>
                      <input
                        type="time" step={60}
                        value={item.inicio}
                        onChange={(e)=> updateItem(index, 'inicio', e.target.value)}
                        style={input}
                      />
                    </div>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Fin (HH:MM)</div>
                      <input
                        type="time" step={60}
                        value={item.fin}
                        onChange={(e)=> updateItem(index, 'fin', e.target.value)}
                        style={input}
                      />
                    </div>
                  </div>

                  {/* referencia costo */}
                  <div>
                    <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Referencia de costo (opcional)</div>
                    <select
                      value={item.referenciaCosto || ''}
                      onChange={(e)=> updateItem(index, 'referenciaCosto', e.target.value)}
                      style={input}
                    >
                      <option value="">Sin referencia</option>
                      {costoNombres.map((n, i)=> (
                        <option key={i} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={finishEdit}
                      style={{ ...input, width: 'auto', background: colors.blue, border: 'none', cursor: 'pointer' }}
                    >✅ Guardar</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingIndex(null)}
                      style={{ ...input, width: 'auto', background: colors.coral, border: 'none', cursor: 'pointer' }}
                    >❌ Cancelar</motion.button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: '1.2rem' }}>📚</span>
                      {item.nivel && (
                        <span style={{
                          padding: '4px 8px', borderRadius: 12,
                          background: `${colors.light}33`, color: colors.light, fontSize: '0.8rem', fontWeight: 600
                        }}>{item.nivel}</span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: colors.light, marginBottom: 4 }}>
                      {item.titulo || (item.ritmoId ? ritmos.find(r=>r.id===item.ritmoId)?.nombre : '')}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: colors.light, opacity: 0.8 }}>
                      🗓️ {item.fecha || '—'} · 🕐 {item.inicio} - {item.fin}
                    </p>
                    {item.ubicacion && <p style={{ fontSize: '0.85rem', color: colors.light, opacity: 0.8 }}>📍 {item.ubicacion}</p>}
                    {item.referenciaCosto && <p style={{ fontSize: '0.85rem', color: colors.light, opacity: 0.8 }}>💲 {item.referenciaCosto}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={()=> startEdit(index)}
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: colors.blue, color: colors.light, cursor: 'pointer' }}
                    >✏️</motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={()=> removeItem(index)}
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: colors.coral, color: colors.light, cursor: 'pointer' }}
                    >🗑️</motion.button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {schedule.length === 0 && !isAdding && (
          <div style={{ textAlign: 'center', padding: 24, background: `${colors.dark}33`, borderRadius: 12, color: colors.light, opacity: 0.6 }}>
            <p>No hay actividades programadas aún</p>
            <p style={{ fontSize: '0.9rem', marginTop: 4 }}>Haz clic en "Agregar Actividad" para comenzar</p>
          </div>
        )}
      </div>

      {/* Form de alta rápida */}
      {isAdding && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, border: `1px solid ${colors.blue}33` }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: colors.light, marginBottom: 12 }}>➕ Nueva Actividad</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Tipo</div>
                <select
                  value={newItem.tipo}
                  onChange={(e) => setNewItem({ ...newItem, tipo: e.target.value as ScheduleItem['tipo'] })}
                  style={input}
                >
                  <option value="clase">📚 Clase</option>
                  <option value="show">🎭 Show</option>
                  <option value="otro">📋 Otro</option>
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Nivel (opcional)</div>
                <input
                  type="text"
                  value={newItem.nivel || ''}
                  onChange={(e) => setNewItem({ ...newItem, nivel: e.target.value })}
                  placeholder="Ej: Principiante, Intermedio"
                  style={input}
                />
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 6, fontSize: 12, color: colors.light, opacity: 0.85 }}>Ritmo</div>
              <RitmosChips
                selected={(() => {
                  if (!newItem.ritmoId) return [];
                  const tag = (ritmos || []).find(r => r.id === newItem.ritmoId);
                  if (!tag) return [];
                  const match = RITMOS_CATALOG.flatMap(g => g.items).find(i => i.label === tag.nombre);
                  return match ? [match.id] : [];
                })()}
                onChange={(ids) => {
                  const first = ids[0];
                  const catalogLabel = first ? RITMOS_CATALOG.flatMap(g => g.items).find(i => i.id === first)?.label : undefined;
                  const tagId = catalogLabel ? (ritmos || []).find(r => r.nombre === catalogLabel)?.id ?? null : null;
                  setNewItem(s => ({ ...s, ritmoId: tagId }));
                }}
              />
            </div>

            <input
              type="text"
              value={newItem.titulo}
              onChange={(e) => setNewItem({ ...newItem, titulo: e.target.value })}
              placeholder="Título (opcional si eliges un ritmo)"
              style={input}
            />

          {/*   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Fecha</div>
                <input
                  type="date"
                  value={newItem.fecha || ''}
                  onChange={(e) => setNewItem({ ...newItem, fecha: e.target.value })}
                  style={input}
                />
              </div>
              <div />
            </div> */}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Inicio</div>
                <input
                  type="time" step={60}
                  value={newItem.inicio}
                  onChange={(e) => setNewItem({ ...newItem, inicio: e.target.value })}
                  style={input}
                />
              </div>
              <div>
                <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Fin</div>
                <input
                  type="time" step={60}
                  value={newItem.fin}
                  onChange={(e) => setNewItem({ ...newItem, fin: e.target.value })}
                  style={input}
                />
              </div>
            </div>

            {/* <div>
              <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Ubicación (texto)</div>
              <input
                type="text"
                value={newItem.ubicacion || ''}
                onChange={(e)=> setNewItem({ ...newItem, ubicacion: e.target.value })}
                placeholder="Ej. Estudio Central, Av. Reforma 123, CDMX"
                style={input}
              />
            </div> */}

       {/*      <div>
              <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Referencia de costo (opcional)</div>
              <select
                value={newItem.referenciaCosto || ''}
                onChange={(e) => setNewItem({ ...newItem, referenciaCosto: e.target.value })}
                style={input}
              >
                <option value="">Sin referencia</option>
                {costoNombres.map((n, i)=> (
                  <option key={i} value={n}>{n}</option>
                ))}
              </select>
            </div>
 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={addItem}
                disabled={!((newItem.titulo?.trim() || newItem.ritmoId) && newItem.inicio && newItem.fin)}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: (newItem.titulo?.trim() || newItem.ritmoId) && newItem.inicio && newItem.fin
                    ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})` : `${colors.light}33`,
                  color: colors.light, fontSize: '0.9rem', fontWeight: 600,
                  cursor: (newItem.titulo?.trim() || newItem.ritmoId) && newItem.inicio && newItem.fin ? 'pointer' : 'not-allowed',
                }}
              >✅ Agregar Actividad</motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setIsAdding(false); }}
                style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${colors.light}33`, background: 'transparent', color: colors.light, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
              >❌ Cancelar</motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* === Costos / Promos === */}
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.light }}>{labelCostos}</label>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={addCosto}
            style={{
              padding: '8px 16px', borderRadius: 20, border: 'none',
              background: `linear-gradient(135deg, ${colors.yellow}, ${colors.orange})`,
              color: colors.dark, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer'
            }}
          >+ Añadir costo</motion.button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {costos.map((c, idx)=> (
            <div key={idx} style={card}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Nombre (referencia)</div>
                  <input
                    style={input}
                    placeholder="Ej. Clase suelta / Paquete 4 clases"
                    value={c.nombre || ''}
                    onChange={(e)=> setCosto(idx, { nombre: e.target.value })}
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Tipo</div>
                  <div style={pillWrap}>
                    {tiposCosto.map(t => (
                      <div
                        key={t}
                        style={pill(c.tipo === t)}
                        onClick={()=> setCosto(idx, { tipo: t })}
                      >{t}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Precio</div>
                  <input
                    type="number" min={0} step="1" placeholder="Ej. 200"
                    value={c.precio ?? ''}
                    onChange={(e)=> setCosto(idx, { precio: e.target.value === '' ? null : Number(e.target.value) })}
                    style={input}
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Regla / Descripción (opcional)</div>
                  <input
                    style={input}
                    placeholder="Ej. Válido hasta el 15/Nov · 2x1 pareja"
                    value={c.regla || ''}
                    onChange={(e)=> setCosto(idx, { regla: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                {onSaveCosto && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={()=> onSaveCosto(idx)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                      color: colors.light,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >💾 Guardar</motion.button>
                )}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={()=> removeCosto(idx)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: `1px solid ${colors.light}33`,
                    background: 'transparent',
                    color: colors.light,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >🗑️ Eliminar</motion.button>
              </div>
            </div>
          ))}
        </div>

        {costos.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, background: `${colors.dark}33`, borderRadius: 12, color: colors.light, opacity: 0.6, marginTop: 8 }}>
            <p>No hay costos cargados</p>
            <p style={{ fontSize: '0.9rem', marginTop: 4 }}>Agrega al menos una opción para vincular desde las clases</p>
          </div>
        )}
      </div>
    </div>
  );
}
