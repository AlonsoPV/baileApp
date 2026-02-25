// path: src/components/events/EventCreateForm.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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

const colors = {
  coral: "#FF3D57",
  orange: "#FF8C42",
  yellow: "#FFD166",
  blue: "#1E88E5",
  dark: "#121212",
  light: "#F5F5F5",
};

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

  if (isLoadingInitial) {
    return (
      <div
        style={{
          minHeight: 320,
          background: `linear-gradient(135deg, ${colors.dark}, #1a1a1a)`,
          display: "grid",
          placeItems: "center",
          color: colors.light,
        }}
      >
        <div>Cargando…</div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <style>{`
        .event-create-form-container { background: linear-gradient(135deg, ${colors.dark}, #1a1a1a); padding: 24px 0; }
        .event-create-form-wrapper { max-width: 800px; margin: 0 auto; padding: 0 24px; }
        .event-create-form-header { margin-bottom: 32px; text-align: center; }
        .event-create-form-header h1 { font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, ${colors.coral}, ${colors.blue}); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
        .event-create-form-header p { font-size: 1.1rem; color: ${colors.light}; opacity: 0.8; }
        .event-create-form-section { padding: 24px; background: ${colors.dark}66; border-radius: 16px; border: 1px solid ${colors.light}22; }
        .event-create-form-section h2 { font-size: 1.5rem; font-weight: 600; color: ${colors.light}; margin-bottom: 20px; }
        .event-create-form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .event-create-form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .event-create-form-actions { display: flex; justify-content: space-between; align-items: center; padding: 24px; background: ${colors.dark}66; border-radius: 16px; border: 1px solid ${colors.light}22; }
        .event-create-form-actions-buttons { display: flex; align-items: center; gap: 12px; }
        @media (max-width: 768px) {
          .event-create-form-container { padding: 16px 0; }
          .event-create-form-wrapper { padding: 0 16px; }
          .event-create-form-header { margin-bottom: 24px; }
          .event-create-form-header h1 { font-size: 2rem; margin-bottom: 6px; }
          .event-create-form-header p { font-size: 1rem; }
          .event-create-form-section { padding: 18px; border-radius: 12px; }
          .event-create-form-section h2 { font-size: 1.3rem; margin-bottom: 16px; }
          .event-create-form-grid-3 { grid-template-columns: 1fr; gap: 12px; }
          .event-create-form-grid-2 { grid-template-columns: 1fr; gap: 12px; }
          .event-create-form-actions { flex-direction: column; gap: 16px; padding: 18px; align-items: stretch; }
          .event-create-form-actions-buttons { flex-direction: column; width: 100%; gap: 12px; }
          .event-create-form-actions-buttons button { width: 100%; }
        }
        @media (max-width: 480px) {
          .event-create-form-container { padding: 12px 0; }
          .event-create-form-wrapper { padding: 0 12px; }
          .event-create-form-header h1 { font-size: 1.75rem; }
          .event-create-form-header p { font-size: 0.95rem; }
          .event-create-form-section { padding: 14px; border-radius: 10px; }
          .event-create-form-section h2 { font-size: 1.2rem; margin-bottom: 14px; }
          .event-create-form-actions { padding: 14px; }
        }
      `}</style>

      <div className="event-create-form-container" style={props.style}>
        <div className="event-create-form-wrapper">
          {props.showHeader && (
            <div className="event-create-form-header">
              <h1>{isParent ? (isEditing ? "🎭 Editar Social" : "🎭 Crear Social") : isEditing ? "📅 Editar Fecha" : "📅 Crear Fecha"}</h1>
              <p>{isParent ? "Información general del evento social" : "Detalles específicos de la fecha del evento"}</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Información Básica */}
            <div className="event-create-form-section">
              <h2>📝 Información Básica</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: "1rem", fontWeight: 600, color: colors.light }}>
                    Nombre del {isParent ? "Social" : "Evento"} *
                  </label>
                  <input
                    type="text"
                    value={(values as any)?.nombre || ""}
                    onChange={(e) => setValue("nombre" as any, e.target.value)}
                    placeholder={`Nombre del ${isParent ? "social" : "evento"}`}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: `${colors.dark}cc`,
                      border: `2px solid ${colors.light}33`,
                      color: colors.light,
                      fontSize: "1rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: "1rem", fontWeight: 600, color: colors.light }}>
                    Biografía
                  </label>
                  <textarea
                    value={(values as any)?.biografia || ""}
                    onChange={(e) => setValue("biografia" as any, e.target.value)}
                    placeholder="Describe el evento, su propósito, qué esperar..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: `${colors.dark}cc`,
                      border: `2px solid ${colors.light}33`,
                      color: colors.light,
                      fontSize: "1rem",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Ritmos */}
            <div className="event-create-form-section">
              <h2>🎵 Ritmos de Baile</h2>

              <div style={{ marginTop: 8 }}>
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
                <div className="event-create-form-section">
                  <h2>🗺️ Ubicaciones del Social</h2>
                  <p style={{ fontSize: "0.9rem", opacity: 0.75, marginBottom: 16, color: colors.light }}>
                    Agrega cada sede o punto de encuentro para este social.
                  </p>

                  <UbicacionesEditor
                    value={(((values as any)?.ubicaciones || []) as AcademyLocation[]) ?? []}
                    onChange={(ubicaciones: AcademyLocation[]) => handleUbicacionesChange(ubicaciones)}
                    allowedZoneIds={Array.isArray((values as any)?.zonas) ? (((values as any).zonas as number[]).filter((n: any) => typeof n === "number") as any) : undefined}
                    savedLocations={orgLocations as any}
                  />
                </div>

                <div className="event-create-form-section">
                  <h2>📷 Galería de Medios</h2>
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

                  <div style={{ marginTop: 16 }}>
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
                <div className="event-create-form-section">
                  <h2>📅 Fecha y Hora</h2>

                  <div className="event-create-form-grid-3">
                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontSize: "1rem", fontWeight: 600, color: colors.light }}>
                        Fecha *
                      </label>
                      <input
                        type="date"
                        value={(values as any)?.fecha || ""}
                        onChange={(e) => setValue("fecha" as any, e.target.value)}
                        disabled={typeof (values as any)?.dia_semana === "number"}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: `${colors.dark}cc`,
                          border: `2px solid ${colors.light}33`,
                          color: colors.light,
                          fontSize: "1rem",
                          opacity: typeof (values as any)?.dia_semana === "number" ? 0.6 : 1,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontSize: "1rem", fontWeight: 600, color: colors.light }}>
                        Hora Inicio
                      </label>
                      <input
                        type="time"
                        value={(values as any)?.hora_inicio || ""}
                        onChange={(e) => setValue("hora_inicio" as any, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: `${colors.dark}cc`,
                          border: `2px solid ${colors.light}33`,
                          color: colors.light,
                          fontSize: "1rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontSize: "1rem", fontWeight: 600, color: colors.light }}>
                        Hora Fin
                      </label>
                      <input
                        type="time"
                        value={(values as any)?.hora_fin || ""}
                        onChange={(e) => setValue("hora_fin" as any, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: `${colors.dark}cc`,
                          border: `2px solid ${colors.light}33`,
                          color: colors.light,
                          fontSize: "1rem",
                        }}
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
                      <div
                        style={{
                          marginTop: 24,
                          padding: 20,
                          background: `${colors.dark}44`,
                          borderRadius: 12,
                          border: `1px solid ${colors.light}22`,
                        }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "end" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
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
                              style={{ width: 20, height: 20, cursor: "pointer" }}
                            />
                            <span style={{ fontSize: "1rem", fontWeight: 600, color: colors.light }}>🔁 Recurrente semanal</span>
                          </label>

                          <label style={{ fontSize: "0.9rem", fontWeight: 600, color: colors.light, opacity: isRecurrentWeekly ? 1 : 0.7 }}>
                            Día (recurrente)
                            <select
                              disabled={!isRecurrentWeekly}
                              value={isRecurrentWeekly ? String((values as any).dia_semana) : ""}
                              onChange={(e) => setValue("dia_semana" as any, parseInt(e.target.value, 10) as any)}
                              style={{
                                width: "100%",
                                marginTop: 8,
                                padding: "12px 14px",
                                borderRadius: 12,
                                background: "#2b2b2b",
                                border: `2px solid ${colors.light}33`,
                                color: "#fff",
                                cursor: isRecurrentWeekly ? "pointer" : "not-allowed",
                                opacity: isRecurrentWeekly ? 1 : 0.6,
                              }}
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
                          </label>
                        </div>

                        {isRecurrentWeekly && (
                          <div style={{ marginTop: 10, fontSize: "0.85rem", opacity: 0.8, color: colors.light }}>
                            Próxima ocurrencia aprox.: <b>{nextYmd || "—"}</b> · La fecha específica queda bloqueada; edita el día.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Ubicación */}
                <div className="event-create-form-section">
                  <h2>📍 Ubicación del Evento</h2>

                  {orgLocations.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", marginBottom: 8, fontSize: "1rem", fontWeight: 600, color: colors.light }}>
                        Elegir ubicación existente o ingresa una nueva
                      </label>

                      <div style={{ position: "relative" }}>
                        <select
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
                          style={{
                            width: "100%",
                            padding: "12px 14px",
                            background: "#2b2b2b",
                            border: "1px solid rgba(255,255,255,0.25)",
                            color: "#fff",
                            outline: "none",
                            fontSize: 14,
                            borderRadius: 12,
                            appearance: "none",
                            WebkitAppearance: "none",
                          }}
                        >
                          <option value="" style={{ background: "#2b2b2b", color: "#fff" }}>
                            — Escribir manualmente —
                          </option>
                          {orgLocations.map((loc: any) => (
                            <option key={loc.id} value={String(loc.id)} style={{ color: "#fff", background: "#2b2b2b" }}>
                              {loc.nombre || loc.direccion || "Ubicación"}
                            </option>
                          ))}
                        </select>
                        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.6)" }}>
                          ▼
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="event-create-form-grid-2">
                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontSize: "1rem", fontWeight: 600, color: colors.light }}>
                        Nombre de la ubicación
                      </label>
                      <input
                        type="text"
                        value={(values as any)?.lugar || ""}
                        onChange={(e) => updateManualLocationField("lugar", e.target.value)}
                        placeholder="Ej: Sede Central / Salón Principal"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: `${colors.dark}cc`,
                          border: `2px solid ${colors.light}33`,
                          color: colors.light,
                          fontSize: "1rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontSize: "1rem", fontWeight: 600, color: colors.light }}>
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={(values as any)?.direccion || ""}
                        onChange={(e) => updateManualLocationField("direccion", e.target.value)}
                        placeholder="Calle, número, colonia"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: `${colors.dark}cc`,
                          border: `2px solid ${colors.light}33`,
                          color: colors.light,
                          fontSize: "1rem",
                        }}
                      />
                    </div>
                  </div>

                  <div className="event-create-form-grid-2" style={{ marginTop: 16 }}>
                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontSize: "1rem", fontWeight: 600, color: colors.light }}>
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={(values as any)?.ciudad || ""}
                        onChange={(e) => updateManualLocationField("ciudad", e.target.value)}
                        placeholder="Ciudad"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: `${colors.dark}cc`,
                          border: `2px solid ${colors.light}33`,
                          color: colors.light,
                          fontSize: "1rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: 8, fontSize: "1rem", fontWeight: 600, color: colors.light }}>
                        Notas o referencias
                      </label>
                      <input
                        type="text"
                        value={(values as any)?.referencias || ""}
                        onChange={(e) => updateManualLocationField("referencias", e.target.value)}
                        placeholder="Ej. Entrada lateral, 2do piso"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: `${colors.dark}cc`,
                          border: `2px solid ${colors.light}33`,
                          color: colors.light,
                          fontSize: "1rem",
                        }}
                      />
                    </div>
                  </div>

                  {/* Zones chips (optional) */}
                  {zonaTags.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8, color: colors.light }}>Zonas</div>
                      <ZonaGroupedChips allTags={zonaTags} selectedIds={(((values as any)?.zonas || []) as number[]) ?? []} onToggle={handleZonaToggle} mode="edit" />
                    </div>
                  )}
                </div>

                {/* Cronograma + costos */}
                <div className="event-create-form-section">
                  <h2>📅 Cronograma del Evento</h2>
                  <ScheduleEditor
                    schedule={(((values as any)?.cronograma || []) as any[]) ?? []}
                    onChangeSchedule={(cronograma) => setValue("cronograma" as any, cronograma as any)}
                    costos={(((values as any)?.costos || []) as any[]) ?? []}
                    onChangeCostos={(costos) => setValue("costos" as any, costos as any)}
                    ritmos={ritmoTags}
                    zonas={zonaTags}
                    eventFecha={(values as any)?.fecha || ""}
                    onSaveCosto={() => showToast('💰 Costo guardado en el formulario. Recuerda hacer click en "✨ Crear" para guardar la fecha completa.', "info")}
                  />
                </div>

                {/* Flyer */}
                <div className="event-create-form-section">
                  <h2>🖼️ Flyer del Evento</h2>
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
                <div className="event-create-form-section">
                  <h2>🌐 Estado de Publicación</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="estado_publicacion"
                        value="borrador"
                        checked={(values as any)?.estado_publicacion === "borrador"}
                        onChange={(e) => setValue("estado_publicacion" as any, e.target.value)}
                        style={{ transform: "scale(1.2)" }}
                      />
                      <span style={{ color: colors.light, fontSize: "1rem" }}>📝 Borrador</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="estado_publicacion"
                        value="publicado"
                        checked={(values as any)?.estado_publicacion === "publicado"}
                        onChange={(e) => setValue("estado_publicacion" as any, e.target.value)}
                        style={{ transform: "scale(1.2)" }}
                      />
                      <span style={{ color: colors.light, fontSize: "1rem" }}>🌐 Público</span>
                    </label>

                    <span style={{ fontSize: "0.9rem", opacity: 0.8, color: colors.light }}>Visible públicamente y permite RSVP</span>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="event-create-form-actions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                style={{
                  padding: "12px 24px",
                  borderRadius: 25,
                  border: `2px solid ${colors.light}33`,
                  background: "transparent",
                  color: colors.light,
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ❌ Cancelar
              </motion.button>

              <div className="event-create-form-actions-buttons">
                {isDirty && (
                  <span style={{ fontSize: "0.9rem", color: colors.orange, fontWeight: 600, textAlign: "center" }}>
                    💾 Cambios sin guardar
                  </span>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting || isFlyerUploading || (!isParent && !(values as any)?.fecha && typeof (values as any)?.dia_semana !== "number")}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 25,
                    border: "none",
                    background:
                      isSubmitting || ( !isParent && !(values as any)?.fecha && typeof (values as any)?.dia_semana !== "number")
                        ? `${colors.light}33`
                        : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`,
                    color: colors.light,
                    fontSize: "1rem",
                    fontWeight: 700,
                    cursor: isSubmitting || isFlyerUploading ? "not-allowed" : "pointer",
                    opacity: isSubmitting || isFlyerUploading ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? "⏳ Guardando..." : isFlyerUploading ? "Subiendo flyer..." : isEditing ? "💾 Actualizar" : "✨ Crear"}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}