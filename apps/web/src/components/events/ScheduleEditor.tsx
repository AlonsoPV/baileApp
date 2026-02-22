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
  realizadoPor?: string; // texto libre: "Se llevará a cabo por"
};

type RitmoTag = { id: number; nombre: string };
type ZonaTag = { id: number; nombre: string };

export type CostoTipo = 'taquilla' | 'preventa' | 'promocion' | 'otro';

type CostoItem = {
  tipo: CostoTipo | string;
  monto: number;
  descripcion?: string;
  nombre?: string; // referencia para cronograma
  /** @deprecated use monto */
  precio?: number | null;
  /** @deprecated use descripcion */
  regla?: string;
};

const TIPOS_COSTO: { id: CostoTipo; label: string }[] = [
  { id: 'taquilla', label: 'Taquilla' },
  { id: 'preventa', label: 'Preventa' },
  { id: 'promocion', label: 'Promoción' },
  { id: 'otro', label: 'Otro' },
];

function normalizeCostoForForm(c: any): CostoItem {
  const tipoRaw = (c?.tipo ?? 'otro').toString().toLowerCase();
  const tipo: CostoTipo =
    tipoRaw === 'taquilla' ? 'taquilla'
    : tipoRaw === 'preventa' ? 'preventa'
    : tipoRaw === 'promocion' || tipoRaw === 'promoción' || tipoRaw === 'promo' ? 'promocion'
    : 'otro';
  const monto = typeof c?.monto === 'number' ? c.monto : (typeof c?.precio === 'number' ? c.precio : 0);
  return {
    tipo,
    monto: monto >= 0 ? monto : 0,
    descripcion: c?.descripcion ?? c?.regla ?? '',
    nombre: c?.nombre,
    precio: c?.precio,
    regla: c?.regla,
  };
}

function toOutputCosto(c: CostoItem) {
  return { tipo: c.tipo, monto: c.monto, descripcion: c.descripcion || undefined, nombre: c.nombre || undefined };
}

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
  // Defensive defaults: callers may pass undefined during first render / partial forms.
  schedule = [],
  onChangeSchedule,
  costos = [],
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
  const [isAddingCosto, setIsAddingCosto] = useState(false); // ✅ Estado para colapsar costos
  const [collapsedCostIdxs, setCollapsedCostIdxs] = useState<Set<number>>(() => new Set());
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
    referenciaCosto: '',
    realizadoPor: ''
  });
  
  // Actualizar fecha cuando cambie eventFecha
  React.useEffect(() => {
    if (eventFecha) {
      setNewItem(prev => ({ ...prev, fecha: eventFecha }));
    }
  }, [eventFecha]);

  const addItem = () => {
    const hasTitulo = (newItem.titulo && newItem.titulo.trim()) || newItem.ritmoId;
    // Permitir que la hora de fin sea opcional: solo exigir inicio
    if (hasTitulo && newItem.inicio) {
      const titleFromRitmo = newItem.ritmoId ? (ritmos.find(r=>r.id===newItem.ritmoId)?.nombre || '') : '';
      const finalTitulo = (newItem.titulo && newItem.titulo.trim()) || titleFromRitmo;
      const next = [...schedule, {
        ...newItem,
        titulo: finalTitulo,
        inicio: normalizeTime(newItem.inicio),
        fin: newItem.fin ? normalizeTime(newItem.fin) : '',
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
        referenciaCosto: '',
        realizadoPor: ''
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

  const duplicateItem = (index: number) => {
    const original = schedule[index];
    if (!original) return;
    const clone = {
      ...original,
      titulo: original.titulo
        ? `${original.titulo} (copia)`
        : original.titulo,
      inicio: normalizeTime(original.inicio),
      fin: normalizeTime(original.fin),
    };
    const next = [
      ...schedule.slice(0, index + 1),
      clone,
      ...schedule.slice(index + 1),
    ];
    onChangeSchedule(next);
  };

  const duplicateCosto = (index: number) => {
    const original = costos[index];
    if (!original) return;
    const c = normalizeCostoForForm(original);
    const clone: CostoItem = {
      ...c,
      nombre: c.nombre ? `${c.nombre} (copia)` : `${TIPOS_COSTO.find(t => t.id === c.tipo)?.label ?? 'Costo'} (copia)`,
    };
    const next = [
      ...costos.slice(0, index + 1).map(normalizeCostoForForm).map(toOutputCosto),
      toOutputCosto(clone),
      ...costos.slice(index + 1).map(normalizeCostoForForm).map(toOutputCosto),
    ];
    onChangeCostos(next);
    // Evitar desalineación de índices tras duplicar
    setCollapsedCostIdxs(new Set([index, index + 1]));
  };

  const startEdit = (i: number) => setEditingIndex(i);
  const finishEdit = () => setEditingIndex(null);

  // ====== Costos ======
  const [newCosto, setNewCosto] = useState<CostoItem>({
    tipo: 'taquilla',
    monto: 0,
    descripcion: '',
    nombre: ''
  });

  const setCosto = (idx: number, patch: Partial<CostoItem>) => {
    const arr = costos.map(normalizeCostoForForm);
    const curr = arr[idx];
    if (!curr) return;
    const merged = { ...curr, ...patch };
    if ('precio' in patch && patch.precio !== undefined) (merged as any).monto = patch.precio;
    if ('regla' in patch && patch.regla !== undefined) merged.descripcion = patch.regla;
    const next = arr.map((c, i) => (i === idx ? toOutputCosto(merged) : toOutputCosto(c)));
    onChangeCostos(next);
    // Si el usuario toca cualquier campo, re-abrimos (descolapsamos) el item.
    setCollapsedCostIdxs((prev) => {
      if (!prev.has(idx)) return prev;
      const n = new Set(prev);
      n.delete(idx);
      return n;
    });
  };

  const hasTaquilla = (costos || []).some((c) => normalizeCostoForForm(c).tipo === 'taquilla');
  const addCostoToList = () => {
    const c = normalizeCostoForForm(newCosto);
    if (c.monto < 0) return;
    if (c.tipo === 'taquilla' && hasTaquilla) return; // Solo puede existir un taquilla
    onChangeCostos([...costos.map(normalizeCostoForForm).map(toOutputCosto), toOutputCosto(c)]);
    setCollapsedCostIdxs((prev) => new Set(prev).add((costos || []).length));
    setNewCosto({ tipo: 'otro', monto: 0, descripcion: '', nombre: '' });
    setIsAddingCosto(false);
  };

  const removeCosto = (idx: number) => {
    onChangeCostos(costos.filter((_, i) => i !== idx).map(normalizeCostoForForm).map(toOutputCosto));
    // Evitar desalineación de índices tras eliminar
    setCollapsedCostIdxs(new Set());
  };

  const costoNombres = useMemo(() => (costos || []).map(c => {
    const n = normalizeCostoForForm(c);
    return (n.nombre || TIPOS_COSTO.find(t => t.id === n.tipo)?.label || '').trim();
  }).filter(Boolean), [costos]);

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
                  {/* Nombre de la actividad */}
                  <div>
                    <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Nombre</div>
                    <input
                      type="text"
                      value={item.titulo || ''}
                      onChange={(e)=> updateItem(index, 'titulo', e.target.value)}
                      placeholder="Nombre de la actividad"
                      style={input}
                    />
                  </div>

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

                  {/* Se llevará a cabo por */}
                  <div>
                    <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Se llevará a cabo por:</div>
                    <input
                      type="text"
                      value={item.realizadoPor || ''}
                      onChange={(e)=> updateItem(index, 'realizadoPor', e.target.value)}
                      placeholder="Ej: Profesor, grupo o entidad responsable"
                      style={input}
                    />
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

                  {/* horario */}
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

            

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={finishEdit}
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
                    >✅ Guardar</motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setEditingIndex(null)}
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
                    🕐 {item.fin ? `${item.inicio} - ${item.fin}` : item.inicio}
                    </p>
                    {item.ubicacion && <p style={{ fontSize: '0.85rem', color: colors.light, opacity: 0.8 }}>📍 {item.ubicacion}</p>}
                  {item.realizadoPor && (
                    <p style={{ fontSize: '0.85rem', color: colors.light, opacity: 0.8 }}>
                      Se llevará a cabo por: {item.realizadoPor}
                    </p>
                  )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={()=> startEdit(index)}
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: colors.blue, color: colors.light, cursor: 'pointer' }}
                    >✏️</motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => duplicateItem(index)}
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: colors.yellow, color: colors.dark, cursor: 'pointer' }}
                    >📄</motion.button>
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
            {/* Nombre primero */}
            <div>
              <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Nombre</div>
              <input
                type="text"
                value={newItem.titulo}
                onChange={(e) => setNewItem({ ...newItem, titulo: e.target.value })}
                placeholder="Nombre de la actividad"
                style={input}
              />
            </div>

            {/* Tipo y nivel */}
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

            {/* Se llevará a cabo por */}
            <div>
              <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Se llevará a cabo por:</div>
              <input
                type="text"
                value={newItem.realizadoPor || ''}
                onChange={(e) => setNewItem({ ...newItem, realizadoPor: e.target.value })}
                placeholder="Ej: Profesor, grupo o entidad responsable"
                style={input}
              />
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
                <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Fin (opcional)</div>
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
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={addItem}
                disabled={!((newItem.titulo?.trim() || newItem.ritmoId) && newItem.inicio)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: (newItem.titulo?.trim() || newItem.ritmoId) && newItem.inicio
                    ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})` 
                    : `${colors.light}33`,
                  color: colors.light,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: (newItem.titulo?.trim() || newItem.ritmoId) && newItem.inicio ? 'pointer' : 'not-allowed',
                }}
              >✅ Agregar Actividad</motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setIsAdding(false); }}
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
            onClick={() => setIsAddingCosto(true)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: 'none',
              background: `linear-gradient(135deg, ${colors.yellow}, ${colors.orange})`,
              color: colors.dark, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer'
            }}
          >+ Añadir costo</motion.button>
        </div>

        {/* Formulario colapsable para agregar nuevo costo */}
        {isAddingCosto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ ...card, marginBottom: 12 }}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Tipo</div>
                  <div style={pillWrap}>
                    {TIPOS_COSTO.map(t => (
                      <div
                        key={t.id}
                        style={pill(normalizeCostoForForm(newCosto).tipo === t.id)}
                        onClick={()=> setNewCosto({ ...newCosto, tipo: t.id })}
                      >{t.label}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Monto *</div>
                  <input
                    type="number" min={0} step="1" placeholder="Ej. 200"
                    value={newCosto.monto ?? ''}
                    onChange={(e)=> setNewCosto({ ...newCosto, monto: Math.max(0, Number(e.target.value) || 0) })}
                    style={input}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Descripción (opcional)</div>
                <input
                  style={input}
                  placeholder="Ej. Válido hasta el 15/Nov · 2x1 pareja"
                  value={newCosto.descripcion || ''}
                  onChange={(e)=> setNewCosto({ ...newCosto, descripcion: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Nombre (referencia para cronograma)</div>
                <input
                  style={input}
                  placeholder="Ej. General, VIP"
                  value={newCosto.nombre || ''}
                  onChange={(e)=> setNewCosto({ ...newCosto, nombre: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', marginTop: 12 }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={addCostoToList}
                  disabled={normalizeCostoForForm(newCosto).monto < 0 || (normalizeCostoForForm(newCosto).tipo === 'taquilla' && hasTaquilla)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: normalizeCostoForForm(newCosto).monto >= 0 && !(normalizeCostoForForm(newCosto).tipo === 'taquilla' && hasTaquilla)
                      ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
                      : `${colors.light}33`,
                    color: colors.light,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: normalizeCostoForForm(newCosto).monto >= 0 && !(normalizeCostoForForm(newCosto).tipo === 'taquilla' && hasTaquilla) ? 'pointer' : 'not-allowed'
                  }}
                >✅ Agregar Costo</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsAddingCosto(false);
                    setNewCosto({ tipo: 'taquilla', monto: 0, descripcion: '', nombre: '' });
                  }}
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
                >❌ Cancelar</motion.button>
              </div>
            </div>
          </motion.div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {costos.map((raw, idx)=> {
            const c = normalizeCostoForForm(raw);
            return (
            <div key={idx} style={card}>
              {collapsedCostIdxs.has(idx) ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem' }}>💸</span>
                      <span style={{
                        padding: '4px 8px', borderRadius: 12,
                        background: `${colors.light}33`, color: colors.light, fontSize: '0.8rem', fontWeight: 600,
                        textTransform: 'capitalize'
                      }}>
                        {TIPOS_COSTO.find(t => t.id === c.tipo)?.label ?? c.tipo}
                      </span>
                      <span style={{
                        padding: '4px 8px', borderRadius: 12,
                        background: `${colors.light}33`, color: colors.light, fontSize: '0.8rem', fontWeight: 600
                      }}>
                        {c.monto === 0 ? 'Gratis' : `$${Number(c.monto).toLocaleString()}`}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: colors.light, marginBottom: 4 }}>
                      {(c.nombre || TIPOS_COSTO.find(t => t.id === c.tipo)?.label || 'Costo').toString()}
                    </h4>
                    {c.descripcion && (
                      <p style={{ fontSize: '0.85rem', color: colors.light, opacity: 0.8, margin: 0 }}>
                        📋 {c.descripcion}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setCollapsedCostIdxs((prev) => { const n = new Set(prev); n.delete(idx); return n; })}
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: colors.blue, color: colors.light, cursor: 'pointer' }}
                    >✏️</motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => duplicateCosto(idx)}
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: colors.yellow, color: colors.dark, cursor: 'pointer' }}
                    >📄</motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={()=> removeCosto(idx)}
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: colors.coral, color: colors.light, cursor: 'pointer' }}
                    >🗑️</motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Tipo</div>
                      <div style={pillWrap}>
                        {TIPOS_COSTO.map(t => (
                          <div
                            key={t.id}
                            style={pill(c.tipo === t.id)}
                            onClick={()=> setCosto(idx, { tipo: t.id })}
                          >{t.label}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Monto *</div>
                      <input
                        type="number" min={0} step="1" placeholder="Ej. 200"
                        value={c.monto ?? ''}
                        onChange={(e)=> setCosto(idx, { monto: Math.max(0, Number(e.target.value) || 0) })}
                        style={input}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Descripción (opcional)</div>
                    <input
                      style={input}
                      placeholder="Ej. Válido hasta el 15/Nov · 2x1 pareja"
                      value={c.descripcion || ''}
                      onChange={(e)=> setCosto(idx, { descripcion: e.target.value })}
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ marginBottom: 4, fontSize: '0.9rem', color: colors.light }}>Nombre (referencia para cronograma)</div>
                    <input
                      style={input}
                      placeholder="Ej. General, VIP"
                      value={c.nombre || ''}
                      onChange={(e)=> setCosto(idx, { nombre: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', marginTop: 10, flexWrap: 'wrap' }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onSaveCosto?.(idx);
                        setCollapsedCostIdxs((prev) => new Set(prev).add(idx));
                      }}
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
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => duplicateCosto(idx)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 8,
                        border: 'none',
                        background: `${colors.yellow}`,
                        color: colors.dark,
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >📄 Duplicar</motion.button>
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
                </>
              )}
            </div>
          );})}
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
