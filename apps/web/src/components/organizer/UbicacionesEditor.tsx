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
  const lastOrgLocsSignature = React.useRef<string | null>(null);
  
  // Estados para edición masiva
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [bulkEdit, setBulkEdit] = useState<Partial<UIItem>>({});
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    // Evitar loops de renderizado infinito: solo sincronizar si los datos realmente cambiaron
    const signature = JSON.stringify(orgLocs || []);
    if (signature === lastOrgLocsSignature.current) {
      return;
    }
    lastOrgLocsSignature.current = signature;

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

  // Funciones para edición masiva
  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIndices(new Set(items.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const applyBulkEdit = async () => {
    if (!organizerId || selectedIndices.size === 0) return;
    
    const selectedIds = Array.from(selectedIndices)
      .map((idx) => ids[idx])
      .filter((id): id is number => id !== null);

    if (selectedIds.length === 0) {
      // Si no hay IDs (son nuevas), aplicar cambios localmente
      setItems((prev) =>
        prev.map((item, idx) =>
          selectedIndices.has(idx) ? { ...item, ...bulkEdit } : item
        )
      );
      return;
    }

    try {
      setBulkSaving(true);
      const payload: any = {};
      if (bulkEdit.ciudad !== undefined) payload.ciudad = bulkEdit.ciudad || null;
      if (bulkEdit.zona_id !== undefined) {
        payload.zona_id = bulkEdit.zona_id ?? null;
        payload.zona_ids = typeof bulkEdit.zona_id === 'number' ? [bulkEdit.zona_id] : [];
      }
      if (bulkEdit.referencias !== undefined) payload.referencias = bulkEdit.referencias || null;

      // Aplicar cambios a todas las ubicaciones seleccionadas
      await Promise.all(
        selectedIds.map((id) => updateLoc.mutateAsync({ id, patch: payload }))
      );

      // Actualizar estado local
      setItems((prev) =>
        prev.map((item, idx) =>
          selectedIndices.has(idx) ? { ...item, ...bulkEdit } : item
        )
      );

      // Limpiar selección y modo masivo
      setSelectedIndices(new Set());
      setBulkEdit({});
      setBulkMode(false);
    } catch (error) {
      console.error('Error applying bulk edit:', error);
    } finally {
      setBulkSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedIndices.size === 0) return;
    
    const selectedIds = Array.from(selectedIndices)
      .map((idx) => ids[idx])
      .filter((id): id is number => id !== null);

    if (selectedIds.length > 0 && organizerId) {
      // Eliminar ubicaciones existentes
      await Promise.all(
        selectedIds.map((id) => deleteLoc.mutateAsync({ id, organizer_id: organizerId }))
      );
    }

    // Eliminar del estado local (incluye las nuevas sin ID)
    const indicesToRemove = Array.from(selectedIndices).sort((a, b) => b - a);
    let nextItems = [...items];
    let nextIds = [...ids];
    let nextKeys = [...rowKeys];

    indicesToRemove.forEach((idx) => {
      nextItems = nextItems.filter((_, i) => i !== idx);
      nextIds = nextIds.filter((_, i) => i !== idx);
      nextKeys = nextKeys.filter((_, i) => i !== idx);
    });

    setItems(nextItems);
    setIds(nextIds);
    setRowKeys(nextKeys);
    setSelectedIndices(new Set());
    setBulkMode(false);
  };

  const selectedCount = selectedIndices.size;

  const accentPalette = [
    'rgba(39,195,255,0.95)',  // cyan
    'rgba(255,61,87,0.95)',   // coral
    'rgba(255,209,102,0.95)', // yellow
    'rgba(16,185,129,0.95)',  // green
    'rgba(168,85,247,0.95)',  // purple
  ];

  return (
    <div style={{ marginTop: spacing[6] }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[4],
          flexWrap: 'wrap',
          gap: spacing[2],
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
        <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setBulkMode(!bulkMode);
              if (bulkMode) {
                setSelectedIndices(new Set());
                setBulkEdit({});
              }
            }}
            style={{
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: borderRadius.lg,
              background: bulkMode
                ? 'rgba(39, 195, 255, 0.2)'
                : 'rgba(255, 255, 255, 0.1)',
              border: bulkMode
                ? '1px solid rgba(39, 195, 255, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.2)',
              color: colors.light,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
            }}
          >
            {bulkMode ? '✖️ Salir modo masivo' : '📋 Modo masivo'}
          </button>
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
            ➕ Agregar
          </button>
        </div>
      </div>

      {/* Panel de edición masiva */}
      {bulkMode && (
        <div
          style={{
            padding: spacing[4],
            borderRadius: borderRadius.xl,
            border: '1px solid rgba(39, 195, 255, 0.3)',
            background: 'linear-gradient(135deg, rgba(39, 195, 255, 0.1) 0%, rgba(30, 136, 229, 0.05) 100%)',
            marginBottom: spacing[4],
            boxShadow: '0 8px 32px rgba(39, 195, 255, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
            <h4
              style={{
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                color: colors.light,
                margin: 0,
              }}
            >
              ✏️ Edición Masiva
            </h4>
            <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
              <span style={{ fontSize: typography.fontSize.sm, opacity: 0.8, color: colors.light }}>
                {selectedCount} seleccionada{selectedCount !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={selectAll}
                style={{
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: borderRadius.md,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: colors.light,
                  cursor: 'pointer',
                  fontSize: typography.fontSize.xs,
                }}
              >
                ✅ Todas
              </button>
              <button
                type="button"
                onClick={deselectAll}
                style={{
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: borderRadius.md,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: colors.light,
                  cursor: 'pointer',
                  fontSize: typography.fontSize.xs,
                }}
              >
                ⛔ Ninguna
              </button>
            </div>
          </div>

          {selectedCount > 0 && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: spacing[3],
                  marginBottom: spacing[3],
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: spacing[1],
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.light,
                    }}
                  >
                    Ciudad (aplicar a todas)
                  </label>
                  <input
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: borderRadius.lg,
                      padding: `${spacing[2]} ${spacing[3]}`,
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: colors.light,
                      fontSize: typography.fontSize.sm,
                    }}
                    placeholder="Ciudad"
                    value={bulkEdit.ciudad || ''}
                    onChange={(e) => setBulkEdit((prev) => ({ ...prev, ciudad: e.target.value }))}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: spacing[1],
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.light,
                    }}
                  >
                    Zona (aplicar a todas)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      style={{
                        width: '100%',
                        background: '#2b2b2b',
                        borderRadius: borderRadius.lg,
                        padding: `${spacing[2]} ${spacing[3]}`,
                        paddingRight: '40px',
                        border: '1px solid rgba(255,255,255,0.25)',
                        color: '#FFFFFF',
                        fontSize: typography.fontSize.sm,
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                      }}
                      value={bulkEdit.zona_id || ''}
                      onChange={(e) =>
                        setBulkEdit((prev) => ({
                          ...prev,
                          zona_id: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                    >
                      <option value="" style={{ background: '#2b2b2b', color: '#FFFFFF' }}>
                        No cambiar zona
                      </option>
                      {uniqueZones.map((z: any) => (
                        <option key={z.id} value={z.id} style={{ background: '#2b2b2b', color: '#FFFFFF' }}>
                          {z.nombre}
                        </option>
                      ))}
                    </select>
                    <span
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: spacing[3] }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: spacing[1],
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.light,
                  }}
                >
                  Referencias (aplicar a todas)
                </label>
                <textarea
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: borderRadius.lg,
                    padding: `${spacing[2]} ${spacing[3]}`,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: colors.light,
                    fontSize: typography.fontSize.sm,
                    resize: 'vertical',
                    minHeight: 60,
                    fontFamily: 'inherit',
                  }}
                  placeholder="Ej. Entrada lateral, 2do piso"
                  value={bulkEdit.referencias || ''}
                  onChange={(e) => setBulkEdit((prev) => ({ ...prev, referencias: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: spacing[2], justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={applyBulkEdit}
                  disabled={bulkSaving || selectedCount === 0}
                  style={{
                    padding: `${spacing[2]} ${spacing[3]}`,
                    borderRadius: borderRadius.lg,
                    background: bulkSaving
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(39, 195, 255, 0.2)',
                    border: '1px solid rgba(39, 195, 255, 0.4)',
                    color: colors.light,
                    cursor: bulkSaving || selectedCount === 0 ? 'not-allowed' : 'pointer',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    opacity: bulkSaving || selectedCount === 0 ? 0.6 : 1,
                  }}
                >
                  {bulkSaving ? '⏳ Aplicando...' : '✅ Aplicar cambios'}
                </button>
                <button
                  type="button"
                  onClick={deleteSelected}
                  disabled={selectedCount === 0}
                  style={{
                    padding: `${spacing[2]} ${spacing[3]}`,
                    borderRadius: borderRadius.lg,
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: colors.light,
                    cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    opacity: selectedCount === 0 ? 0.6 : 1,
                  }}
                >
                  🗑️ Eliminar seleccionadas
                </button>
              </div>
            </>
          )}

          {selectedCount === 0 && (
            <div
              style={{
                fontSize: typography.fontSize.sm,
                opacity: 0.7,
                color: colors.light,
                textAlign: 'center',
                padding: spacing[3],
              }}
            >
              Selecciona ubicaciones usando los checkboxes para aplicar cambios masivos
            </div>
          )}
        </div>
      )}

      {(items || []).map((item, index) => {
        const key = ensureRowKey(index);
        const isExpanded = !!expanded[key];
        const zonaNombre = item.zona_id
          ? uniqueZones.find((z: any) => z.id === item.zona_id)?.nombre
          : undefined;
        const accent = accentPalette[index % accentPalette.length];

        if (!isExpanded) {
          return (
            <div
              key={key}
              style={{
                ...summaryBoxStyle,
                flexWrap: 'nowrap',
                cursor: bulkMode ? 'default' : 'pointer',
                borderLeft: `4px solid ${accent}`,
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.60) 100%)',
              }}
              onClick={() => {
                if (bulkMode) return;
                setExpanded((exp) => ({ ...exp, [key]: true }));
              }}
              role={bulkMode ? undefined : 'button'}
              aria-expanded={bulkMode ? undefined : false}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], flex: 1, minWidth: 0 }}>
                {bulkMode && (
                  <input
                    type="checkbox"
                    checked={selectedIndices.has(index)}
                    onChange={() => toggleSelection(index)}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: accent,
                      boxShadow: `0 0 0 3px rgba(255,255,255,0.08)`,
                      flexShrink: 0,
                    }}
                  />
                  <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.sede || 'Ubicación sin nombre'}
                  </strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={bulkMode}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (bulkMode) return;
                    setExpanded((exp) => ({ ...exp, [key]: true }));
                  }}
                  title={bulkMode ? 'Salir de “Modo masivo” para editar' : 'Editar ubicación'}
                  style={{
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: borderRadius.lg,
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.08)',
                    color: colors.light,
                    cursor: bulkMode ? 'not-allowed' : 'pointer',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    opacity: bulkMode ? 0.55 : 1,
                  }}
                  aria-label="Editar ubicación"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  disabled={bulkMode}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (bulkMode) return;
                    remove(index);
                  }}
                  title={bulkMode ? 'Usa “Eliminar seleccionadas” en modo masivo' : 'Eliminar ubicación'}
                  style={{
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: borderRadius.lg,
                    border: '1px solid rgba(239,68,68,0.45)',
                    background: 'rgba(239,68,68,0.2)',
                    color: colors.light,
                    cursor: bulkMode ? 'not-allowed' : 'pointer',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    opacity: bulkMode ? 0.55 : 1,
                  }}
                  aria-label="Eliminar ubicación"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={key}
            style={{
              padding: spacing[4],
              borderRadius: borderRadius.xl,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderLeft: `4px solid ${accent}`,
              background: `linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 55%, rgba(0,0,0,0.15) 100%)`,
              marginBottom: spacing[3],
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing[2],
                marginBottom: spacing[3],
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span
                  aria-hidden
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: accent,
                    boxShadow: `0 0 0 3px rgba(255,255,255,0.08)`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: typography.fontWeight.semibold, color: colors.light, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.sede || 'Ubicación sin nombre'}
                  </div>
                  {/* Vista rápida de detalles (solo cuando está expandido) */}
                  <div style={{ fontSize: 12, opacity: 0.85, color: colors.light }}>
                    {[item.direccion, item.ciudad, zonaNombre].filter(Boolean).join(' · ') || 'Completa la dirección para mejores resultados'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setExpanded((exp) => ({ ...exp, [key]: false }))}
                  style={{
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: borderRadius.lg,
                    border: '1px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.06)',
                    color: colors.light,
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                  }}
                  aria-label="Colapsar ubicación"
                >
                  ▾ Colapsar
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  style={{
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: borderRadius.lg,
                    border: '1px solid rgba(239,68,68,0.45)',
                    background: 'rgba(239,68,68,0.18)',
                    color: colors.light,
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                  }}
                  aria-label="Eliminar ubicación"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: spacing[3],
                marginBottom: spacing[3],
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: spacing[1],
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.light,
                  }}
                >
                  Nombre de la sede
                </label>
                <input
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: borderRadius.lg,
                    padding: `${spacing[2]} ${spacing[3]}`,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: colors.light,
                    fontSize: typography.fontSize.sm,
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(240, 147, 251, 0.5)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  placeholder="Ej: Sede Central / Salón Principal"
                  value={item.sede || ''}
                  onChange={(e) => patch(index, { sede: e.target.value })}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: spacing[1],
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.light,
                  }}
                >
                  Dirección
                </label>
                <input
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: borderRadius.lg,
                    padding: `${spacing[2]} ${spacing[3]}`,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: colors.light,
                    fontSize: typography.fontSize.sm,
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(240, 147, 251, 0.5)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  placeholder="Calle, número, colonia"
                  value={item.direccion || ''}
                  onChange={(e) => patch(index, { direccion: e.target.value })}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: spacing[1],
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.light,
                  }}
                >
                  Ciudad
                </label>
                <input
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: borderRadius.lg,
                    padding: `${spacing[2]} ${spacing[3]}`,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: colors.light,
                    fontSize: typography.fontSize.sm,
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(240, 147, 251, 0.5)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  placeholder="Ciudad"
                  value={item.ciudad || ''}
                  onChange={(e) => patch(index, { ciudad: e.target.value })}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: spacing[1],
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.light,
                  }}
                >
                  Seleccionar zona
                </label>

                <div style={{ position: 'relative' }}>
                  <select
                    style={{
                      width: '100%',
                      background: '#2b2b2b',
                      borderRadius: borderRadius.lg,
                      padding: `${spacing[2]} ${spacing[3]}`,
                      paddingRight: '40px',
                      border: '1px solid rgba(255,255,255,0.25)',
                      color: '#FFFFFF',
                      fontSize: typography.fontSize.sm,
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(240, 147, 251, 0.5)';
                      e.currentTarget.style.background = 'rgba(43, 43, 43, 0.95)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      e.currentTarget.style.background = '#2b2b2b';
                    }}
                    value={item.zona_id || ''}
                    onChange={(e) => patch(index, { zona_id: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="" style={{ background: '#2b2b2b', color: '#FFFFFF' }}>
                      Seleccionar zona
                    </option>
                    {uniqueZones.map((z: any) => (
                      <option key={z.id} value={z.id} style={{ background: '#2b2b2b', color: '#FFFFFF' }}>
                        {z.nombre}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.75rem',
                    }}
                  >
                    ▼
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: spacing[3] }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: spacing[1],
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.light,
                }}
              >
                Notas / referencias
              </label>
              <textarea
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: borderRadius.lg,
                  padding: `${spacing[2]} ${spacing[3]}`,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: colors.light,
                  fontSize: typography.fontSize.sm,
                  transition: 'all 0.2s ease',
                  resize: 'vertical',
                  minHeight: 80,
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(240, 147, 251, 0.5)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                placeholder="Ej. Entrada lateral, 2do piso"
                value={item.referencias || ''}
                onChange={(e) => patch(index, { referencias: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing[2], alignItems: 'center', paddingTop: spacing[2], borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
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
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: colors.light,
                  cursor: 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Cancelar
              </button>
              <div style={{ flex: 1 }} />
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


