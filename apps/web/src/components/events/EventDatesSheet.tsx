import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../Toast";
import { useBulkUpdateEventDates } from "../../hooks/useBulkUpdateEventDates";
import { uploadEventFlyer } from "../../lib/uploadEventFlyer";
import { supabase } from "../../lib/supabase";
import { calculateNextDateWithTime } from "../../utils/calculateRecurringDates";
import {
  buildLocationBulkPatchFromFilled,
  isWeeklyRecurrentRow,
  validateHoraOrder,
} from "../../hooks/useBulkEventDateActions";
import { useTags } from "../../hooks/useTags";
import ZonaGroupedChips from "../profile/ZonaGroupedChips";

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

type BulkPanelId = "time" | "date" | "location" | "estado" | "flyer" | "more";

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
  onDeleteRows?: (rows: EventDateRow[]) => Promise<void> | void;
  deletingRowId?: number | null;
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

type ConfirmDialogConfig = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
};

function BulkSheetOverlay({
  title,
  children,
  onClose,
  footer,
  overlayClassName = "eds-bulkOverlay",
  titleId = "eds-bulk-sheet-title",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  overlayClassName?: string;
  titleId?: string;
}) {
  return (
    <div
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="eds-bulkSheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="eds-bulkSheet__head">
          <h2 id={titleId} className="eds-bulkSheet__title">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="eds-bulkSheet__close"
          >
            ×
          </button>
        </div>
        <div className="eds-bulkSheet__body">{children}</div>
        {footer ? <div className="eds-bulkSheet__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

function toHHmm(value?: string | null) {
  if (!value) return "—";
  const parts = String(value).split(":");
  if (parts.length >= 2) return `${parts[0] || "00"}:${parts[1] || "00"}`;
  return String(value);
}

/** Inicio y fin en una sola cadena para la columna "Hora" (edición masiva sigue usando hora_inicio / hora_fin). */
function formatHoraRange(horaInicio?: string | null, horaFin?: string | null) {
  const a = toHHmm(horaInicio);
  const b = toHHmm(horaFin);
  if (a === "—" && b === "—") return "—";
  return `${a} – ${b}`;
}

function toWeekdayNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 6) return null;
  return n;
}

function resolveDisplayYmd(row: EventDateRow): string {
  const ymdFromRow = String(row.fecha || "").split("T")[0];
  if (ymdFromRow) return ymdFromRow;
  try {
    const diaSemana = toWeekdayNumber((row as any)?.dia_semana);
    if (diaSemana !== null) {
      const next = calculateNextDateWithTime(diaSemana, row.hora_inicio || "20:00");
      const y = next.getFullYear();
      const m = String(next.getMonth() + 1).padStart(2, "0");
      const d = String(next.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  } catch {}
  return String(row.fecha || "").split("T")[0];
}

function formatYmdWithWeekdayEs(value?: string | null) {
  const ymd = String(value || "").split("T")[0];
  if (!ymd) return "—";
  try {
    const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ymd;
    const dt = new Date(y, m - 1, d);
    const weekday = dt.toLocaleDateString("es-MX", { weekday: "long" });
    const yy = String(y).slice(-2);
    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${weekday} ${dd}-${mm}-${yy}`;
  } catch {
    return ymd;
  }
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
  onToggleEstadoPublicacion,
  estadoRowBusyId,
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
  onToggleEstadoPublicacion: (row: EventDateRow) => void;
  estadoRowBusyId: number | null;
}) {
  const flyerTone = row.flyer_url ? "ok" : "warn";
  const pubTone = row.estado_publicacion === "publicado" ? "ok" : "muted";
  const isRecurrent = toWeekdayNumber((row as any)?.dia_semana) !== null;
  return (
    <div
      className="eds-grid eds-row"
      role="row"
      style={{
        alignItems: "center",
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
            <span style={{ opacity: 1 }}>{formatYmdWithWeekdayEs(resolveDisplayYmd(row))}</span>
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
      <div
        className="eds-cellHora"
        style={{
          color: "#fff",
          fontSize: 13,
          opacity: 0.9,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={formatHoraRange(row.hora_inicio, row.hora_fin)}
      >
        {formatHoraRange(row.hora_inicio, row.hora_fin)}
      </div>
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
      <div className="eds-cellEstado">
        <motion.button
          type="button"
          whileHover={{ scale: estadoRowBusyId != null ? 1 : 1.02 }}
          whileTap={{ scale: estadoRowBusyId != null ? 1 : 0.98 }}
          onClick={() => onToggleEstadoPublicacion(row)}
          disabled={estadoRowBusyId != null}
          title={
            estadoRowBusyId === row.id
              ? "Guardando…"
              : estadoRowBusyId != null
                ? "Otra fecha se está guardando…"
                : row.estado_publicacion === "publicado"
                  ? "Publicado — clic para pasar a borrador"
                  : "Borrador — clic para publicar"
          }
          aria-label={
            row.estado_publicacion === "publicado"
              ? "Cambiar a borrador"
              : "Publicar fecha"
          }
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: estadoRowBusyId != null ? "wait" : "pointer",
            opacity: estadoRowBusyId != null && estadoRowBusyId !== row.id ? 0.55 : estadoRowBusyId === row.id ? 0.65 : 1,
            width: "fit-content",
          }}
        >
          <Badge tone={pubTone}>
            {estadoRowBusyId === row.id ? "⏳" : row.estado_publicacion === "publicado" ? "🌐" : "📝"}
          </Badge>
        </motion.button>
      </div>
      <div className="eds-cellActions" style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", justifyContent: "flex-end" }}>
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
  onDeleteRows,
  deletingRowId,
}: Props) {
  const { showToast } = useToast();
  const qc = useQueryClient();
  const bulkUpdate = useBulkUpdateEventDates();
  const { zonas: zonaCatalog = [] } = useTags("zona");
  const zonaTagsForBulk = useMemo(
    () =>
      (zonaCatalog || []).map((t: { id: number; nombre?: string; slug?: string; tipo?: string }) => ({
        id: t.id,
        nombre: t.nombre,
        slug: t.slug,
        tipo: t.tipo,
      })),
    [zonaCatalog]
  );

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkPanel, setBulkPanel] = useState<BulkPanelId | null>(null);
  const [bulkTimeHi, setBulkTimeHi] = useState("");
  const [bulkTimeHf, setBulkTimeHf] = useState("");
  const [bulkDateYmd, setBulkDateYmd] = useState("");
  const [bulkLoc, setBulkLoc] = useState({
    lugar: "",
    direccion: "",
    ciudad: "",
    referencias: "",
    zonas: [] as number[],
  });
  const [bulkZonasTouched, setBulkZonasTouched] = useState(false);
  const [bulkFlyerFile, setBulkFlyerFile] = useState<File | null>(null);
  const [bulkFlyerPreviewUrl, setBulkFlyerPreviewUrl] = useState<string | null>(null);
  const [bulkFlyerBusy, setBulkFlyerBusy] = useState(false);
  const bulkFlyerInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [flyerTarget, setFlyerTarget] = useState<EventDateRow | null>(null);
  const [flyerUploadingById, setFlyerUploadingById] = useState<Record<number, boolean>>({});
  const [flyerErrorById, setFlyerErrorById] = useState<Record<number, boolean>>({});
  const [editingFechaId, setEditingFechaId] = useState<number | null>(null);
  const [editingFechaValue, setEditingFechaValue] = useState<string>("");
  const [estadoSavingId, setEstadoSavingId] = useState<number | null>(null);
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

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const applyPatch = useCallback(
    async (patch: Record<string, any>, successMsg = "Actualizado ✅") => {
      if (!selectedList.length) return;
      try {
        const res = await bulkUpdate.mutateAsync({ dateIds: selectedList, patch });
        const ids = res.updatedIds || [];
        onRowsPatched?.(ids, patch);
        applyLocalPatch(ids, patch);
        ids.forEach((id) => {
          qc.invalidateQueries({ queryKey: ["event", "date", id] });
          qc.invalidateQueries({ queryKey: ["date", id] });
        });
        qc.invalidateQueries({ queryKey: ["dates"] });
        qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
        qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
        const parentSet = new Set<number>();
        sortedRows.forEach((r) => {
          if (ids.includes(r.id) && r.parent_id != null) parentSet.add(Number(r.parent_id));
        });
        parentSet.forEach((pid) => {
          qc.invalidateQueries({ queryKey: ["dates", pid] });
          qc.invalidateQueries({ queryKey: ["event", "dates", pid] });
        });
        showToast(successMsg, "success");
      } catch (e: any) {
        showToast(e?.message || "Error en bulk update", "error");
      }
    },
    [bulkUpdate, selectedList, onRowsPatched, showToast, applyLocalPatch, qc, sortedRows]
  );

  const selectedRowsForBulk = useMemo(
    () => sortedRows.filter((r) => selectedIds.has(r.id)),
    [sortedRows, selectedIds]
  );

  const selectedRowsForBulkRef = useRef(selectedRowsForBulk);
  selectedRowsForBulkRef.current = selectedRowsForBulk;

  /** Al abrir un panel masivo (time / date / location), precargar con la primera fila seleccionada (orden de la tabla). */
  useEffect(() => {
    if (!bulkPanel) return;
    const rows = selectedRowsForBulkRef.current;
    const first = rows[0];
    if (!first) return;

    if (bulkPanel === "location") {
      setBulkZonasTouched(false);
      const zonasRaw = (first as any).zonas;
      const zonas = Array.isArray(zonasRaw)
        ? zonasRaw.map((n: unknown) => Number(n)).filter((n) => Number.isFinite(n))
        : [];
      setBulkLoc({
        lugar: String((first as any).lugar ?? ""),
        direccion: String((first as any).direccion ?? ""),
        ciudad: String((first as any).ciudad ?? ""),
        referencias: String((first as any).referencias ?? ""),
        zonas,
      });
      return;
    }
    if (bulkPanel === "time") {
      const hi = first.hora_inicio ? String(first.hora_inicio).slice(0, 5) : "";
      const hf = first.hora_fin ? String(first.hora_fin).slice(0, 5) : "";
      setBulkTimeHi(hi);
      setBulkTimeHf(hf);
      return;
    }
    if (bulkPanel === "date") {
      const ymd = resolveDisplayYmd(first);
      setBulkDateYmd(String(ymd || "").split("T")[0] || "");
    }
  }, [bulkPanel]);

  const recurrentSelectedCount = useMemo(
    () => selectedRowsForBulk.filter((r) => isWeeklyRecurrentRow(r as any)).length,
    [selectedRowsForBulk]
  );

  useEffect(() => {
    if (!bulkPanel && !confirmDialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirmDialog) setConfirmDialog(null);
      else if (bulkPanel) setBulkPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bulkPanel, confirmDialog]);

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

  const toggleEstadoPublicacion = useCallback(
    async (row: EventDateRow) => {
      if (!row?.id || estadoSavingId != null) return;
      const next: "borrador" | "publicado" =
        row.estado_publicacion === "publicado" ? "borrador" : "publicado";
      setEstadoSavingId(row.id);
      try {
        await updateRow(
          row.id,
          { estado_publicacion: next },
          next === "publicado" ? "Fecha publicada ✅" : "Guardado como borrador ✅"
        );
      } finally {
        setEstadoSavingId(null);
      }
    },
    [updateRow, estadoSavingId]
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

  const executeRecurrentWeekly = useCallback(async () => {
    if (!canRun) return;
    const selectedRows = sortedRows.filter((r) => selectedIds.has(r.id));
    if (!selectedRows.length) return;
    try {
      let updated = 0;
      let skipped = 0;
      const updatedParentIds = new Set<number>();
      for (const r of selectedRows) {
        const dia = makeDiaSemanaFromFecha((r as any)?.fecha);
        if (dia === null) {
          skipped += 1;
          continue;
        }
        await updateRow(r.id, { dia_semana: dia });
        updated += 1;
        const pid = (r as any)?.parent_id;
        if (pid != null && Number.isFinite(Number(pid))) updatedParentIds.add(Number(pid));
      }
      for (const parentId of updatedParentIds) {
        try {
          await supabase.rpc("ensure_weekly_occurrences", { p_parent_id: parentId, p_weeks_ahead: 13 });
        } catch (e) {
          console.warn("[EventDatesSheet] ensure_weekly_occurrences failed for parent", parentId, e);
        }
      }
      if (updated > 0) {
        qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
        qc.invalidateQueries({ queryKey: ["dates"] });
        showToast(`Recurrentes ✅ (${updated})`, "success");
      }
      if (skipped > 0) showToast(`Algunas filas no tenían fecha válida (omitidas: ${skipped})`, "info");
    } catch (e: any) {
      showToast(e?.message || "Error convirtiendo a recurrente", "error");
    }
  }, [canRun, makeDiaSemanaFromFecha, selectedIds, sortedRows, updateRow, showToast, qc]);

  const makeSelectedRecurrentWeekly = useCallback(() => {
    const selectedRows = sortedRows.filter((r) => selectedIds.has(r.id));
    if (!selectedRows.length) return;
    setConfirmDialog({
      title: "Recurrente semanal",
      message: `¿Convertir ${selectedRows.length} fecha(s) a evento recurrente semanal?\n\nEsto marcará las fechas como recurrente (se limita editar la fecha).`,
      confirmLabel: "Convertir",
      onConfirm: () => executeRecurrentWeekly(),
    });
  }, [sortedRows, selectedIds, executeRecurrentWeekly]);

  const executeRemoveRecurrence = useCallback(async () => {
    if (!canRun) return;
    const selectedRows = sortedRows.filter((r) => selectedIds.has(r.id));
    const recurrentRows = selectedRows.filter(
      (r) => (r as any)?.dia_semana != null && typeof (r as any).dia_semana === "number"
    );
    if (!recurrentRows.length) {
      showToast("Ninguna fila seleccionada es recurrente", "info");
      return;
    }
    try {
      let updated = 0;
      for (const r of recurrentRows) {
        const dia = (r as any).dia_semana as number;
        const hora = (r as any).hora_inicio || "20:00";
        const next = calculateNextDateWithTime(dia, hora);
        const y = next.getFullYear();
        const m = String(next.getMonth() + 1).padStart(2, "0");
        const d = String(next.getDate()).padStart(2, "0");
        const fechaYmd = `${y}-${m}-${d}`;
        await updateRow(r.id, { dia_semana: null, fecha: fechaYmd });
        updated += 1;
      }
      if (updated > 0) {
        qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
        qc.invalidateQueries({ queryKey: ["dates"] });
        showToast(`Recurrencia quitada ✅ (${updated})`, "success");
      }
    } catch (e: any) {
      showToast(e?.message || "Error quitando recurrencia", "error");
    }
  }, [canRun, selectedIds, sortedRows, updateRow, showToast, qc]);

  const removeRecurrenceFromSelected = useCallback(() => {
    const selectedRows = sortedRows.filter((r) => selectedIds.has(r.id));
    const recurrentRows = selectedRows.filter(
      (r) => (r as any)?.dia_semana != null && typeof (r as any).dia_semana === "number"
    );
    if (!recurrentRows.length) {
      showToast("Ninguna fila seleccionada es recurrente", "info");
      return;
    }
    setConfirmDialog({
      title: "Quitar recurrencia",
      message: `¿Quitar recurrencia en ${recurrentRows.length} fecha(s)? Se asignará la próxima ocurrencia como fecha fija.`,
      confirmLabel: "Quitar recurrencia",
      danger: true,
      onConfirm: () => executeRemoveRecurrence(),
    });
  }, [sortedRows, selectedIds, executeRemoveRecurrence, showToast]);

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

  const handleBulkFlyerPick = useCallback(() => {
    bulkFlyerInputRef.current?.click();
  }, []);

  const handleBulkFlyerFileChange = useCallback((file?: File | null) => {
    if (!file) return;
    setBulkFlyerFile(file);
    setBulkFlyerPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  const closeBulkFlyerPanel = useCallback(() => {
    setBulkFlyerPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setBulkFlyerFile(null);
    if (bulkFlyerInputRef.current) bulkFlyerInputRef.current.value = "";
    setBulkPanel(null);
  }, []);

  const executeBulkFlyerUpload = useCallback(async () => {
    if (!bulkFlyerFile || !selectedList.length) return;
    setBulkFlyerBusy(true);
    try {
      const first = sortedRows.find((r) => r.id === selectedList[0]);
      if (!first) return;
      const url = await uploadEventFlyer({
        file: bulkFlyerFile,
        parentId: first.parent_id ?? null,
        dateId: first.id,
      });
      const { error } = await supabase.from("events_date").update({ flyer_url: url }).in("id", selectedList);
      if (error) throw error;
      onRowsPatched?.(selectedList, { flyer_url: url });
      applyLocalPatch(selectedList, { flyer_url: url });
      selectedList.forEach((id) => {
        qc.invalidateQueries({ queryKey: ["event", "date", id] });
        qc.invalidateQueries({ queryKey: ["date", id] });
      });
      qc.invalidateQueries({ queryKey: ["dates"] });
      qc.invalidateQueries({ queryKey: ["event-dates", "by-organizer"] });
      qc.invalidateQueries({ queryKey: ["event-parents", "by-organizer"] });
      const parentSet = new Set<number>();
      sortedRows.forEach((r) => {
        if (selectedList.includes(r.id) && r.parent_id != null) parentSet.add(Number(r.parent_id));
      });
      parentSet.forEach((pid) => {
        qc.invalidateQueries({ queryKey: ["dates", pid] });
        qc.invalidateQueries({ queryKey: ["event", "dates", pid] });
      });
      showToast("Flyer aplicado a todas las fechas seleccionadas ✅", "success");
      closeBulkFlyerPanel();
    } catch (e: any) {
      console.error("[EventDatesSheet] bulk flyer error:", e);
      showToast(e?.message || "Error subiendo flyer", "error");
    } finally {
      setBulkFlyerBusy(false);
    }
  }, [
    bulkFlyerFile,
    selectedList,
    sortedRows,
    onRowsPatched,
    applyLocalPatch,
    qc,
    showToast,
    closeBulkFlyerPanel,
  ]);

  const applyBulkFlyer = useCallback(() => {
    if (!bulkFlyerFile || !selectedList.length) {
      showToast("Selecciona una imagen", "info");
      return;
    }
    setConfirmDialog({
      title: "Aplicar flyer",
      message: `¿Aplicar este flyer a ${selectedList.length} fecha(s)? Se reemplazará la imagen en todas.`,
      confirmLabel: "Aplicar flyer",
      onConfirm: () => executeBulkFlyerUpload(),
    });
  }, [bulkFlyerFile, selectedList.length, showToast, executeBulkFlyerUpload]);

  const applyBulkTime = useCallback(() => {
    const patch: Record<string, any> = {};
    if (bulkTimeHi) patch.hora_inicio = bulkTimeHi;
    if (bulkTimeHf) patch.hora_fin = bulkTimeHf;
    if (!Object.keys(patch).length) {
      showToast("Indica al menos hora de inicio o fin", "info");
      return;
    }
    const err = validateHoraOrder(
      patch.hora_inicio ?? undefined,
      patch.hora_fin ?? undefined
    );
    if (err) {
      showToast(err, "error");
      return;
    }
    void applyPatch(patch, "Horario actualizado ✅");
    setBulkPanel(null);
  }, [bulkTimeHi, bulkTimeHf, applyPatch, showToast]);

  const applyBulkDate = useCallback(() => {
    const ymd = bulkDateYmd.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      showToast("Fecha inválida (usa YYYY-MM-DD)", "error");
      return;
    }
    let message = `¿Aplicar la fecha ${ymd} a ${selectedList.length} evento(s)?`;
    if (recurrentSelectedCount > 0) {
      message += `\n\n${recurrentSelectedCount} ${
        recurrentSelectedCount === 1 ? "es recurrente" : "son recurrentes"
      }: se quitará la recurrencia semanal (pasan a fecha fija).`;
    }
    setConfirmDialog({
      title: "Cambiar fecha",
      message,
      confirmLabel: "Aplicar",
      onConfirm: async () => {
        await applyPatch({ fecha: ymd, dia_semana: null }, "Fechas actualizadas ✅");
        setBulkPanel(null);
      },
    });
  }, [bulkDateYmd, selectedList.length, recurrentSelectedCount, applyPatch, showToast]);

  const applyBulkLocation = useCallback(() => {
    const textPatch = buildLocationBulkPatchFromFilled({
      lugar: bulkLoc.lugar,
      direccion: bulkLoc.direccion,
      ciudad: bulkLoc.ciudad,
      referencias: bulkLoc.referencias,
    });
    const patch: Record<string, any> = { ...textPatch };
    if (bulkZonasTouched) {
      patch.zonas = bulkLoc.zonas;
    }
    if (!Object.keys(patch).length) {
      showToast("Completa al menos un campo de ubicación o elige una o más zonas", "info");
      return;
    }
    setConfirmDialog({
      title: "Cambiar ubicación",
      message: `¿Aplicar estos datos a ${selectedList.length} evento(s)? Solo se actualizan los campos que indiques (texto y/o zonas).`,
      confirmLabel: "Aplicar",
      onConfirm: async () => {
        await applyPatch(patch as Record<string, any>, "Ubicación actualizada ✅");
        setBulkPanel(null);
      },
    });
  }, [bulkLoc, bulkZonasTouched, selectedList.length, applyPatch, showToast]);

  const applyBulkEstado = useCallback(
    (est: "publicado" | "borrador") => {
      const isPub = est === "publicado";
      setConfirmDialog({
        title: isPub ? "Publicar eventos" : "Pasar a borrador",
        message: `Se actualizará el estado de ${selectedList.length} evento(s) a ${isPub ? "publicado" : "borrador"}.`,
        confirmLabel: isPub ? "Publicar" : "Usar borrador",
        onConfirm: async () => {
          await applyPatch(
            { estado_publicacion: est },
            isPub ? "Eventos publicados ✅" : "Guardados como borrador ✅"
          );
          setBulkPanel(null);
        },
      });
    },
    [selectedList.length, applyPatch]
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
          min-height: 140px;
          width: 100%;
          max-width: 100%;
          /* Don't trap scroll on desktop; allow scroll to bubble to the page when needed */
          overscroll-behavior: auto;
          scrollbar-gutter: stable;
        }
        @media (max-height: 500px) {
          .eds-scroll { max-height: 55vh; }
        }
        /* Table structure: header + body of rows, full width, aligned columns */
        .eds-scroll .eds-minWidth {
          min-width: 860px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .eds-table {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 0;
        }
        .eds-table__body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          min-width: 0;
        }
        .eds-grid {
          /* Column widths for header + rows */
          --eds-flyer-col: 64px;
          --eds-estado-col: 64px;
          --eds-actions-col: 140px;
          /* ↓ Reduce Evento/Lugar widths and let them wrap to 2 lines */
          --eds-event-col: 165px;
          --eds-date-col: 140px;
          --eds-hora-col: minmax(120px, 1fr);
          --eds-place-col: minmax(160px, 1fr);
          --eds-cols: 42px var(--eds-event-col) var(--eds-date-col) var(--eds-hora-col) var(--eds-place-col) var(--eds-flyer-col) var(--eds-estado-col) var(--eds-actions-col);
        }
        /* Regla crítica: header y filas usan el mismo grid y padding para alineación exacta. */
        .eds-grid.eds-header,
        .eds-grid.eds-row {
          display: grid;
          grid-template-columns: var(--eds-cols);
          gap: 10px;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding-left: 10px;
          padding-right: 10px;
        }
        .eds-grid.eds-row {
          grid-template-rows: auto;
          grid-auto-flow: column;
          flex-shrink: 0;
          padding-top: 10px;
          padding-bottom: 10px;
        }
        .eds-grid.eds-header {
          padding-top: 10px;
          padding-bottom: 10px;
        }
        /* Ensure Estado/Acciones never collapse */
        .eds-cellFlyer { min-width: var(--eds-flyer-col); }
        .eds-cellEstado { min-width: var(--eds-estado-col); }
        .eds-cellActions { min-width: var(--eds-actions-col); }
        .eds-cellHora { min-width: var(--eds-hora-col); }
        .eds-hHora { min-width: var(--eds-hora-col); }
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

        /* Bulk actions (responsive) — OrganizerProfileEditor: selección múltiple */
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
        .eds-actionsBar--sticky {
          position: sticky;
          top: 0;
          z-index: 5;
          backdrop-filter: blur(10px);
        }
        .eds-actionsBar__top {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        @media (max-width: 520px) {
          .eds-actionsBar__top {
            flex-direction: column;
            align-items: stretch;
          }
          .eds-actionsBar__cancel {
            width: 100%;
            justify-content: center;
          }
        }
        .eds-actionsBar__count {
          font-size: 14px;
          font-weight: 800;
          color: #fff;
        }
        .eds-actionsBar__cancel {
          min-height: 44px;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.06);
          color: #fff;
          cursor: pointer;
          font-weight: 800;
          font-size: 13px;
        }
        .eds-actionsChips {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          scroll-snap-type: x proximity;
          padding: 4px 4px 8px;
          scrollbar-width: thin;
        }
        .eds-chipBtn {
          flex: 0 0 auto;
          min-height: 44px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.22);
          background: #1a1f2b;
          color: #fff;
          cursor: pointer;
          font-weight: 900;
          font-size: 13px;
          white-space: nowrap;
          scroll-snap-align: start;
          touch-action: manipulation;
        }
        .eds-chipBtn:disabled { opacity: 0.55; cursor: not-allowed; }
        .eds-chipBtnPrimary {
          border-color: rgba(39,195,255,0.75);
          background: #1E88E5;
        }
        .eds-chipBtnDanger {
          border-color: rgba(255,61,87,0.75);
          background: #FF3D57;
        }
        .eds-bulkOverlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: rgba(0,0,0,0.55);
          padding: 0;
        }
        @media (min-width: 560px) {
          .eds-bulkOverlay { align-items: center; padding: 16px; }
        }
        .eds-bulkOverlay.eds-bulkOverlay--confirm {
          z-index: 70;
        }
        .eds-bulkSheet {
          width: 100%;
          max-width: 440px;
          max-height: min(88vh, 620px);
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          background: #1a1f2b;
          border-top-left-radius: 18px;
          border-top-right-radius: 18px;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 -12px 40px rgba(0,0,0,0.45);
        }
        @media (min-width: 560px) {
          .eds-bulkSheet { border-radius: 18px; }
        }
        .eds-bulkSheet__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          position: sticky;
          top: 0;
          background: rgba(26,31,43,0.96);
          z-index: 1;
        }
        .eds-bulkSheet__title { margin: 0; font-size: 17px; font-weight: 900; color: #fff; }
        .eds-bulkSheet__close {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.06);
          color: #fff;
          cursor: pointer;
          font-size: 22px;
          line-height: 1;
          flex-shrink: 0;
        }
        .eds-bulkSheet__body { padding: 0 16px 16px; }
        .eds-bulkSheet__footer { padding: 12px 16px 16px; border-top: 1px solid rgba(255,255,255,0.08); }
        .eds-bulkHint { font-size: 12px; opacity: 0.85; color: #fff; margin: 0 0 10px; line-height: 1.4; }
        .eds-bulkField { margin-bottom: 12px; }
        /* Dos columnas por defecto; en pantallas estrechas pasa a una columna */
        .eds-actionsInputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          align-items: end;
          width: 100%;
          min-width: 0;
        }
        .eds-actionsInputs > * {
          min-width: 0;
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
          .eds-actionsInputs { grid-template-columns: 1fr 1fr; }
          .eds-actionBtn { flex: 1 1 auto; }
        }
        @media (max-width: 520px) {
          .eds-actionsInputs { grid-template-columns: 1fr 1fr; gap: 10px; }
          .eds-actionBtn { width: 100%; justify-content: center; }
        }
        @media (max-width: 720px) {
          .eds-minWidth { min-width: 710px; }
          /* Give more room to "Evento" on mobile */
          .eds-grid { --eds-flyer-col: 56px; --eds-estado-col: 56px; --eds-actions-col: 132px; --eds-event-col: 160px; --eds-date-col: 132px; --eds-hora-col: minmax(108px, 1fr); --eds-place-col: minmax(160px, 1fr); --eds-cols: 36px var(--eds-event-col) var(--eds-date-col) var(--eds-hora-col) var(--eds-place-col) var(--eds-flyer-col) var(--eds-estado-col) var(--eds-actions-col); }
          .eds-iconBtn{ width: 36px; height: 36px; border-radius: 999px; }
        }
        @media (max-width: 520px) {
          .eds-minWidth { min-width: 560px; }
          .eds-place { display: none; }
          .eds-grid { --eds-flyer-col: 56px; --eds-estado-col: 56px; --eds-actions-col: 132px; --eds-event-col: minmax(180px, 1fr); --eds-date-col: 110px; --eds-hora-col: minmax(100px, 1fr); --eds-cols: 36px var(--eds-event-col) var(--eds-date-col) var(--eds-hora-col) var(--eds-flyer-col) var(--eds-estado-col) var(--eds-actions-col); }
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

      {selectedCount === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 12 }} role="status" aria-live="polite">
          Selecciona una o más fechas con la casilla para ver acciones masivas.
        </div>
      ) : null}

      <input
        id="eds-flyer-input"
        type="file"
        accept="image/png, image/jpeg, image/webp"
        style={{ display: "none" }}
        onChange={(e) => handleFlyerFile(e.target.files?.[0])}
      />

      <input
        ref={bulkFlyerInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        style={{ display: "none" }}
        aria-hidden
        onChange={(e) => handleBulkFlyerFileChange(e.target.files?.[0])}
      />

      {selectedCount > 0 ? (
        <div className="eds-actionsBar eds-actionsBar--sticky" role="region" aria-label="Acciones masivas">
          <div className="eds-actionsBar__top">
            <div className="eds-actionsBar__count" aria-live="polite">
              {selectedCount === 1 ? "1 evento seleccionado" : `${selectedCount} eventos seleccionados`}
            </div>
            <button type="button" className="eds-actionsBar__cancel" onClick={clearSelection}>
              Cancelar selección
            </button>
          </div>
          <div className="eds-actionsChips" role="toolbar" aria-label="Acciones en lote">
            <button
              type="button"
              className="eds-chipBtn eds-chipBtnPrimary"
              disabled={!canRun}
              onClick={() => setBulkPanel("time")}
            >
              🕐 Horario
            </button>
            <button
              type="button"
              className="eds-chipBtn eds-chipBtnPrimary"
              disabled={!canRun}
              onClick={() => setBulkPanel("date")}
            >
              📅 Día
            </button>
            <button
              type="button"
              className="eds-chipBtn"
              disabled={!canRun}
              onClick={() => setBulkPanel("location")}
            >
              📍 Ubicación
            </button>
            <button
              type="button"
              className="eds-chipBtn"
              disabled={!canRun}
              onClick={() => setBulkPanel("estado")}
            >
              🌐 Estado
            </button>
            <button
              type="button"
              className="eds-chipBtn"
              disabled={!canRun}
              onClick={() => setBulkPanel("flyer")}
            >
              🖼 Flyer
            </button>
            <button
              type="button"
              className="eds-chipBtn"
              disabled={!canRun}
              onClick={() => setBulkPanel("more")}
            >
              ⋯ Más
            </button>
          </div>
        </div>
      ) : null}

      {/* Table: header (sticky) + body of full-width rows aligned to columns */}
      <div className="eds-scroll">
        <div className="eds-minWidth">
          <div className="eds-table" role="table" aria-label="Fechas del evento">
            <div className="eds-grid eds-header" style={{ display: "grid", opacity: 0.9, fontSize: 12, marginBottom: 8, color: "#fff" }} role="row">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }} role="columnheader">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => setAll(e.target.checked)}
                  aria-label={allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
              </div>
              <div role="columnheader">Evento</div>
              <div role="columnheader">Fecha</div>
              <div className="eds-hHora" role="columnheader">
                Hora
              </div>
              <div className="eds-place" role="columnheader">Lugar</div>
              <div className="eds-hFlyer" role="columnheader">Flyer</div>
              <div className="eds-hEstado" role="columnheader">Estado</div>
              <div className="eds-hActions" role="columnheader">Acciones</div>
            </div>
            {isLoading && (
              <div style={{ color: "rgba(255,255,255,0.8)", padding: 12 }}>Cargando…</div>
            )}
            {!isLoading && sortedRows.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.8)", padding: 12 }}>No hay fechas.</div>
            )}
            <div className="eds-table__body" role="rowgroup">
            {!isLoading && sortedRows.map((r) => (
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
                onToggleEstadoPublicacion={toggleEstadoPublicacion}
                estadoRowBusyId={estadoSavingId}
              />
            ))}
            </div>
          </div>
        </div>
      </div>

      {bulkPanel === "time" && (
        <BulkSheetOverlay
          title="Cambiar horario"
          onClose={() => setBulkPanel(null)}
          footer={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" className="eds-actionBtn" onClick={() => setBulkPanel(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="eds-actionBtn eds-actionBtnPrimary"
                disabled={bulkUpdate.isPending}
                onClick={applyBulkTime}
              >
                {bulkUpdate.isPending ? "Aplicando…" : "Aplicar a seleccionadas"}
              </button>
            </div>
          }
        >
          <p className="eds-bulkHint">
            Deja vacío lo que no quieras cambiar. Si indicas inicio y fin, el fin debe ser posterior al inicio.
          </p>
          {selectedRowsForBulk.length > 1 ? (
            <p className="eds-bulkHint" style={{ opacity: 0.9 }}>
              Valores iniciales según la primera fila seleccionada (orden actual de la tabla).
            </p>
          ) : null}
          <div className="eds-actionsInputs" style={{ marginTop: 8 }}>
            <div>
              <div className="eds-fieldLabel">Hora inicio</div>
              <input
                className="eds-timeInput"
                type="time"
                value={bulkTimeHi}
                onChange={(e) => setBulkTimeHi(e.target.value)}
                aria-label="Nueva hora de inicio"
              />
            </div>
            <div>
              <div className="eds-fieldLabel">Hora fin</div>
              <input
                className="eds-timeInput"
                type="time"
                value={bulkTimeHf}
                onChange={(e) => setBulkTimeHf(e.target.value)}
                aria-label="Nueva hora de fin"
              />
            </div>
          </div>
        </BulkSheetOverlay>
      )}

      {bulkPanel === "date" && (
        <BulkSheetOverlay
          title="Cambiar día / fecha"
          onClose={() => setBulkPanel(null)}
          footer={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" className="eds-actionBtn" onClick={() => setBulkPanel(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="eds-actionBtn eds-actionBtnPrimary"
                disabled={bulkUpdate.isPending}
                onClick={applyBulkDate}
              >
                {bulkUpdate.isPending ? "Aplicando…" : "Aplicar a seleccionadas"}
              </button>
            </div>
          }
        >
          <p className="eds-bulkHint">Nueva fecha aplicada a todas las filas seleccionadas (formato del calendario).</p>
          {selectedRowsForBulk.length > 1 ? (
            <p className="eds-bulkHint" style={{ opacity: 0.9 }}>
              Fecha inicial según la primera fila seleccionada (orden actual de la tabla).
            </p>
          ) : null}
          {recurrentSelectedCount > 0 ? (
            <p className="eds-bulkHint" style={{ color: "#ffd166" }}>
              Incluyes {recurrentSelectedCount} fecha(s) recurrentes: al guardar se quita la recurrencia semanal y quedan como
              fecha fija.
            </p>
          ) : null}
          <div className="eds-bulkField">
            <div className="eds-fieldLabel">Nueva fecha</div>
            <input
              className="eds-timeInput"
              type="date"
              value={bulkDateYmd}
              onChange={(e) => setBulkDateYmd(e.target.value)}
              aria-label="Nueva fecha para eventos seleccionados"
            />
          </div>
        </BulkSheetOverlay>
      )}

      {bulkPanel === "location" && (
        <BulkSheetOverlay
          title="Cambiar ubicación"
          onClose={() => setBulkPanel(null)}
          footer={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" className="eds-actionBtn" onClick={() => setBulkPanel(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="eds-actionBtn eds-actionBtnPrimary"
                disabled={bulkUpdate.isPending}
                onClick={applyBulkLocation}
              >
                {bulkUpdate.isPending ? "Aplicando…" : "Aplicar a seleccionadas"}
              </button>
            </div>
          }
        >
          <p className="eds-bulkHint">
            Solo se actualizan los campos que rellenes (lugar, dirección, ciudad, referencias y/o zonas en la base de datos).
          </p>
          {selectedRowsForBulk.length > 1 ? (
            <p className="eds-bulkHint" style={{ opacity: 0.9 }}>
              Valores iniciales según la primera fila seleccionada (orden actual de la tabla).
            </p>
          ) : null}
          <div className="eds-bulkField">
            <div className="eds-fieldLabel">Zonas</div>
            <p className="eds-bulkHint" style={{ marginTop: 0, marginBottom: 8 }}>
              Opcional. Si eliges zonas, se aplican a todas las fechas seleccionadas (reemplazan las zonas de esas filas).
            </p>
            <div style={{ marginTop: 4 }}>
              <ZonaGroupedChips
                mode="edit"
                allTags={zonaTagsForBulk}
                selectedIds={bulkLoc.zonas}
                onToggle={(id) => {
                  setBulkZonasTouched(true);
                  setBulkLoc((p) => {
                    const cur = p.zonas || [];
                    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
                    return { ...p, zonas: next };
                  });
                }}
                size="compact"
              />
            </div>
          </div>
          <div className="eds-bulkField">
            <div className="eds-fieldLabel">Lugar</div>
            <input
              className="eds-timeInput"
              value={bulkLoc.lugar}
              onChange={(e) => setBulkLoc((p) => ({ ...p, lugar: e.target.value }))}
              autoComplete="off"
            />
          </div>
          <div className="eds-bulkField">
            <div className="eds-fieldLabel">Dirección</div>
            <input
              className="eds-timeInput"
              value={bulkLoc.direccion}
              onChange={(e) => setBulkLoc((p) => ({ ...p, direccion: e.target.value }))}
              autoComplete="street-address"
            />
          </div>
          <div className="eds-bulkField">
            <div className="eds-fieldLabel">Ciudad</div>
            <input
              className="eds-timeInput"
              value={bulkLoc.ciudad}
              onChange={(e) => setBulkLoc((p) => ({ ...p, ciudad: e.target.value }))}
              autoComplete="address-level2"
            />
          </div>
          <div className="eds-bulkField">
            <div className="eds-fieldLabel">Referencias</div>
            <input
              className="eds-timeInput"
              value={bulkLoc.referencias}
              onChange={(e) => setBulkLoc((p) => ({ ...p, referencias: e.target.value }))}
              autoComplete="off"
            />
          </div>
        </BulkSheetOverlay>
      )}

      {bulkPanel === "estado" && (
        <BulkSheetOverlay title="Estado de publicación" onClose={() => setBulkPanel(null)}>
          <p className="eds-bulkHint">Se pedirá confirmación antes de aplicar a todas las fechas seleccionadas.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            <button
              type="button"
              className="eds-actionBtn eds-actionBtnPrimary"
              style={{ minHeight: 48, width: "100%" }}
              disabled={bulkUpdate.isPending}
              onClick={() => applyBulkEstado("publicado")}
            >
              🌐 Publicado
            </button>
            <button
              type="button"
              className="eds-actionBtn"
              style={{ minHeight: 48, width: "100%" }}
              disabled={bulkUpdate.isPending}
              onClick={() => applyBulkEstado("borrador")}
            >
              📝 Borrador
            </button>
          </div>
        </BulkSheetOverlay>
      )}

      {bulkPanel === "flyer" && (
        <BulkSheetOverlay
          title="Cambiar flyer"
          onClose={closeBulkFlyerPanel}
          footer={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="eds-actionBtn"
                onClick={closeBulkFlyerPanel}
                disabled={bulkFlyerBusy}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="eds-actionBtn eds-actionBtnPrimary"
                disabled={bulkFlyerBusy || !bulkFlyerFile}
                onClick={() => void applyBulkFlyer()}
              >
                {bulkFlyerBusy ? "Subiendo…" : "Aplicar a todas"}
              </button>
            </div>
          }
        >
          <p className="eds-bulkHint">
            Se usa el mismo flujo de subida que el flyer por fila: una sola subida y la misma URL en todas las fechas
            seleccionadas.
          </p>
          <button type="button" className="eds-actionBtn eds-actionBtnPrimary" style={{ width: "100%", minHeight: 44 }} onClick={handleBulkFlyerPick}>
            Elegir imagen
          </button>
          {bulkFlyerPreviewUrl ? (
            <img
              src={bulkFlyerPreviewUrl}
              alt="Vista previa del flyer"
              style={{ width: "100%", maxHeight: 220, objectFit: "contain", marginTop: 12, borderRadius: 12 }}
            />
          ) : (
            <p className="eds-bulkHint" style={{ marginTop: 10 }}>
              Sin imagen aún.
            </p>
          )}
        </BulkSheetOverlay>
      )}

      {confirmDialog && (
        <BulkSheetOverlay
          title={confirmDialog.title}
          titleId="eds-confirm-title"
          overlayClassName="eds-bulkOverlay eds-bulkOverlay--confirm"
          onClose={() => setConfirmDialog(null)}
          footer={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" className="eds-actionBtn" onClick={() => setConfirmDialog(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className={
                  confirmDialog.danger ? "eds-actionBtn eds-actionBtnDanger" : "eds-actionBtn eds-actionBtnPrimary"
                }
                onClick={async () => {
                  const cfg = confirmDialog;
                  setConfirmDialog(null);
                  await Promise.resolve(cfg.onConfirm());
                }}
              >
                {confirmDialog.confirmLabel || "Confirmar"}
              </button>
            </div>
          }
        >
          <p className="eds-bulkHint" style={{ whiteSpace: "pre-line" }}>
            {confirmDialog.message}
          </p>
        </BulkSheetOverlay>
      )}

      {bulkPanel === "more" && (
        <BulkSheetOverlay title="Más acciones" onClose={() => setBulkPanel(null)}>
          <p className="eds-bulkHint">
            Recurrencia y &quot;frecuente&quot; tienen reglas especiales; el detalle técnico para futuros cambios está en el
            hook useBulkEventDateActions. Aquí están las mismas acciones que antes en la barra completa.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="eds-actionBtn"
              disabled={!canRun}
              onClick={() => {
                setBulkPanel(null);
                queueMicrotask(() => void makeSelectedRecurrentWeekly());
              }}
              title="Convierte las fechas seleccionadas a recurrente semanal (usa el día de la semana de cada fecha)"
            >
              🔁 Recurrente
            </button>
            <button
              type="button"
              className="eds-actionBtn"
              disabled={!canRun}
              onClick={() => {
                setBulkPanel(null);
                queueMicrotask(() => void removeRecurrenceFromSelected());
              }}
              title="Quitar recurrencia semanal: asigna la próxima ocurrencia como fecha fija"
            >
              🚫 Quitar recurrencia
            </button>
            <button
              type="button"
              className="eds-actionBtn eds-actionBtnPrimary"
              disabled={!canRun || !onStartFrecuentes}
              onClick={() => {
                setBulkPanel(null);
                queueMicrotask(() => startFrecuentesFromSelection());
              }}
              title={onStartFrecuentes ? "Usar una fecha como plantilla para planificador de frecuentes" : "No disponible aquí"}
            >
              📋 Frecuente
            </button>
            <button
              type="button"
              className="eds-actionBtn eds-actionBtnDanger"
              disabled={!canRun || (!onDeleteRow && !onDeleteRows)}
              onClick={() => {
                setBulkPanel(null);
                if (!selectedList.length) return;
                if (!onDeleteRow && !onDeleteRows) return;
                setConfirmDialog({
                  title: "Eliminar fechas",
                  message: `¿Eliminar ${selectedList.length} fecha(s) seleccionada(s)? Esta acción no se puede deshacer.`,
                  confirmLabel: "Eliminar",
                  danger: true,
                  onConfirm: async () => {
                    try {
                      setBulkDeleting(true);
                      const selRows = sortedRows.filter((r) => selectedIds.has(r.id));
                      if (onDeleteRows) {
                        await Promise.resolve(onDeleteRows(selRows));
                      } else if (onDeleteRow) {
                        for (const r of selRows) {
                          await Promise.resolve(onDeleteRow(r));
                        }
                      }
                      setSelectedIds(new Set());
                      showToast("Eliminadas ✅", "success");
                    } catch (e: any) {
                      showToast(e?.message || "Error eliminando seleccionadas", "error");
                    } finally {
                      setBulkDeleting(false);
                    }
                  },
                });
              }}
            >
              {bulkDeleting ? "Eliminando…" : "🗑️ Eliminar seleccionadas"}
            </button>
          </div>
        </BulkSheetOverlay>
      )}
    </Wrapper>
  );
}

