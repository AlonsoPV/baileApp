import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useCreateDate, useUpdateDate } from "../../hooks/useEvents";
import { useEventDate } from "../../hooks/useEventDate";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { useToast } from "../../components/Toast";
import AddToCalendarButton from "../../components/AddToCalendarButton";
import DateFlyerUploader from "../../components/events/DateFlyerUploader";
import ScheduleEditor from "../../components/events/ScheduleEditor";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useOrganizerLocations } from "../../hooks/useOrganizerLocations";
import { supabase } from "../../lib/supabase";
import { useTags } from "../../hooks/useTags";
import RitmosChips from "../../components/RitmosChips";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";
import { useQueryClient } from "@tanstack/react-query";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
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

export function EventDateEditScreen() {
  const params = useParams<{ id?: string; dateId?: string; parentId?: string }>();
  const id = params.id ?? params.dateId;
  const parentId = params.parentId;
  const isNew = !!parentId;
  const navigate = useNavigate();
  const create = useCreateDate();
  const update = useUpdateDate();
  const dateIdNum = id ? parseInt(id) : undefined;
  const { data: currentDate } = useEventDate(!isNew ? dateIdNum : undefined);
  const { showToast } = useToast();
  const { data: org } = useMyOrganizer();
  const { data: orgLocations = [] } = useOrganizerLocations((org as any)?.id);
  const { data: allTags } = useTags();
  const ritmoTags = allTags?.filter((t: any) => t.tipo === 'ritmo') || [];
  const zonaTags = allTags?.filter((t: any) => t.tipo === 'zona') || [];
  const allowedCatalogIds = (((org as any)?.ritmos_seleccionados || []) as string[]) || [];
  const queryClient = useQueryClient();

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    } catch {
      return false;
    }
  });

  // For new date, currentDate stays null; for edit, we fetch by dateId

  const [form, setForm] = useState({
    nombre: "",
    biografia: "",
    djs: "",
    telefono_contacto: "",
    mensaje_contacto: "",
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    lugar: "",
    direccion: "",
    ciudad: "",
    referencias: "",
    requisitos: "",
    zona: null as number | null,
    estilos: [] as number[],
    ritmos_seleccionados: [] as string[],
    zonas: [] as number[],
    cronograma: [] as any[],
    costos: [] as any[],
    flyer_url: "",
    estado_publicacion: "borrador" as 'borrador' | 'publicado'
  });
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [didImportLegacy, setDidImportLegacy] = useState(false);

  // Modo: Único vs Frecuentes (bulk planner)
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkErrors, setBulkErrors] = useState<Record<string, Record<string, string>>>({});
  const [createdDateIdByRow, setCreatedDateIdByRow] = useState<Record<string, number>>({});
  const [showPendingFlyers, setShowPendingFlyers] = useState(false);
  const [bulkGeneralFlyerUrl, setBulkGeneralFlyerUrl] = useState<string | null>(null);
  const [bulkShowAllFlyers, setBulkShowAllFlyers] = useState(false);
  const [semanasRepetir, setSemanasRepetir] = useState<number>(4);

  useEffect(() => {
    const onResize = () => {
      try {
        setIsMobile(window.innerWidth < 768);
      } catch { }
    };
    try {
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (currentDate) {
      setForm(prev => {
        // Solo actualizar si hay cambios reales para evitar loops
        const newFlyerUrl = currentDate.flyer_url || "";
        const newCronograma = Array.isArray((currentDate as any).cronograma) ? (currentDate as any).cronograma : [];
        const newCostos = Array.isArray((currentDate as any).costos) ? (currentDate as any).costos : [];
        const newRitmos = Array.isArray((currentDate as any).ritmos_seleccionados) ? (currentDate as any).ritmos_seleccionados : [];
        const newZonas = Array.isArray((currentDate as any).zonas) ? (currentDate as any).zonas : [];
        const newForm = {
          nombre: (currentDate as any).nombre || "",
          biografia: (currentDate as any).biografia || "",
          djs: (currentDate as any).djs || "",
          telefono_contacto: (currentDate as any).telefono_contacto || "",
          mensaje_contacto: (currentDate as any).mensaje_contacto || "",
          fecha: currentDate.fecha,
          hora_inicio: currentDate.hora_inicio || "",
          hora_fin: currentDate.hora_fin || "",
          lugar: currentDate.lugar || "",
          direccion: currentDate.direccion || "",
          ciudad: currentDate.ciudad || "",
          referencias: currentDate.referencias || "",
          requisitos: currentDate.requisitos || "",
          zona: typeof (currentDate as any).zona === 'number' ? (currentDate as any).zona : null,
          estilos: Array.isArray((currentDate as any).estilos) ? (currentDate as any).estilos : [],
          ritmos_seleccionados: newRitmos as string[],
          zonas: newZonas as number[],
          cronograma: newCronograma,
          costos: newCostos,
          flyer_url: newFlyerUrl,
          estado_publicacion: (currentDate.estado_publicacion as 'borrador' | 'publicado')
        };
        
        // Comparar campos clave para evitar loops
        const prevCrono = Array.isArray((prev as any).cronograma) ? (prev as any).cronograma : [];
        const prevCostos = Array.isArray((prev as any).costos) ? (prev as any).costos : [];
        const sameCrono = JSON.stringify(prevCrono) === JSON.stringify(newCronograma);
        const sameCostos = JSON.stringify(prevCostos) === JSON.stringify(newCostos);
        if (prev.flyer_url !== newFlyerUrl ||
            (prev as any).nombre !== (newForm as any).nombre ||
            (prev as any).biografia !== (newForm as any).biografia ||
            (prev as any).djs !== (newForm as any).djs ||
            (prev as any).telefono_contacto !== (newForm as any).telefono_contacto ||
            (prev as any).mensaje_contacto !== (newForm as any).mensaje_contacto ||
            prev.fecha !== newForm.fecha ||
            prev.referencias !== newForm.referencias ||
            prev.estado_publicacion !== newForm.estado_publicacion ||
            !sameCrono ||
            !sameCostos) {
          return newForm;
        }
        return prev;
      });
      
      // Preseleccionar ubicación si coincide con alguna guardada
      const match = orgLocations.find((loc) =>
        (loc.nombre || "") === (currentDate.lugar || "") &&
        (loc.direccion || "") === (currentDate.direccion || "") &&
        (loc.ciudad || "") === (currentDate.ciudad || "")
      );
      if (match?.id) {
        setSelectedLocationId(String(match.id));
      }
    }
  }, [currentDate, orgLocations]);

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
        flyer_status: 'PENDING',
        flyer_url: null,
      };
      return [...prevRows, row];
    });
  }, [form.fecha, form.hora_inicio, form.hora_fin, form.estado_publicacion]);

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
    setBulkRows((prev) => {
      // si ya hay filas, agregamos abajo; si no, reemplazamos
      return prev.length ? [...prev, ...newRows] : newRows;
    });
    showToast(`Generamos ${weeks} fila${weeks !== 1 ? 's' : ''} ✅`, 'success');
  }, [form.fecha, form.hora_inicio, form.hora_fin, form.estado_publicacion, semanasRepetir, bulkGeneralFlyerUrl, showToast]);

  const validateBulkRows = useCallback((rows: BulkRow[]) => {
    const errs: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      const e: Record<string, string> = {};
      if (!r.fecha) e.fecha = 'Fecha requerida';
      // permitir overnight: hora_fin < hora_inicio es válido.
      // solo validar formato básico si existe
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

  // Importar cronograma/costos antiguos (event_schedules / event_prices) si el JSON en events_date está vacío.
  useEffect(() => {
    const run = async () => {
      if (!currentDate) return;
      if (isNew) return;
      if (!dateIdNum) return;
      if (didImportLegacy) return;

      const currentCrono = Array.isArray((currentDate as any).cronograma) ? (currentDate as any).cronograma : [];
      const currentCostos = Array.isArray((currentDate as any).costos) ? (currentDate as any).costos : [];
      if (currentCrono.length > 0 || currentCostos.length > 0) {
        setDidImportLegacy(true);
        return;
      }

      try {
        const [{ data: legacySchedules, error: schErr }, { data: legacyPrices, error: prErr }] = await Promise.all([
          supabase
            .from("event_schedules")
            .select("id, tipo, titulo, descripcion, hora_inicio, hora_fin")
            .eq("event_date_id", dateIdNum)
            .order("hora_inicio", { ascending: true }),
          supabase
            .from("event_prices")
            .select("id, nombre, descripcion, precio, tipo")
            .eq("event_date_id", dateIdNum)
            .order("created_at", { ascending: false }),
        ]);
        if (schErr) throw schErr;
        if (prErr) throw prErr;

        const mappedCrono = (legacySchedules || []).map((s: any) => ({
          tipo: s.tipo === "show" ? "show" : (s.tipo === "clase" ? "clase" : "otro"),
          titulo: s.titulo || "",
          inicio: s.hora_inicio || "",
          fin: s.hora_fin || "",
          fecha: (currentDate as any)?.fecha ? String((currentDate as any).fecha).split("T")[0] : "",
          // campos opcionales soportados por ScheduleEditor (si existen en tu data model)
          referenciaCosto: "",
          realizadoPor: "",
        }));

        const mappedCostos = (legacyPrices || []).map((p: any) => {
          const t = String(p.tipo || "").toLowerCase();
          const tipo =
            t.includes("taquilla") ? "Taquilla" :
            t.includes("preventa") ? "Preventa" :
            (t.includes("promo") || t.includes("prom")) ? "Promoción" :
            "Otro";
          return {
            nombre: p.nombre || "",
            tipo,
            precio: typeof p.precio === "number" ? p.precio : (p.precio ? Number(p.precio) : null),
            regla: p.descripcion || "",
          };
        });

        if (mappedCrono.length === 0 && mappedCostos.length === 0) {
          setDidImportLegacy(true);
          return;
        }

        setForm((prev) => {
          const prevCrono = Array.isArray((prev as any).cronograma) ? (prev as any).cronograma : [];
          const prevCostos = Array.isArray((prev as any).costos) ? (prev as any).costos : [];
          // Solo llenar si el usuario todavía no ha capturado nada en el nuevo formato.
          return {
            ...prev,
            cronograma: prevCrono.length ? prevCrono : mappedCrono,
            costos: prevCostos.length ? prevCostos : mappedCostos,
          };
        });

        setDidImportLegacy(true);
        showToast("Importamos tu cronograma/costos anteriores. Presiona Guardar para conservarlos ✅", "success");
      } catch (e: any) {
        console.error("[EventDateEditScreen] Legacy import failed:", e);
        setDidImportLegacy(true);
        // No bloquear al usuario si falla import
      }
    };
    run();
  }, [currentDate, dateIdNum, didImportLegacy, isNew, showToast]);

  const applyOrganizerLocationToForm = (loc?: any | null) => {
    if (!loc) return;
    setSelectedLocationId(loc.id ? String(loc.id) : "");
    setForm(prev => ({
      ...prev,
      lugar: loc.nombre || prev.lugar,
      direccion: loc.direccion || prev.direccion,
      ciudad: loc.ciudad || prev.ciudad,
    }));
  };

  const clearLocationSelection = () => {
    setSelectedLocationId("");
    setForm(prev => ({
      ...prev,
      lugar: "",
      direccion: "",
      ciudad: "",
    }));
  };

  const updateManualLocationField = (
    key: 'lugar' | 'direccion' | 'ciudad',
    value: string
  ) => {
    setSelectedLocationId("");
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  async function save() {
    console.log('[EventDateEditScreen] Save called:', { isNew, parentId, id, form });

    if (!form.fecha) {
      showToast('La fecha es obligatoria', 'error');
      return;
    }

    if (!isNew && !id) {
      showToast('ID requerido para actualizar', 'error');
      return;
    }

    try {
      if (isNew) {
        if (!(org as any)?.id) {
          showToast('No se encontró tu perfil de organizador', 'error');
          return;
        }

        console.log('[EventDateEditScreen] Creating new date with organizerId:', (org as any)?.id);
        const result = await create.mutateAsync({
          organizer_id: (org as any)?.id ?? null,
          parent_id: parentId ? Number(parentId) : null,
          nombre: form.nombre?.trim() || null,
          biografia: form.biografia?.trim() || null,
          djs: form.djs?.trim() || null,
          telefono_contacto: form.telefono_contacto?.trim() || null,
          mensaje_contacto: form.mensaje_contacto?.trim() || null,
          fecha: form.fecha,
          hora_inicio: form.hora_inicio || null,
          hora_fin: form.hora_fin || null,
          lugar: form.lugar.trim() || null,
          direccion: form.direccion.trim() || null,
          ciudad: form.ciudad.trim() || null,
          zona: typeof form.zona === 'number' ? form.zona : null,
          referencias: form.referencias.trim() || null,
          requisitos: form.requisitos.trim() || null,
          estilos: Array.isArray(form.estilos) ? form.estilos : [],
          ritmos_seleccionados: Array.isArray(form.ritmos_seleccionados) ? form.ritmos_seleccionados : [],
          zonas: Array.isArray(form.zonas) ? form.zonas : [],
          cronograma: Array.isArray(form.cronograma) ? form.cronograma : [],
          costos: Array.isArray(form.costos) ? form.costos : [],
          flyer_url: form.flyer_url?.trim() || null,
          estado_publicacion: form.estado_publicacion
        } as any);
        console.log('[EventDateEditScreen] Date created successfully:', result);
        showToast('Fecha creada ✅', 'success');
      } else {
        console.log('[EventDateEditScreen] Updating date with id:', id);
        const updatePayload = {
          id: Number(id),
          nombre: form.nombre?.trim() || null,
          biografia: form.biografia?.trim() || null,
          djs: form.djs?.trim() || null,
          telefono_contacto: form.telefono_contacto?.trim() || null,
          mensaje_contacto: form.mensaje_contacto?.trim() || null,
          fecha: form.fecha,
          hora_inicio: form.hora_inicio || null,
          hora_fin: form.hora_fin || null,
          lugar: form.lugar.trim() || null,
          direccion: form.direccion.trim() || null,
          ciudad: form.ciudad.trim() || null,
          zona: typeof form.zona === 'number' ? form.zona : null,
          referencias: form.referencias.trim() || null,
          requisitos: form.requisitos.trim() || null,
          estilos: Array.isArray(form.estilos) ? form.estilos : [],
          ritmos_seleccionados: Array.isArray(form.ritmos_seleccionados) ? form.ritmos_seleccionados : [],
          zonas: Array.isArray(form.zonas) ? form.zonas : [],
          cronograma: Array.isArray(form.cronograma) ? form.cronograma : [],
          costos: Array.isArray(form.costos) ? form.costos : [],
          flyer_url: form.flyer_url?.trim() || null,
          estado_publicacion: form.estado_publicacion
        } as any;
        console.log('[EventDateEditScreen] Update payload:', updatePayload);
        const updatedData = await update.mutateAsync(updatePayload);
        console.log('[EventDateEditScreen] Date updated successfully:', updatedData);
        
        // Actualizar el estado local con los datos actualizados de la BD
        if (updatedData) {
          setForm({
            nombre: (updatedData as any).nombre || "",
            biografia: (updatedData as any).biografia || "",
            djs: (updatedData as any).djs || "",
            telefono_contacto: (updatedData as any).telefono_contacto || "",
            mensaje_contacto: (updatedData as any).mensaje_contacto || "",
            fecha: updatedData.fecha,
            hora_inicio: updatedData.hora_inicio || "",
            hora_fin: updatedData.hora_fin || "",
            lugar: updatedData.lugar || "",
            direccion: updatedData.direccion || "",
            ciudad: updatedData.ciudad || "",
            referencias: updatedData.referencias || "",
            requisitos: updatedData.requisitos || "",
            zona: typeof (updatedData as any).zona === 'number' ? (updatedData as any).zona : null,
            estilos: Array.isArray((updatedData as any).estilos) ? (updatedData as any).estilos : [],
            ritmos_seleccionados: Array.isArray((updatedData as any).ritmos_seleccionados) ? (updatedData as any).ritmos_seleccionados : [],
            zonas: Array.isArray((updatedData as any).zonas) ? (updatedData as any).zonas : [],
            cronograma: Array.isArray((updatedData as any).cronograma) ? (updatedData as any).cronograma : [],
            costos: Array.isArray((updatedData as any).costos) ? (updatedData as any).costos : [],
            flyer_url: updatedData.flyer_url || "",
            estado_publicacion: (updatedData.estado_publicacion as 'borrador' | 'publicado')
          });
        }
        
        showToast('Fecha actualizada ✅', 'success');
      }
      navigate('/profile/organizer/edit');
    } catch (err: any) {
      console.error('[EventDateEditScreen] Error saving date:', err);
      showToast(`Error: ${err.message || 'Error al guardar fecha'}`, 'error');
    }
  }

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
      const parentIdToUse: number | null =
        (parentId ? Number(parentId) : (currentDate as any)?.parent_id ? Number((currentDate as any).parent_id) : null);
      if (!parentIdToUse) {
        showToast('No se encontró el parent_id para crear fechas frecuentes', 'error');
        return;
      }

      const selectedOrganizerLocation = selectedLocationId
        ? orgLocations.find((loc) => String(loc.id ?? '') === selectedLocationId)
        : undefined;

      const resolvedLugar = form.lugar.trim() || selectedOrganizerLocation?.nombre || null;
      const resolvedDireccion = form.direccion.trim() || selectedOrganizerLocation?.direccion || null;
      const resolvedCiudad = form.ciudad.trim() || selectedOrganizerLocation?.ciudad || null;
      const resolvedReferencias = form.referencias.trim() || selectedOrganizerLocation?.referencias || null;

      const basePayload: any = {
        parent_id: parentIdToUse,
        organizer_id: (org as any)?.id ?? null,
        nombre: form.nombre?.trim() || null,
        biografia: form.biografia?.trim() || null,
        djs: form.djs?.trim() || null,
        telefono_contacto: form.telefono_contacto?.trim() || null,
        mensaje_contacto: form.mensaje_contacto?.trim() || null,
        lugar: resolvedLugar,
        direccion: resolvedDireccion,
        ciudad: resolvedCiudad,
        zona: typeof form.zona === 'number' ? form.zona : null,
        referencias: resolvedReferencias,
        requisitos: form.requisitos?.trim() || null,
        estilos: Array.isArray(form.estilos) ? form.estilos : [],
        ritmos_seleccionados: Array.isArray(form.ritmos_seleccionados) ? form.ritmos_seleccionados : [],
        zonas: Array.isArray(form.zonas) ? form.zonas : [],
        cronograma: Array.isArray(form.cronograma) ? form.cronograma : [],
        costos: Array.isArray(form.costos) ? form.costos : [],
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

      // Map rowId -> dateId robusto
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

      // invalidate caches
      queryClient.invalidateQueries({ queryKey: ["dates", parentIdToUse] });
      queryClient.invalidateQueries({ queryKey: ["event", "dates", parentIdToUse] });
      queryClient.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      queryClient.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });

      showToast(`${created.length} fechas creadas ✅ (en borrador)`, 'success');
    } catch (e: any) {
      console.error('[EventDateEditScreen] bulk create error:', e);
      showToast(e?.message || 'Error al crear fechas en batch', 'error');
    }
  }, [
    bulkRows,
    validateBulkRows,
    parentId,
    currentDate,
    selectedLocationId,
    orgLocations,
    form,
    org,
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
      console.error('[EventDateEditScreen] apply bulk general flyer error:', e);
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
      console.error('[EventDateEditScreen] bulk publish error:', e);
      showToast(e?.message || 'Error al publicar', 'error');
    }
  }, [bulkRows, createdDateIdByRow, queryClient, showToast]);

  return (
    <div
      className="event-date-editor"
      style={{
        padding: 'clamp(16px, 3vw, 28px)',
        maxWidth: '900px',
        margin: '0 auto',
        color: colors.light,
      }}
    >
      <style>{`
        .event-date-editor .org-editor-card {
          margin-bottom: 24px;
          padding: 1.2rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255,255,255,0.04) inset;
        }

        .event-date-editor .org-date-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        .event-date-editor .org-date-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .event-date-editor .org-date-form-select {
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

        .event-date-editor .org-date-form-select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: rgba(255,255,255,0.6);
        }

        .event-date-editor .event-date-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .event-date-editor .event-date-actions > button {
          flex: 1 1 220px;
          min-width: 220px;
        }

        .event-date-editor .bulk-sheet-inner {
          display: block;
        }

        @media (max-width: 768px) {
          .event-date-editor {
            padding: 16px !important;
          }
          .event-date-editor h1 {
            font-size: 1.6rem !important;
            margin-bottom: 20px !important;
          }
          .event-date-editor .org-editor-card {
            padding: 1rem !important;
            border-radius: 12px !important;
            margin-bottom: 18px !important;
          }
          .event-date-editor .org-date-form-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .event-date-editor .org-date-form-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .event-date-editor .event-date-actions {
            flex-direction: column !important;
          }
          .event-date-editor .event-date-actions > button {
            width: 100% !important;
            min-width: 100% !important;
          }
        }
      `}</style>
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/app/profile', icon: '🏠' },
          { label: 'Organizador', href: '/profile/organizer/edit', icon: '🎤' },
          { label: isNew ? 'Nueva Fecha' : 'Editar Fecha', icon: '📅' },
        ]}
      />

      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '32px' }}>
        {isNew ? "📅 Crear" : "📅 Editar"} Fecha
      </h1>

      {/* Información Básica */}
      <div className="org-editor-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
          📝 Información Básica
        </h3>
        <div className="org-date-form-grid-2">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Nombre del Evento *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre del evento"
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Biografía
            </label>
            <textarea
              value={form.biografia}
              onChange={(e) => setForm({ ...form, biografia: e.target.value })}
              rows={2}
              placeholder="Describe el evento, su propósito, qué esperar..."
              className="org-editor-textarea"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              DJs presentes
            </label>
            <textarea
              value={form.djs}
              onChange={(e) => setForm({ ...form, djs: e.target.value })}
              rows={2}
              placeholder="Ejemplo: DJ Juan | DJ María | DJ Invitado"
              className="org-editor-textarea"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
                resize: 'vertical',
              }}
            />
          </div>
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              value={form.telefono_contacto}
              onChange={(e) => setForm({ ...form, telefono_contacto: e.target.value })}
              placeholder="Ej: 55 1234 5678"
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Mensaje de saludo para WhatsApp
            </label>
            <textarea
              value={form.mensaje_contacto}
              onChange={(e) => setForm({ ...form, mensaje_contacto: e.target.value })}
              onFocus={() => {
                if (!form.mensaje_contacto) {
                  const nombre = form.nombre || 'este evento';
                  const template = `Hola! Vengo de Donde Bailar MX, me interesa el evento "${nombre}".`;
                  setForm((prev) => ({ ...prev, mensaje_contacto: template }));
                }
              }}
              rows={2}
              placeholder='Ejemplo: "Hola! Vengo de Donde Bailar MX..."'
              className="org-editor-textarea"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: colors.light,
                fontSize: '1rem',
                resize: 'vertical',
              }}
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
              // mapear estilos por nombre de tag si se puede
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
                setForm((prev) => ({ ...prev, estilos: mappedTagIds }));
              } catch { }
            }}
          />
        </div>
      </div>

      {/* Ubicación del Evento */}
      <div className="org-editor-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
          📍 Ubicación del Evento
        </h3>
        {orgLocations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Elegir ubicación existente o ingresa una nueva
            </label>
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
                  const found = orgLocations.find((loc) => String(loc.id ?? "") === nextId);
                  applyOrganizerLocationToForm(found);
                  // si hay zona(s) en la ubicación, reflejar en form.zonas
                  try {
                    const zonasFromLoc: number[] = [];
                    if (typeof (found as any)?.zona_id === 'number') zonasFromLoc.push((found as any).zona_id);
                    if (Array.isArray((found as any)?.zona_ids)) {
                      (found as any).zona_ids.forEach((z: any) => {
                        if (typeof z === 'number' && !zonasFromLoc.includes(z)) zonasFromLoc.push(z);
                      });
                    }
                    setForm((prev) => ({
                      ...prev,
                      zona: typeof (found as any)?.zona_id === 'number' ? (found as any).zona_id : prev.zona,
                      zonas: zonasFromLoc.length ? zonasFromLoc : prev.zonas,
                    }));
                  } catch { }
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
        )}

        <div className="org-date-form-grid-2">
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Nombre de la ubicación
            </label>
            <input
              type="text"
              value={form.lugar}
              onChange={(e) => updateManualLocationField('lugar', e.target.value)}
              placeholder="Ej: Sede Central / Salón Principal"
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Dirección
            </label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => updateManualLocationField('direccion', e.target.value)}
              placeholder="Calle, número, colonia"
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>
        <div className="org-date-form-grid-2" style={{ marginTop: '16px' }}>
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Ciudad
            </label>
            <input
              type="text"
              value={form.ciudad}
              onChange={(e) => updateManualLocationField('ciudad', e.target.value)}
              placeholder="Ciudad"
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Notas o referencias
            </label>
            <input
              type="text"
              value={form.referencias}
              onChange={(e) => setForm({ ...form, referencias: e.target.value })}
              placeholder="Ej. Entrada lateral, 2do piso"
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>

        {/* Zonas */}
        {selectedLocationId && Array.isArray(form.zonas) && form.zonas.length > 0 && (
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
              onToggle={(zonaId: number) => {
                setForm((prev) => {
                  const current = Array.isArray(prev.zonas) ? prev.zonas : [];
                  const next = current.includes(zonaId)
                    ? current.filter((id) => id !== zonaId)
                    : [...current, zonaId];
                  return { ...prev, zonas: next };
                });
              }}
              size="compact"
              style={{ gap: '4px', fontSize: 12 }}
            />
          </div>
        )}
      </div>

      {/* Requisitos / Dresscode */}
      <div className="org-editor-card">
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
          ✅ Requisitos / Dresscode
        </h3>
        <textarea
          value={form.requisitos}
          onChange={e => setForm({ ...form, requisitos: e.target.value })}
          rows={3}
          placeholder="Requisitos para participar..."
          className="org-editor-textarea"
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            background: `${colors.dark}cc`,
            border: `1px solid ${colors.light}33`,
            color: colors.light,
            fontSize: '1rem',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Cronograma + Costos */}
      <div className="org-editor-card">
        <ScheduleEditor
          schedule={form.cronograma || []}
          onChangeSchedule={(cronograma) => setForm({ ...form, cronograma })}
          costos={form.costos || []}
          onChangeCostos={(costos) => setForm({ ...form, costos })}
          eventFecha={form.fecha}
          ritmos={ritmoTags}
          zonas={zonaTags}
          onSaveCosto={() => {
            showToast('💰 Costo guardado en el formulario. Recuerda presionar Guardar al final.', 'info');
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
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              {bulkMode ? 'Fecha base (para generar)' : 'Fecha *'}
            </label>
            <input
              type="date"
              value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })}
              required
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Hora Inicio
            </label>
            <input
              type="time"
              value={form.hora_inicio}
              onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
          <div>
            <label className="org-editor-field" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Hora Fin
            </label>
            <input
              type="time"
              value={form.hora_fin}
              onChange={e => setForm({ ...form, hora_fin: e.target.value })}
              className="org-editor-input"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                background: `${colors.dark}cc`,
                border: `1px solid ${colors.light}33`,
                color: '#FFFFFF',
                fontSize: '1rem',
              }}
            />
          </div>
        </div>

        {!bulkMode && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', fontSize: 13, opacity: 0.92 }}>
            <b>Modo Único</b>: se crea <b>una sola fecha</b>. Si necesitas varias fechas, usa <b>Frecuentes</b>.
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

                  {/* Planificador bulk (sheet) */}
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
                        disabled={create.isPending || bulkSelectedCount === 0}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 14,
                          border: '1px solid rgba(39,195,255,0.55)',
                          background: 'linear-gradient(135deg, rgba(39,195,255,0.22), rgba(30,136,229,0.22))',
                          color: '#fff',
                          cursor: create.isPending || bulkSelectedCount === 0 ? 'not-allowed' : 'pointer',
                          fontWeight: 900,
                          fontSize: 14,
                          letterSpacing: 0.2,
                          opacity: create.isPending || bulkSelectedCount === 0 ? 0.55 : 1,
                          boxShadow: '0 12px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset',
                        }}
                      >
                        {create.isPending ? '⏳ Guardando batch...' : '✅ Guardar fechas'}
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
                      onChange={(url) => {
                        setBulkGeneralFlyerUrl(url || null);
                      }}
                      dateId={null}
                      parentId={parentId ? Number(parentId) : (currentDate as any)?.parent_id ? Number((currentDate as any).parent_id) : undefined}
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
            onChange={(url) => setForm({ ...form, flyer_url: url || "" })}
            dateId={!isNew ? Number(id) : undefined}
            parentId={parentId ? Number(parentId) : undefined}
          />
        </div>
      )}

      {/* Estado de Publicación (solo Único; después del flyer) */}
      {!bulkMode && (
        <div className="org-editor-card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: '#FFFFFF' }}>
            🌐 Estado de Publicación
          </h3>
          <div className="org-date-form-radio-group" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label className="org-date-form-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="radio"
                name="estado_publicacion"
                value="borrador"
                checked={form.estado_publicacion === 'borrador'}
                onChange={(e) => setForm({ ...form, estado_publicacion: e.target.value as any })}
                style={{ transform: 'scale(1.2)' }}
              />
              <span style={{ color: '#FFFFFF', fontSize: '1rem' }}>
                📝 Borrador (solo tú puedes verlo)
              </span>
            </label>
            <label className="org-date-form-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="radio"
                name="estado_publicacion"
                value="publicado"
                checked={form.estado_publicacion === 'publicado'}
                onChange={(e) => setForm({ ...form, estado_publicacion: e.target.value as any })}
                style={{ transform: 'scale(1.2)' }}
              />
              <span style={{ color: '#FFFFFF', fontSize: '1rem' }}>
                🌐 Público (visible para todos)
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Botón Agregar a Calendario - Solo para eventos existentes */}
      {!isNew && id && currentDate && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <AddToCalendarButton event={{
            titulo: `Evento ${currentDate.id}`,
            descripcion: `Evento del ${currentDate.fecha}`,
            fecha: currentDate.fecha,
            hora_inicio: currentDate.hora_inicio,
            hora_fin: currentDate.hora_fin,
            lugar: currentDate.lugar
          }} />
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
                        parentId={parentId ? Number(parentId) : (currentDate as any)?.parent_id ? Number((currentDate as any).parent_id) : undefined}
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
                            console.error('[EventDateEditScreen] error updating flyer_url:', e);
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

      <div className="event-date-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {!isNew && id && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/profile/organizer/edit?mode=frecuentes&fromDateId=${encodeURIComponent(String(id))}`)}
            style={{
              padding: '16px 24px',
              borderRadius: '50px',
              border: `1px solid rgba(39,195,255,0.40)`,
              background: 'linear-gradient(135deg, rgba(39,195,255,0.14), rgba(30,136,229,0.14))',
              color: colors.light,
              fontSize: '1rem',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: `0 10px 22px rgba(0,0,0,0.28), 0 0 0 1px rgba(39,195,255,0.06) inset`,
            }}
            title="Abrir Frecuentes con esta fecha como plantilla"
          >
            📋 Convertir a Frecuentes
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={save}
          disabled={bulkMode || create.isPending || update.isPending}
          style={{
            padding: '16px',
            borderRadius: '50px',
            border: 'none',
            background: (bulkMode || create.isPending || update.isPending)
              ? `${colors.light}33`
              : `linear-gradient(135deg, rgba(39,195,255,0.26), rgba(30,136,229,0.34), rgba(255,61,87,0.20))`,
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '900',
            cursor: (bulkMode || create.isPending || update.isPending) ? 'not-allowed' : 'pointer',
            boxShadow: `0 12px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset`,
            letterSpacing: 0.2,
          }}
          title={bulkMode ? 'En Frecuentes se guarda desde "Guardar fechas"' : undefined}
        >
          {(create.isPending || update.isPending) ? 'Guardando...' : '💾 Guardar'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/profile/organizer/edit')}
          style={{
            padding: '16px 24px',
            borderRadius: '50px',
            border: `1px solid rgba(255,255,255,0.28)`,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))',
            color: colors.light,
            fontSize: '1rem',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: `0 10px 22px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.04) inset`,
          }}
        >
          ← Volver
        </motion.button>
      </div>
    </div>
  );
}