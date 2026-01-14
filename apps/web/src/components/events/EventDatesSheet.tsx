import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../Toast";
import { useBulkUpdateEventDates } from "../../hooks/useBulkUpdateEventDates";
import { uploadEventFlyer } from "../../lib/uploadEventFlyer";
import { supabase } from "../../lib/supabase";

type OrganizerLocationLite = {
  id?: number;
  nombre?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  referencias?: string | null;
};

export type EventDateRow = {
  id: number;
  parent_id: number | null;
  nombre?: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  lugar: string | null;
  direccion: string | null;
  ciudad: string | null;
  referencias: string | null;
  requisitos: string | null;
  ritmos_seleccionados?: string[] | null;
  zonas?: number[] | null;
  flyer_url: string | null;
  estado_publicacion: "borrador" | "publicado";
  updated_at?: string | null;
};

type BulkDraft = {
  hora_inicio?: string;
  hora_fin?: string;
  lugar?: string;
  direccion?: string;
  ciudad?: string;
  referencias?: string;
};

type Props = {
  rows: EventDateRow[];
  isLoading?: boolean;
  onOpenRow: (id: number) => void;
  onRowsPatched?: (ids: number[], patch: Record<string, any>) => void;
  onStartFrecuentes?: (fromDateId: number) => void;
  title?: string;
  variant?: "card" | "embedded";
  showHeader?: boolean;
  onViewRow?: (id: number) => void;
  onDeleteRow?: (row: EventDateRow) => void;
  deletingRowId?: number | null;
  locations?: OrganizerLocationLite[];
};

const Badge = ({ children, tone }: { children: React.ReactNode; tone: "ok" | "warn" | "muted" }) => {
  const style =
    tone === "ok"
      ? { border: "1px solid rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.12)" }
      : tone === "warn"
      ? { border: "1px solid rgba(255,209,102,0.35)", background: "rgba(255,209,102,0.12)" }
      : { border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)" };
  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        color: "#fff",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

function toHHmm(value?: string | null) {
  if (!value) return "—";
  const parts = String(value).split(":");
  if (parts.length >= 2) return `${parts[0] || "00"}:${parts[1] || "00"}`;
  return String(value);
}

const Row = React.memo(function Row({
  row,
  selected,
  onToggle,
  onEdit,
  onPrefetchRow,
  onEditPointerDown,
  onEditClick,
  onView,
  onDelete,
  deletingRowId,
  onPickFlyer,
  flyerUploading,
  flyerError,
  canEditFecha,
  isEditingFecha,
  editingFechaValue,
  onStartEditFecha,
  onChangeEditFecha,
  onSaveFecha,
  onCancelFecha,
  isEditingLocation,
  onStartEditLocation,
  onCancelLocation,
  onSaveLocation,
  locationDraft,
  onLocationDraftChange,
  locations,
}: {
  row: EventDateRow;
  selected: boolean;
  onToggle: (id: number, next: boolean) => void;
  onEdit: (id: number) => void;
  onPrefetchRow: (row: EventDateRow) => void;
  onEditPointerDown: (id: number) => void;
  onEditClick: (id: number) => void;
  onView?: (id: number) => void;
  onDelete?: (row: EventDateRow) => void;
  deletingRowId?: number | null;
  onPickFlyer?: (row: EventDateRow) => void;
  flyerUploading?: boolean;
  flyerError?: boolean;
  canEditFecha: boolean;
  isEditingFecha: boolean;
  editingFechaValue: string;
  onStartEditFecha: (row: EventDateRow) => void;
  onChangeEditFecha: (value: string) => void;
  onSaveFecha: () => void;
  onCancelFecha: () => void;
  isEditingLocation: boolean;
  onStartEditLocation: (row: EventDateRow) => void;
  onCancelLocation: () => void;
  onSaveLocation: () => void;
  locationDraft: { locationId: string; lugar: string; direccion: string; ciudad: string; referencias: string };
  onLocationDraftChange: (patch: Partial<{ locationId: string; lugar: string; direccion: string; ciudad: string; referencias: string }>) => void;
  locations: OrganizerLocationLite[];
}) {
  const flyerTone = row.flyer_url ? "ok" : "warn";
  const pubTone = row.estado_publicacion === "publicado" ? "ok" : "muted";
  const isRecurrent = (row as any)?.dia_semana !== null && (row as any)?.dia_semana !== undefined;
  return (
    <div
      className="eds-grid eds-row"
      style={{
        display: "grid",
        gap: 10,
        alignItems: "center",
        padding: "10px 10px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onToggle(row.id, e.target.checked)}
        style={{ width: 18, height: 18 }}
      />
      <div
        className="eds-eventName"
        style={{
          color: "#fff",
          fontWeight: 900,
          fontSize: 13,
          minWidth: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as any,
          lineHeight: 1.15,
        }}
        title={row.nombre || ""}
      >
        {row.nombre || "—"}
      </div>
      <div
        className="eds-dateCell"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {!isEditingFecha ? (
          <button
            type="button"
            onClick={() => onStartEditFecha(row)}
            title={
              isRecurrent
                ? "Editar fecha (esto quitará la recurrencia semanal)"
                : "Editar fecha"
            }
            className={`eds-editableDate ${canEditFecha ? "" : "eds-editableDateDisabled"}`}
            style={{ maxWidth: "100%", minWidth: 0 }}
          >
            <span style={{ opacity: 1 }}>{String(row.fecha).split("T")[0]}</span>
            {isRecurrent && (
              <span
                className="eds-recurMark"
                title="Recurrente semanal"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  fontSize: 12,
                  lineHeight: "18px",
                }}
              >
                🔁
              </span>
            )}
            <span style={{ opacity: 0.9, fontSize: 12 }}>✎</span>
          </button>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 8,
              width: "100%",
              minWidth: 0,
              maxWidth: "100%",
              overflow: "hidden",
              flex: "1 1 0%",
            }}
          >
            <input
              type="date"
              value={editingFechaValue}
              onChange={(e) => onChangeEditFecha(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(0,0,0,0.25)",
                color: "#fff",
                boxSizing: "border-box",
                minWidth: 0,
              }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={onCancelFecha}
                className="eds-iconBtn"
                title="Cancelar"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={onSaveFecha}
                className="eds-iconBtn eds-iconBtnPrimary"
                title="Guardar fecha"
              >
                ✓
              </button>
            </div>
          </div>
        )}
      </div>
      <div style={{ color: "#fff", fontSize: 13, opacity: 0.9 }}>{toHHmm(row.hora_inicio)}</div>
      <div style={{ color: "#fff", fontSize: 13, opacity: 0.9 }}>{toHHmm(row.hora_fin)}</div>
      <div
        className="eds-place"
        style={{
          color: "#fff",
          fontSize: 12,
          opacity: 0.9,
          minWidth: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as any,
          lineHeight: 1.2,
        }}
        title={row.lugar || ""}
      >
        {row.lugar || "—"}
      </div>
      <div
        className="eds-cellFlyer"
        title={flyerUploading ? "Subiendo flyer…" : flyerError ? "Error subiendo flyer" : (row.flyer_url ? "Flyer añadido (toca para cambiar)" : "Flyer pendiente (toca para añadir)")}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => onPickFlyer?.(row)}
          disabled={!onPickFlyer || !!flyerUploading}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: !onPickFlyer || flyerUploading ? "not-allowed" : "pointer",
            width: "fit-content",
            opacity: !onPickFlyer ? 0.7 : 1,
          }}
        >
          <Badge tone={flyerError ? "warn" : flyerTone}>
            {flyerUploading ? "⏳" : flyerError ? "⚠" : (row.flyer_url ? "🖼️✓" : "🖼️—")}
          </Badge>
        </motion.button>
      </div>
      <div className="eds-cellEstado" title={row.estado_publicacion === "publicado" ? "Publicado" : "Borrador"}>
        <Badge tone={pubTone}>{row.estado_publicacion === "publicado" ? "🌐" : "📝"}</Badge>
      </div>
      <div className="eds-cellActions" style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", justifyContent: "flex-end" }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => (isEditingLocation ? onCancelLocation() : onStartEditLocation(row))}
            className="eds-iconBtn"
            title={isEditingLocation ? "Cerrar ubicación" : "Editar ubicación"}
          >
            📍
          </motion.button>
          {onView && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onView(row.id)}
              className="eds-iconBtn"
              title="Ir a detalle"
            >
              ↗
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onPointerEnter={() => onPrefetchRow(row)}
            onPointerDown={() => onEditPointerDown(row.id)}
            onClick={() => onEditClick(row.id)}
            className="eds-iconBtn eds-iconBtnPrimary"
            title="Editar"
          >
            ✏️
          </motion.button>
          {onDelete && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onDelete(row)}
              disabled={deletingRowId === row.id}
              className="eds-iconBtn eds-iconBtnDanger"
              title="Eliminar"
            >
              {deletingRowId === row.id ? "⏳" : "🗑️"}
            </motion.button>
          )}
        </div>
      </div>

      {isEditingLocation && (
        <div
          style={{
            gridColumn: "1 / -1",
            marginTop: 8,
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(0,0,0,0.20)",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Ubicación (reutilizable)</div>
              <select
                value={locationDraft.locationId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  if (!nextId) {
                    onLocationDraftChange({ locationId: "", lugar: "", direccion: "", ciudad: "", referencias: "" });
                    return;
                  }
                  const found = locations.find((l) => String(l.id ?? "") === nextId);
                  onLocationDraftChange({
                    locationId: nextId,
                    lugar: String(found?.nombre || ""),
                    direccion: String(found?.direccion || ""),
                    ciudad: String(found?.ciudad || ""),
                    referencias: String(found?.referencias || ""),
                  });
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "#2b2b2b",
                  color: "#fff",
                }}
              >
                <option value="">— Escribir manualmente —</option>
                {locations.map((loc) => (
                  <option key={String(loc.id)} value={String(loc.id)} style={{ background: "#2b2b2b", color: "#fff" }}>
                    {loc.nombre || loc.direccion || "Ubicación"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Nombre (lugar)</div>
              <input
                type="text"
                value={locationDraft.lugar}
                onChange={(e) => onLocationDraftChange({ lugar: e.target.value })}
                placeholder="Ej. Salón principal"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.25)",
                  color: "#fff",
                }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Dirección</div>
              <input
                type="text"
                value={locationDraft.direccion}
                onChange={(e) => onLocationDraftChange({ direccion: e.target.value })}
                placeholder="Calle, número"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.25)",
                  color: "#fff",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Ciudad</div>
              <input
                type="text"
                value={locationDraft.ciudad}
                onChange={(e) => onLocationDraftChange({ ciudad: e.target.value })}
                placeholder="Ciudad"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(0,0,0,0.25)",
                  color: "#fff",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={onCancelLocation}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSaveLocation}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(39,195,255,0.40)",
                background: "rgba(39,195,255,0.10)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Guardar ubicación
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default function EventDatesSheet({
  rows,
  isLoading,
  onOpenRow,
  onRowsPatched,
  onStartFrecuentes,
  title,
  variant = "card",
  showHeader = true,
  onViewRow,
  onDeleteRow,
  deletingRowId,
  locations = [],
}: Props) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const bulkUpdate = useBulkUpdateEventDates();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDraft, setBulkDraft] = useState<BulkDraft>({});
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [flyerTarget, setFlyerTarget] = useState<EventDateRow | null>(null);
  const [flyerUploadingById, setFlyerUploadingById] = useState<Record<number, boolean>>({});
  const [flyerErrorById, setFlyerErrorById] = useState<Record<number, boolean>>({});
  const [editingFechaId, setEditingFechaId] = useState<number | null>(null);
  const [editingFechaValue, setEditingFechaValue] = useState<string>("");
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [locationDraft, setLocationDraft] = useState({
    locationId: "",
    lugar: "",
    direccion: "",
    ciudad: "",
    referencias: "",
  });
  // Optimistic UI patches per row id so actions reflect immediately even if parent doesn't pass onRowsPatched.
  const [localPatchById, setLocalPatchById] = useState<Record<number, Record<string, any>>>({});

  const applyLocalPatch = useCallback((ids: number[], patch: Record<string, any>) => {
    if (!ids?.length) return;
    setLocalPatchById((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        const key = Number(id);
        if (!Number.isFinite(key)) return;
        next[key] = { ...(next[key] || {}), ...(patch || {}) };
      });
      return next;
    });
  }, []);

  // Prune patches for rows that no longer exist (e.g., after delete or filters).
  useEffect(() => {
    const idSet = new Set((rows || []).map((r) => Number(r.id)));
    setLocalPatchById((prev) => {
      const next: Record<number, Record<string, any>> = {};
      for (const [k, v] of Object.entries(prev)) {
        const id = Number(k);
        if (idSet.has(id)) next[id] = v as any;
      }
      return next;
    });
  }, [rows]);

  const renderedRows = useMemo(() => {
    return (rows || []).map((r) => {
      const patch = localPatchById[Number(r.id)];
      return patch ? ({ ...(r as any), ...(patch as any) } as EventDateRow) : r;
    });
  }, [rows, localPatchById]);

  const sortedRows = useMemo(() => {
    return [...renderedRows].sort((a, b) => {
      const fa = String(a.fecha || "");
      const fb = String(b.fecha || "");
      const byDate = fa.localeCompare(fb);
      if (byDate !== 0) return byDate;
      const na = String(a.nombre || "");
      const nb = String(b.nombre || "");
      return na.localeCompare(nb);
    });
  }, [renderedRows]);

  const selectedCount = selectedIds.size;
  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const lastPointerDownRef = useRef<{ id: number | null; ts: number }>({ id: null, ts: 0 });
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const allCount = sortedRows.length;
  const allSelected = allCount > 0 && selectedCount === allCount;
  const someSelected = selectedCount > 0 && selectedCount < allCount;

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const seedAndPrefetchDate = useCallback(
    (row: EventDateRow) => {
      const id = row?.id;
      if (!id) return;
      // 1) Seed cache immediately from already-rendered row (instant drawer render).
      qc.setQueryData(["event", "date", id], (prev: any) => prev ?? row);
      // 2) Prefetch in background to get any missing fields and ensure freshness.
      void qc.prefetchQuery({
        queryKey: ["event", "date", id],
        queryFn: async () => {
          const { data, error } = await supabase.from("events_date").select("*").eq("id", id).maybeSingle();
          if (error) throw error;
          return data;
        },
        staleTime: 1000 * 30,
      });
    },
    [qc]
  );

  // Back-compat helper for any stale HMR closures that still reference `prefetchDate(id)`.
  // Safe to keep: it reuses the new seeding path when possible.
  const prefetchDate = useCallback(
    (id: number) => {
      if (!id) return;
      const row = sortedRows.find((r) => r.id === id);
      if (row) {
        seedAndPrefetchDate(row);
        return;
      }
      void qc.prefetchQuery({
        queryKey: ["event", "date", id],
        queryFn: async () => {
          const { data, error } = await supabase.from("events_date").select("*").eq("id", id).maybeSingle();
          if (error) throw error;
          return data;
        },
        staleTime: 1000 * 30,
      });
    },
    [qc, seedAndPrefetchDate, sortedRows]
  );

  const openDrawerPointerDown = useCallback(
    (id: number) => {
      if (!id) return;
      lastPointerDownRef.current = { id, ts: Date.now() };
      onOpenRow(id);
    },
    [onOpenRow]
  );

  const openDrawerClick = useCallback(
    (id: number) => {
      if (!id) return;
      const last = lastPointerDownRef.current;
      // Avoid double-trigger (pointerdown -> click) for same id.
      if (last?.id === id && Date.now() - (last?.ts || 0) < 800) {
        lastPointerDownRef.current = { id: null, ts: 0 };
        return;
      }
      onOpenRow(id);
    },
    [onOpenRow]
  );

  const toggle = useCallback((id: number, next: boolean) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
  }, []);

  const setAll = useCallback((next: boolean) => {
    setSelectedIds(() => {
      if (!next) return new Set();
      return new Set(sortedRows.map((r) => r.id));
    });
  }, [sortedRows]);

  const applyPatch = useCallback(
    async (patch: Record<string, any>) => {
      if (!selectedList.length) return;
      try {
        const res = await bulkUpdate.mutateAsync({ dateIds: selectedList, patch });
        onRowsPatched?.(res.updatedIds, patch);
        applyLocalPatch(res.updatedIds, patch);
        showToast("Actualizado ✅", "success");
      } catch (e: any) {
        showToast(e?.message || "Error en bulk update", "error");
      }
    },
    [bulkUpdate, selectedList, onRowsPatched, showToast, applyLocalPatch]
  );

  const canRun = selectedCount > 0 && !bulkUpdate.isPending && !bulkDeleting;

  const updateRow = useCallback(
    async (rowId: number, patch: Record<string, any>, successMsg?: string) => {
      try {
        const { error } = await supabase.from("events_date").update(patch).eq("id", rowId);
        if (error) throw error;
        onRowsPatched?.([rowId], patch);
        applyLocalPatch([rowId], patch);
        // Refrescar caches/listas para que la UI refleje el cambio aunque el parent no pase onRowsPatched.
        // Nota: usamos invalidación por prefijo para cubrir keys como ["dates", parentId, publishedOnly].
        const row = sortedRows.find((r) => r.id === rowId);
        qc.invalidateQueries({ queryKey: ["event", "date", rowId] });
        qc.invalidateQueries({ queryKey: ["date", rowId] });
        qc.invalidateQueries({ queryKey: ["dates"] });
        qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
        qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
        if (row?.parent_id) {
          qc.invalidateQueries({ queryKey: ["dates", row.parent_id] });
          qc.invalidateQueries({ queryKey: ["event", "dates", row.parent_id] });
        }
        if (successMsg) showToast(successMsg, "success");
      } catch (e: any) {
        console.error("[EventDatesSheet] updateRow error:", e);
        showToast(e?.message || "Error guardando cambios", "error");
        throw e;
      }
    },
    [onRowsPatched, showToast, qc, sortedRows, applyLocalPatch]
  );

  const makeDiaSemanaFromFecha = useCallback((fechaValue: any): number | null => {
    try {
      if (!fechaValue) return null;
      const plain = String(fechaValue).split("T")[0];
      const [y, m, d] = plain.split("-").map((n) => parseInt(n, 10));
      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
      const dt = new Date(y, m - 1, d);
      const day = dt.getDay(); // 0..6
      return typeof day === "number" && day >= 0 && day <= 6 ? day : null;
    } catch {
      return null;
    }
  }, []);

  const makeSelectedRecurrentWeekly = useCallback(async () => {
    if (!canRun) return;
    const selectedRows = sortedRows.filter((r) => selectedIds.has(r.id));
    if (!selectedRows.length) return;
    const ok = window.confirm(
      `¿Convertir ${selectedRows.length} fecha(s) a evento recurrente semanal?\n\nEsto marcará la(s) fecha(s) como recurrente (se bloqueará editar la fecha).`
    );
    if (!ok) return;

    try {
      let updated = 0;
      let skipped = 0;
      for (const r of selectedRows) {
        const dia = makeDiaSemanaFromFecha((r as any)?.fecha);
        if (dia === null) {
          skipped += 1;
          continue;
        }
        await updateRow(r.id, { dia_semana: dia });
        updated += 1;
      }
      if (updated > 0) showToast(`Recurrentes ✅ (${updated})`, "success");
      if (skipped > 0) showToast(`Algunas filas no tenían fecha válida (omitidas: ${skipped})`, "info");
    } catch (e: any) {
      showToast(e?.message || "Error convirtiendo a recurrente", "error");
    }
  }, [canRun, makeDiaSemanaFromFecha, selectedIds, sortedRows, updateRow, showToast]);

  const startFrecuentesFromSelection = useCallback(() => {
    if (!onStartFrecuentes) return;
    if (!selectedList.length) return;
    if (selectedList.length !== 1) {
      showToast("Selecciona 1 fecha para usarla como plantilla de frecuentes", "info");
      return;
    }
    onStartFrecuentes(selectedList[0]);
  }, [onStartFrecuentes, selectedList, showToast]);

  const startEditFecha = useCallback((row: EventDateRow) => {
    const isRecurrent = (row as any)?.dia_semana !== null && (row as any)?.dia_semana !== undefined;
    if (isRecurrent) {
      showToast("ℹ️ Este evento es recurrente. Si guardas una fecha específica, se quitará la recurrencia.", "info");
    }
    setEditingFechaId(row.id);
    setEditingFechaValue(String(row.fecha || "").split("T")[0]);
  }, [showToast]);

  const saveFecha = useCallback(async () => {
    if (!editingFechaId) return;
    const value = (editingFechaValue || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      showToast("Fecha inválida (usa YYYY-MM-DD)", "error");
      return;
    }
    const row = sortedRows.find((r) => r.id === editingFechaId);
    const isRecurrent = (row as any)?.dia_semana !== null && (row as any)?.dia_semana !== undefined;
    const patch: Record<string, any> = { fecha: value };
    if (isRecurrent) patch.dia_semana = null;
    try {
      await updateRow(
        editingFechaId,
        patch,
        isRecurrent ? "Fecha guardada ✅ (recurrencia removida)" : "Fecha guardada ✅"
      );
      setEditingFechaId(null);
    } catch {
      // updateRow ya muestra toast; mantener el modo edición para que el usuario pueda reintentar.
    }
  }, [editingFechaId, editingFechaValue, showToast, updateRow, sortedRows]);

  const cancelFecha = useCallback(() => {
    setEditingFechaId(null);
    setEditingFechaValue("");
  }, []);

  const startEditLocation = useCallback((row: EventDateRow) => {
    setEditingLocationId(row.id);
    setLocationDraft({
      locationId: "",
      lugar: row.lugar || "",
      direccion: row.direccion || "",
      ciudad: row.ciudad || "",
      referencias: row.referencias || "",
    });
  }, []);

  const cancelLocation = useCallback(() => {
    setEditingLocationId(null);
    setLocationDraft({ locationId: "", lugar: "", direccion: "", ciudad: "", referencias: "" });
  }, []);

  const saveLocation = useCallback(async () => {
    if (!editingLocationId) return;
    await updateRow(
      editingLocationId,
      {
        lugar: locationDraft.lugar || null,
        direccion: locationDraft.direccion || null,
        ciudad: locationDraft.ciudad || null,
        referencias: locationDraft.referencias || null,
      },
      "Ubicación guardada ✅"
    );
    setEditingLocationId(null);
  }, [editingLocationId, locationDraft, updateRow]);

  const pickFlyer = useCallback((row: EventDateRow) => {
    setFlyerTarget(row);
    const el = document.getElementById("eds-flyer-input") as HTMLInputElement | null;
    el?.click();
  }, []);

  const handleFlyerFile = useCallback(
    async (file?: File | null) => {
      if (!file || !flyerTarget) return;
      const row = flyerTarget;
      setFlyerErrorById((p) => ({ ...p, [row.id]: false }));
      setFlyerUploadingById((p) => ({ ...p, [row.id]: true }));
      try {
        const url = await uploadEventFlyer({ file, parentId: row.parent_id ?? null, dateId: row.id });
        const { error } = await supabase.from("events_date").update({ flyer_url: url }).eq("id", row.id);
        if (error) throw error;
        onRowsPatched?.([row.id], { flyer_url: url });
        applyLocalPatch([row.id], { flyer_url: url });
        showToast("Flyer añadido ✅", "success");
      } catch (e: any) {
        console.error("[EventDatesSheet] flyer upload error:", e);
        setFlyerErrorById((p) => ({ ...p, [row.id]: true }));
        showToast(e?.message || "Error subiendo flyer", "error");
      } finally {
        setFlyerUploadingById((p) => ({ ...p, [row.id]: false }));
        setFlyerTarget(null);
        const el = document.getElementById("eds-flyer-input") as HTMLInputElement | null;
        if (el) el.value = "";
      }
    },
    [flyerTarget, onRowsPatched, showToast]
  );

  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
    if (variant === "embedded") return <div>{children}</div>;
    return (
      <div className="org-editor-card" style={{ marginTop: 18 }}>
        {children}
      </div>
    );
  };

  return (
    <Wrapper>
      <style>{`
        /* Allow both horizontal + vertical scrolling inside the sheet area */
        .eds-scroll {
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          max-height: 70vh;
          /* Don't trap scroll on desktop; allow scroll to bubble to the page when needed */
          overscroll-behavior: auto;
          scrollbar-gutter: stable;
        }
        .eds-minWidth { min-width: 930px; }
        .eds-grid {
          /* Column widths for header + rows */
          --eds-flyer-col: 64px;
          --eds-estado-col: 64px;
          --eds-actions-col: 140px;
          /* ↓ Reduce Evento/Lugar widths and let them wrap to 2 lines */
          --eds-event-col: 165px;
          --eds-date-col: 140px;
          --eds-time-col: 72px;
          --eds-place-col: minmax(160px, 1fr);
          --eds-cols: 42px var(--eds-event-col) var(--eds-date-col) var(--eds-time-col) var(--eds-time-col) var(--eds-place-col) var(--eds-flyer-col) var(--eds-estado-col) var(--eds-actions-col);
        }
        /* Explicit grid-template-columns per request */
        .eds-grid.eds-row { grid-template-columns: var(--eds-cols); }
        .eds-grid.eds-header { grid-template-columns: var(--eds-cols); }
        /* Ensure Estado/Acciones never collapse */
        .eds-cellFlyer { min-width: var(--eds-flyer-col); }
        .eds-cellEstado { min-width: var(--eds-estado-col); }
        .eds-cellActions { min-width: var(--eds-actions-col); }
        .eds-hFlyer { min-width: var(--eds-flyer-col); }
        .eds-hEstado { min-width: var(--eds-estado-col); }
        .eds-hActions { min-width: var(--eds-actions-col); }
        .eds-header {
          position: sticky;
          top: 0;
          z-index: 2;
          background: rgba(18,18,18,0.92);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 8px 10px;
          border: 1px solid rgba(255,255,255,0.10);
        }
        .eds-iconBtn{
          width: 38px;
          height: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.22);
          background: #1a1f2b;
          color: #fff;
          cursor: pointer;
          font-weight: 900;
          user-select: text; /* requerido: contenido seleccionable */
          -webkit-user-select: text;
          box-shadow: 0 8px 18px rgba(0,0,0,0.25);
          transition: transform .12s ease, border-color .12s ease, background .12s ease, box-shadow .12s ease, opacity .12s ease;
        }
        .eds-iconBtn:hover{ transform: translateY(-1px); border-color: rgba(255,255,255,0.32); background: #23293a; }
        .eds-iconBtn:active{ transform: translateY(0px) scale(0.98); }
        .eds-iconBtn:disabled{ opacity: .55; cursor: not-allowed; box-shadow: none; }
        .eds-iconBtnPrimary{ border-color: rgba(39,195,255,0.75); background: #1E88E5; }
        .eds-iconBtnPrimary:hover{ background: #1976D2; border-color: rgba(39,195,255,0.9); }
        .eds-iconBtnDanger{ border-color: rgba(255,61,87,0.75); background: #FF3D57; }
        .eds-iconBtnDanger:hover{ background: #E53935; border-color: rgba(255,61,87,0.9); }

        .eds-editableDate{
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 12px;
          border: 1px dashed rgba(39,195,255,0.35);
          background: rgba(39,195,255,0.08);
          color: #fff;
          font-weight: 900;
          cursor: pointer;
          transition: border-color .12s ease, background .12s ease, transform .12s ease;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        .eds-editableDate:hover{ border-color: rgba(39,195,255,0.65); background: rgba(39,195,255,0.12); transform: translateY(-1px); }
        .eds-editableDate:active{ transform: translateY(0px) scale(0.99); }
        .eds-editableDateDisabled{
          opacity: .6;
          cursor: not-allowed;
          border-style: solid;
          border-color: rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.05);
        }

        /* Bulk actions (responsive) */
        .eds-actionsBar{
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-bottom: 14px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
        }
        .eds-actionsInputs{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-items: end;
        }
        .eds-fieldLabel{
          font-size: 12px;
          opacity: 0.85;
          color: #fff;
          margin-bottom: 6px;
          font-weight: 800;
        }
        .eds-timeInput{
          width: 100%;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(0,0,0,0.25);
          color: #fff;
          min-height: 40px;
        }
        .eds-actionsBtns{
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .eds-actionBtn{
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.28);
          background: #1a1f2b;
          color: #fff;
          cursor: pointer;
          font-weight: 900;
          user-select: text; /* requerido: contenido seleccionable */
          -webkit-user-select: text;
          min-height: 40px;
          white-space: nowrap;
        }
        .eds-actionBtnPrimary{
          border-color: rgba(39,195,255,0.75);
          background: #1E88E5;
        }
        .eds-actionBtnDanger{
          border-color: rgba(255,61,87,0.75);
          background: #FF3D57;
        }
        .eds-actionBtn:disabled{
          opacity: .55;
          cursor: not-allowed;
        }
        @media (max-width: 720px) {
          .eds-actionsInputs{ grid-template-columns: 1fr 1fr; }
          .eds-actionBtn{ flex: 1 1 auto; }
        }
        @media (max-width: 520px) {
          .eds-actionsInputs{ grid-template-columns: 1fr; }
          .eds-actionBtn{ width: 100%; justify-content: center; }
        }
        @media (max-width: 720px) {
          .eds-minWidth { min-width: 780px; }
          /* Give more room to "Evento" on mobile */
          .eds-grid { --eds-flyer-col: 56px; --eds-estado-col: 56px; --eds-actions-col: 132px; --eds-event-col: 160px; --eds-date-col: 132px; --eds-time-col: 64px; --eds-place-col: minmax(160px, 1fr); --eds-cols: 36px var(--eds-event-col) var(--eds-date-col) var(--eds-time-col) var(--eds-time-col) var(--eds-place-col) var(--eds-flyer-col) var(--eds-estado-col) var(--eds-actions-col); }
          .eds-iconBtn{ width: 36px; height: 36px; border-radius: 999px; }
        }
        @media (max-width: 520px) {
          .eds-minWidth { min-width: 620px; }
          .eds-place { display: none; }
          .eds-grid { --eds-flyer-col: 56px; --eds-estado-col: 56px; --eds-actions-col: 132px; --eds-event-col: minmax(180px, 1fr); --eds-date-col: 110px; --eds-time-col: 64px; --eds-cols: 36px var(--eds-event-col) var(--eds-date-col) var(--eds-time-col) var(--eds-time-col) var(--eds-flyer-col) var(--eds-estado-col) var(--eds-actions-col); }
          .eds-editableDate{ padding: 6px 8px; }
        }
      `}</style>

      {showHeader && (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 900, color: "#fff", fontSize: 16 }}>{title || "📅 Fechas (bulk editor)"}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setAll(true)}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 12 }}
          >
            Seleccionar todo
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 12 }}
          >
            Limpiar
          </button>
        </div>
      </div>
      )}

      <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 12 }}>
        Seleccionadas: <b>{selectedCount}</b>. Bulk no se bloquea por uploads (flyers se manejan aparte).
      </div>

      <input
        id="eds-flyer-input"
        type="file"
        accept="image/png, image/jpeg, image/webp"
        style={{ display: "none" }}
        onChange={(e) => handleFlyerFile(e.target.files?.[0])}
      />

      {/* Bulk actions bar */}
      <div className="eds-actionsBar">
        <div className="eds-actionsInputs">
          <div>
            <div className="eds-fieldLabel">Hora inicio</div>
            <input
              className="eds-timeInput"
              type="time"
              value={bulkDraft.hora_inicio || ""}
              onChange={(e) => setBulkDraft((p) => ({ ...p, hora_inicio: e.target.value }))}
            />
          </div>
          <div>
            <div className="eds-fieldLabel">Hora fin</div>
            <input
              className="eds-timeInput"
              type="time"
              value={bulkDraft.hora_fin || ""}
              onChange={(e) => setBulkDraft((p) => ({ ...p, hora_fin: e.target.value }))}
            />
          </div>
        </div>

        <div className="eds-actionsBtns">
          <button
            className="eds-actionBtn eds-actionBtnPrimary"
            type="button"
            disabled={!canRun || (!bulkDraft.hora_inicio && !bulkDraft.hora_fin)}
            onClick={() =>
              applyPatch({
                ...(bulkDraft.hora_inicio ? { hora_inicio: bulkDraft.hora_inicio } : {}),
                ...(bulkDraft.hora_fin ? { hora_fin: bulkDraft.hora_fin } : {}),
              })
            }
            title="Aplicar hora a seleccionadas"
          >
            {bulkUpdate.isPending ? "Aplicando…" : "Aplicar hora"}
          </button>

          <button
            className="eds-actionBtn"
            type="button"
            disabled={!canRun}
            onClick={() => applyPatch({ estado_publicacion: "publicado" })}
          >
            🌐 Publicar
          </button>
          <button
            className="eds-actionBtn"
            type="button"
            disabled={!canRun}
            onClick={() => applyPatch({ estado_publicacion: "borrador" })}
          >
            📝 Borrador
          </button>

          <button
            className="eds-actionBtn"
            type="button"
            disabled={!canRun}
            onClick={makeSelectedRecurrentWeekly}
            title="Convierte las fechas seleccionadas a recurrente semanal (usa el día de la semana de cada fecha)"
          >
            🔁 Recurrente
          </button>

          <button
            className="eds-actionBtn"
            type="button"
            disabled={!canRun}
            onClick={() => applyPatch({ dia_semana: null })}
            title="Quitar recurrencia semanal (dia_semana = null) en seleccionadas"
          >
            🚫 Quitar recurrencia
          </button>

          <button
            className="eds-actionBtn eds-actionBtnPrimary"
            type="button"
            disabled={!canRun || !onStartFrecuentes}
            onClick={startFrecuentesFromSelection}
            title={onStartFrecuentes ? "Usar esta fecha como plantilla para planificador de frecuentes" : "No disponible aquí"}
          >
            📋 Frecuente
          </button>

          <button
            className="eds-actionBtn eds-actionBtnDanger"
            type="button"
            disabled={!canRun || !onDeleteRow}
            onClick={async () => {
              if (!selectedList.length) return;
              if (!onDeleteRow) return;
              const ok = window.confirm(
                `¿Eliminar ${selectedList.length} fecha(s) seleccionada(s)? Esta acción no se puede deshacer.`
              );
              if (!ok) return;
              try {
                setBulkDeleting(true);
                const selectedRows = sortedRows.filter((r) => selectedIds.has(r.id));
                for (const r of selectedRows) {
                  await Promise.resolve(onDeleteRow(r));
                }
                setSelectedIds(new Set());
                showToast("Eliminadas ✅", "success");
              } catch (e: any) {
                showToast(e?.message || "Error eliminando seleccionadas", "error");
              } finally {
                setBulkDeleting(false);
              }
            }}
          >
            {bulkDeleting ? "Eliminando…" : "🗑️ Eliminar"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="eds-scroll">
        <div className="eds-minWidth">
          <div className="eds-grid eds-header" style={{ display: "grid", gap: 10, opacity: 0.9, fontSize: 12, marginBottom: 8, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={(e) => setAll(e.target.checked)}
                aria-label={allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
            </div>
            <div>Evento</div>
            <div>Fecha</div>
            <div>Inicio</div>
            <div>Fin</div>
            <div className="eds-place">Lugar</div>
            <div className="eds-hFlyer">Flyer</div>
            <div className="eds-hEstado">Estado</div>
            <div className="eds-hActions">Acciones</div>
          </div>
          {isLoading && (
            <div style={{ color: "rgba(255,255,255,0.8)", padding: 12 }}>Cargando…</div>
          )}
          {!isLoading && sortedRows.length === 0 && (
            <div style={{ color: "rgba(255,255,255,0.8)", padding: 12 }}>No hay fechas.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortedRows.map((r) => (
              <Row
                key={r.id}
                row={r}
                selected={selectedIds.has(r.id)}
                onToggle={toggle}
                onEdit={onOpenRow}
                onPrefetchRow={seedAndPrefetchDate}
                onEditPointerDown={openDrawerPointerDown}
                onEditClick={openDrawerClick}
                onView={onViewRow}
                onDelete={onDeleteRow}
                deletingRowId={deletingRowId}
                onPickFlyer={pickFlyer}
                flyerUploading={!!flyerUploadingById[r.id]}
                flyerError={!!flyerErrorById[r.id]}
                canEditFecha={true}
                isEditingFecha={editingFechaId === r.id}
                editingFechaValue={editingFechaId === r.id ? editingFechaValue : String(r.fecha || "").split("T")[0]}
                onStartEditFecha={startEditFecha}
                onChangeEditFecha={setEditingFechaValue}
                onSaveFecha={saveFecha}
                onCancelFecha={cancelFecha}
                isEditingLocation={editingLocationId === r.id}
                onStartEditLocation={startEditLocation}
                onCancelLocation={cancelLocation}
                onSaveLocation={saveLocation}
                locationDraft={locationDraft}
                onLocationDraftChange={(patch) => setLocationDraft((p) => ({ ...p, ...patch }))}
                locations={locations}
              />
            ))}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}

