import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useEventDate, useUpdateEventDate } from "../../hooks/useEventDate";
import { useTags } from "../../hooks/useTags";
import { useMyOrganizer } from "../../hooks/useOrganizer";
import { useOrganizerLocations, type OrganizerLocation } from "../../hooks/useOrganizerLocations";
import RitmosChips from "../RitmosChips";
import ZonaGroupedChips from "../profile/ZonaGroupedChips";
import ScheduleEditor from "../../components/events/ScheduleEditor";
import DateFlyerUploader from "../../components/events/DateFlyerUploader";
import { useToast } from "../Toast";

type Props = {
  open: boolean;
  dateId: number | null;
  onClose: () => void;
  onUpdated?: (dateId: number, patch: Record<string, any>) => void;
};

const colors = {
  coral: "#FF3D57",
  orange: "#FF8C42",
  yellow: "#FFD166",
  blue: "#1E88E5",
  dark: "#121212",
  light: "#F5F5F5",
};

const toFormLocation = (loc?: OrganizerLocation | null) => {
  if (!loc) return null;
  return {
    id: loc.id ?? null,
    sede: loc.nombre || "",
    direccion: loc.direccion || "",
    ciudad: loc.ciudad || "",
    referencias: loc.referencias || "",
    zona_id:
      typeof loc.zona_id === "number"
        ? loc.zona_id
        : Array.isArray(loc.zona_ids) && loc.zona_ids.length
          ? loc.zona_ids[0] ?? null
          : null,
    zona_ids: Array.isArray(loc.zona_ids) ? loc.zona_ids : [],
  };
};

export default function EventDateFullDrawer({ open, dateId, onClose, onUpdated }: Props) {
  const { showToast } = useToast();
  const { data: date, isLoading } = useEventDate(open && dateId ? dateId : undefined);
  const updateDate = useUpdateEventDate();
  const { data: allTags } = useTags();
  const { data: myOrg } = useMyOrganizer();
  const { data: orgLocations = [] } = useOrganizerLocations((myOrg as any)?.id);

  const ritmoTags = allTags?.filter((t: any) => t.tipo === "ritmo") || [];
  const zonaTags = allTags?.filter((t: any) => t.tipo === "zona") || [];

  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    biografia: "",
    djs: "",
    telefono_contacto: "",
    mensaje_contacto: "",
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    dia_semana: null as number | null,
    lugar: "",
    ciudad: "",
    direccion: "",
    referencias: "",
    requisitos: "",
    zona: null as number | null,
    estilos: [] as number[],
    ritmos_seleccionados: [] as string[],
    zonas: [] as number[],
    cronograma: [] as any[],
    costos: [] as any[],
    flyer_url: null as string | null,
    estado_publicacion: "borrador" as "borrador" | "publicado",
    ubicaciones: [] as any[],
  });

  useEffect(() => {
    if (!date) return;
    const d: any = date;
    setForm({
      nombre: d.nombre || "",
      biografia: d.biografia || "",
      djs: d.djs || "",
      telefono_contacto: d.telefono_contacto || "",
      mensaje_contacto: d.mensaje_contacto || "",
      fecha: d.fecha ? String(d.fecha).split("T")[0] : "",
      hora_inicio: d.hora_inicio || "",
      hora_fin: d.hora_fin || "",
      dia_semana: typeof d.dia_semana === "number" ? d.dia_semana : null,
      lugar: d.lugar || "",
      ciudad: d.ciudad || "",
      direccion: d.direccion || "",
      referencias: d.referencias || "",
      requisitos: d.requisitos || "",
      zona: typeof d.zona === "number" ? d.zona : null,
      estilos: Array.isArray(d.estilos) ? d.estilos : [],
      ritmos_seleccionados: Array.isArray(d.ritmos_seleccionados) ? d.ritmos_seleccionados : [],
      zonas: Array.isArray(d.zonas) ? d.zonas : [],
      cronograma: Array.isArray(d.cronograma) ? d.cronograma : [],
      costos: Array.isArray(d.costos) ? d.costos : [],
      flyer_url: d.flyer_url || null,
      estado_publicacion: (d.estado_publicacion || "borrador") as any,
      ubicaciones: Array.isArray(d.ubicaciones) ? d.ubicaciones : [],
    });

    // si hay ubicaciones y coincide con organizer_locations, setear selectedLocationId (best effort)
    try {
      const loc0 = Array.isArray(d.ubicaciones) && d.ubicaciones.length ? d.ubicaciones[0] : null;
      if (loc0) {
        const match = orgLocations.find((ol: any) => {
          const n = String(ol?.nombre || "");
          const c = String(ol?.ciudad || "");
          return n && c && n === String(loc0?.sede || loc0?.nombre || "") && c === String(loc0?.ciudad || "");
        });
        if (match?.id) setSelectedLocationId(String(match.id));
      } else {
        setSelectedLocationId("");
      }
    } catch {
      // ignore
    }
  }, [date, orgLocations]);

  const isRecurrentWeekly = form.dia_semana !== null && form.dia_semana !== undefined;

  const dayLabels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const nextOccurrenceYmd = useMemo(() => {
    try {
      if (!isRecurrentWeekly) return null;
      const target = Number(form.dia_semana);
      if (!Number.isFinite(target) || target < 0 || target > 6) return null;
      const now = new Date();
      const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const current = base.getDay();
      let delta = (target - current + 7) % 7;
      if (delta === 0) delta = 7; // next week
      const next = new Date(base);
      next.setDate(base.getDate() + delta);
      const y = next.getFullYear();
      const m = String(next.getMonth() + 1).padStart(2, "0");
      const d = String(next.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    } catch {
      return null;
    }
  }, [form.dia_semana, isRecurrentWeekly]);

  const allowedCatalogIds = useMemo(() => {
    return (((myOrg as any)?.ritmos_seleccionados || []) as string[]) || [];
  }, [myOrg]);

  const selectedOrganizerLocation = useMemo(() => {
    if (!selectedLocationId) return null;
    return orgLocations.find((loc: any) => String(loc?.id ?? "") === String(selectedLocationId)) || null;
  }, [orgLocations, selectedLocationId]);

  const applyOrganizerLocation = (loc?: OrganizerLocation | null) => {
    if (!loc) {
      setSelectedLocationId("");
      setForm((prev) => ({
        ...prev,
        ubicaciones: [],
        zonas: [],
        zona: null,
      }));
      return;
    }
    setSelectedLocationId(loc.id ? String(loc.id) : "");
    const mapped = toFormLocation(loc);
    const zonasFromOrgLoc: number[] = [];
    if (typeof loc.zona_id === "number") zonasFromOrgLoc.push(loc.zona_id);
    if (Array.isArray(loc.zona_ids)) {
      loc.zona_ids.forEach((z) => {
        if (typeof z === "number" && !zonasFromOrgLoc.includes(z)) zonasFromOrgLoc.push(z);
      });
    }
    setForm((prev) => ({
      ...prev,
      lugar: (loc.nombre as any) || prev.lugar,
      direccion: (loc.direccion as any) || prev.direccion,
      ciudad: (loc.ciudad as any) || prev.ciudad,
      referencias: (loc.referencias as any) || prev.referencias,
      zona: typeof loc.zona_id === "number" ? loc.zona_id : prev.zona,
      zonas: zonasFromOrgLoc.length ? zonasFromOrgLoc : prev.zonas,
      ubicaciones: mapped ? [mapped] : prev.ubicaciones,
    }));
  };

  const toggleZona = (zonaId: number) => {
    const currentZonas = form.zonas || [];
    const newZonas = currentZonas.includes(zonaId) ? currentZonas.filter((id) => id !== zonaId) : [...currentZonas, zonaId];
    setForm({ ...form, zonas: newZonas });
  };

  const handleSave = async () => {
    if (!dateId) return;
    try {
      setSaving(true);
      const patch: any = {
        nombre: form.nombre || null,
        biografia: form.biografia || null,
        djs: form.djs || null,
        telefono_contacto: form.telefono_contacto || null,
        mensaje_contacto: form.mensaje_contacto || null,
        fecha: form.fecha || null,
        hora_inicio: form.hora_inicio || null,
        hora_fin: form.hora_fin || null,
        dia_semana: typeof form.dia_semana === "number" ? form.dia_semana : null,
        lugar: (form.lugar || "").trim() || null,
        direccion: (form.direccion || "").trim() || null,
        ciudad: (form.ciudad || "").trim() || null,
        zona: typeof form.zona === "number" ? form.zona : null,
        referencias: (form.referencias || "").trim() || null,
        requisitos: (form.requisitos || "").trim() || null,
        ritmos_seleccionados: Array.isArray(form.ritmos_seleccionados) ? form.ritmos_seleccionados : [],
        estilos: Array.isArray(form.estilos) ? form.estilos : [],
        zonas: Array.isArray(form.zonas) ? form.zonas : [],
        cronograma: Array.isArray(form.cronograma) ? form.cronograma : [],
        costos: Array.isArray(form.costos) ? form.costos : [],
        flyer_url: form.flyer_url || null,
        estado_publicacion: form.estado_publicacion || "borrador",
        ubicaciones: Array.isArray(form.ubicaciones) ? form.ubicaciones : [],
      };
      await updateDate.mutateAsync({ id: dateId, patch });
      onUpdated?.(dateId, patch);
      showToast("Cambios guardados ✅", "success");
    } catch (e: any) {
      console.error("[EventDateFullDrawer] save error:", e);
      showToast(e?.message || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(860px, 92vw)",
          height: "100vh",
          background: `linear-gradient(135deg, ${colors.dark} 0%, #1a1a1a 50%, ${colors.dark} 100%)`,
          borderLeft: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 18, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>
            ✏️ Editar fecha {dateId ? `#${dateId}` : ""}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 900,
            }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: 18 }}>
          <div className="org-editor-card" style={{ marginBottom: 16, padding: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, color: "#fff" }}>
            {isLoading && <div style={{ opacity: 0.85 }}>Cargando…</div>}
            {!isLoading && !date && <div style={{ opacity: 0.85 }}>No encontramos esta fecha.</div>}
          </div>

          {!isLoading && !!date && (
            <>
              {/* Información básica */}
              <div className="org-editor-card" style={{ marginBottom: 16, padding: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, color: "#fff" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>📝 Información básica</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                    Nombre *
                    <input
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                      placeholder="Ej. Social SBK"
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                    Biografía
                    <textarea
                      value={form.biografia}
                      onChange={(e) => setForm({ ...form, biografia: e.target.value })}
                      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff", minHeight: 88 }}
                      placeholder="Descripción del evento"
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                    DJs
                    <textarea
                      value={form.djs}
                      onChange={(e) => setForm({ ...form, djs: e.target.value })}
                      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff", minHeight: 68 }}
                      placeholder="Lineup (opcional)"
                    />
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                      Teléfono/WhatsApp
                      <input
                        value={form.telefono_contacto}
                        onChange={(e) => setForm({ ...form, telefono_contacto: e.target.value })}
                        style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                        placeholder="+52..."
                      />
                    </label>
                    <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                      Mensaje WhatsApp
                      <input
                        value={form.mensaje_contacto}
                        onChange={(e) => setForm({ ...form, mensaje_contacto: e.target.value })}
                        style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                        placeholder="Hola! Me interesa..."
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Ritmos */}
              <div className="org-editor-card" style={{ marginBottom: 16, padding: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, color: "#fff" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>🎵 Ritmos</div>
                <RitmosChips
                  selectedCatalogIds={allowedCatalogIds}
                  selected={form.ritmos_seleccionados || []}
                  onChange={(ids) => setForm({ ...form, ritmos_seleccionados: ids })}
                  catalog={ritmoTags}
                />
              </div>

              {/* Ubicación */}
              <div className="org-editor-card" style={{ marginBottom: 16, padding: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, color: "#fff" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>📍 Ubicación</div>
                <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                  Ubicación guardada (opcional)
                  <select
                    value={selectedLocationId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      if (!nextId) {
                        applyOrganizerLocation(null);
                        return;
                      }
                      const loc = orgLocations.find((l: any) => String(l?.id ?? "") === String(nextId));
                      applyOrganizerLocation((loc as any) || null);
                    }}
                    style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "#2b2b2b", color: "#fff" }}
                  >
                    <option value="">(No usar ubicación guardada)</option>
                    {orgLocations.map((l: any) => (
                      <option key={l.id} value={String(l.id)}>
                        {l.nombre || "Sede"} {l.ciudad ? `· ${l.ciudad}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                    Lugar
                    <input
                      value={form.lugar}
                      onChange={(e) => setForm({ ...form, lugar: e.target.value })}
                      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                      placeholder="Nombre del lugar"
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                    Ciudad
                    <input
                      value={form.ciudad}
                      onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                      placeholder="Ciudad"
                    />
                  </label>
                </div>
                <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95, marginTop: 10, display: "block" }}>
                  Dirección
                  <input
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                    placeholder="Calle y número"
                  />
                </label>
                <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95, marginTop: 10, display: "block" }}>
                  Referencias
                  <input
                    value={form.referencias}
                    onChange={(e) => setForm({ ...form, referencias: e.target.value })}
                    style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                    placeholder="Ej. Entrada lateral"
                  />
                </label>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>Zonas</div>
                  <ZonaGroupedChips zonas={zonaTags} selected={form.zonas || []} onToggle={toggleZona} />
                </div>
              </div>

              {/* Cronograma + costos */}
              <div className="org-editor-card" style={{ marginBottom: 16, padding: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, color: "#fff" }}>
                <ScheduleEditor
                  schedule={form.cronograma || []}
                  onChangeSchedule={(cronograma) => setForm((prev) => ({ ...prev, cronograma }))}
                  costos={form.costos || []}
                  onChangeCostos={(costos) => setForm((prev) => ({ ...prev, costos }))}
                  ritmos={ritmoTags}
                  zonas={zonaTags}
                  eventFecha={form.fecha}
                  onSaveCosto={() => showToast("💰 Costo guardado en el formulario. Recuerda guardar cambios.", "info")}
                />
              </div>

              {/* Fecha y hora */}
              <div className="org-editor-card" style={{ marginBottom: 16, padding: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, color: "#fff" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>📅 Fecha y hora</div>
                {/* Recurrencia semanal */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900 }}>
                    <input
                      type="checkbox"
                      checked={isRecurrentWeekly}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          dia_semana: next ? (typeof prev.dia_semana === "number" ? prev.dia_semana : 5) : null,
                        }));
                      }}
                    />
                    🔁 Recurrente semanal
                  </label>

                  <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                    Día (recurrente)
                    <select
                      disabled={!isRecurrentWeekly}
                      value={typeof form.dia_semana === "number" ? String(form.dia_semana) : ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, dia_semana: parseInt(e.target.value, 10) }))}
                      style={{
                        width: "100%",
                        marginTop: 6,
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: "#2b2b2b",
                        color: "#fff",
                        opacity: isRecurrentWeekly ? 1 : 0.6,
                        cursor: isRecurrentWeekly ? "pointer" : "not-allowed",
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
                  <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
                    Próxima ocurrencia aprox.: <b>{nextOccurrenceYmd || "—"}</b> · La fecha específica queda “bloqueada”; edita el día de la semana.
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                    Fecha
                    <input
                      type="date"
                      value={form.fecha}
                      onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                      disabled={isRecurrentWeekly}
                      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                    Hora inicio
                    <input
                      type="time"
                      value={form.hora_inicio}
                      onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.95 }}>
                    Hora fin
                    <input
                      type="time"
                      value={form.hora_fin}
                      onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                    />
                  </label>
                </div>
              </div>

              {/* Flyer + estado */}
              <div className="org-editor-card" style={{ marginBottom: 16, padding: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, color: "#fff" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>🖼️ Flyer</div>
                <DateFlyerUploader
                  value={form.flyer_url || null}
                  onChange={(url) => setForm((prev) => ({ ...prev, flyer_url: url || null }))}
                  dateId={dateId || undefined}
                  parentId={(date as any)?.parent_id}
                />
              </div>

              <div className="org-editor-card" style={{ marginBottom: 16, padding: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, color: "#fff" }}>
                <div style={{ fontWeight: 900, marginBottom: 12 }}>🌐 Estado</div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
                    <input
                      type="radio"
                      name="estado_publicacion_drawer"
                      value="borrador"
                      checked={form.estado_publicacion === "borrador"}
                      onChange={() => setForm((prev) => ({ ...prev, estado_publicacion: "borrador" }))}
                    />
                    📝 Borrador
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
                    <input
                      type="radio"
                      name="estado_publicacion_drawer"
                      value="publicado"
                      checked={form.estado_publicacion === "publicado"}
                      onChange={() => setForm((prev) => ({ ...prev, estado_publicacion: "publicado" }))}
                    />
                    🌐 Público
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: 18, borderTop: "1px solid rgba(255,255,255,0.10)", display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.20)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isLoading || !dateId}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(39,195,255,0.45)",
              background: "linear-gradient(135deg, rgba(39,195,255,0.22), rgba(30,136,229,0.22))",
              color: "#fff",
              fontWeight: 900,
              cursor: saving || isLoading || !dateId ? "not-allowed" : "pointer",
              opacity: saving || isLoading || !dateId ? 0.6 : 1,
            }}
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

