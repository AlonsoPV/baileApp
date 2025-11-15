import React, { useState, useEffect, useMemo } from 'react';
import { AcademyLocation } from '../../types/academy';
import { colors, typography, spacing, borderRadius } from '../../theme/colors';
import { useTags } from '../../hooks/useTags';

type UbicacionesEditorProps = {
  value: AcademyLocation[];
  onChange: (v: AcademyLocation[]) => void;
  onSaveItem?: (index: number, item: AcademyLocation) => void;
  allowedZoneIds?: number[];
  savedLocations?: Array<{
    id?: string | number;
    nombre?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
    referencias?: string | null;
    zona_id?: number | null;
    zona_ids?: number[] | null;
    zonas?: number[] | null;
  }>;
};

export default function UbicacionesEditor({
  value,
  onChange,
  onSaveItem,
  allowedZoneIds,
  savedLocations,
}: UbicacionesEditorProps) {
  const ensureId = (loc: AcademyLocation): AcademyLocation & { id: string } => {
    if (loc.id && typeof loc.id === 'string') return loc as AcademyLocation & { id: string };
    if (loc.id && typeof loc.id === 'number') {
      return { ...loc, id: String(loc.id) };
    }
    return { ...loc, id: `ubicacion_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
  };
  const [items, setItems] = useState<AcademyLocation[]>((value || []).map(ensureId));
  const { zonas } = useTags('zona');
  const zoneOptions = useMemo(() => {
    if (!Array.isArray(zonas)) return [];
    if (!allowedZoneIds || !allowedZoneIds.length) return zonas;
    const allowed = new Set(allowedZoneIds);
    const filtered = zonas.filter((z: any) => allowed.has(z.id));
    return filtered.length ? filtered : zonas;
  }, [zonas, allowedZoneIds]);
  const normalizedSaved = useMemo(() => {
    if (!Array.isArray(savedLocations)) return [];
    return savedLocations.map((loc) => {
      const zonaIds = Array.isArray(loc.zona_ids)
        ? loc.zona_ids.filter((id): id is number => typeof id === 'number')
        : Array.isArray(loc.zonas)
        ? loc.zonas.filter((id): id is number => typeof id === 'number')
        : typeof loc.zona_id === 'number'
        ? [loc.zona_id]
        : [];
      return {
        id: String(loc.id ?? ''),
        nombre: loc.nombre || '',
        direccion: loc.direccion || '',
        ciudad: loc.ciudad || '',
        referencias: loc.referencias || '',
        zona_id: zonaIds.length ? zonaIds[0] : null,
        zonaIds,
      };
    });
  }, [savedLocations]);
  const [selectedSaved, setSelectedSaved] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setItems((value || []).map(ensureId));
  }, [value]);

  useEffect(() => {
    const initial: Record<string, string> = {};
    (value || []).forEach((item) => {
      const ensured = ensureId(item);
      const itemId = ensured.id || '';
      if (!itemId) return;
      const match = normalizedSaved.find(
        (loc) =>
          loc.nombre === (ensured.sede || ensured.nombre || '') &&
          loc.direccion === (ensured.direccion || '') &&
          loc.ciudad === (ensured.ciudad || '') &&
          loc.referencias === (ensured.referencias || '')
      );
      if (match?.id) {
        initial[itemId] = match.id;
      }
    });
    setSelectedSaved(initial);
  }, [value, normalizedSaved]);

  const update = (next:AcademyLocation[]) => { 
    const withIds = next.map(ensureId);
    setItems(withIds); 
    onChange(withIds); 
  };

  const add = () => {
    update([...(items||[]), { 
      sede: '', 
      direccion: '', 
      ciudad: '', 
      zona_id: null,
      referencias: ''
    }]);
  };

  const remove = (index: number) => {
    const removed = (items || [])[index];
    const ensured = removed ? ensureId(removed) : null;
    if (ensured?.id) {
      setSelectedSaved((prev) => {
        const copy = { ...prev };
        delete copy[ensured.id!];
        return copy;
      });
    }
    update((items||[]).filter((_, i) => i !== index));
  };
  
  const patch = (index: number, p: Partial<AcademyLocation>) =>
    update((items||[]).map((item, i) => i === index ? { ...item, ...p } : item));

  const saveOne = async (index: number) => {
    try {
      setSaving(s => ({ ...s, [index]: true }));
      if (onSaveItem) await Promise.resolve(onSaveItem(index, (items||[])[index]));
      setSaved(s => ({ ...s, [index]: true }));
      setTimeout(() => setSaved(s => { const c = { ...s }; delete c[index]; return c; }), 1500);
    } finally {
      setSaving(s => ({ ...s, [index]: false }));
    }
  };

  return (
    <div style={{ marginTop: spacing[6] }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[4]
      }}>
        <h3 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.light
        }}>
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
            fontWeight: typography.fontWeight.medium
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

      {(items||[]).map((item, index)=>(
        <div key={index} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing[3],
          padding: spacing[3],
          borderRadius: borderRadius.xl,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.05)',
          marginBottom: spacing[3]
        }}>
          {normalizedSaved.length > 0 && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: typography.fontSize.xs, color: colors.mut }}>Ubicación guardada</label>
              <select
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: borderRadius.lg,
                  padding: `${spacing[2]} ${spacing[3]}`,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: colors.light,
                  fontSize: typography.fontSize.sm,
                }}
                value={(() => {
                  const ensured = ensureId(item);
                  return selectedSaved[ensured.id || ''] || '';
                })()}
                onChange={(e) => {
                  const savedId = e.target.value;
                  const ensured = ensureId(item);
                  const itemId = ensured.id || '';
                  setSelectedSaved((prev) => ({ ...prev, [itemId]: savedId }));
                  if (!savedId) return;
                  const savedLoc = normalizedSaved.find((loc) => loc.id === savedId);
                  if (savedLoc) {
                    patch(index, {
                      sede: savedLoc.nombre,
                      direccion: savedLoc.direccion,
                      ciudad: savedLoc.ciudad,
                      referencias: savedLoc.referencias,
                      zona_id: savedLoc.zona_id,
                      zonaIds: savedLoc.zonaIds,
                      zonas: savedLoc.zonaIds,
                    });
                  }
                }}
              >
                <option value="">— Escribir manualmente —</option>
                {normalizedSaved.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nombre || loc.direccion || 'Ubicación'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <input 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm
            }}
            placeholder="Nombre de la sede"
            value={item.sede || ''} 
            onChange={e=>patch(index, {sede: e.target.value})}
          />
          
          <input 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm
            }}
            placeholder="Dirección"
            value={item.direccion || ''} 
            onChange={e=>patch(index, {direccion: e.target.value})}
          />
          
          <input 
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm
            }}
            placeholder="Ciudad"
            value={item.ciudad || ''} 
            onChange={e=>patch(index, {ciudad: e.target.value})}
          />
          
          <select
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: borderRadius.lg,
              padding: `${spacing[2]} ${spacing[3]}`,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: colors.light,
              fontSize: typography.fontSize.sm
            }}
            value={item.zona_id || ''}
            onChange={e=>patch(index, { zona_id: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Seleccionar zona</option>
            {(zoneOptions || []).map((z:any) => (
              <option key={z.id} value={z.id}>{z.nombre}</option>
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
              minHeight: 64
            }}
            placeholder="Notas / referencias"
            value={item.referencias || ''}
            onChange={e=>patch(index, { referencias: e.target.value })}
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
                opacity: saving[index] ? 0.6 : 1
              }}
            >
              {saving[index] ? 'Guardando…' : (saved[index] ? 'Guardado ✓' : 'Guardar')}
            </button>
            <button 
              type="button" 
              onClick={()=>remove(index)}
              style={{
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: borderRadius.lg,
                background: 'rgba(239, 68, 68, 0.8)',
                border: 'none',
                color: colors.light,
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                transition: 'all 0.2s ease'
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

      {(items||[]).length===0 && (
        <div style={{
          fontSize: typography.fontSize.sm,
          opacity: 0.7,
          color: colors.light,
          textAlign: 'center',
          padding: spacing[4]
        }}>
          Aún no has agregado ubicaciones.
        </div>
      )}
    </div>
  );
}
