import React, { useEffect, useMemo, useState } from "react";
import DateFlyerUploader from "./DateFlyerUploader";
import { supabase } from "../../lib/supabase";
import { useEventDate } from "../../hooks/useEventDate";
import { useToast } from "../Toast";

type Props = {
  open: boolean;
  dateId: number | null;
  onClose: () => void;
  onUpdated?: (dateId: number, patch: Record<string, any>) => void;
};

export default function EventDateDrawer({ open, dateId, onClose, onUpdated }: Props) {
  const { showToast } = useToast();
  const { data: date, isLoading } = useEventDate(open && dateId ? dateId : undefined);
  const parentId = useMemo(() => (date as any)?.parent_id ?? null, [date]);

  const [draft, setDraft] = useState({
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    estado_publicacion: "borrador" as "borrador" | "publicado",
    referencias: "",
    lugar: "",
    direccion: "",
    ciudad: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!date) return;
    setDraft({
      fecha: String((date as any)?.fecha || "").split("T")[0],
      hora_inicio: (date as any)?.hora_inicio || "",
      hora_fin: (date as any)?.hora_fin || "",
      estado_publicacion: ((date as any)?.estado_publicacion || "borrador") as any,
      referencias: (date as any)?.referencias || "",
      lugar: (date as any)?.lugar || "",
      direccion: (date as any)?.direccion || "",
      ciudad: (date as any)?.ciudad || "",
    });
  }, [date]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          width: "min(560px, 92vw)",
          height: "100%",
          background: "rgba(18,18,18,0.98)",
          borderLeft: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
          padding: 18,
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>Editar fecha #{dateId}</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            ✕
          </button>
        </div>

        {isLoading && (
          <div style={{ color: "rgba(255,255,255,0.8)", padding: 12 }}>Cargando…</div>
        )}

        {!isLoading && date && (
          <>
            {/* Flyer override individual */}
            <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: 12, marginBottom: 14, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ fontWeight: 900, color: "#fff", marginBottom: 8 }}>🖼️ Flyer (override por fecha)</div>
              <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 10 }}>
                Subir flyer aquí <b>solo</b> afecta esta fecha. No bloquea guardar otros campos.
              </div>
              <DateFlyerUploader
                value={(date as any)?.flyer_url || null}
                dateId={dateId || undefined}
                parentId={typeof parentId === "number" ? parentId : undefined}
                onStatusChange={(st, msg) => {
                  if (st === "ERROR") showToast(msg || "Error subiendo flyer", "error");
                }}
                onChange={async (url) => {
                  try {
                    if (!dateId) return;
                    await supabase.from("events_date").update({ flyer_url: url || null }).eq("id", dateId);
                    onUpdated?.(dateId, { flyer_url: url || null });
                    showToast(url ? "Flyer guardado ✅" : "Flyer removido ✅", "success");
                  } catch (e: any) {
                    console.error("[EventDateDrawer] flyer update error:", e);
                    showToast(e?.message || "Error guardando flyer", "error");
                  }
                }}
              />
            </div>

            {/* Campos puntuales */}
            <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: 12, marginBottom: 14, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ fontWeight: 900, color: "#fff", marginBottom: 10 }}>🛠️ Ajustes</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Fecha</div>
                  <input
                    type="date"
                    value={draft.fecha}
                    onChange={(e) => setDraft((p) => ({ ...p, fecha: e.target.value }))}
                    style={{ width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Estado</div>
                  <select
                    value={draft.estado_publicacion}
                    onChange={(e) => setDraft((p) => ({ ...p, estado_publicacion: e.target.value as any }))}
                    style={{ width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "#2b2b2b", color: "#fff" }}
                  >
                    <option value="borrador">📝 borrador</option>
                    <option value="publicado">🌐 publicado</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Hora inicio</div>
                  <input
                    type="time"
                    value={draft.hora_inicio}
                    onChange={(e) => setDraft((p) => ({ ...p, hora_inicio: e.target.value }))}
                    style={{ width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Hora fin</div>
                  <input
                    type="time"
                    value={draft.hora_fin}
                    onChange={(e) => setDraft((p) => ({ ...p, hora_fin: e.target.value }))}
                    style={{ width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Notas / referencias</div>
                  <input
                    type="text"
                    value={draft.referencias}
                    onChange={(e) => setDraft((p) => ({ ...p, referencias: e.target.value }))}
                    placeholder="Ej. Entrada lateral, 2do piso"
                    style={{ width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Lugar</div>
                  <input
                    type="text"
                    value={draft.lugar}
                    onChange={(e) => setDraft((p) => ({ ...p, lugar: e.target.value }))}
                    style={{ width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Ciudad</div>
                  <input
                    type="text"
                    value={draft.ciudad}
                    onChange={(e) => setDraft((p) => ({ ...p, ciudad: e.target.value }))}
                    style={{ width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 12, opacity: 0.85, color: "#fff", marginBottom: 6 }}>Dirección</div>
                  <input
                    type="text"
                    value={draft.direccion}
                    onChange={(e) => setDraft((p) => ({ ...p, direccion: e.target.value }))}
                    style={{ width: "100%", padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(0,0,0,0.25)", color: "#fff" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (!dateId) return;
                    setSaving(true);
                    try {
                      const patch: any = {
                        fecha: draft.fecha || null,
                        hora_inicio: draft.hora_inicio || null,
                        hora_fin: draft.hora_fin || null,
                        estado_publicacion: draft.estado_publicacion,
                        referencias: draft.referencias || null,
                        lugar: draft.lugar || null,
                        ciudad: draft.ciudad || null,
                        direccion: draft.direccion || null,
                      };
                      const { error } = await supabase.from("events_date").update(patch).eq("id", dateId);
                      if (error) throw error;
                      onUpdated?.(dateId, patch);
                      showToast("Guardado ✅", "success");
                    } catch (e: any) {
                      console.error("[EventDateDrawer] save error:", e);
                      showToast(e?.message || "Error guardando", "error");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(39,195,255,0.55)",
                    background: saving
                      ? "rgba(255,255,255,0.08)"
                      : "linear-gradient(135deg, rgba(39,195,255,0.22), rgba(30,136,229,0.22))",
                    color: "#fff",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: 900,
                  }}
                >
                  {saving ? "Guardando…" : "💾 Guardar cambios"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

