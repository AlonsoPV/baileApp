import React, { useEffect, useState } from 'react';
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

export default function OrganizerUbicacionesEditor({ organizerId }: { organizerId?: number }) {
  const { zonas } = useTags('zona');
  const { data: orgLocs = [] } = useOrganizerLocations(organizerId);
  const createLoc = useCreateOrganizerLocation();
  const updateLoc = useUpdateOrganizerLocation();
  const deleteLoc = useDeleteOrganizerLocation();

  const [items, setItems] = useState<UIItem[]>([]);
  const [ids, setIds] = useState<number[]>([]);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const mapped: UIItem[] = (orgLocs || []).map((u: any) => ({
      sede: u?.nombre || '',
      direccion: u?.direccion || '',
      ciudad: u?.ciudad || '',
      zona_id: typeof u?.zona_id === 'number' ? u.zona_id : (Array.isArray(u?.zona_ids) ? (u.zona_ids[0] ?? null) : null),
      referencias: u?.referencias || ''
    }));
    setItems(mapped);
    setIds((orgLocs || []).map((u: any) => u.id as number));
  }, [orgLocs]);

  const update = (next: UIItem[]) => setItems(next);
  const add = () => {
    update([...(items || []), { sede: '', direccion: '', ciudad: '', zona_id: null, referencias: '' }]);
  };
  const remove = (index: number) => {
    const id = ids[index];
    if (id) deleteLoc.mutate({ id, organizer_id: organizerId! });
    update((items || []).filter((_, i) => i !== index));
    const nextIds = [...ids]; nextIds.splice(index, 1); setIds(nextIds);
  };
  const patch = (index: number, p: Partial<UIItem>) =>
    update((items || []).map((it, i) => (i === index ? { ...it, ...p } : it)));

  const saveOne = async (index: number) => {
    if (!organizerId) return;
    try {
      setSaving((s) => ({ ...s, [index]: true }));
      const it = (items || [])[index];
      const payload: any = {
        organizer_id: organizerId,
        nombre: it.sede || '',
        direccion: it.direccion || '',
        ciudad: it.ciudad || '',
        referencias: it.referencias || '',
        zona_id: it.zona_id ?? null,
        zona_ids: typeof it.zona_id === 'number' ? [it.zona_id] : [],
      };
      const idAt = ids[index];
      if (idAt) {
        await updateLoc.mutateAsync({ id: idAt, patch: payload });
      } else {
        const created = await createLoc.mutateAsync(payload);
        const nextIds = [...ids];
        nextIds[index] = created.id!;
        setIds(nextIds);
      }
      setSaved((s) => ({ ...s, [index]: true }));
      setTimeout(() => setSaved((s) => { const c = { ...s }; delete c[index]; return c; }), 1500);
    } finally {
      setSaving((s) => ({ ...s, [index]: false }));
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

      {(items || []).map((item, index) => (
        <div
          key={index}
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
            {(zonas || []).map((z: any) => (
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
              disabled={!!saving[index]}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: borderRadius.lg,
                background: saved[index] ? 'rgba(16, 185, 129, 0.9)' : 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: colors.light,
                cursor: saving[index] ? 'not-allowed' : 'pointer',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                transition: 'all 0.2s ease',
                opacity: saving[index] ? 0.6 : 1,
              }}
            >
              {saving[index] ? 'Guardando…' : saved[index] ? 'Guardado ✓' : 'Guardar'}
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
      ))}

      {(items || []).length === 0 && (
        <div
          style={{
            fontSize: typography.fontSize.sm,
            opacity: 0.7,
            color: colors.light,
            textAlign: 'center',
            padding: spacing[4],
          }}
        >
          Aún no has agregado ubicaciones.
        </div>
      )}
    </div>
  );
}


