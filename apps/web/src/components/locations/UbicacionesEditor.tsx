import React from 'react';
import { useTags } from '../../hooks/useTags';

type Ubicacion = {
  id?: string;
  nombre?: string;
  sede?: string;
  direccion?: string;
  ciudad?: string;
  referencias?: string;
  zonaIds?: number[];
  zona_id?: number | null;
  zonas?: number[];
};

type Props = {
  value?: Ubicacion[];
  onChange?: (v: Ubicacion[]) => void;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
};

const colors = {
  line: 'rgba(255,255,255,0.12)',
  panel: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  mut: 'rgba(255,255,255,0.75)'
};

export default function UbicacionesEditor({ value = [], onChange, title = 'Ubicaciones', className, style }: Props) {
  const { data: allTags } = useTags();
  const zonas = (allTags || []).filter((t: any) => t.tipo === 'zona');
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

const ensureId = (u: Ubicacion): Ubicacion => ({
  ...u,
  id: u.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
});

const getZonaIds = (u?: Ubicacion) => {
  if (!u) return [] as number[];
  if (Array.isArray(u.zonaIds)) return u.zonaIds.filter((n): n is number => typeof n === 'number');
  if (Array.isArray(u.zonas)) return u.zonas.filter((n): n is number => typeof n === 'number');
  if (typeof u.zona_id === 'number') return [u.zona_id];
  return [];
};

const syncZonaFields = (item: Ubicacion, ids: number[]) => ({
  ...item,
  zonaIds: ids,
  zonas: ids,
  zona_id: ids.length ? ids[0] : null,
});

const withName = (item: Ubicacion, value: string) => ({
  ...item,
  nombre: value,
  sede: value,
});

  const update = (items: Ubicacion[]) => onChange?.(items.map(ensureId));

  const addItem = () => {
    const item = ensureId({ nombre: '', sede: '', direccion: '', ciudad: '', referencias: '', zonaIds: [] });
    update([...(value || []), item]);
    if (item.id) setExpandedIds(new Set([...Array.from(expandedIds), item.id]));
  };

  const updateField = (idx: number, key: keyof Ubicacion, val: any) => {
    const next = [...(value || [])];
    const current = ensureId({ ...(next[idx] || {}) });
    let updated: Ubicacion = current;

    if (key === 'nombre' || key === 'sede') {
      updated = withName(current, val);
    } else if (key === 'ciudad') {
      updated = { ...current, ciudad: val };
    } else {
      updated = { ...current, [key]: val };
    }

    next[idx] = updated;
    update(next);
  };

  const toggleZona = (idx: number, tagId: number) => {
    const current = [...(value || [])];
    const existing = ensureId({ ...(current[idx] || {}) });
    const zonasSel = new Set(getZonaIds(existing));
    zonasSel.has(tagId) ? zonasSel.delete(tagId) : zonasSel.add(tagId);
    current[idx] = syncZonaFields(existing, Array.from(zonasSel));
    update(current);
  };

  const removeItem = (idx: number) => {
    const next = [...(value || [])];
    const removed = next[idx];
    next.splice(idx, 1);
    update(next);
    if (removed?.id && expandedIds.has(removed.id)) {
      const copy = new Set(expandedIds);
      copy.delete(removed.id);
      setExpandedIds(copy);
    }
  };

  const label: React.CSSProperties = { fontSize: 12, color: colors.mut, marginBottom: 6 };
  const shell = (invalid = false): React.CSSProperties => ({
    borderRadius: 10,
    border: `1px solid ${invalid ? 'rgba(239,68,68,0.5)' : colors.line}`,
    background: colors.panel
  });
  const input: React.CSSProperties = {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: colors.text,
    padding: '10px 12px',
    fontSize: 14
  };
  const chip = (active: boolean): React.CSSProperties => ({
    padding: '6px 10px',
    borderRadius: 999,
    border: active ? '1px solid #1976D2' : `1px solid ${colors.line}`,
    background: active ? 'rgba(25,118,210,0.2)' : 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer'
  });

  return (
    <div className={className} style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: '#fff' }}>{title}</h3>
        <button
          type="button"
          onClick={addItem}
          style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${colors.line}`, background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}
        >
          ➕ Agregar ubicación
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {(value || []).map((raw, idx) => {
          const u = ensureId(raw);
          const id = u.id || String(idx);
          const isOpen = id ? expandedIds.has(id) : false;
          const zonaNames = getZonaIds(u).map(zid => zonas.find((z: any) => z.id === zid)?.nombre).filter(Boolean) as string[];
          const displayName = (u.nombre || u.sede || '').trim();

          return (
            <div key={id} style={{ padding: 12, borderRadius: 12, border: `1px solid ${colors.line}`, background: 'rgba(255,255,255,0.04)', display: 'grid', gap: 10 }}>
              {!isOpen && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <strong style={{ color: '#fff' }}>{displayName || 'Ubicación'}</strong>
                    {u.direccion && (
                      <span style={{ fontSize: 12, opacity: 0.8 }}>{u.direccion}</span>
                    )}
                    {u.ciudad && (
                      <span style={{ fontSize: 12, opacity: 0.7 }}>🏙️ {u.ciudad}</span>
                    )}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {zonaNames.map((name, i) => (
                        <span key={i} style={{ fontSize: 12, fontWeight: 600, color: '#fff', border: '1px solid rgba(25,118,210,0.4)', background: 'rgba(25,118,210,0.18)', padding: '2px 8px', borderRadius: 999 }}>{name}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setExpandedIds(new Set([...Array.from(expandedIds), id]))} style={{ padding: '6px 10px', borderRadius: 10, border: `1px solid ${colors.line}`, background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>Editar</button>
                    <button type="button" onClick={() => removeItem(idx)} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(229,57,53,0.35)', background: 'rgba(229,57,53,0.12)', color: '#fff', cursor: 'pointer' }}>Eliminar</button>
                  </div>
                </div>
              )}

              {isOpen && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    <div>
                      <div style={label}>Nombre de la ubicación</div>
                      <div style={shell(!displayName)}>
                        <input
                          style={input}
                          value={displayName}
                          onChange={(e) => updateField(idx, 'nombre', e.target.value)}
                          placeholder="Ej. Sede Centro / Salón"
                        />
                      </div>
                    </div>
                    <div>
                      <div style={label}>Ciudad</div>
                      <div style={shell()}>
                        <input
                          style={input}
                          value={u.ciudad || ''}
                          onChange={(e) => updateField(idx, 'ciudad', e.target.value)}
                          placeholder="CDMX, Puebla, etc."
                        />
                      </div>
                    </div>
                    <div>
                      <div style={label}>Dirección</div>
                      <div style={shell()}>
                        <input
                          style={input}
                          value={u.direccion || ''}
                          onChange={(e) => updateField(idx, 'direccion', e.target.value)}
                          placeholder="Calle, número, colonia"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={label}>Notas o referencias</div>
                    <div style={shell()}>
                      <input style={input} value={u?.referencias || ''} onChange={(e) => updateField(idx, 'referencias', e.target.value)} placeholder="Ej. Entrada lateral, 2do piso" />
                    </div>
                  </div>

                  <div>
                    <div style={label}>Zonas</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {zonas.map((z: any) => (
                        <button
                          key={z.id}
                          type="button"
                          style={chip(getZonaIds(u).includes(z.id))}
                          onClick={() => toggleZona(idx, z.id)}
                        >
                          {z.nombre}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button type="button" onClick={() => setExpandedIds((prev) => { const next = new Set(prev); next.delete(id); return next; })} style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${colors.line}`, background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer' }}>Guardar</button>
                    <button type="button" onClick={() => removeItem(idx)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(229,57,53,0.35)', background: 'rgba(229,57,53,0.12)', color: '#fff', cursor: 'pointer' }}>Eliminar</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


