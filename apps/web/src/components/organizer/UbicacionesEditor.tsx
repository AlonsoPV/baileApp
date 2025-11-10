import React, { useEffect, useMemo, useState } from 'react';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { useTags } from '../../hooks/useTags';
import {
  useOrganizerLocations,
  useCreateOrganizerLocation,
  useUpdateOrganizerLocation,
  useDeleteOrganizerLocation,
} from '../../hooks/useOrganizerLocations';

type UIItem = {
  sede?: string;
  direccion?: string;
  ciudad?: string;
  zona_id?: number | null;
  referencias?: string;
};

const summaryBoxStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: spacing[2],
  padding: `${spacing[3]} ${spacing[3]}`,
  borderRadius: borderRadius.xl,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.55)',
  marginBottom: spacing[3],
  alignItems: 'center',
  flexWrap: 'wrap'
};

export default function OrganizerUbicacionesEditor({ organizerId }: { organizerId?: number }) {
  const { zonas } = useTags('zona');
  const { data: orgLocs = [] } = useOrganizerLocations(organizerId);
  const createLoc = useCreateOrganizerLocation();
  const updateLoc = useUpdateOrganizerLocation();
  const deleteLoc = useDeleteOrganizerLocation();

  const [items, setItems] = useState<UIItem[]>([]);
  const [ids, setIds] = useState<Array<number | null>>([]);
  const [rowKeys, setRowKeys] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const mapped: UIItem[] = (orgLocs || []).map((u: any) => ({
      sede: u?.nombre || '',
      direccion: u?.direccion || '',
      ciudad: u?.ciudad || '',
      zona_id:
        typeof u?.zona_id === 'number'
          ? u.zona_id
          : Array.isArray(u?.zona_ids)
          ? u.zona_ids[0] ?? null
          : null,
      referencias: u?.referencias || '',
    }));
    setItems(mapped);
    setIds((orgLocs || []).map((u: any) => (u.id as number) ?? null));
    setRowKeys((orgLocs || []).map((u: any) => `persist-${u.id}`));
    setExpanded({});
    setSaving({});
    setSaved({});
  }, [orgLocs]);

  const ensureRowKey = (index: number) => rowKeys[index] || `temp-${index}`;

  const add = () => {
    const nextItems = [...items, { sede: '', direccion: '', ciudad: '', zona_id: null, referencias: '' }];
    const newKey = `temp-${Date.now()}`;
    setItems(nextItems);
    setIds([...ids, null]);
    setRowKeys([...rowKeys, newKey]);
    setExpanded((exp) => ({ ...exp, [newKey]: true }));
  };

  const remove = (index: number) => {
    const id = ids[index];
    if (id) deleteLoc.mutate({ id, organizer_id: organizerId! });
    const nextItems = items.filter((_, i) => i !== index);
    const nextIds = ids.filter((_, i) => i !== index);
    const nextKeys = rowKeys.filter((_, i) => i !== index);
    setItems(nextItems);
    setIds(nextIds);
    setRowKeys(nextKeys);
    setExpanded((exp) => {
      const copy = { ...exp };
      delete copy[ensureRowKey(index)];
      return copy;
    });
  };

  const patch = (index: number, p: Partial<UIItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...p } : it)));
  };

  const uniqueZones = useMemo(() => zonas || [], [zonas]);

  const saveOne = async (index: number) => {
    if (!organizerId) return;
    const key = ensureRowKey(index);
    const item = items[index];
    try {
      setSaving((s) => ({ ...s, [key]: true }));
      const payload: any = {
        organizer_id: organizerId,
        nombre: item.sede || '',
        direccion: item.direccion || '',
        ciudad: item.ciudad || '',
        referencias: item.referencias || '',
        zona_id: item.zona_id ?? null,
        zona_ids: typeof item.zona_id === 'number' ? [item.zona_id] : [],
      };
      const idAt = ids[index];
      if (idAt) {
        await updateLoc.mutateAsync({ id: idAt, patch: payload });
      } else {
        const created = await createLoc.mutateAsync(payload);
        setIds((prev) => prev.map((val, i) => (i === index ? created.id || null : val)));
        setRowKeys((prev) => prev.map((val, i) => (i === index ? `persist-${created.id}` : val)));
      }
      setSaved((s) => ({ ...s, [key]: true }));
      setExpanded((exp) => {
        const copy = { ...exp };
        delete copy[key];
        return copy;
      });
      setTimeout(() => setSaved((s) => { const copy = { ...s }; delete copy[key]; return copy; }), 1500);
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  return (
    <div style={{ marginTop: spacing[6] }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[4],
        }}
      >
        <h3
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.light,
          }}
        >
          📍 Ubicaciones
        </h3>
        <button
          type="button"
          onClick={add}
          style={{
            padding: `${spacing[2]} ${spacing[3]}`,
            borderRadius: borderRadius.lg,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: colors.light,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          Agregar
        </button>
      </div>

      {(items || []).map((item, index) => {
        const key = ensureRowKey(index);
        const isExpanded = !!expanded[key];
        const zonaNombre = item.zona_id
          ? uniqueZones.find((z: any) => z.id === item.zona_id)?.nombre
          : undefined;

        if (!isExpanded) {
          return (
            <div key={key} style={summaryBoxStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong>{item.sede || 'Ubicación sin nombre'}</strong>
                {item.direccion && <span style={{ fontSize: 13 }}>{item.direccion}</span>}
                {item.ciudad && (
                  <span style={{ fontSize: 12, opacity: 0.8 }}>🏙️ {item.ciudad}</span>
                )}
                {zonaNombre && (
                  <span style={{ fontSize: 12, opacity: 0.8 }}>📍 {zonaNombre}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setExpanded((exp) => ({ ...exp, [key]: true }))}
                  style={{
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: borderRadius.lg,
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.08)',
                    color: colors.light,
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  style={{
                    padding: `${spacing[1]} ${spacing[3]}`,
                    borderRadius: borderRadius.lg,
                    border: '1px solid rgba(239,68,68,0.45)',
                    background: 'rgba(239,68,68,0.2)',
                    color: colors.light,
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={key}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing[3],
              padding: spacing[3],
              borderRadius: borderRadius.xl,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              marginBottom: spacing[3],
            }}
          >
            <input
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: borderRadius.lg,
                padding: `${spacing[2]} ${spacing[3]}`,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: colors.light,
                fontSize: typography.fontSize.sm,
              }}
              placeholder="Nombre de la sede"
              value={item.sede || ''}
              onChange={(e) => patch(index, { sede: e.target.value })}
            />

            <input
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: borderRadius.lg,
                padding: `${spacing[2]} ${spacing[3]}`,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: colors.light,
                fontSize: typography.fontSize.sm,
              }}
              placeholder="Dirección"
              value={item.direccion || ''}
              onChange={(e) => patch(index, { direccion: e.target.value })}
            />

            <input
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: borderRadius.lg,
                padding: `${spacing[2]} ${spacing[3]}`,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: colors.light,
                fontSize: typography.fontSize.sm,
              }}
              placeholder="Ciudad"
              value={item.ciudad || ''}
              onChange={(e) => patch(index, { ciudad: e.target.value })}
            />

            <select
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: borderRadius.lg,
                padding: `${spacing[2]} ${spacing[3]}`,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: colors.light,
                fontSize: typography.fontSize.sm,
              }}
              value={item.zona_id || ''}
              onChange={(e) => patch(index, { zona_id: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Seleccionar zona</option>
              {uniqueZones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}
                </option>
              ))}
            </select>

            <textarea
              style={{
                gridColumn: '1 / -1',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: borderRadius.lg,
                padding: `${spacing[2]} ${spacing[3]}`,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: colors.light,
                fontSize: typography.fontSize.sm,
                minHeight: 64,
              }}
              placeholder="Notas / referencias"
              value={item.referencias || ''}
              onChange={(e) => patch(index, { referencias: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing[2] }}>
              <button
                type="button"
                onClick={() => saveOne(index)}
                disabled={!!saving[key]}
                style={{
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: borderRadius.lg,
                  background: saved[key] ? 'rgba(16, 185, 129, 0.9)' : 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: colors.light,
                  cursor: saving[key] ? 'not-allowed' : 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  transition: 'all 0.2s ease',
                  opacity: saving[key] ? 0.6 : 1,
                }}
              >
                {saving[key] ? 'Guardando…' : saved[key] ? 'Guardado ✓' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExpanded((exp) => ({ ...exp, [key]: false }));
                  setSaved((s) => {
                    const copy = { ...s };
                    delete copy[key];
                    return copy;
                  });
                }}
                style={{
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: borderRadius.lg,
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: colors.light,
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  transition: 'all 0.2s ease',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                style={{
                  padding: `${spacing[2]} ${spacing[3]}`,
                  borderRadius: borderRadius.lg,
                  background: 'rgba(239, 68, 68, 0.8)',
                  border: 'none',
                  color: colors.light,
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)';
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        );
      })}

      {(items || []).length === 0 && (
        <div
          style={{
            fontSize: typography.fontSize.sm,
            opacity: 0.7,
            color: colors.light,
            textAlign: 'center',
            padding: spacing[4],
            background: 'rgba(0,0,0,0.55)',
            borderRadius: borderRadius.lg,
          }}
        >
          Aún no has agregado ubicaciones.
        </div>
      )}
    </div>
  );
}


