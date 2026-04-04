// ScheduleEditorPlus.tsx
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import RitmosChips from "../RitmosChips";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";
import CostsPhasesEditor from "./CostsPhasesEditor";

const colors = {
  coral: "#FF3D57",
  orange: "#FF8C42",
  yellow: "#FFD166",
  blue: "#1E88E5",
  dark: "#121212",
  light: "#F5F5F5",
};

// ------------------------
// Types
// ------------------------
type ScheduleItem = {
  /** UI-only stable id (NOT persisted) */
  __ui_id?: string;

  tipo: "clase" | "inicio" | "social" | "taller" | "paquete" | "coreografia" | "show" | "otro";
  titulo?: string;
  ritmoId?: number | null;
  zonaId?: number | null;
  inicio: string; // HH:MM
  fin: string; // HH:MM (opcional)
  fecha?: string; // YYYY-MM-DD
  ubicacion?: string; // texto libre
  nivel?: string;
  referenciaCosto?: string; // enlaza con costos.nombre (normalizado)
  realizadoPor?: string; // texto libre: "Se llevará a cabo por"
};

type RitmoTag = { id: number; nombre: string };
type ZonaTag = { id: number; nombre: string };

export type CostoTipo = "taquilla" | "preventa" | "promocion" | "gratis" | "otro";

type CostoItem = {
  /** UI-only stable id (NOT persisted) */
  __ui_id?: string;

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
  { id: "taquilla", label: "Taquilla" },
  { id: "preventa", label: "Preventa" },
  { id: "promocion", label: "Promoción" },
  { id: "gratis", label: "Gratis" },
  { id: "otro", label: "Otro" },
];

// ------------------------
// Helpers
// ------------------------
const makeUiId = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = globalThis as any;
    if (c?.crypto?.randomUUID) return c.crypto.randomUUID();
  } catch {}
  return `ui_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

function normalizeCostoForForm(c: any): CostoItem {
  const tipoRaw = (c?.tipo ?? "otro").toString().toLowerCase();
  const tipo: CostoTipo =
    tipoRaw === "taquilla"
      ? "taquilla"
      : tipoRaw === "preventa"
      ? "preventa"
      : tipoRaw === "promocion" || tipoRaw === "promoción" || tipoRaw === "promo"
      ? "promocion"
      : tipoRaw === "gratis"
      ? "gratis"
      : "otro";

  const monto =
    typeof c?.monto === "number"
      ? c.monto
      : typeof c?.precio === "number"
      ? c.precio
      : 0;

  return {
    __ui_id: typeof c?.__ui_id === "string" ? c.__ui_id : makeUiId(),
    tipo,
    monto: tipo === "gratis" ? 0 : (monto >= 0 ? monto : 0),
    descripcion: c?.descripcion ?? c?.regla ?? "",
    nombre: c?.nombre ?? "",
    precio: c?.precio ?? null,
    regla: c?.regla ?? "",
  };
}

/** Output limpio para DB: NO guardar __ui_id / precio / regla */
function toOutputCosto(c: CostoItem) {
  return {
    tipo: c.tipo,
    monto: c.monto,
    descripcion: c.descripcion || undefined,
    nombre: c.nombre || undefined,
  };
}

/** Output limpio para DB: NO guardar __ui_id */
function toOutputSchedule(item: ScheduleItem) {
  const { __ui_id, ...rest } = item;
  return rest;
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

  // Metadatos compartidos (opcional)
  selectedRitmoId?: number | null;
  selectedZonaId?: number | null;
  ubicacion?: string;
  eventFecha?: string; // Fecha del evento para heredar

  onMetaChange?: (meta: MetaState) => void;
  onSaveCosto?: (index: number) => void;

  labelSchedule?: string;
  labelCostos?: string;
  hideCostsSection?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

const normalizeTime = (t?: string) => {
  if (!t) return "";
  const [hh = "", mm = ""] = t.split(":");
  return `${hh.padStart(2, "0")}:${(mm || "00").padStart(2, "0")}`;
};

const card: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  background: `${colors.dark}66`,
  border: `1px solid ${colors.light}22`,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  background: `${colors.dark}cc`,
  border: `1px solid ${colors.light}33`,
  color: colors.light,
  fontSize: "0.9rem",
  outline: "none",
};

const pillWrap: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
const pill = (active: boolean): React.CSSProperties => ({
  padding: "6px 10px",
  borderRadius: 999,
  border: `1px solid ${active ? colors.blue : `${colors.light}33`}`,
  background: active ? `${colors.blue}33` : "transparent",
  color: colors.light,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
});

const SCHEDULE_TYPE_OPTIONS: Array<{ value: ScheduleItem["tipo"]; label: string }> = [
  { value: "inicio", label: "Inicio" },
  { value: "social", label: "Social" },
  { value: "taller", label: "Taller" },
  { value: "clase", label: "Clase" },
  { value: "otro", label: "Otro" },
];

const isClaseType = (tipo?: ScheduleItem["tipo"]) => tipo === "clase";

const getTipoLabel = (tipo?: ScheduleItem["tipo"]) => {
  const found = SCHEDULE_TYPE_OPTIONS.find((o) => o.value === tipo);
  if (found) return found.label;
  return tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : "Actividad";
};

export default function ScheduleEditorPlus({
  schedule = [],
  onChangeSchedule,
  costos = [],
  onChangeCostos,
  ritmos = [],
  zonas = [],
  selectedRitmoId = null,
  selectedZonaId = null,
  ubicacion = "",
  eventFecha = "",
  onMetaChange,
  onSaveCosto,
  labelSchedule = "Cronograma",
  labelCostos = "Costos y Promociones",
  hideCostsSection = false,
  style,
  className,
}: Props) {
  // ------------------------
  // Perf: maps (O(1) lookup)
  // ------------------------
  const catalogIdToLabel = useMemo(() => {
    const m = new Map<string, string>();
    RITMOS_CATALOG.forEach((g) => g.items.forEach((i) => m.set(i.id, i.label)));
    return m;
  }, []);

  const labelToCatalogId = useMemo(() => {
    const m = new Map<string, string>();
    RITMOS_CATALOG.forEach((g) => g.items.forEach((i) => m.set(i.label, i.id)));
    return m;
  }, []);

  const ritmoTagNameById = useMemo(() => new Map(ritmos.map((r) => [r.id, r.nombre])), [ritmos]);
  const ritmoTagIdByName = useMemo(() => new Map(ritmos.map((r) => [r.nombre, r.id])), [ritmos]);

  // ------------------------
  // Ensure stable UI ids
  // ------------------------
  useEffect(() => {
    const needsFix =
      schedule.some((s) => !s.__ui_id) || (!hideCostsSection && costos.some((c) => !c.__ui_id));
    if (!needsFix) return;

    // Patch in-place via setters (best effort)
    const nextSchedule = schedule.map((s) => (s.__ui_id ? s : { ...s, __ui_id: makeUiId() }));
    const nextCostos = hideCostsSection ? costos : costos.map((c) => (c.__ui_id ? c : normalizeCostoForForm(c)));

    const scheduleChanged = nextSchedule.some((s, i) => s.__ui_id !== schedule[i].__ui_id);
    const costosChanged = !hideCostsSection && nextCostos.some((c, i) => c.__ui_id !== costos[i].__ui_id);

    // Si ambos cambian y el padre usa setState({ ...state, ... }), la 2.ª llamada puede pisar la 1.ª.
    // Preferimos: (1) actualizaciones funcionales en el padre; (2) diferir costos si también hubo cronograma.
    if (scheduleChanged) onChangeSchedule(nextSchedule);
    if (costosChanged) {
      if (!hideCostsSection && scheduleChanged) {
        queueMicrotask(() => onChangeCostos(nextCostos));
      } else if (!hideCostsSection) {
        onChangeCostos(nextCostos);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once on mount

  const [editingScheduleUiId, setEditingScheduleUiId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [isAddingCosto, setIsAddingCosto] = useState(false);
  const [collapsedCostUiIds, setCollapsedCostUiIds] = useState<Set<string>>(() => new Set());

  const [meta, setMeta] = useState<MetaState>({
    ritmoId: selectedRitmoId ?? null,
    zonaId: selectedZonaId ?? null,
    ubicacion: ubicacion ?? "",
  });

  const setMetaField = (patch: MetaState) => {
    const next = { ...meta, ...patch };
    setMeta(next);
    onMetaChange?.(next);
  };

  const [newItem, setNewItem] = useState<ScheduleItem>({
    __ui_id: makeUiId(),
    tipo: "inicio",
    titulo: "",
    ritmoId: selectedRitmoId ?? null,
    zonaId: selectedZonaId ?? null,
    inicio: "",
    fin: "",
    fecha: eventFecha || "",
    ubicacion: ubicacion ?? "",
    nivel: "",
    referenciaCosto: "",
    realizadoPor: "",
  });

  // Mantener fecha heredada
  useEffect(() => {
    if (!eventFecha) return;
    setNewItem((prev) => ({ ...prev, fecha: eventFecha }));
  }, [eventFecha]);

  // ------------------------
  // Schedule actions
  // ------------------------
  const addItem = () => {
    const hasTitulo = (newItem.titulo && newItem.titulo.trim()) || newItem.ritmoId;
    if (!hasTitulo || !newItem.inicio) return;

    const titleFromRitmo = newItem.ritmoId ? (ritmoTagNameById.get(newItem.ritmoId) || "") : "";
    const finalTitulo = (newItem.titulo && newItem.titulo.trim()) || titleFromRitmo;

    const next = [
      ...schedule,
      {
        ...newItem,
        __ui_id: makeUiId(),
        titulo: finalTitulo,
        inicio: normalizeTime(newItem.inicio),
        fin: newItem.fin ? normalizeTime(newItem.fin) : "",
        // ✅ importante: mantener fecha heredada si aplica
        fecha: (newItem.fecha || eventFecha || "").toString(),
      },
    ];

    onChangeSchedule(next);

    // Reset new item (mantener defaults + fecha heredada)
    setNewItem({
      __ui_id: makeUiId(),
      tipo: "inicio",
      titulo: "",
      ritmoId: meta.ritmoId ?? null,
      zonaId: meta.zonaId ?? null,
      inicio: "",
      fin: "",
      fecha: eventFecha || "",
      ubicacion: meta.ubicacion ?? "",
      nivel: "",
      referenciaCosto: "",
      realizadoPor: "",
    });

    setIsAdding(false);
  };

  const updateItemByUiId = (uiId: string, field: keyof ScheduleItem, v: any) => {
    const next = schedule.map((it) => {
      if (it.__ui_id !== uiId) return it;
      if (field === "tipo") {
        const nextTipo = v as ScheduleItem["tipo"];
        if (!isClaseType(nextTipo)) {
          return {
            ...it,
            tipo: nextTipo,
            nivel: "",
            ritmoId: null,
            realizadoPor: "",
          };
        }
      }
      return {
        ...it,
        [field]: field === "inicio" || field === "fin" ? normalizeTime(v) : v,
      };
    });
    onChangeSchedule(next);
  };

  const removeItemByUiId = (uiId: string) => {
    onChangeSchedule(schedule.filter((it) => it.__ui_id !== uiId));
    if (editingScheduleUiId === uiId) setEditingScheduleUiId(null);
  };

  const duplicateItemByUiId = (uiId: string) => {
    const index = schedule.findIndex((s) => s.__ui_id === uiId);
    if (index < 0) return;

    const original = schedule[index];
    const clone: ScheduleItem = {
      ...original,
      __ui_id: makeUiId(),
      titulo: original.titulo ? `${original.titulo} (copia)` : original.titulo,
      inicio: normalizeTime(original.inicio),
      fin: normalizeTime(original.fin),
    };

    const next = [...schedule];
    next.splice(index + 1, 0, clone);
    onChangeSchedule(next);
  };

  // ------------------------
  // Costs actions
  // ------------------------
  const [newCosto, setNewCosto] = useState<CostoItem>({
    __ui_id: makeUiId(),
    tipo: "taquilla",
    monto: 0,
    descripcion: "",
    nombre: "",
  });

  const costosNormalized = useMemo(() => costos.map(normalizeCostoForForm), [costos]);

  const hasTaquilla = useMemo(
    () => costosNormalized.some((c) => normalizeCostoForForm(c).tipo === "taquilla"),
    [costosNormalized]
  );

  const setCostoByUiId = (uiId: string, patch: Partial<CostoItem>) => {
    const next = costosNormalized.map((c) => {
      if (c.__ui_id !== uiId) return c;
      const merged = { ...c, ...patch };
      if (patch.tipo === "gratis") merged.monto = 0;

      // Compat: si alguien sigue mandando precio/regla
      if ("precio" in patch && patch.precio !== undefined) (merged as any).monto = patch.precio as any;
      if ("regla" in patch && patch.regla !== undefined) merged.descripcion = patch.regla;

      return merged;
    });

    // guardar manteniendo __ui_id en memoria del form (pero no en DB al final, si usas toOutputCosto)
    onChangeCostos(next);

    // si estaba colapsado, al tocarlo se abre
    setCollapsedCostUiIds((prev) => {
      if (!prev.has(uiId)) return prev;
      const n = new Set(prev);
      n.delete(uiId);
      return n;
    });
  };

  const addCostoToList = () => {
    const c = normalizeCostoForForm(newCosto);
    if (c.monto < 0) return;
    if (c.tipo === "taquilla" && hasTaquilla) return;

    const next = [...costosNormalized, { ...c, __ui_id: makeUiId() }];
    onChangeCostos(next);

    // colapsar el recién agregado
    const newUiId = next[next.length - 1].__ui_id!;
    setCollapsedCostUiIds((prev) => new Set(prev).add(newUiId));

    setNewCosto({ __ui_id: makeUiId(), tipo: "otro", monto: 0, descripcion: "", nombre: "" });
    setIsAddingCosto(false);
  };

  const removeCostoByUiId = (uiId: string) => {
    const next = costosNormalized.filter((c) => c.__ui_id !== uiId);
    onChangeCostos(next);
    setCollapsedCostUiIds(new Set());
  };

  // ✅ FIX: duplicar SIN re-normalizar todo el array y SIN reconstruir indices
  const duplicateCostoByUiId = (uiId: string) => {
    const index = costosNormalized.findIndex((c) => c.__ui_id === uiId);
    if (index < 0) return;

    const original = costosNormalized[index];
    const clone: CostoItem = {
      ...original,
      __ui_id: makeUiId(),
      nombre: original.nombre ? `${original.nombre} (copia)` : "Costo (copia)",
    };

    const next = [...costosNormalized];
    next.splice(index + 1, 0, clone);
    onChangeCostos(next);

    // colapsar original+clone (best effort)
    setCollapsedCostUiIds(new Set([original.__ui_id!, clone.__ui_id!]));
  };

  const costoNombres = useMemo(() => {
    return costosNormalized
      .map((c) => (c.nombre || TIPOS_COSTO.find((t) => t.id === (c.tipo as any))?.label || "").trim())
      .filter(Boolean);
  }, [costosNormalized]);

  // ------------------------
  // UI
  // ------------------------
  return (
    <div style={{ ...style }} className={className}>
      {/* === Cronograma === */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <label style={{ fontSize: "1.1rem", fontWeight: 600, color: colors.light }}>{labelSchedule}</label>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsAdding(true);
              setNewItem((s) => ({
                ...s,
                __ui_id: makeUiId(),
                ritmoId: meta.ritmoId ?? null,
                zonaId: meta.zonaId ?? null,
                ubicacion: meta.ubicacion ?? "",
                fecha: eventFecha || s.fecha || "",
              }));
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: "none",
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
              color: colors.light,
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ➕ Agregar Actividad
          </motion.button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {schedule.map((item) => {
            const uiId = item.__ui_id || makeUiId();
            const isEditing = editingScheduleUiId === uiId;

            return (
              <div key={uiId} style={card}>
                {isEditing ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(140px, 1fr)", gap: 10, alignItems: "end" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Nombre</div>
                        <input
                          type="text"
                          value={item.titulo || ""}
                          onChange={(e) => updateItemByUiId(uiId, "titulo", e.target.value)}
                          placeholder="Nombre de la actividad"
                          style={input}
                        />
                      </div>
                      <div>
                        <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Tipo</div>
                        <select
                          value={item.tipo}
                          onChange={(e) => updateItemByUiId(uiId, "tipo", e.target.value as ScheduleItem["tipo"])}
                          style={input}
                        >
                          {SCHEDULE_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {isClaseType(item.tipo) && (
                      <div>
                        <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Nivel (opcional)</div>
                        <input
                          type="text"
                          value={item.nivel || ""}
                          onChange={(e) => updateItemByUiId(uiId, "nivel", e.target.value)}
                          placeholder="Ej: Principiante, Intermedio"
                          style={input}
                        />
                      </div>
                    )}

                    {isClaseType(item.tipo) && (
                      <div>
                        <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Se llevará a cabo por:</div>
                        <input
                          type="text"
                          value={item.realizadoPor || ""}
                          onChange={(e) => updateItemByUiId(uiId, "realizadoPor", e.target.value)}
                          placeholder="Ej: Profesor, grupo o entidad responsable"
                          style={input}
                        />
                      </div>
                    )}

                    {isClaseType(item.tipo) && (
                      <div>
                        <div style={{ marginBottom: 6, fontSize: 12, color: colors.light, opacity: 0.85 }}>Ritmo</div>
                        <RitmosChips
                          selected={(() => {
                            if (!item.ritmoId) return [];
                            const tagName = ritmoTagNameById.get(item.ritmoId);
                            if (!tagName) return [];
                            const catalogId = labelToCatalogId.get(tagName);
                            return catalogId ? [catalogId] : [];
                          })()}
                          onChange={(ids) => {
                            const first = ids[0];
                            const label = first ? catalogIdToLabel.get(first) : undefined;
                            const tagId = label ? ritmoTagIdByName.get(label) ?? null : null;
                            updateItemByUiId(uiId, "ritmoId", tagId);
                          }}
                        />
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Inicio (HH:MM)</div>
                        <input
                          type="time"
                          step={60}
                          value={item.inicio}
                          onChange={(e) => updateItemByUiId(uiId, "inicio", e.target.value)}
                          style={input}
                        />
                      </div>
                      <div>
                        <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Fin (HH:MM)</div>
                        <input
                          type="time"
                          step={60}
                          value={item.fin}
                          onChange={(e) => updateItemByUiId(uiId, "fin", e.target.value)}
                          style={input}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditingScheduleUiId(null)}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 8,
                          border: "none",
                          background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                          color: colors.light,
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ✅ Listo
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setEditingScheduleUiId(null)}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 8,
                          border: `1px solid ${colors.light}33`,
                          background: "transparent",
                          color: colors.light,
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        ❌ Cancelar
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: "1.2rem" }}>📚</span>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 12,
                            background: `${colors.light}22`,
                            color: colors.light,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          {getTipoLabel(item.tipo)}
                        </span>
                        {isClaseType(item.tipo) && item.nivel && (
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 12,
                              background: `${colors.light}33`,
                              color: colors.light,
                              fontSize: "0.8rem",
                              fontWeight: 600,
                            }}
                          >
                            {item.nivel}
                          </span>
                        )}
                      </div>

                      <h4 style={{ fontSize: "1rem", fontWeight: 600, color: colors.light, marginBottom: 4 }}>
                        {item.titulo || (item.ritmoId ? ritmoTagNameById.get(item.ritmoId) : "")}
                      </h4>

                      <p style={{ fontSize: "0.9rem", color: colors.light, opacity: 0.8 }}>
                        🕐 {item.fin ? `${item.inicio} - ${item.fin}` : item.inicio}
                      </p>

                      {isClaseType(item.tipo) && item.realizadoPor && (
                        <p style={{ fontSize: "0.85rem", color: colors.light, opacity: 0.8 }}>
                          Se llevará a cabo por: {item.realizadoPor}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEditingScheduleUiId(uiId)}
                        style={{ padding: 6, borderRadius: 6, border: "none", background: colors.blue, color: colors.light, cursor: "pointer" }}
                      >
                        ✏️
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => duplicateItemByUiId(uiId)}
                        style={{ padding: 6, borderRadius: 6, border: "none", background: colors.yellow, color: colors.dark, cursor: "pointer" }}
                      >
                        📄
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeItemByUiId(uiId)}
                        style={{ padding: 6, borderRadius: 6, border: "none", background: colors.coral, color: colors.light, cursor: "pointer" }}
                      >
                        🗑️
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {schedule.length === 0 && !isAdding && (
          <div style={{ textAlign: "center", padding: 24, background: `${colors.dark}33`, borderRadius: 12, color: colors.light, opacity: 0.6 }}>
            <p>No hay actividades programadas aún</p>
            <p style={{ fontSize: "0.9rem", marginTop: 4 }}>Haz clic en "Agregar Actividad" para comenzar</p>
          </div>
        )}
      </div>

      {/* Form de alta rápida */}
      {isAdding && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, border: `1px solid ${colors.blue}33` }}>
          <h4 style={{ fontSize: "1rem", fontWeight: 600, color: colors.light, marginBottom: 12 }}>➕ Nueva Actividad</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(140px, 1fr)", gap: 10, alignItems: "end" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Nombre</div>
                <input
                  type="text"
                  value={newItem.titulo}
                  onChange={(e) => setNewItem({ ...newItem, titulo: e.target.value })}
                  placeholder="Nombre de la actividad"
                  style={input}
                />
              </div>
              <div>
                <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Tipo</div>
                <select
                  value={newItem.tipo}
                  onChange={(e) => {
                    const nextTipo = e.target.value as ScheduleItem["tipo"];
                    setNewItem((prev) =>
                      isClaseType(nextTipo)
                        ? { ...prev, tipo: nextTipo }
                        : { ...prev, tipo: nextTipo, nivel: "", ritmoId: null, realizadoPor: "" }
                    );
                  }}
                  style={input}
                >
                  {SCHEDULE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isClaseType(newItem.tipo) && (
              <div>
                <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Nivel (opcional)</div>
                <input
                  type="text"
                  value={newItem.nivel || ""}
                  onChange={(e) => setNewItem({ ...newItem, nivel: e.target.value })}
                  placeholder="Ej: Principiante, Intermedio"
                  style={input}
                />
              </div>
            )}

            {isClaseType(newItem.tipo) && (
              <div>
                <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Se llevará a cabo por:</div>
                <input
                  type="text"
                  value={newItem.realizadoPor || ""}
                  onChange={(e) => setNewItem({ ...newItem, realizadoPor: e.target.value })}
                  placeholder="Ej: Profesor, grupo o entidad responsable"
                  style={input}
                />
              </div>
            )}

            {isClaseType(newItem.tipo) && (
              <div>
                <div style={{ marginBottom: 6, fontSize: 12, color: colors.light, opacity: 0.85 }}>Ritmo</div>
                <RitmosChips
                  selected={(() => {
                    if (!newItem.ritmoId) return [];
                    const tagName = ritmoTagNameById.get(newItem.ritmoId);
                    if (!tagName) return [];
                    const catalogId = labelToCatalogId.get(tagName);
                    return catalogId ? [catalogId] : [];
                  })()}
                  onChange={(ids) => {
                    const first = ids[0];
                    const label = first ? catalogIdToLabel.get(first) : undefined;
                    const tagId = label ? ritmoTagIdByName.get(label) ?? null : null;
                    setNewItem((s) => ({ ...s, ritmoId: tagId }));
                  }}
                />
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Inicio</div>
                <input
                  type="time"
                  step={60}
                  value={newItem.inicio}
                  onChange={(e) => setNewItem({ ...newItem, inicio: e.target.value })}
                  style={input}
                />
              </div>
              <div>
                <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Fin (opcional)</div>
                <input
                  type="time"
                  step={60}
                  value={newItem.fin}
                  onChange={(e) => setNewItem({ ...newItem, fin: e.target.value })}
                  style={input}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addItem}
                disabled={!((newItem.titulo?.trim() || newItem.ritmoId) && newItem.inicio)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: (newItem.titulo?.trim() || newItem.ritmoId) && newItem.inicio ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})` : `${colors.light}33`,
                  color: colors.light,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: (newItem.titulo?.trim() || newItem.ritmoId) && newItem.inicio ? "pointer" : "not-allowed",
                }}
              >
                ✅ Agregar Actividad
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAdding(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: `1px solid ${colors.light}33`,
                  background: "transparent",
                  color: colors.light,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ❌ Cancelar
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* === Costos / Promos === */}
      {!hideCostsSection && (
      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <label style={{ fontSize: "1.1rem", fontWeight: 600, color: colors.light }}>{labelCostos}</label>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingCosto(true)}
            style={{
              padding: "8px 16px",
              borderRadius: 20,
              border: "none",
              background: `linear-gradient(135deg, ${colors.yellow}, ${colors.orange})`,
              color: colors.dark,
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Añadir costo
          </motion.button>
        </div>

        {isAddingCosto && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ ...card, marginBottom: 12 }}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Tipo</div>
                  <div style={pillWrap}>
                    {TIPOS_COSTO.map((t) => (
                      <div key={t.id} style={pill(normalizeCostoForForm(newCosto).tipo === t.id)} onClick={() => setNewCosto({ ...newCosto, tipo: t.id })}>
                        {t.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Monto *</div>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    placeholder="Ej. 200"
                    value={newCosto.monto ?? ""}
                    onChange={(e) => setNewCosto({ ...newCosto, monto: Math.max(0, Number(e.target.value) || 0) })}
                    style={input}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Descripción (opcional)</div>
                <input
                  style={input}
                  placeholder="Ej. Válido hasta el 15/Nov · 2x1 pareja"
                  value={newCosto.descripcion || ""}
                  onChange={(e) => setNewCosto({ ...newCosto, descripcion: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Nombre (referencia para cronograma)</div>
                <input
                  style={input}
                  placeholder="Ej. General, VIP"
                  value={newCosto.nombre || ""}
                  onChange={(e) => setNewCosto({ ...newCosto, nombre: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-start", marginTop: 12 }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addCostoToList}
                  disabled={normalizeCostoForForm(newCosto).monto < 0 || (normalizeCostoForForm(newCosto).tipo === "taquilla" && hasTaquilla)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background:
                      normalizeCostoForForm(newCosto).monto >= 0 && !(normalizeCostoForForm(newCosto).tipo === "taquilla" && hasTaquilla)
                        ? `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
                        : `${colors.light}33`,
                    color: colors.light,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: normalizeCostoForForm(newCosto).monto >= 0 && !(normalizeCostoForForm(newCosto).tipo === "taquilla" && hasTaquilla) ? "pointer" : "not-allowed",
                  }}
                >
                  ✅ Agregar Costo
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsAddingCosto(false);
                    setNewCosto({ __ui_id: makeUiId(), tipo: "taquilla", monto: 0, descripcion: "", nombre: "" });
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: `1px solid ${colors.light}33`,
                    background: "transparent",
                    color: colors.light,
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ❌ Cancelar
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {costosNormalized.map((c) => {
            const uiId = c.__ui_id!;
            const isCollapsed = collapsedCostUiIds.has(uiId);

            return (
              <div key={uiId} style={card}>
                {isCollapsed ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: "1.2rem" }}>💸</span>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 12,
                            background: `${colors.light}33`,
                            color: colors.light,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {TIPOS_COSTO.find((t) => t.id === (c.tipo as any))?.label ?? c.tipo}
                        </span>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 12,
                            background: `${colors.light}33`,
                            color: colors.light,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          {c.monto === 0 ? "Gratis" : `$${Number(c.monto).toLocaleString()}`}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 600, color: colors.light, marginBottom: 4 }}>
                        {(c.nombre || TIPOS_COSTO.find((t) => t.id === (c.tipo as any))?.label || "Costo").toString()}
                      </h4>
                      {c.descripcion && (
                        <p style={{ fontSize: "0.85rem", color: colors.light, opacity: 0.8, margin: 0 }}>📋 {c.descripcion}</p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setCollapsedCostUiIds((prev) => {
                            const n = new Set(prev);
                            n.delete(uiId);
                            return n;
                          })
                        }
                        style={{ padding: 6, borderRadius: 6, border: "none", background: colors.blue, color: colors.light, cursor: "pointer" }}
                      >
                        ✏️
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => duplicateCostoByUiId(uiId)}
                        style={{ padding: 6, borderRadius: 6, border: "none", background: colors.yellow, color: colors.dark, cursor: "pointer" }}
                      >
                        📄
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeCostoByUiId(uiId)}
                        style={{ padding: 6, borderRadius: 6, border: "none", background: colors.coral, color: colors.light, cursor: "pointer" }}
                      >
                        🗑️
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Tipo</div>
                        <div style={pillWrap}>
                          {TIPOS_COSTO.map((t) => (
                            <div key={t.id} style={pill(c.tipo === t.id)} onClick={() => setCostoByUiId(uiId, { tipo: t.id })}>
                              {t.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Monto *</div>
                        <input
                          type="number"
                          min={0}
                          step="1"
                          placeholder="Ej. 200"
                          value={c.monto ?? ""}
                          onChange={(e) => setCostoByUiId(uiId, { monto: Math.max(0, Number(e.target.value) || 0) })}
                          style={input}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Descripción (opcional)</div>
                      <input
                        style={input}
                        placeholder="Ej. Válido hasta el 15/Nov · 2x1 pareja"
                        value={c.descripcion || ""}
                        onChange={(e) => setCostoByUiId(uiId, { descripcion: e.target.value })}
                      />
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ marginBottom: 4, fontSize: "0.9rem", color: colors.light }}>Nombre (referencia para cronograma)</div>
                      <input
                        style={input}
                        placeholder="Ej. General, VIP"
                        value={c.nombre || ""}
                        onChange={(e) => setCostoByUiId(uiId, { nombre: e.target.value })}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-start", marginTop: 10, flexWrap: "wrap" }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          // Nota: esto NO persiste en DB; solo “marca listo” en UI (como tu diseño original)
                          const idx = costosNormalized.findIndex((x) => x.__ui_id === uiId);
                          if (idx >= 0) onSaveCosto?.(idx);

                          setCollapsedCostUiIds((prev) => new Set(prev).add(uiId));
                        }}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 8,
                          border: "none",
                          background: `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                          color: colors.light,
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        💾 Listo
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => duplicateCostoByUiId(uiId)}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 8,
                          border: "none",
                          background: `${colors.yellow}`,
                          color: colors.dark,
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        📄 Duplicar
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeCostoByUiId(uiId)}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 8,
                          border: `1px solid ${colors.light}33`,
                          background: "transparent",
                          color: colors.light,
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        🗑️ Eliminar
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {costosNormalized.length === 0 && (
          <div style={{ textAlign: "center", padding: 24, background: `${colors.dark}33`, borderRadius: 12, color: colors.light, opacity: 0.6, marginTop: 8 }}>
            <p>No hay costos cargados</p>
            <p style={{ fontSize: "0.9rem", marginTop: 4 }}>Agrega al menos una opción para vincular desde las clases</p>
          </div>
        )}
      </div>
      )}

      {hideCostsSection && (
        <div style={{ marginTop: 20 }}>
          <CostsPhasesEditor value={costos as any[]} onChange={(next) => onChangeCostos(next as any)} />
        </div>
      )}

      {/* Nota opcional: si quieres forzar que NO se persistan __ui_id,
          puedes limpiar antes de mandar al backend:
          - schedule.map(toOutputSchedule)
          - costos.map(normalizeCostoForForm).map(toOutputCosto)
      */}
    </div>
  );
}