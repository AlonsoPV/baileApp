import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEventDate, useUpdateEventDate } from "../../hooks/useEventDate";
import { useTags } from "../../hooks/useTags";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import RitmosChips from "../../components/RitmosChips";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import ScheduleEditor from "../../components/events/ScheduleEditor";
import DateFlyerUploader from "../../components/events/DateFlyerUploader";
import { useOrganizerLocations, type OrganizerLocation } from "../../hooks/useOrganizerLocations";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";
import { useToast } from "../../components/Toast";
import { supabase } from "../../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

const toFormLocation = (loc?: OrganizerLocation | null) => {
  if (!loc) return null;
  return {
    id: loc.id ?? null,
    sede: loc.nombre || '',
    direccion: loc.direccion || '',
    ciudad: loc.ciudad || '',
    referencias: loc.referencias || '',
    zona_id: typeof loc.zona_id === 'number'
      ? loc.zona_id
      : Array.isArray(loc.zona_ids) && loc.zona_ids.length
        ? loc.zona_ids[0] ?? null
        : null,
    zona_ids: Array.isArray(loc.zona_ids) ? loc.zona_ids : [],
  };
};

type BulkPubEstado = 'borrador' | 'publicado';
type BulkFlyerStatus = 'PENDING' | 'UPLOADING' | 'DONE' | 'ERROR';

type BulkRow = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado_publicacion: BulkPubEstado;
  notas: string;
  selected: boolean;
  flyer_status: BulkFlyerStatus;
  flyer_url?: string | null;
};

const makeRowId = () => {
  try {
    // @ts-ignore - crypto puede no existir en algunos entornos antiguos
    return typeof crypto !== 'undefined' && crypto?.randomUUID
      ? crypto.randomUUID()
      : `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  } catch {
    return `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
};

const BulkRowItem = React.memo(function BulkRowItem({
  row,
  errors,
  onChange,
  onRemove,
  dense,
}: {
  row: BulkRow;
  errors?: Record<string, string>;
  onChange: (rowId: string, patch: Partial<BulkRow>) => void;
  onRemove: (rowId: string) => void;
  dense?: boolean;
}) {
  const rowErr = errors || {};
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'var(--bulk-cols, 44px 140px 120px 120px 140px 1fr 44px)',
        gap: dense ? 8 : 10,
        alignItems: 'center',
        padding: dense ? '8px 8px' : '10px 10px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.04)',
      }}
      className="bulk-row"
    >
      <input
        type="checkbox"
        checked={row.selected}
        onChange={(e) => onChange(row.id, { selected: e.target.checked })}
        style={{ width: dense ? 16 : 18, height: dense ? 16 : 18 }}
      />

      <div>
        <input
          type="date"
          value={row.fecha}
          onChange={(e) => onChange(row.id, { fecha: e.target.value })}
          style={{
            width: '100%',
            padding: dense ? '7px 8px' : '8px 10px',
            borderRadius: 10,
            border: rowErr.fecha ? '1px solid rgba(255,61,87,0.9)' : '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(0,0,0,0.25)',
            color: '#fff',
            fontSize: dense ? 12 : 13,
          }}
        />
        {rowErr.fecha && (
          <div style={{ color: '#ff3d57', fontSize: 11, marginTop: 4 }}>{rowErr.fecha}</div>
        )}
      </div>

      <input
        type="time"
        value={row.hora_inicio}
        onChange={(e) => onChange(row.id, { hora_inicio: e.target.value })}
        style={{
          width: '100%',
          padding: dense ? '7px 8px' : '8px 10px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(0,0,0,0.25)',
          color: '#fff',
          fontSize: dense ? 12 : 13,
        }}
      />

      <div>
        <input
          type="time"
          value={row.hora_fin}
          onChange={(e) => onChange(row.id, { hora_fin: e.target.value })}
          style={{
            width: '100%',
            padding: dense ? '7px 8px' : '8px 10px',
            borderRadius: 10,
            border: rowErr.hora_fin ? '1px solid rgba(255,61,87,0.9)' : '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(0,0,0,0.25)',
            color: '#fff',
            fontSize: dense ? 12 : 13,
          }}
        />
        {rowErr.hora_fin && (
          <div style={{ color: '#ff3d57', fontSize: 11, marginTop: 4 }}>{rowErr.hora_fin}</div>
        )}
      </div>

      <select
        value={row.estado_publicacion}
        onChange={(e) => onChange(row.id, { estado_publicacion: e.target.value as BulkPubEstado })}
        style={{
          width: '100%',
          padding: dense ? '7px 8px' : '8px 10px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          background: '#2b2b2b',
          color: '#fff',
          fontSize: dense ? 12 : 13,
        }}
      >
        <option value="borrador">📝 borrador</option>
        <option value="publicado">🌐 publicado</option>
      </select>

      <input
        type="text"
        value={row.notas}
        onChange={(e) => onChange(row.id, { notas: e.target.value })}
        placeholder="Notas (opcional)"
        style={{
          width: '100%',
          padding: dense ? '7px 8px' : '8px 10px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(0,0,0,0.25)',
          color: '#fff',
          fontSize: dense ? 12 : 13,
        }}
      />

      <button
        type="button"
        onClick={() => onRemove(row.id)}
        style={{
          width: dense ? 34 : 36,
          height: dense ? 34 : 36,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(255,255,255,0.05)',
          color: '#fff',
          cursor: 'pointer',
        }}
        title="Eliminar fila"
      >
        🗑️
      </button>
    </div>
  );
});

export default function OrganizerEventDateEditScreen() {
  const navigate = useNavigate();
  const { dateId } = useParams<{ dateId: string }>();
  const dateIdNum = dateId ? parseInt(dateId) : undefined;

  const { data: date, isLoading } = useEventDate(dateIdNum);
  const updateDate = useUpdateEventDate();
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter((t: any) => t.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter((t: any) => t.tipo === 'zona') || [];

  const { data: myOrg } = useMyOrganizer();
  const allowedCatalogIds = ((myOrg as any)?.ritmos_seleccionados || []) as string[];
  const { data: orgLocations = [] } = useOrganizerLocations((myOrg as any)?.id);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  
  const [form, setForm] = useState({
    nombre: '',
    biografia: '',
    djs: '',
    telefono_contacto: '',
    mensaje_contacto: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    lugar: '',
    ciudad: '',
    direccion: '',
    referencias: '',
    requisitos: '',
    zona: null as number | null,
    estilos: [] as number[],
    ritmos_seleccionados: [] as string[],
    zonas: [] as number[],
    cronograma: [] as any[],
    costos: [] as any[],
    flyer_url: null as string | null,
    estado_publicacion: 'borrador' as 'borrador' | 'publicado',
    ubicaciones: [] as any[],
  });
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onResize = () => {
      try { setIsMobile(window.innerWidth < 768); } catch { }
    };
    try {
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    } catch {
      return;
    }
  }, []);

  // Modo: Único vs Frecuentes (bulk planner)
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkErrors, setBulkErrors] = useState<Record<string, Record<string, string>>>({});
  const [createdDateIdByRow, setCreatedDateIdByRow] = useState<Record<string, number>>({});
  const [showPendingFlyers, setShowPendingFlyers] = useState(false);
  const [bulkGeneralFlyerUrl, setBulkGeneralFlyerUrl] = useState<string | null>(null);
  const [bulkShowAllFlyers, setBulkShowAllFlyers] = useState(false);
  const [semanasRepetir, setSemanasRepetir] = useState<number>(4);

  const toggleZona = (zonaId: number) => {
    const currentZonas = form.zonas || [];
    const newZonas = currentZonas.includes(zonaId)
      ? currentZonas.filter((id: number) => id !== zonaId)
      : [...currentZonas, zonaId];
    setForm({ ...form, zonas: newZonas });
  };

  const applyOrganizerLocation = (loc?: OrganizerLocation | null) => {
    if (!loc) {
      setSelectedLocationId('');
      setForm((prev) => ({
        ...prev,
        ubicaciones: [],
        zonas: [], // Limpiar zonas cuando se limpia la ubicación
        zona: null,
      }));
      return;
    }
    setSelectedLocationId(loc.id ? String(loc.id) : '');
    const mapped = toFormLocation(loc);
    
    // Extraer zonas de la ubicación del organizador
    const zonasFromOrgLoc: number[] = [];
    if (typeof loc.zona_id === 'number') {
      zonasFromOrgLoc.push(loc.zona_id);
    }
    if (Array.isArray(loc.zona_ids)) {
      loc.zona_ids.forEach((z) => {
        if (typeof z === 'number' && !zonasFromOrgLoc.includes(z)) {
          zonasFromOrgLoc.push(z);
        }
      });
    }
    
    setForm((prev) => ({
      ...prev,
      lugar: loc.nombre || '',
      direccion: loc.direccion || '',
      ciudad: loc.ciudad || '',
      referencias: loc.referencias || '',
      zona: typeof loc.zona_id === 'number' ? loc.zona_id : (Array.isArray(loc.zona_ids) && loc.zona_ids.length ? loc.zona_ids[0] ?? null : null),
      zonas: zonasFromOrgLoc, // Siempre usar las zonas de la ubicación seleccionada
      ubicaciones: mapped ? [mapped] : prev.ubicaciones,
    }));
  };

  const clearLocationSelection = () => {
    setSelectedLocationId('');
    setForm((prev) => ({
      ...prev,
      ubicaciones: [],
      lugar: '',
      direccion: '',
      ciudad: '',
      referencias: '',
      zonas: [], // Limpiar zonas cuando se limpia la ubicación
      zona: null,
    }));
  };

  const updateManualLocationField = (field: 'lugar' | 'direccion' | 'ciudad' | 'referencias', value: string) => {
    setSelectedLocationId('');
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      const base = {
        sede: field === 'lugar' ? value : updated.lugar || '',
        direccion: field === 'direccion' ? value : updated.direccion || '',
        ciudad: field === 'ciudad' ? value : updated.ciudad || '',
        referencias: field === 'referencias' ? value : updated.referencias || '',
        zona_id: updated.zona ?? null,
      };
      return {
        ...updated,
        ubicaciones: updated.ubicaciones && updated.ubicaciones.length
          ? [{ ...updated.ubicaciones[0], ...base }]
          : [base],
      };
    });
  };

  useEffect(() => {
    if (!orgLocations.length) {
      if (selectedLocationId) setSelectedLocationId('');
      return;
    }
    const match = orgLocations.find(
      (loc) =>
        (loc.nombre || '') === (form.lugar || '') &&
        (loc.direccion || '') === (form.direccion || '') &&
        (loc.ciudad || '') === (form.ciudad || '') &&
        (loc.referencias || '') === (form.referencias || '')
    );
    if (match) {
      if (selectedLocationId !== String(match.id)) {
        setSelectedLocationId(String(match.id));
      }
    } else if (selectedLocationId) {
      setSelectedLocationId('');
    }
  }, [orgLocations, form.lugar, form.direccion, form.ciudad, form.referencias, selectedLocationId]);

  useEffect(() => {
    if (date) {
      console.log('📥 [OrganizerEventDateEditScreen] Cargando fecha:', date);
      const fechaStr = date.fecha || '';
      
      setForm({
        nombre: date.nombre || '',
        biografia: (date as any).biografia || '',
        djs: (date as any).djs || '',
        telefono_contacto: (date as any).telefono_contacto || '',
        mensaje_contacto: (date as any).mensaje_contacto || '',
        fecha: fechaStr,
        hora_inicio: date.hora_inicio || '',
        hora_fin: date.hora_fin || '',
        lugar: (date as any).lugar || '',
        ciudad: (date as any).ciudad || '',
        direccion: (date as any).direccion || '',
        referencias: (date as any).referencias || '',
        requisitos: (date as any).requisitos || '',
        zona: (date as any).zona || null,
        estilos: (date as any).estilos || [],
        ritmos_seleccionados: ((date as any).ritmos_seleccionados || []) as string[],
        zonas: (date as any).zonas || [],
        cronograma: (date as any).cronograma || [],
        costos: (date as any).costos || [],
        flyer_url: (date as any).flyer_url || null,
        estado_publicacion: (date as any).estado_publicacion || 'borrador',
        ubicaciones: (date as any).ubicaciones || [],
      });
    }
  }, [date]);

  const addBulkRow = useCallback(() => {
    setBulkRows((prevRows) => {
      const row: BulkRow = {
        id: makeRowId(),
        fecha: form.fecha || '',
        hora_inicio: form.hora_inicio || '',
        hora_fin: form.hora_fin || '',
        estado_publicacion: (form.estado_publicacion || 'borrador') as BulkPubEstado,
        notas: '',
        selected: true,
        flyer_status: bulkGeneralFlyerUrl ? 'DONE' : 'PENDING',
        flyer_url: bulkGeneralFlyerUrl || null,
      };
      return [...prevRows, row];
    });
  }, [form.fecha, form.hora_inicio, form.hora_fin, form.estado_publicacion, bulkGeneralFlyerUrl]);

  const updateBulkRow = useCallback((rowId: string, patch: Partial<BulkRow>) => {
    setBulkRows((prevRows) => prevRows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  }, []);

  const removeBulkRow = useCallback((rowId: string) => {
    setBulkRows((prevRows) => prevRows.filter((r) => r.id !== rowId));
    setBulkErrors((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    setCreatedDateIdByRow((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  }, []);

  const setAllBulkSelected = useCallback((selected: boolean) => {
    setBulkRows((prev) => prev.map((r) => ({ ...r, selected })));
  }, []);

  const clearBulk = useCallback(() => {
    setBulkRows([]);
    setBulkErrors({});
    setCreatedDateIdByRow({});
    setShowPendingFlyers(false);
    setBulkGeneralFlyerUrl(null);
    setBulkShowAllFlyers(false);
  }, []);

  const bulkSelectedCount = useMemo(() => bulkRows.filter((r) => r.selected).length, [bulkRows]);

  const validateBulkRows = useCallback((rows: BulkRow[]) => {
    const errs: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      const e: Record<string, string> = {};
      if (!r.fecha) e.fecha = 'Fecha requerida';
      // permitir overnight: hora_fin < hora_inicio es válido
      if (r.hora_fin && r.hora_fin.length < 4) e.hora_fin = 'Hora inválida';
      if (Object.keys(e).length) errs[r.id] = e;
    }
    setBulkErrors(errs);
    return errs;
  }, []);

  const bulkPreview = useMemo(() => {
    const selected = bulkRows.filter((r) => r.selected).map((r) => r.fecha).filter(Boolean);
    const sorted = [...selected].sort();
    return {
      count: sorted.length,
      first: sorted[0] || '',
      last: sorted[sorted.length - 1] || '',
    };
  }, [bulkRows]);

  const generateWeeklyRowsFromTemplate = useCallback(() => {
    if (!form.fecha) {
      showToast('Configura la fecha base primero', 'info');
      return;
    }
    const weeks = Math.max(1, Math.min(52, semanasRepetir || 1));
    const parseYmd = (ymd: string) => {
      const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
      return new Date(y, (m || 1) - 1, d || 1);
    };
    const fmtYmd = (dt: Date) => {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    const base = parseYmd(form.fecha);
    const newRows: BulkRow[] = [];
    for (let i = 0; i < weeks; i++) {
      const dt = new Date(base);
      dt.setDate(base.getDate() + i * 7);
      newRows.push({
        id: makeRowId(),
        fecha: fmtYmd(dt),
        hora_inicio: form.hora_inicio || '',
        hora_fin: form.hora_fin || '',
        estado_publicacion: (form.estado_publicacion || 'borrador') as BulkPubEstado,
        notas: '',
        selected: true,
        flyer_status: bulkGeneralFlyerUrl ? 'DONE' : 'PENDING',
        flyer_url: bulkGeneralFlyerUrl || null,
      });
    }
    setBulkRows((prev) => (prev.length ? [...prev, ...newRows] : newRows));
    showToast(`Generamos ${weeks} fila${weeks !== 1 ? 's' : ''} ✅`, 'success');
  }, [form.fecha, form.hora_inicio, form.hora_fin, form.estado_publicacion, semanasRepetir, bulkGeneralFlyerUrl, showToast]);

  const handleBulkCreateDates = useCallback(async () => {
    const selectedRows = bulkRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      showToast('Selecciona al menos una fila', 'info');
      return;
    }
    const errs = validateBulkRows(selectedRows);
    if (Object.keys(errs).length > 0) {
      showToast('Revisa los errores en la tabla antes de guardar', 'error');
      return;
    }
    try {
      const parentIdToUse: number | null = (date as any)?.parent_id ? Number((date as any).parent_id) : null;
      if (!parentIdToUse) {
        showToast('No se encontró el parent_id para crear fechas frecuentes', 'error');
        return;
      }

      const selectedOrganizerLocation = selectedLocationId
        ? orgLocations.find((loc) => String(loc.id ?? '') === selectedLocationId)
        : undefined;

      const resolvedLugar = (form.lugar || '').trim() || selectedOrganizerLocation?.nombre || null;
      const resolvedDireccion = (form.direccion || '').trim() || selectedOrganizerLocation?.direccion || null;
      const resolvedCiudad = (form.ciudad || '').trim() || selectedOrganizerLocation?.ciudad || null;
      const resolvedReferencias = (form.referencias || '').trim() || selectedOrganizerLocation?.referencias || null;

      const basePayload: any = {
        parent_id: parentIdToUse,
        organizer_id: (myOrg as any)?.id ?? null,
        nombre: form.nombre || null,
        biografia: form.biografia || null,
        djs: form.djs || null,
        telefono_contacto: form.telefono_contacto || null,
        mensaje_contacto: form.mensaje_contacto || null,
        lugar: resolvedLugar,
        direccion: resolvedDireccion,
        ciudad: resolvedCiudad,
        zona: typeof form.zona === 'number' ? form.zona : null,
        referencias: resolvedReferencias,
        requisitos: form.requisitos || null,
        estilos: form.estilos || [],
        ritmos_seleccionados: form.ritmos_seleccionados || [],
        zonas: form.zonas || [],
        cronograma: form.cronograma || [],
        costos: form.costos || [],
      };

      const payloads = selectedRows.map((r) => ({
        ...basePayload,
        fecha: r.fecha,
        hora_inicio: r.hora_inicio || null,
        hora_fin: r.hora_fin || null,
        flyer_url: bulkGeneralFlyerUrl || null,
        estado_publicacion: 'borrador' as const,
        dia_semana: null,
      }));

      const { data: createdDates, error } = await supabase
        .from('events_date')
        .insert(payloads as any)
        .select('id, fecha, hora_inicio, hora_fin, lugar, ciudad, parent_id, flyer_url');
      if (error) throw error;
      const created = Array.isArray(createdDates) ? createdDates : [];

      const makeKey = (o: {
        fecha?: string | null;
        hora_inicio?: string | null;
        hora_fin?: string | null;
        lugar?: string | null;
        ciudad?: string | null;
        parent_id?: number | null;
      }) => `${o.fecha || ''}|${o.hora_inicio || ''}|${o.hora_fin || ''}|${o.lugar || ''}|${o.ciudad || ''}|${o.parent_id ?? ''}`;

      const buckets = new Map<string, number[]>();
      for (const d of (created as any[])) {
        const key = makeKey({
          fecha: d?.fecha ? String(d.fecha).split('T')[0] : null,
          hora_inicio: d?.hora_inicio ?? null,
          hora_fin: d?.hora_fin ?? null,
          lugar: d?.lugar ?? null,
          ciudad: d?.ciudad ?? null,
          parent_id: d?.parent_id ?? null,
        });
        const arr = buckets.get(key) || [];
        if (d?.id) arr.push(Number(d.id));
        buckets.set(key, arr);
      }

      const mapping: Record<string, number> = {};
      for (const row of selectedRows) {
        const key = makeKey({
          fecha: row.fecha,
          hora_inicio: row.hora_inicio || null,
          hora_fin: row.hora_fin || null,
          lugar: resolvedLugar,
          ciudad: resolvedCiudad,
          parent_id: parentIdToUse,
        });
        const arr = buckets.get(key) || [];
        const picked = arr.shift();
        if (picked) mapping[row.id] = picked;
        buckets.set(key, arr);
      }

      setCreatedDateIdByRow((prev) => ({ ...prev, ...mapping }));
      setShowPendingFlyers(!bulkGeneralFlyerUrl);

      if (bulkGeneralFlyerUrl) {
        selectedRows.forEach((row) => {
          updateBulkRow(row.id, { flyer_url: bulkGeneralFlyerUrl, flyer_status: 'DONE' });
        });
      }

      queryClient.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      queryClient.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      queryClient.invalidateQueries({ queryKey: ["event", "dates", parentIdToUse] });
      queryClient.invalidateQueries({ queryKey: ["dates", parentIdToUse] });

      showToast(`${created.length} fechas creadas ✅ (en borrador)`, 'success');
    } catch (e: any) {
      console.error('[OrganizerEventDateEditScreen] bulk create error:', e);
      showToast(e?.message || 'Error al crear fechas en batch', 'error');
    }
  }, [
    bulkRows,
    validateBulkRows,
    date,
    selectedLocationId,
    orgLocations,
    form,
    myOrg,
    bulkGeneralFlyerUrl,
    queryClient,
    showToast,
    updateBulkRow,
  ]);

  const applyBulkGeneralFlyerToCreated = useCallback(async (onlySelected: boolean) => {
    if (!bulkGeneralFlyerUrl) {
      showToast('Primero sube/selecciona un flyer general', 'info');
      return;
    }
    const rows = onlySelected ? bulkRows.filter((r) => r.selected) : bulkRows;
    const withIds = rows.map((r) => ({ row: r, id: createdDateIdByRow[r.id] })).filter((x) => !!x.id);
    if (withIds.length === 0) {
      showToast('No hay fechas creadas a las que aplicar el flyer (guarda el batch primero)', 'info');
      return;
    }
    try {
      const ids = withIds.map((x) => Number(x.id));
      const { error } = await supabase
        .from('events_date')
        .update({ flyer_url: bulkGeneralFlyerUrl as any })
        .in('id', ids);
      if (error) throw error;
      withIds.forEach(({ row }) => {
        updateBulkRow(row.id, { flyer_url: bulkGeneralFlyerUrl, flyer_status: 'DONE' });
      });
      queryClient.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      showToast(`Flyer aplicado a ${ids.length} fecha${ids.length !== 1 ? 's' : ''} ✅`, 'success');
    } catch (e: any) {
      console.error('[OrganizerEventDateEditScreen] apply bulk general flyer error:', e);
      showToast(e?.message || 'Error aplicando flyer general', 'error');
    }
  }, [bulkGeneralFlyerUrl, bulkRows, createdDateIdByRow, queryClient, showToast, updateBulkRow]);

  const handleBulkPublish = useCallback(async (onlySelected: boolean) => {
    const rows = onlySelected ? bulkRows.filter((r) => r.selected) : bulkRows;
    const withIds = rows.map((r) => ({ row: r, id: createdDateIdByRow[r.id] })).filter((x) => !!x.id);
    if (withIds.length === 0) {
      showToast('No hay fechas creadas para publicar (primero guarda el batch)', 'info');
      return;
    }
    try {
      const ids = withIds.map((x) => Number(x.id));
      const { error } = await supabase
        .from('events_date')
        .update({ estado_publicacion: 'publicado' as any })
        .in('id', ids);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      queryClient.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      showToast('Fechas publicadas ✅', 'success');
    } catch (e: any) {
      console.error('[OrganizerEventDateEditScreen] bulk publish error:', e);
      showToast(e?.message || 'Error al publicar', 'error');
    }
  }, [bulkRows, createdDateIdByRow, queryClient, showToast]);

  const handleSave = async () => {
    if (!dateIdNum) return;
    
    try {
      console.log('💾 [OrganizerEventDateEditScreen] Guardando fecha...');
      
      // Payload con TODAS las columnas que existen en events_date
      const patch = {
        nombre: form.nombre || null,
        biografia: form.biografia || null,
        djs: form.djs || null,
        telefono_contacto: form.telefono_contacto || null,
        mensaje_contacto: form.mensaje_contacto || null,
        fecha: form.fecha,
        hora_inicio: form.hora_inicio || null,
        hora_fin: form.hora_fin || null,
        lugar: form.lugar || null,
        direccion: form.direccion || null,
        ciudad: form.ciudad || null,
        zona: form.zona || null,
        referencias: form.referencias || null,
        requisitos: form.requisitos || null,
        ritmos_seleccionados: form.ritmos_seleccionados || [],
        estilos: form.estilos || [],
        zonas: form.zonas || [],
        cronograma: form.cronograma || [],
        costos: form.costos || [],
        flyer_url: form.flyer_url || null,
        estado_publicacion: form.estado_publicacion || 'borrador',
        dia_semana: null
      } as any;

      console.log('📦 [OrganizerEventDateEditScreen] Patch:', patch);
      
      const updated = await updateDate.mutateAsync({ id: dateIdNum, patch });
      
      console.log('✅ [OrganizerEventDateEditScreen] Fecha actualizada:', updated);
      setStatusMsg({ type: 'ok', text: '✅ Fecha actualizada exitosamente' });
      
      // Navegar después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        navigate(`/social/fecha/${updated.id}`);
      }, 1500);
    } catch (error: any) {
      console.error('❌ [OrganizerEventDateEditScreen] Error guardando:', error);
      setStatusMsg({ 
        type: 'err', 
        text: `❌ Error al guardar: ${error.message || 'Intenta nuevamente'}` 
      });
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Cargando fecha...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!date) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.light,
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Fecha no encontrada</h2>
          <button
            onClick={() => navigate('/profile/organizer/edit')}
            style={{
              padding: '14px 28px',
              borderRadius: '50px',
              border: 'none',
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(30,136,229,0.5)',
            }}
          >
            ← Volver al Organizador
          </button>
        </div>
      </div>
    );
  }

  // ====== UI con la estructura/diseño solicitados ======
  return (
    <>
      <style>{`
        .org-editor-card {
          margin-bottom: 2rem;
          padding: 1.2rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }
        
        .org-editor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        
        .org-editor-field {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #FFFFFF;
          font-size: 0.95rem;
        }
        
        .org-editor-input {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 1rem;
        }
        
        .org-editor-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
          opacity: 1;
        }
        
        .org-editor-input:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          outline: none;
          color: #FFFFFF;
        }
        
        .org-editor-textarea {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: #FFFFFF;
          font-size: 1rem;
          resize: vertical;
        }
        
        .org-editor-textarea::placeholder {
          color: rgba(255, 255, 255, 0.5);
          opacity: 1;
        }
        
        .org-editor-textarea:focus {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          outline: none;
          color: #FFFFFF;
        }
        
        .org-date-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        
        .org-date-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .org-date-form-buttons {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .org-date-form-buttons button {
          flex: 1 1 auto;
          min-width: 120px;
        }
        
        .org-date-form-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          margin-bottom: 16px;
        }
        
        .org-date-form-radio-group {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        
        .org-date-form-radio-group .org-date-form-checkbox {
          margin-bottom: 0;
        }
        
        .org-date-form-select-wrapper {
          position: relative;
        }
        
        .org-date-form-select {
          width: 100%;
          padding: 12px 14px;
          padding-right: 40px;
          background: #2b2b2b;
          border: 1px solid rgba(255,255,255,0.25);
          color: #FFFFFF;
          outline: none;
          font-size: 14px;
          border-radius: 12px;
          appearance: none;
          -webkit-appearance: none;
        }
        
        .org-date-form-select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: rgba(255,255,255,0.6);
        }
        
        input[type="date"].org-editor-input,
        input[type="time"].org-editor-input {
          cursor: pointer;
        }
        
        input[type="date"].org-editor-input::-webkit-calendar-picker-indicator,
        input[type="time"].org-editor-input::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.7;
          cursor: pointer;
        }
        
        input[type="date"].org-editor-input::-webkit-calendar-picker-indicator:hover,
        input[type="time"].org-editor-input::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
        
        @media (max-width: 768px) {
          .org-editor-card {
            padding: 1rem !important;
            margin-bottom: 1.5rem !important;
            border-radius: 12px !important;
          }
          
          .org-editor-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .org-date-form-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .org-date-form-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          
          .org-date-form-buttons {
            flex-direction: column !important;
          }
          
          .org-date-form-buttons button {
            width: 100% !important;
          }
          
          .org-date-form-select {
            padding: 10px 12px !important;
            padding-right: 36px !important;
            font-size: 13px !important;
          }
          
          .org-date-form-select-arrow {
            right: 12px !important;
            font-size: 0.8rem !important;
          }
          
          .org-editor-field {
            font-size: 0.9rem !important;
            margin-bottom: 0.5rem !important;
          }
          
          .org-editor-input {
            padding: 0.6rem !important;
            font-size: 0.9rem !important;
          }
          
          .org-editor-textarea {
            padding: 0.6rem !important;
            font-size: 0.9rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .org-editor-card {
            padding: 0.75rem !important;
            margin-bottom: 1rem !important;
            border-radius: 10px !important;
          }
          
          .org-date-form-grid {
            gap: 0.75rem !important;
          }
          
          .org-date-form-grid-2 {
            gap: 0.75rem !important;
          }
          
          .org-date-form-buttons {
            gap: 0.75rem !important;
          }
          
          .org-date-form-select {
            padding: 8px 10px !important;
            padding-right: 32px !important;
            font-size: 12px !important;
          }
          
          .org-date-form-select-arrow {
            right: 10px !important;
            font-size: 0.75rem !important;
          }
          
          .org-editor-field {
            font-size: 0.8rem !important;
            margin-bottom: 0.4rem !important;
          }
          
          .org-editor-input {
            padding: 0.5rem !important;
            font-size: 0.85rem !important;
          }
          
          .org-editor-textarea {
            padding: 0.5rem !important;
            font-size: 0.85rem !important;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.dark} 0%, #1a1a1a 50%, ${colors.dark} 100%)`,
        padding: '24px 0',
        color: colors.light,
        position: 'relative',
      }}>
        {/* Efecto de fondo decorativo */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, rgba(30, 136, 229, 0.05) 0%, transparent 50%),
                       radial-gradient(circle at 80% 80%, rgba(255, 61, 87, 0.05) 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Header con título */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <motion.button
              whileHover={{ scale: 1.05, x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              ← Volver
            </motion.button>
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '800',
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}>
            📅 Editar Fecha de Evento
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
          }}>
            Modifica la información de esta fecha del evento
          </p>
        </motion.div>

        {/* Mensaje de estado */}
        {statusMsg && (
          <motion.div
          
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginBottom: '1.5rem',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              border: statusMsg.type === 'ok' 
                ? '2px solid rgba(16,185,129,0.4)' 
                : '2px solid rgba(239,68,68,0.4)',
              background: statusMsg.type === 'ok' 
                ? 'rgba(16,185,129,0.15)' 
                : 'rgba(239,68,68,0.15)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              textAlign: 'center',
              boxShadow: statusMsg.type === 'ok' 
                ? '0 4px 12px rgba(16,185,129,0.2)' 
                : '0 4px 12px rgba(239,68,68,0.2)'
            }}
          >
            {statusMsg.text}
          </motion.div>
        )}

        <div style={{
          marginBottom: '2rem',
          padding: 0,
          borderRadius: '16px',
          background: 'transparent',
          border: 'none',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>

                  {/* Información Básica */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      📝 Información Básica
                    </h3>
                    <div className="org-editor-grid">
                      <div>
                <label className="org-editor-field">Nombre del Evento *</label>
                        <input
                          type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                          placeholder="Nombre del evento"
                          className="org-editor-input"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                <label className="org-editor-field">Biografía</label>
                        <textarea
                  value={form.biografia || ''}
                  onChange={(e) => setForm({ ...form, biografia: e.target.value })}
                          placeholder="Describe el evento, su propósito, qué esperar..."
                          rows={2}
                          className="org-editor-textarea"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                <label className="org-editor-field">DJs presentes</label>
                        <textarea
                  value={form.djs || ''}
                  onChange={(e) => setForm({ ...form, djs: e.target.value })}
                          placeholder="Ejemplo: DJ Juan | DJ María | DJ Invitado Especial"
                          rows={2}
                          className="org-editor-textarea"
                        />
                      </div>
                      <div>
                <label className="org-editor-field">Teléfono / WhatsApp para más información</label>
                        <input
                          type="tel"
                  value={form.telefono_contacto || ''}
                  onChange={(e) => setForm({ ...form, telefono_contacto: e.target.value })}
                          placeholder="Ejemplo: 55 1234 5678"
                          className="org-editor-input"
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                <label className="org-editor-field">Mensaje de saludo para WhatsApp</label>
                        <textarea
                  value={form.mensaje_contacto || ''}
                  onChange={(e) => setForm({ ...form, mensaje_contacto: e.target.value })}
                          onFocus={() => {
                    if (!form.mensaje_contacto) {
                      const nombre = form.nombre || 'este evento';
                              const template = `Hola! Vengo de Donde Bailar MX, me interesa el evento "${nombre}".`;
                      setForm((prev) => ({ ...prev, mensaje_contacto: template }));
                            }
                          }}
                  placeholder='Ejemplo: "Hola! Vengo de Donde Bailar MX..."'
                          rows={2}
                          className="org-editor-textarea"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ritmos */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      🎵 Ritmos de Baile
                    </h3>
                    <div style={{ marginTop: 8 }}>
                      <RitmosChips
                selected={form.ritmos_seleccionados || []}
                allowedIds={allowedCatalogIds}
                        onChange={(ids) => {
                  const next = (allowedCatalogIds && allowedCatalogIds.length)
                    ? ids.filter((id) => allowedCatalogIds.includes(id))
                    : ids;
                  setForm({ ...form, ritmos_seleccionados: next });
                          try {
                            const labelByCatalogId = new Map<string, string>();
                            RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
                            const nameToTagId = new Map<string, number>(
                              ritmoTags.map((t: any) => [t.nombre, t.id])
                            );
                    const mappedTagIds = next
                              .map(cid => labelByCatalogId.get(cid))
                              .filter(Boolean)
                              .map((label: any) => nameToTagId.get(label as string))
                              .filter((n): n is number => typeof n === 'number');
                    setForm(prev => ({ ...prev, estilos: mappedTagIds }));
                          } catch { }
                        }}
                      />
                    </div>
                  </div>

          {/* Ubicación */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      📍 Ubicación del Evento
                    </h3>
                    {orgLocations.length > 0 && (
                      <>
                        <div style={{ marginBottom: 16 }}>
                          <label className="org-editor-field">Elegir ubicación existente o ingresa una nueva</label>
                          <div className="org-date-form-select-wrapper" style={{ position: 'relative' }}>
                            <select
                              className="org-date-form-select"
                      value={selectedLocationId}
                              onChange={(e) => {
                                const nextId = e.target.value;
                                if (!nextId) {
                          clearLocationSelection();
                                  return;
                                }
                                const found = orgLocations.find((loc) => String(loc.id ?? '') === nextId);
                        applyOrganizerLocation(found);
                              }}
                            >
                              <option value="" style={{ background: '#2b2b2b', color: '#FFFFFF' }}>
                                — Escribir manualmente —
                              </option>
                              {orgLocations.map((loc) => (
                                <option
                                  key={loc.id}
                                  value={String(loc.id)}
                                  style={{ color: '#FFFFFF', background: '#2b2b2b' }}
                                >
                                  {loc.nombre || loc.direccion || 'Ubicación'}
                                </option>
                              ))}
                            </select>
                    <span className="org-date-form-select-arrow">▼</span>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="org-date-form-grid-2">
                      <div>
                        <label className="org-editor-field">Nombre de la ubicación</label>
                        <input
                          type="text"
                  value={form.lugar || ''}
                  onChange={(e) => updateManualLocationField('lugar', e.target.value)}
                          placeholder="Ej: Sede Central / Salón Principal"
                          className="org-editor-input"
                        />
                      </div>
                      <div>
                        <label className="org-editor-field">Dirección</label>
                        <input
                          type="text"
                  value={form.direccion || ''}
                  onChange={(e) => updateManualLocationField('direccion', e.target.value)}
                          placeholder="Calle, número, colonia"
                          className="org-editor-input"
                        />
                      </div>
                    </div>
                    <div className="org-date-form-grid-2" style={{ marginTop: '16px' }}>
                      <div>
                        <label className="org-editor-field">Ciudad</label>
                        <input
                          type="text"
                  value={form.ciudad || ''}
                  onChange={(e) => updateManualLocationField('ciudad', e.target.value)}
                          placeholder="Ciudad"
                          className="org-editor-input"
                        />
                      </div>
                      <div>
                        <label className="org-editor-field">Notas o referencias</label>
                        <input
                          type="text"
                  value={form.referencias || ''}
                  onChange={(e) => updateManualLocationField('referencias', e.target.value)}
                          placeholder="Ej. Entrada lateral, 2do piso"
                          className="org-editor-input"
                        />
                      </div>
                    </div>

            {selectedLocationId && (form.zonas || []).length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <label className="org-editor-field" style={{ marginBottom: '8px', display: 'block' }}>
                          Zonas de la ubicación seleccionada
                        </label>
                        <ZonaGroupedChips
                  selectedIds={form.zonas || []}
                          allTags={zonaTags}
                          mode="display"
                          autoExpandSelectedParents={true}
                          size="compact"
                  style={{ gap: '4px', fontSize: 12 }}
                        />
                      </div>
                    )}

            {!selectedLocationId && (
                      <div style={{ marginTop: '16px' }}>
                        <label className="org-editor-field" style={{ marginBottom: '8px', display: 'block' }}>
                          Zonas de la Ciudad
                        </label>
                        <ZonaGroupedChips
                  selectedIds={form.zonas || []}
                          allTags={zonaTags}
                          mode="edit"
                  onToggle={toggleZona}
                          size="compact"
                  style={{ gap: '4px', fontSize: 12 }}
                        />
                      </div>
                    )}
                  </div>

          {/* Cronograma + Costos */}
          <div className="org-editor-card">
                    <ScheduleEditor
              schedule={form.cronograma || []}
              onChangeSchedule={(cronograma) => setForm({ ...form, cronograma })}
              costos={form.costos || []}
              onChangeCostos={(costos) => setForm({ ...form, costos })}
                      ritmos={ritmoTags}
                      zonas={zonaTags}
              eventFecha={form.fecha}
                      onSaveCosto={() => {
                showToast('💰 Costo guardado en el formulario. Recuerda hacer click en "💾 Guardar Cambios".', 'info');
                      }}
                    />
                  </div>

          {/* Fecha y Hora (último paso) + toggle Único/Frecuentes */}
                  <div className="org-editor-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                      📅 Fecha y Hora
                    </h3>

                    <div className="mode-toggle" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkMode(false);
                          setShowPendingFlyers(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 999,
                          border: !bulkMode ? '2px solid rgba(255,255,255,0.55)' : '1px solid rgba(255,255,255,0.22)',
                          background: !bulkMode
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.10))'
                            : 'rgba(255,255,255,0.06)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: 14,
                          boxShadow: !bulkMode ? '0 10px 26px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.08) inset' : 'none',
                        }}
                        aria-pressed={!bulkMode}
                      >
                        🧍 Único
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkMode(true);
                          if (bulkRows.length === 0) addBulkRow();
                        }}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 999,
                          border: bulkMode ? '2px solid rgba(39,195,255,0.70)' : '1px solid rgba(39,195,255,0.40)',
                          background: bulkMode
                            ? 'linear-gradient(135deg, rgba(39,195,255,0.28), rgba(30,136,229,0.22))'
                            : 'rgba(39,195,255,0.06)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: 14,
                          boxShadow: bulkMode ? '0 10px 26px rgba(0,0,0,0.35), 0 0 0 2px rgba(39,195,255,0.12) inset' : 'none',
                        }}
                        aria-pressed={bulkMode}
                      >
                        📋 Frecuentes
                      </button>
                    </div>

                    <div className="org-date-form-grid">
                      <div>
                <label className="org-editor-field">{bulkMode ? 'Fecha base (para generar)' : 'Fecha *'}</label>
                        <input
                          type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                          required
                          className="org-editor-input"
                          style={{ color: '#FFFFFF' }}
                        />
                      </div>
                      <div>
                <label className="org-editor-field">Hora Inicio</label>
                        <input
                          type="time"
                  value={form.hora_inicio}
                  onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                          className="org-editor-input"
                          style={{ color: '#FFFFFF' }}
                        />
                      </div>
                      <div>
                <label className="org-editor-field">Hora Fin</label>
                        <input
                          type="time"
                  value={form.hora_fin}
                  onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                          className="org-editor-input"
                          style={{ color: '#FFFFFF' }}
                        />
                      </div>
                    </div>

                    {!bulkMode && (
                      <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', fontSize: 13, opacity: 0.92 }}>
                <b>Modo Único</b>: estás editando <b>una sola fecha</b>. Si necesitas crear varias, usa <b>Frecuentes</b>.
                      </div>
                    )}

                    {bulkMode && (
                      <div style={{ marginTop: 14, padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}>
                        {(() => {
                  const baseReady = !!form.fecha;
                  const disabledStyle = { cursor: 'not-allowed', opacity: 0.55 } as const;
                  const enabledStyle = { cursor: 'pointer', opacity: 1 } as const;
                          const tip = baseReady ? undefined : 'Configura la fecha base para habilitar acciones rápidas';

                          return (
                            <>
                        <div style={{ fontWeight: 800, marginBottom: 8 }}>⚡ Acciones rápidas</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, opacity: 0.85 }}>Semanas:</span>
                            <input
                              type="number"
                              min="1"
                              max="52"
                            value={semanasRepetir || 4}
                            onChange={(e) => setSemanasRepetir(parseInt(e.target.value) || 4)}
                              className="org-editor-input"
                              style={{ width: 90, color: '#FFFFFF' }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => baseReady && addBulkRow()}
                            disabled={!baseReady}
                            title={tip}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: '1px solid rgba(255,255,255,0.18)',
                              background: 'rgba(255,255,255,0.06)',
                              color: '#fff',
                              fontWeight: 700,
                              ...(baseReady ? enabledStyle : disabledStyle),
                            }}
                          >
                            ➕ Agregar fila
                          </button>
                          <button
                            type="button"
                            onClick={() => baseReady && generateWeeklyRowsFromTemplate()}
                            disabled={!baseReady}
                            title={tip}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: '1px solid rgba(39,195,255,0.40)',
                              background: 'rgba(39,195,255,0.10)',
                              color: '#fff',
                              fontWeight: 700,
                              ...(baseReady ? enabledStyle : disabledStyle),
                            }}
                          >
                          🔁 Generar semanal ({Math.max(1, Math.min(52, semanasRepetir || 1))})
                          </button>
                          <button
                            type="button"
                            onClick={() => baseReady && setAllBulkSelected(true)}
                            disabled={!baseReady}
                            title={tip}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: '1px solid rgba(255,255,255,0.18)',
                              background: 'rgba(255,255,255,0.06)',
                              color: '#fff',
                              fontWeight: 700,
                              ...(baseReady ? enabledStyle : disabledStyle),
                            }}
                          >
                            ✅ Seleccionar todo
                          </button>
                          <button
                            type="button"
                            onClick={() => baseReady && setAllBulkSelected(false)}
                            disabled={!baseReady}
                            title={tip}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: '1px solid rgba(255,255,255,0.18)',
                              background: 'rgba(255,255,255,0.06)',
                              color: '#fff',
                              fontWeight: 700,
                              ...(baseReady ? enabledStyle : disabledStyle),
                            }}
                          >
                            ⛔ Deseleccionar
                          </button>
                          <button
                            type="button"
                            onClick={() => baseReady && clearBulk()}
                            disabled={!baseReady}
                            title={tip}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: '1px solid rgba(255,61,87,0.35)',
                              background: 'rgba(255,61,87,0.10)',
                              color: '#fff',
                              fontWeight: 700,
                              ...(baseReady ? enabledStyle : disabledStyle),
                            }}
                          >
                            🧹 Limpiar bulk
                          </button>
                        </div>
                        {!baseReady && (
                          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                            Configura la <b>Fecha base</b> para habilitar estas acciones.
                          </div>
                        )}
                        
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: 10, color: '#FFFFFF' }}>
                            📋 Planificador (frecuentes)
                          </h3>
                          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 10 }}>
                            Seleccionadas: <b>{bulkSelectedCount}</b>
                            {bulkPreview.count > 0 && (
                              <>
                                {' '}· Preview: <b>{bulkPreview.first}</b> → <b>{bulkPreview.last}</b>
                              </>
                            )}
                          </div>

                          <div className="bulk-sheet" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
                            <div
                              className="bulk-sheet-inner"
                              style={{
                                minWidth: isMobile ? 760 : 0,
                                ['--bulk-cols' as any]: isMobile
                                  ? '38px 140px 110px 110px 130px 220px 44px'
                                  : '44px 140px 120px 120px 140px 1fr 44px',
                              }}
                            >
                              <div className="bulk-header" style={{ display: 'grid', gridTemplateColumns: 'var(--bulk-cols, 44px 140px 120px 120px 140px 1fr 44px)', gap: 10, opacity: 0.85, fontSize: 12, marginBottom: 8 }}>
                                <div></div>
                                <div>Fecha</div>
                                <div>Hora inicio</div>
                                <div>Hora fin</div>
                                <div>Estado</div>
                                <div>Notas</div>
                                <div></div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {bulkRows.map((r) => (
                                  <BulkRowItem
                                    key={r.id}
                                    row={r}
                                    errors={bulkErrors[r.id]}
                                    onChange={updateBulkRow}
                                    onRemove={removeBulkRow}
                                    dense={isMobile}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={handleBulkCreateDates}
                            disabled={bulkSelectedCount === 0}
                              style={{
                                padding: '12px 16px',
                                borderRadius: 14,
                                border: '1px solid rgba(39,195,255,0.55)',
                                background: 'linear-gradient(135deg, rgba(39,195,255,0.22), rgba(30,136,229,0.22))',
                                color: '#fff',
                              cursor: bulkSelectedCount === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: 900,
                                fontSize: 14,
                                letterSpacing: 0.2,
                              opacity: bulkSelectedCount === 0 ? 0.55 : 1,
                                boxShadow: '0 12px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset',
                              }}
                            >
                            ✅ Guardar fechas
                            </button>

                            <button
                              type="button"
                              onClick={() => handleBulkPublish(true)}
                              disabled={Object.keys(createdDateIdByRow).length === 0}
                              style={{
                                padding: '12px 16px',
                                borderRadius: 14,
                                border: '1px solid rgba(255,255,255,0.28)',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
                                color: '#fff',
                                cursor: Object.keys(createdDateIdByRow).length === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: 900,
                                fontSize: 14,
                                opacity: Object.keys(createdDateIdByRow).length === 0 ? 0.55 : 1,
                                boxShadow: '0 10px 22px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.04) inset',
                              }}
                            >
                              🌐 Publicar seleccionadas
                            </button>

                            <button
                              type="button"
                              onClick={() => handleBulkPublish(false)}
                              disabled={Object.keys(createdDateIdByRow).length === 0}
                              style={{
                                padding: '12px 16px',
                                borderRadius: 14,
                                border: '1px solid rgba(255,61,87,0.55)',
                                background: 'linear-gradient(135deg, rgba(255,61,87,0.22), rgba(255,140,66,0.18))',
                                color: '#fff',
                                cursor: Object.keys(createdDateIdByRow).length === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: 900,
                                fontSize: 14,
                                opacity: Object.keys(createdDateIdByRow).length === 0 ? 0.55 : 1,
                                boxShadow: '0 12px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05) inset',
                              }}
                            >
                              🚀 Publicar todas
                            </button>
                          </div>
                        </div>

                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                          <div style={{ fontWeight: 800, marginBottom: 8 }}>🖼️ Flyer general (opcional)</div>
                          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
                            Si lo cargas aquí, se usará como flyer para <b>todas</b> las fechas del batch. Después puedes reemplazarlo por fecha en “Flyers pendientes”.
                          </div>
                          <DateFlyerUploader
                            value={bulkGeneralFlyerUrl || null}
                          onChange={(url) => setBulkGeneralFlyerUrl(url || null)}
                            dateId={null}
                          parentId={(date as any)?.parent_id ? Number((date as any).parent_id) : undefined}
                          />
                          <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => applyBulkGeneralFlyerToCreated(true)}
                              disabled={!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.18)',
                                background: 'rgba(255,255,255,0.06)',
                                color: '#fff',
                                cursor: (!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0) ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                opacity: (!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0) ? 0.55 : 1,
                              }}
                            >
                              🧩 Aplicar a seleccionadas (creadas)
                            </button>
                            <button
                              type="button"
                              onClick={() => applyBulkGeneralFlyerToCreated(false)}
                              disabled={!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.18)',
                                background: 'rgba(255,255,255,0.06)',
                                color: '#fff',
                                cursor: (!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0) ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                opacity: (!bulkGeneralFlyerUrl || Object.keys(createdDateIdByRow).length === 0) ? 0.55 : 1,
                              }}
                            >
                              🧩 Aplicar a todas (creadas)
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowPendingFlyers((v) => !v)}
                              disabled={Object.keys(createdDateIdByRow).length === 0}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                border: '1px solid rgba(39,195,255,0.40)',
                                background: 'rgba(39,195,255,0.10)',
                                color: '#fff',
                                cursor: Object.keys(createdDateIdByRow).length === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                opacity: Object.keys(createdDateIdByRow).length === 0 ? 0.55 : 1,
                              }}
                            >
                              🧾 {showPendingFlyers ? 'Ocultar flyers individuales' : 'Abrir flyers individuales'}
                            </button>
                          </div>
                        </div>
                    </>
                  );
                })()}
                      </div>
                    )}
                  </div>

          {/* Flyer (solo Único; después de Fecha y Hora) */}
                  {!bulkMode && (
                    <div className="org-editor-card">
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                        🖼️ Flyer del Evento
                      </h3>
                      <DateFlyerUploader
                value={form.flyer_url || null}
                onChange={(url) => setForm({ ...form, flyer_url: url })}
                dateId={dateIdNum}
                parentId={(date as any)?.parent_id}
                      />
                    </div>
                  )}

          {/* Estado de Publicación (solo Único; después del flyer) */}
                  {!bulkMode && (
                    <div className="org-editor-card">
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                        🌐 Estado de Publicación
                      </h3>
                      <div className="org-date-form-radio-group">
                        <label className="org-date-form-checkbox">
                          <input
                            type="radio"
                            name="estado_publicacion"
                            value="borrador"
                    checked={form.estado_publicacion === 'borrador'}
                    onChange={(e) => setForm({ ...form, estado_publicacion: e.target.value as 'borrador' | 'publicado' })}
                            style={{ transform: 'scale(1.2)' }}
                          />
                          <span style={{ color: '#FFFFFF', fontSize: '1rem' }}>
                            📝 Borrador (solo tú puedes verlo)
                          </span>
                        </label>
                        <label className="org-date-form-checkbox">
                          <input
                            type="radio"
                            name="estado_publicacion"
                            value="publicado"
                    checked={form.estado_publicacion === 'publicado'}
                    onChange={(e) => setForm({ ...form, estado_publicacion: e.target.value as 'borrador' | 'publicado' })}
                            style={{ transform: 'scale(1.2)' }}
                          />
                          <span style={{ color: '#FFFFFF', fontSize: '1rem' }}>
                            🌐 Público (visible para todos)
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Flyers pendientes (bulk) */}
                  {bulkMode && showPendingFlyers && (
                    <div className="org-editor-card">
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem', color: '#FFFFFF' }}>
                        🧾 Flyers pendientes
                      </h3>
                      <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>
                        Sube flyers después del batch. No bloquea la creación. Puedes usar flyer general o reemplazar individualmente.
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {(() => {
                          const all = bulkRows
                            .map((r) => ({ r, dateId: createdDateIdByRow[r.id] }))
                            .filter((x) => !!x.dateId);
                          const filtered = bulkShowAllFlyers
                            ? all
                            : all.filter(({ r }) => !r.flyer_url || r.flyer_status === 'ERROR' || r.flyer_status === 'PENDING');
                          const showing = filtered;

                          return (
                            <>
                              {all.length > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                                    Mostrando <b>{showing.length}</b> de <b>{all.length}</b>.
                                    {!bulkShowAllFlyers && all.length !== showing.length && (
                                      <> (las que ya tienen flyer no se muestran)</>
                                    )}
                                  </div>
                                  {all.length !== showing.length && (
                                    <button
                                      type="button"
                                      onClick={() => setBulkShowAllFlyers((v) => !v)}
                                      style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                      {bulkShowAllFlyers ? '🙈 Ocultar las que ya tienen flyer' : '👀 Mostrar todas (para reemplazar)'}
                                    </button>
                                  )}
                                </div>
                              )}

                              {showing.length === 0 && (
                                <div style={{ fontSize: 13, opacity: 0.9 }}>
                                  ✅ Todas las fechas ya tienen flyer. Si quieres reemplazar alguno, usa “Mostrar todas”.
                                </div>
                              )}

                              {showing.map(({ r, dateId }) => (
                                <div
                                  key={r.id}
                                  style={{
                                    border: '1px solid rgba(255,255,255,0.10)',
                                    borderRadius: 14,
                                    padding: 12,
                                    background: 'rgba(255,255,255,0.04)',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ fontWeight: 800 }}>
                                      📅 {r.fecha} {r.hora_inicio ? `· ${r.hora_inicio}` : ''}
                                    </div>
                                    <div style={{ fontSize: 12, opacity: 0.85 }}>
                                      {r.flyer_status === 'UPLOADING' ? '⏳ UPLOADING' : (r.flyer_url ? '✅ DONE' : (r.flyer_status === 'ERROR' ? '❌ ERROR' : '⏳ PENDING'))}
                                    </div>
                                  </div>

                                  <DateFlyerUploader
                                    value={r.flyer_url || null}
                                    dateId={Number(dateId)}
                            parentId={(date as any)?.parent_id ? Number((date as any).parent_id) : undefined}
                                    onStatusChange={(status) => {
                                      if (status === 'UPLOADING') updateBulkRow(r.id, { flyer_status: 'UPLOADING' });
                                      if (status === 'DONE') updateBulkRow(r.id, { flyer_status: 'DONE' });
                                      if (status === 'ERROR') updateBulkRow(r.id, { flyer_status: 'ERROR' });
                                      if (status === 'PENDING') updateBulkRow(r.id, { flyer_status: 'PENDING', flyer_url: null });
                                    }}
                                    onChange={async (url) => {
                                      try {
                                await supabase.from('events_date').update({ flyer_url: url || null }).eq('id', Number(dateId));
                                        updateBulkRow(r.id, { flyer_url: url || null, flyer_status: url ? 'DONE' : 'PENDING' });
                                        showToast('Flyer guardado ✅', 'success');
                                      } catch (e: any) {
                                console.error('[OrganizerEventDateEditScreen] error updating flyer_url:', e);
                                        updateBulkRow(r.id, { flyer_status: 'ERROR' });
                                        showToast(e?.message || 'Error guardando flyer', 'error');
                                      }
                                    }}
                                  />
                                </div>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    </div>
              )}

          {/* Botones */}
          <div className="org-editor-card org-date-form-buttons">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'transparent',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              ❌ Cancelar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={bulkMode}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: '700',
                cursor: bulkMode ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(30, 136, 229, 0.3)',
                opacity: bulkMode ? 0.6 : 1
              }}
            >
              💾 Guardar Cambios
            </motion.button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
