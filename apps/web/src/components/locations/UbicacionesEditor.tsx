import React from 'react';
import { useTags } from '../../hooks/useTags';

type Ubicacion = {
  id?: string;
  nombre?: string;
  direccion?: string;
  referencias?: string;
  zonaIds?: number[]; // múltiples zonas
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

  const ensureId = (u: Ubicacion): Ubicacion => ({ ...u, id: u.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });

  const update = (items: Ubicacion[]) => onChange?.(items.map(ensureId));

  const addItem = () => update([...(value || []), ensureId({ nombre: '', direccion: '', referencias: '', zonaIds: [] })]);

  const updateField = (idx: number, key: keyof Ubicacion, val: any) => {
    const next = [...(value || [])];
    next[idx] = ensureId({ ...(next[idx] || {}), [key]: val });
    update(next);
  };

  const toggleZona = (idx: number, tagId: number) => {
    const current = [...(value || [])];
    const zonasSel = new Set(current[idx]?.zonaIds || []);
    zonasSel.has(tagId) ? zonasSel.delete(tagId) : zonasSel.add(tagId);
    current[idx] = ensureId({ ...(current[idx] || {}), zonaIds: Array.from(zonasSel) });
    update(current);
  };

  const removeItem = (idx: number) => {
    const next = [...(value || [])];
    next.splice(idx, 1);
    update(next);
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
        {(value || []).map((u, idx) => (
          <div key={u.id || idx} style={{ padding: 12, borderRadius: 12, border: `1px solid ${colors.line}`, background: 'rgba(255,255,255,0.04)', display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={label}>Nombre de la ubicación</div>
                <div style={shell(!(u?.nombre || '').trim())}>
                  <input style={input} value={u?.nombre || ''} onChange={(e) => updateField(idx, 'nombre', e.target.value)} placeholder="Ej. Sede Centro / Salón" />
                </div>
              </div>
              <div>
                <div style={label}>Dirección</div>
                <div style={shell()}>
                  <input style={input} value={u?.direccion || ''} onChange={(e) => updateField(idx, 'direccion', e.target.value)} placeholder="Calle, número, colonia, ciudad" />
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
                  <button key={z.id} type="button" style={chip((u?.zonaIds || []).includes(z.id))} onClick={() => toggleZona(idx, z.id)}>
                    {z.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(229,57,53,0.35)', background: 'rgba(229,57,53,0.12)', color: '#fff', cursor: 'pointer' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


