// path: src/components/events/EventCreateForm.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, FileText, Globe, Image, MapPin, Music } from "lucide-react";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useTags } from "../../hooks/useTags";
import { useToast } from "../Toast";
import { useHydratedForm } from "../../hooks/useHydratedForm";
import ScheduleEditor from "./ScheduleEditor";
import DateFlyerUploader from "./DateFlyerUploader";
import { MediaGrid } from "../MediaGrid";
import { MediaUploader } from "../MediaUploader";
import { useEventParentMedia } from "../../hooks/useEventParentMedia";
import RitmosChips from "../RitmosChips";
import { RITMOS_CATALOG } from "../../lib/ritmosCatalog";
import UbicacionesEditor from "../academy/UbicacionesEditor";
import { useOrganizerLocations, type OrganizerLocation } from "../../hooks/useOrganizerLocations";
import type { AcademyLocation } from "../../types/academy";
import { calculateNextDateWithTime } from "../../utils/calculateRecurringDates";
import ZonaGroupedChips from "../profile/ZonaGroupedChips";
import "../../styles/eventCreateForm.css";

type EventCreateFormProps =
  | {
      mode: "parent";
      parent?: any;
      onSubmit: (values: any) => Promise<any>;
      onSuccess?: (eventId: number) => void;
      onCancel?: () => void;
      showHeader?: boolean;
      style?: React.CSSProperties;
      className?: string;
    }
  | {
      mode: "date";
      date?: any;
      parentId: number;
      onSubmit: (values: any) => Promise<any>;
      onSuccess?: (eventId: number) => void;
      onCancel?: () => void;
      showHeader?: boolean;
      style?: React.CSSProperties;
      className?: string;
    };

export default function EventCreateForm(props: EventCreateFormProps) {
  const navigate = useNavigate();
  const { data: organizer } = useMyOrganizer();
  const { showToast } = useToast();
  const { data: orgLocations = [] } = useOrganizerLocations((organizer as any)?.id);

  const isParent = props.mode === "parent";
  const initialData = isParent ? (props as any).parent : (props as any).date;

  const hasId = !!initialData?.id;
  const isEditing = !!initialData && hasId;

  // ✅ Parent media hook: call always, but enable only when needed (avoid conditional hook call)
  const parentMedia = useEventParentMedia(isParent && isEditing ? initialData?.id : undefined);

  // Safety: no "return" before hooks. Keep rendering minimal UI if needed.
  const isLoadingInitial = !initialData && isEditing;

  // Form hydration
  const { form: values, setField: setValue, dirty: isDirty, setFromServer: reset } = useHydratedForm({
    draftKey: isParent
      ? `event-parent-${(props as any)?.parent?.id || "new"}-${isEditing ? "edit" : "create"}`
      : `event-date-${(props as any)?.date?.id || "new"}-${(props as any)?.parentId}-${isEditing ? "edit" : "create"}`,
    serverData: initialData,
    defaults: {
      // Common
      nombre: "",
      biografia: "",
      estilos: [],
      ritmos_seleccionados: [] as string[],
      zonas: [],
      media: [],

      // Parent-specific
      sede_general: "",
      faq: [],

      // Date-specific
      fecha: "",
      hora_inicio: "",
      hora_fin: "",
      lugar: "",
      direccion: "",
      ciudad: "",
      zona: null as number | null,
      referencias: "",
      cronograma: [],
      costos: [],
      flyer_url: null as string | null,
      estado_publicacion: "borrador",
      ubicaciones: [] as any[],
      dia_semana: null as number | null,
    },
    preferDraft: true,
  });

  // Tags for mapping
  const { data: allTags } = useTags();
  const ritmoTags = useMemo(() => (allTags?.filter((tag: any) => tag.tipo === "ritmo") ?? []), [allTags]);
  const zonaTags = useMemo(() => (allTags?.filter((tag: any) => tag.tipo === "zona") ?? []), [allTags]);

  // Allowed catalog ids
  const { data: myOrg } = useMyOrganizer();
  const allowedCatalogIds = (((myOrg as any)?.ritmos_seleccionados || []) as string[]) || [];

  // ✅ keep ritmos_seleccionados inside allowed list
  useEffect(() => {
    if (!allowedCatalogIds.length) return;
    const current = (((values as any)?.ritmos_seleccionados || []) as string[]).filter(Boolean);
    const filtered = current.filter((id) => allowedCatalogIds.includes(id));
    if (filtered.length !== current.length) {
      setValue("ritmos_seleccionados" as any, filtered as any);
    }
  }, [allowedCatalogIds, setValue, (values as any)?.ritmos_seleccionados]);

  // Locations helpers
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [zonesExpanded, setZonesExpanded] = useState(false);
  const hasPrefilledLocations = useRef(false);

  useEffect(() => setZonesExpanded(false), [selectedLocationId, (values as any)?.zonas]);

  const selectedLocation = useMemo(() => {
    if (!selectedLocationId) return null;
    return orgLocations.find((loc: any) => String(loc.id ?? "") === String(selectedLocationId)) || null;
  }, [selectedLocationId, orgLocations]);

  const mapOrganizerLocationToUbicacion = useCallback((loc?: OrganizerLocation | null) => {
    if (!loc) return null;

    const zonaIds = Array.isArray((loc as any)?.zona_ids)
      ? ((loc as any).zona_ids as number[]).filter((id) => typeof id === "number")
      : typeof (loc as any)?.zona_id === "number"
      ? [(loc as any).zona_id]
      : [];

    return {
      sede: (loc as any).nombre || (loc as any)?.sede || "",
      nombre: (loc as any).nombre || (loc as any)?.sede || "",
      direccion: (loc as any).direccion || "",
      ciudad: (loc as any).ciudad || "",
      referencias: (loc as any).referencias || "",
      zona_id: zonaIds.length ? zonaIds[0] : null,
      zonas: zonaIds,
      zonaIds,
    } as AcademyLocation;
  }, []);

  const applyOrganizerLocationToForm = useCallback(
    (loc?: OrganizerLocation | null) => {
      if (!loc) return;

      setSelectedLocationId(loc.id ? String(loc.id) : "");
      setValue("lugar", (loc as any).nombre || "");
      setValue("direccion", (loc as any).direccion || "");
      setValue("ciudad", (loc as any).ciudad || "");
      setValue("referencias", (loc as any).referencias || "");

      const zonaIds = Array.isArray((loc as any)?.zona_ids)
        ? ((loc as any).zona_ids as number[]).filter((id) => typeof id === "number")
        : typeof (loc as any)?.zona_id === "number"
        ? [(loc as any).zona_id]
        : [];

      if (typeof (loc as any)?.zona_id === "number") setValue("zona" as any, (loc as any).zona_id as any);
      if (zonaIds.length) setValue("zonas" as any, zonaIds as any);

      const ubicacion = mapOrganizerLocationToUbicacion(loc);
      if (ubicacion) setValue("ubicaciones" as any, [ubicacion] as any);
    },
    [mapOrganizerLocationToUbicacion, setValue]
  );

  const clearLocationSelection = useCallback(() => {
    setSelectedLocationId("");
    setValue("lugar", "");
    setValue("direccion", "");
    setValue("ciudad", "");
    setValue("referencias", "");
    setValue("ubicaciones" as any, [] as any);
  }, [setValue]);

  const handleUbicacionesChange = useCallback(
    (list: AcademyLocation[]) => {
      setValue("ubicaciones" as any, list as any);
      const primary = list[0];

      if (primary) {
        setValue("lugar", primary.sede || "");
        setValue("direccion", primary.direccion || "");
        setValue("ciudad", primary.ciudad || "");
        setValue("referencias", primary.referencias || "");
        if (typeof (primary as any).zona_id === "number") setValue("zona" as any, (primary as any).zona_id as any);
      } else {
        setValue("lugar", "");
        setValue("direccion", "");
        setValue("ciudad", "");
        setValue("referencias", "");
      }

      const match = primary
        ? orgLocations.find(
            (loc: any) =>
              (loc.nombre || "") === (primary.sede || "") &&
              (loc.direccion || "") === (primary.direccion || "") &&
              (loc.ciudad || "") === (primary.ciudad || "") &&
              (loc.referencias || "") === (primary.referencias || "")
          )
        : undefined;

      setSelectedLocationId(match?.id ? String(match.id) : "");
    },
    [orgLocations, setValue]
  );

  const updateManualLocationField = useCallback(
    (field: "lugar" | "direccion" | "ciudad" | "referencias", value: string) => {
      setSelectedLocationId("");
      setValue(field, value);

      const current = (((values as any)?.ubicaciones || []) as AcademyLocation[]) || [];
      const base: AcademyLocation = {
        sede: (values as any)?.lugar || "",
        direccion: (values as any)?.direccion || "",
        ciudad: (values as any)?.ciudad || "",
        referencias: (values as any)?.referencias || "",
        zona_id: typeof (values as any)?.zona === "number" ? (values as any).zona : null,
      };

      const next = current.length ? [...current] : [base];
      const primary = { ...base, ...(next[0] || {}) };

      if (field === "lugar") primary.sede = value;
      if (field === "direccion") primary.direccion = value;
      if (field === "ciudad") primary.ciudad = value;
      if (field === "referencias") primary.referencias = value;

      next[0] = primary;
      setValue("ubicaciones" as any, next as any);
    },
    [setValue, values]
  );

  // Sync selectedLocationId with manual fields (best-effort)
  useEffect(() => {
    if (!orgLocations.length) {
      if (selectedLocationId) setSelectedLocationId("");
      return;
    }
    const match = orgLocations.find(
      (loc: any) =>
        (loc.nombre || "") === ((values as any)?.lugar || "") &&
        (loc.direccion || "") === ((values as any)?.direccion || "") &&
        (loc.ciudad || "") === ((values as any)?.ciudad || "") &&
        (loc.referencias || "") === ((values as any)?.referencias || "")
    );

    if (match) {
      if (selectedLocationId !== String(match.id)) setSelectedLocationId(String(match.id));
    } else if (selectedLocationId) {
      setSelectedLocationId("");
    }
  }, [
    orgLocations,
    selectedLocationId,
    (values as any)?.lugar,
    (values as any)?.direccion,
    (values as any)?.ciudad,
    (values as any)?.referencias,
  ]);

  // Prefill ubicaciones for parent creation (only once)
  useEffect(() => {
    if (!isParent) return;
    if (!orgLocations.length) return;
    if (hasPrefilledLocations.current) return;

    const currentUbicaciones = Array.isArray((values as any)?.ubicaciones) ? ((values as any).ubicaciones as AcademyLocation[]) : [];
    if (isEditing && currentUbicaciones.length > 0) return;
    if (!isEditing && currentUbicaciones.length > 0) return;

    const mapped = orgLocations.map((loc: any) => ({
      sede: loc.nombre || (loc as any).sede || "",
      direccion: loc.direccion || "",
      ciudad: loc.ciudad || "",
      referencias: loc.referencias || "",
      zona_id: typeof loc.zona_id === "number" ? loc.zona_id : null,
      zonaIds:
        Array.isArray((loc as any)?.zona_ids) && (loc as any)?.zona_ids?.length
          ? ((loc as any).zona_ids as number[]).filter((n: any) => typeof n === "number")
          : typeof loc.zona_id === "number"
          ? [loc.zona_id]
          : [],
    }));

    if (mapped.length) {
      setValue("ubicaciones" as any, mapped as any);

      const first = orgLocations[0] as any;
      if (first) {
        setSelectedLocationId(first.id ? String(first.id) : "");
        setValue("lugar", first.nombre || "");
        setValue("direccion", first.direccion || "");
        setValue("ciudad", first.ciudad || "");
        setValue("referencias", first.referencias || "");
        if (typeof first.zona_id === "number") setValue("zona" as any, first.zona_id as any);
        if (Array.isArray(first.zona_ids) && first.zona_ids.length) setValue("zonas" as any, first.zona_ids as any);
      }

      hasPrefilledLocations.current = true;
    }
  }, [isParent, isEditing, orgLocations, setValue, values]);

  // Zones toggle
  const handleZonaToggle = useCallback(
    (id: number) => {
      const current = (((values as any)?.zonas || []) as number[]).filter((z) => typeof z === "number");
      const exists = current.includes(id);
      const next = exists ? current.filter((z) => z !== id) : [...current, id];
      setValue("zonas" as any, next as any);
    },
    [setValue, values]
  );

  // Submit state + flyer upload bridge
  const [isSubmitting, setIsSubmitting] = useState(false);
  const flyerUploadPromiseRef = useRef<Promise<string> | null>(null);
  const [isFlyerUploading, setIsFlyerUploading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const pendingFlyer = flyerUploadPromiseRef.current;
      if (pendingFlyer) {
        try {
          await pendingFlyer;
        } catch (e: any) {
          showToast(e?.message || "No se pudo subir el flyer. Intenta de nuevo.", "error");
          return;
        }
      }

      const result = await props.onSubmit(values);

      // If server returns a row with updated_at (best-effort), align drafts.
      if (result && typeof result === "object" && "updated_at" in (result as any)) {
        reset(result as any);
      }

      showToast(isEditing ? `${isParent ? "Social" : "Fecha"} actualizado exitosamente` : `${isParent ? "Social" : "Fecha"} creado exitosamente`, "success");

      if (props.onSuccess) {
        const createdId =
          (result as any)?.id ??
          (result as any)?.parent_id ??
          (result as any)?.parentId ??
          (initialData as any)?.id ??
          null;

        if (createdId) props.onSuccess(Number(createdId));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast("Error al guardar", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, props, values, reset, showToast, isEditing, isParent, initialData]);

  const handleCancel = useCallback(() => {
    if (props.onCancel) props.onCancel();
    else navigate(-1);
  }, [props, navigate]);

  const handleScheduleChange = useCallback((cronograma: any[]) => {
    setValue("cronograma" as any, cronograma as any);
  }, [setValue]);

  const handleCostosChange = useCallback((costos: any[]) => {
    setValue("costos" as any, costos as any);
  }, [setValue]);

  const handleScheduleCostSaved = useCallback(() => {
    showToast('💰 Costo guardado en el formulario. Recuerda hacer click en "✨ Crear" para guardar la fecha completa.', "info");
  }, [showToast]);

  const rootClass = ["ecf", props.className].filter(Boolean).join(" ");

  if (isLoadingInitial) {
    return (
      <div className={rootClass} style={props.style}>
        <div className="ecf__loading-screen">Cargando…</div>
      </div>
    );
  }

  return (
    <div className={rootClass} style={props.style}>
      <div className="ecf__wrapper">
        {props.showHeader && (
          <div className="ecf__header">
            <div className="ecf__mode-badge">{isParent ? "Social" : "Fecha de evento"}</div>
            <h1 className="ecf__title">
              {isParent ? (isEditing ? "Editar social" : "Crear social") : isEditing ? "Editar fecha" : "Nueva fecha"}
            </h1>
            <p className="ecf__subtitle">
              {isParent ? "Información general del evento social" : "Detalles específicos de esta fecha"}
            </p>
          </div>
        )}

        <div className="ecf__sections">
          {/* Información Básica */}
          <div className="ecf__section">
            <div className="ecf__section-header">
              <div className="ecf__section-icon">
                <FileText size={18} aria-hidden />
              </div>
              <div>
                <h2 className="ecf__section-title">Información básica</h2>
              </div>
            </div>

            <div className="ecf__stack">
              <div className="ecf__field">
                <label className="ecf__label">
                  Nombre del {isParent ? "social" : "evento"}
                  <span className="ecf__label-required">*</span>
                </label>
                <input
                  type="text"
                  className="ecf__input"
                  value={(values as any)?.nombre || ""}
                  onChange={(e) => setValue("nombre" as any, e.target.value)}
                  placeholder={`Nombre del ${isParent ? "social" : "evento"}`}
                />
              </div>

              <div className="ecf__field">
                <label className="ecf__label">Descripción</label>
                <textarea
                  className="ecf__textarea"
                  value={(values as any)?.biografia || ""}
                  onChange={(e) => setValue("biografia" as any, e.target.value)}
                  placeholder="Describe el evento, su propósito, qué esperar..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Ritmos */}
          <div className="ecf__section">
            <div className="ecf__section-header">
              <div className="ecf__section-icon ecf__section-icon--schedule">
                <Music size={18} aria-hidden />
              </div>
              <div>
                <h2 className="ecf__section-title">Ritmos de baile</h2>
              </div>
            </div>

            <div className="ecf__chips-wrap">
              <RitmosChips
                selected={(() => {
                  const selected = (((values as any)?.ritmos_seleccionados || []) as string[]).filter(Boolean);
                  return allowedCatalogIds.length ? selected.filter((id) => allowedCatalogIds.includes(id)) : selected;
                })()}
                allowedIds={allowedCatalogIds}
                onChange={(ids) => {
                  const next = allowedCatalogIds.length ? ids.filter((id) => allowedCatalogIds.includes(id)) : ids;
                  setValue("ritmos_seleccionados" as any, next as any);

                  // Mapear también a estilos (tag IDs) si es posible
                  try {
                    const labelByCatalogId = new Map<string, string>();
                    RITMOS_CATALOG.forEach((g: any) => g.items.forEach((i: any) => labelByCatalogId.set(i.id, i.label)));
                    const nameToTagId = new Map<string, number>(ritmoTags.map((t: any) => [t.nombre, t.id]));
                    const mappedTagIds = next
                      .map((cid) => labelByCatalogId.get(cid))
                      .filter(Boolean)
                      .map((label: any) => nameToTagId.get(String(label)))
                      .filter((n): n is number => typeof n === "number");
                    setValue("estilos" as any, mappedTagIds as any);
                  } catch {}
                }}
              />
            </div>
          </div>

          {/* Campos parent */}
          {isParent && (
            <>
              <div className="ecf__section">
                <div className="ecf__section-header">
                  <div className="ecf__section-icon ecf__section-icon--location">
                    <MapPin size={18} aria-hidden />
                  </div>
                  <div>
                    <h2 className="ecf__section-title">Ubicaciones del social</h2>
                    <p className="ecf__section-desc">Agrega cada sede o punto de encuentro para este social.</p>
                  </div>
                </div>

                <UbicacionesEditor
                  value={(((values as any)?.ubicaciones || []) as AcademyLocation[]) ?? []}
                  onChange={(ubicaciones: AcademyLocation[]) => handleUbicacionesChange(ubicaciones)}
                  allowedZoneIds={Array.isArray((values as any)?.zonas) ? (((values as any).zonas as number[]).filter((n: any) => typeof n === "number") as any) : undefined}
                  savedLocations={orgLocations as any}
                />
              </div>

              <div className="ecf__section">
                <div className="ecf__section-header">
                  <div className="ecf__section-icon ecf__section-icon--media">
                    <Image size={18} aria-hidden />
                  </div>
                  <div>
                    <h2 className="ecf__section-title">Galería de medios</h2>
                  </div>
                </div>
                <MediaUploader
                  onPick={(files) => {
                    // If editing parent, upload to storage/DB
                    if (isEditing && (parentMedia as any)?.add?.mutate) {
                      Array.from(files).forEach((file, idx) => {
                        (parentMedia as any).add.mutate({ file, slot: `p${idx + 1}` });
                      });
                    } else {
                      // Create-mode: local preview only
                      const now = Date.now();
                      const picked = Array.from(files).map((f, i) => ({
                        id: `${now}-${i}`,
                        type: f.type.startsWith("video") ? "video" : "image",
                        url: URL.createObjectURL(f),
                      }));
                      const current = (((values as any)?.media as any[]) || []) as any[];
                      setValue("media" as any, [...picked, ...current] as any);
                    }
                  }}
                />

                <div className="ecf__media-grid">
                  <MediaGrid
                    items={isEditing ? ((parentMedia as any)?.media as any[]) || [] : (((values as any)?.media as any[]) || [])}
                    onRemove={(id) => {
                      if (isEditing && (parentMedia as any)?.remove?.mutate) {
                        (parentMedia as any).remove.mutate(id as string);
                      } else {
                        const next = ((((values as any)?.media as any[]) || []) as any[]).filter((m: any) => m.id !== id);
                        setValue("media" as any, next as any);
                      }
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Campos date */}
          {!isParent && (
            <>
              <div className="ecf__section">
                <div className="ecf__section-header">
                  <div className="ecf__section-icon ecf__section-icon--date">
                    <Calendar size={18} aria-hidden />
                  </div>
                  <div>
                    <h2 className="ecf__section-title">Fecha y hora</h2>
                  </div>
                </div>

                <div className="ecf__grid-3">
                  <div className="ecf__field">
                    <label className="ecf__label">
                      Fecha
                      <span className="ecf__label-required">*</span>
                    </label>
                    <input
                      type="date"
                      className="ecf__input"
                      value={(values as any)?.fecha || ""}
                      onChange={(e) => setValue("fecha" as any, e.target.value)}
                      disabled={typeof (values as any)?.dia_semana === "number"}
                    />
                  </div>

                  <div className="ecf__field">
                    <label className="ecf__label">Hora inicio</label>
                    <input
                      type="time"
                      className="ecf__input"
                      value={(values as any)?.hora_inicio || ""}
                      onChange={(e) => setValue("hora_inicio" as any, e.target.value)}
                    />
                  </div>

                  <div className="ecf__field">
                    <label className="ecf__label">Hora fin</label>
                    <input
                      type="time"
                      className="ecf__input"
                      value={(values as any)?.hora_fin || ""}
                      onChange={(e) => setValue("hora_fin" as any, e.target.value)}
                    />
                  </div>
                </div>

                {/* Recurrente semanal */}
                {(() => {
                  const isRecurrentWeekly = typeof (values as any)?.dia_semana === "number";
                  const dayLabels = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

                  let nextYmd: string | null = null;
                  if (isRecurrentWeekly) {
                    try {
                      const horaInicioStr = (values as any)?.hora_inicio || "20:00";
                      const next = calculateNextDateWithTime((values as any).dia_semana, horaInicioStr);
                      const y = next.getFullYear();
                      const m = String(next.getMonth() + 1).padStart(2, "0");
                      const d = String(next.getDate()).padStart(2, "0");
                      nextYmd = `${y}-${m}-${d}`;
                    } catch {
                      nextYmd = null;
                    }
                  }

                  const makeDiaSemanaFromFecha = (fechaValue: any): number | null => {
                    try {
                      if (!fechaValue) return null;
                      const plain = String(fechaValue).split("T")[0];
                      const [y, m, d] = plain.split("-").map((n) => parseInt(n, 10));
                      if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
                      const dt = new Date(y, m - 1, d);
                      const day = dt.getDay();
                      return typeof day === "number" && day >= 0 && day <= 6 ? day : null;
                    } catch {
                      return null;
                    }
                  };

                  return (
                    <div className="ecf__recurrent-box">
                      <div className="ecf__recurrent-grid">
                        <label className="ecf__toggle">
                          <input
                            type="checkbox"
                            checked={isRecurrentWeekly}
                            onChange={(e) => {
                              const next = e.target.checked;
                              if (!next) {
                                setValue("dia_semana" as any, null as any);
                                return;
                              }
                              const fromFecha = makeDiaSemanaFromFecha((values as any)?.fecha);
                              setValue("dia_semana" as any, ((fromFecha ?? 5) as any) as any);
                            }}
                          />
                          <span className="ecf__toggle-label">Recurrente semanal</span>
                        </label>

                        <div className="ecf__field">
                          <label className="ecf__label">Día de la semana</label>
                          <div className="ecf__select-wrap">
                            <select
                              className="ecf__select"
                              disabled={!isRecurrentWeekly}
                              value={isRecurrentWeekly ? String((values as any).dia_semana) : ""}
                              onChange={(e) => setValue("dia_semana" as any, parseInt(e.target.value, 10) as any)}
                            >
                              <option value="" disabled>
                                Selecciona…
                              </option>
                              {dayLabels.map((lbl, idx) => (
                                <option key={idx} value={String(idx)}>
                                  {lbl}
                                </option>
                              ))}
                            </select>
                            <svg className="ecf__select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {isRecurrentWeekly && (
                        <div className="ecf__recurrent-hint">
                          Próxima ocurrencia aprox.: <strong>{nextYmd || "—"}</strong>
                          {" · "}
                          La fecha específica queda bloqueada; edita el día.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Ubicación */}
              <div className="ecf__section">
                <div className="ecf__section-header">
                  <div className="ecf__section-icon ecf__section-icon--location">
                    <MapPin size={18} aria-hidden />
                  </div>
                  <div>
                    <h2 className="ecf__section-title">Ubicación del evento</h2>
                  </div>
                </div>

                {orgLocations.length > 0 && (
                  <div className="ecf__field ecf__location-select-block">
                    <label className="ecf__label">Elegir ubicación existente o ingresa una nueva</label>

                    <div className="ecf__select-wrap">
                      <select
                        className="ecf__select"
                        value={selectedLocationId}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          if (!nextId) {
                            clearLocationSelection();
                            return;
                          }
                          const found = orgLocations.find((loc: any) => String(loc.id ?? "") === String(nextId));
                          applyOrganizerLocationToForm(found || null);
                        }}
                      >
                        <option value="">— Escribir manualmente —</option>
                        {orgLocations.map((loc: any) => (
                          <option key={loc.id} value={String(loc.id)}>
                            {loc.nombre || loc.direccion || "Ubicación"}
                          </option>
                        ))}
                      </select>
                      <svg className="ecf__select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="ecf__grid-2">
                  <div className="ecf__field">
                    <label className="ecf__label">Nombre de la ubicación</label>
                    <input
                      type="text"
                      className="ecf__input"
                      value={(values as any)?.lugar || ""}
                      onChange={(e) => updateManualLocationField("lugar", e.target.value)}
                      placeholder="Ej: Sede Central / Salón Principal"
                    />
                  </div>

                  <div className="ecf__field">
                    <label className="ecf__label">Dirección</label>
                    <input
                      type="text"
                      className="ecf__input"
                      value={(values as any)?.direccion || ""}
                      onChange={(e) => updateManualLocationField("direccion", e.target.value)}
                      placeholder="Calle, número, colonia"
                    />
                  </div>
                </div>

                <div className="ecf__grid-2 ecf__grid-2--mt">
                  <div className="ecf__field">
                    <label className="ecf__label">Ciudad</label>
                    <input
                      type="text"
                      className="ecf__input"
                      value={(values as any)?.ciudad || ""}
                      onChange={(e) => updateManualLocationField("ciudad", e.target.value)}
                      placeholder="Ciudad"
                    />
                  </div>

                  <div className="ecf__field">
                    <label className="ecf__label">Notas o referencias</label>
                    <input
                      type="text"
                      className="ecf__input"
                      value={(values as any)?.referencias || ""}
                      onChange={(e) => updateManualLocationField("referencias", e.target.value)}
                      placeholder="Ej. Entrada lateral, 2do piso"
                    />
                  </div>
                </div>

                {/* Zones chips (optional) */}
                {zonaTags.length > 0 && (
                  <div className="ecf__zones-block">
                    <div className="ecf__label">Zonas</div>
                    <ZonaGroupedChips allTags={zonaTags} selectedIds={(((values as any)?.zonas || []) as number[]) ?? []} onToggle={handleZonaToggle} mode="edit" />
                  </div>
                )}
              </div>

              {/* Cronograma + costos */}
              <div className="ecf__section">
                <div className="ecf__section-header">
                  <div className="ecf__section-icon ecf__section-icon--schedule">
                    <Clock size={18} aria-hidden />
                  </div>
                  <div>
                    <h2 className="ecf__section-title">Cronograma del evento</h2>
                  </div>
                </div>
                <ScheduleEditor
                  schedule={(((values as any)?.cronograma || []) as any[]) ?? []}
                  onChangeSchedule={handleScheduleChange}
                  costos={(((values as any)?.costos || []) as any[]) ?? []}
                  onChangeCostos={handleCostosChange}
                  ritmos={ritmoTags}
                  zonas={zonaTags}
                  eventFecha={(values as any)?.fecha || ""}
                  hideCostsSection
                  onSaveCosto={handleScheduleCostSaved}
                />
              </div>

              {/* Flyer */}
              <div className="ecf__section">
                <div className="ecf__section-header">
                  <div className="ecf__section-icon ecf__section-icon--media">
                    <Image size={18} aria-hidden />
                  </div>
                  <div>
                    <h2 className="ecf__section-title">Flyer del evento</h2>
                  </div>
                </div>
                <DateFlyerUploader
                  value={(values as any)?.flyer_url || null}
                  onChange={(url) => setValue("flyer_url" as any, url as any)}
                  dateId={initialData?.id}
                  parentId={(props as any).parentId}
                  onUploadPromiseChange={(promise) => {
                    flyerUploadPromiseRef.current = promise;
                    setIsFlyerUploading(!!promise);
                  }}
                />
              </div>

              {/* Estado */}
              <div className="ecf__section">
                <div className="ecf__section-header">
                  <div className="ecf__section-icon ecf__section-icon--status">
                    <Globe size={18} aria-hidden />
                  </div>
                  <div>
                    <h2 className="ecf__section-title">Estado de publicación</h2>
                  </div>
                </div>
                <div className="ecf__radio-group">
                  <label className="ecf__radio-option">
                    <input
                      type="radio"
                      name="estado_publicacion"
                      value="borrador"
                      checked={(values as any)?.estado_publicacion === "borrador"}
                      onChange={(e) => setValue("estado_publicacion" as any, e.target.value)}
                    />
                    <div>
                      <div className="ecf__radio-label">Borrador</div>
                      <div className="ecf__radio-desc">Solo visible para ti</div>
                    </div>
                  </label>

                  <label className="ecf__radio-option">
                    <input
                      type="radio"
                      name="estado_publicacion"
                      value="publicado"
                      checked={(values as any)?.estado_publicacion === "publicado"}
                      onChange={(e) => setValue("estado_publicacion" as any, e.target.value)}
                    />
                    <div>
                      <div className="ecf__radio-label">Público</div>
                      <div className="ecf__radio-desc">Visible y permite RSVP</div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="ecf__actions">
            <button type="button" className="ecf__btn ecf__btn--cancel" onClick={handleCancel}>
              Cancelar
            </button>

            <div className="ecf__actions-right">
              {isDirty && <span className="ecf__dirty-hint">Cambios sin guardar</span>}

              <button
                type="button"
                className="ecf__btn ecf__btn--submit"
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  isFlyerUploading ||
                  (!isParent && !(values as any)?.fecha && typeof (values as any)?.dia_semana !== "number")
                }
              >
                {isSubmitting
                  ? "Guardando…"
                  : isFlyerUploading
                  ? "Subiendo flyer…"
                  : isEditing
                  ? "Guardar cambios"
                  : "Crear"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
