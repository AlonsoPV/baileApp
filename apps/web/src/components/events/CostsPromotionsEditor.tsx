import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const palette = {
  surface: "rgba(20, 22, 30, 0.7)",
  border: "rgba(255, 255, 255, 0.12)",
  text: "#F5F5F5",
  accent: "#f093fb",
  accentAlt: "#FFD166",
  danger: "#FF3D57",
  success: "#10B981",
  blue: "#1E88E5",
};

export type PromotionType = "promocion" | "paquete" | "descuento" | "membresia" | "otro";

export interface PromotionItem {
  id?: string | number;
  nombre: string;
  tipo: PromotionType;
  descripcion?: string;
  condicion?: string;
  precio?: number | null;
  validoDesde?: string;
  validoHasta?: string;
  activo?: boolean;
  codigo?: string;
}

interface CostsPromotionsEditorProps {
  value: PromotionItem[];
  onChange: (value: PromotionItem[]) => void;
  label?: string;
  helperText?: string;
  hideHeader?: boolean;
}

const emptyPromotion: PromotionItem = {
  nombre: "",
  tipo: "promocion",
  descripcion: "",
  condicion: "",
  precio: null,
  validoDesde: "",
  validoHasta: "",
  activo: true,
  codigo: "",
};

const typeOptions: Array<{ value: PromotionType; label: string; icon: string }> = [
  { value: "promocion", label: "Promoción", icon: "✨" },
  { value: "paquete", label: "Paquete", icon: "🧾" },
  { value: "descuento", label: "Descuento", icon: "💸" },
  { value: "membresia", label: "Membresía", icon: "🎟️" },
  { value: "otro", label: "Otro", icon: "💡" },
];

const formatCurrency = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "Gratis";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (numeric === null || Number.isNaN(numeric)) return `$${String(value)}`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `$${Number(numeric).toLocaleString("en-US")}`;
  }
};

const formatDate = (value?: string) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

export default function CostsPromotionsEditor({
  value,
  onChange,
  label = "Promociones y Paquetes",
  helperText = "Agrega descuentos, paquetes o beneficios especiales con su vigencia.",
  hideHeader = false,
}: CostsPromotionsEditorProps) {
  const [mode, setMode] = useState<"idle" | "adding" | "editing">("idle");
  const [draft, setDraft] = useState<PromotionItem>({ ...emptyPromotion });
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const reset = () => {
    setMode("idle");
    setDraft({ ...emptyPromotion });
    setEditIndex(null);
  };

  const handleStartAdd = () => {
    setDraft({ ...emptyPromotion });
    setEditIndex(null);
    setMode("adding");
  };

  const handleStartEdit = (index: number) => {
    const current = value[index];
    if (!current) return;
    setDraft({
      ...emptyPromotion,
      ...current,
      precio: current.precio ?? null,
      validoDesde: current.validoDesde || "",
      validoHasta: current.validoHasta || "",
    });
    setEditIndex(index);
    setMode("editing");
  };

  const handleRemove = (index: number) => {
    const next = value.filter((_, idx) => idx !== index);
    onChange(next);
    if (editIndex === index) reset();
  };

  const handleFieldChange = <K extends keyof PromotionItem>(field: K, val: PromotionItem[K]) => {
    setDraft((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const sanitizedDraft = useMemo(() => {
    const cleaned: PromotionItem = {
      ...draft,
      nombre: (draft.nombre || "").trim(),
      descripcion: draft.descripcion ? draft.descripcion.trim() : "",
      condicion: draft.condicion ? draft.condicion.trim() : "",
      codigo: draft.codigo ? draft.codigo.trim() : "",
      precio: draft.precio === null || draft.precio === undefined || Number.isNaN(draft.precio)
        ? null
        : Number(draft.precio),
      validoDesde: draft.validoDesde ? draft.validoDesde : undefined,
      validoHasta: draft.validoHasta ? draft.validoHasta : undefined,
      activo: draft.activo ?? true,
    };
    return cleaned;
  }, [draft]);

  const handleSave = () => {
    if (!sanitizedDraft.nombre) return;
    if (mode === "adding") {
      onChange([...value, sanitizedDraft]);
    } else if (mode === "editing" && editIndex !== null) {
      const next = [...value];
      next[editIndex] = sanitizedDraft;
      onChange(next);
    }
    reset();
  };

  const hasDates = sanitizedDraft.validoDesde || sanitizedDraft.validoHasta;

  return (
    <div
      style={{
        background: "rgba(12, 14, 20, 0.6)",
        borderRadius: 16,
        border: `1px solid ${palette.border}`,
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: hideHeader ? "flex-end" : "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {!hideHeader && (
          <div>
            <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: palette.text }}>{label}</h3>
            {helperText && (
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                {helperText}
              </p>
            )}
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleStartAdd}
          disabled={mode === "adding"}
          style={{
            padding: "0.65rem 1.1rem",
            borderRadius: 999,
            border: "none",
            background: mode === "adding"
              ? "rgba(255,255,255,0.1)"
              : "linear-gradient(135deg, rgba(240,147,251,0.9), rgba(30,136,229,0.9))",
            color: palette.text,
            fontWeight: 700,
            cursor: mode === "adding" ? "not-allowed" : "pointer",
            boxShadow: mode === "adding" ? "none" : "0 10px 24px rgba(240,147,251,0.35)",
          }}
        >
          ➕ Nueva promoción
        </motion.button>
      </div>

      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {value.length === 0 && mode === "idle" && (
          <div style={{
            padding: "1.25rem",
            borderRadius: 14,
            border: `1px dashed ${palette.border}`,
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            fontSize: "0.95rem",
          }}>
            Aún no tienes promociones configuradas. Añade tu primer paquete o descuento especial.
          </div>
        )}

        {value.map((item, index) => (
          <motion.div
            key={`${item.id ?? index}-${item.nombre}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 12,
              border: `1px solid ${palette.border}`,
              background: "rgba(28, 32, 42, 0.7)",
              padding: "0.875rem 1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              position: "relative",
            }}
          >
            {/* Tipo badge compacto */}
            <div style={{
              padding: "0.35rem 0.6rem",
              borderRadius: 8,
              background: "rgba(240,147,251,0.15)",
              border: "1px solid rgba(240,147,251,0.35)",
              color: palette.accent,
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "capitalize",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}>
              {typeOptions.find((opt) => opt.value === item.tipo)?.icon ?? "✨"}
            </div>

            {/* Contenido principal */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ 
                    margin: 0, 
                    color: palette.text, 
                    fontSize: "0.95rem", 
                    fontWeight: 700,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as any,
                    overflow: "hidden",
                    lineHeight: 1.3,
                  }}>
                    {item.nombre}
                  </h4>
                  {item.descripcion && (
                    <p style={{ 
                      margin: "0.25rem 0 0", 
                      color: "rgba(255,255,255,0.65)", 
                      fontSize: "0.8rem", 
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical" as any,
                      overflow: "hidden",
                    }}>
                      {item.descripcion}
                    </p>
                  )}
                </div>

                {/* Precio destacado */}
                <div style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: 10,
                  background: item.precio === null || item.precio === 0
                    ? "rgba(16,185,129,0.15)"
                    : "linear-gradient(135deg, rgba(30,136,229,0.2), rgba(124,77,255,0.15))",
                  border: item.precio === null || item.precio === 0
                    ? "1px solid rgba(16,185,129,0.4)"
                    : "1px solid rgba(30,136,229,0.4)",
                  color: item.precio === null || item.precio === 0 ? palette.success : palette.blue,
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  boxShadow: item.precio !== null && item.precio !== 0 ? "0 4px 12px rgba(30,136,229,0.2)" : "none",
                }}>
                  {formatCurrency(item.precio)}
                </div>
              </div>

              {/* Badges compactos en una línea */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center", marginTop: "0.4rem" }}>
                {item.activo === false && (
                  <span style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                  }}>
                    Inactiva
                  </span>
                )}
                {item.codigo && (
                  <span style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: 6,
                    background: "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.4)",
                    color: palette.success,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}>
                    🎫 {item.codigo.toUpperCase()}
                  </span>
                )}
                {item.condicion && (
                  <span style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.7rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical" as any,
                    overflow: "hidden",
                    maxWidth: "200px",
                  }}>
                    📋 {item.condicion}
                  </span>
                )}
                {(item.validoDesde || item.validoHasta) && (
                  <span style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: 6,
                    background: "rgba(255,209,102,0.12)",
                    border: "1px solid rgba(255,209,102,0.35)",
                    color: palette.accentAlt,
                    fontSize: "0.7rem",
                    whiteSpace: "nowrap",
                  }}>
                    ⏰ {formatDate(item.validoDesde) ?? "hoy"}
                    {item.validoHasta && ` - ${formatDate(item.validoHasta)}`}
                  </span>
                )}
              </div>
            </div>

            {/* Botones de acción como iconos */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", flexShrink: 0 }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleStartEdit(index)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.08)",
                  color: palette.text,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  padding: 0,
                }}
                title="Editar"
              >
                ✏️
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRemove(index)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid rgba(255,61,87,0.4)",
                  background: "rgba(255,61,87,0.12)",
                  color: palette.danger,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  padding: 0,
                }}
                title="Eliminar"
              >
                🗑️
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {mode !== "idle" && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            style={{
              marginTop: "1.75rem",
              borderRadius: 18,
              border: `1px solid rgba(240,147,251,0.25)`,
              background: "rgba(32, 36, 48, 0.85)",
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: palette.text }}>
                {mode === "adding" ? "Nueva promoción" : "Editar promoción"}
              </h4>
              <button
                type="button"
                onClick={reset}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.65)",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                ✖ Cerrar
              </button>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    Tipo
                  </label>
                  <select
                    value={draft.tipo}
                    onChange={(e) => handleFieldChange("tipo", e.target.value as PromotionType)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      background: "rgba(10,12,16,0.8)",
                      color: palette.text,
                    }}
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    Precio
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={draft.precio ?? ""}
                    onChange={(e) => handleFieldChange("precio", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="Dejar vacío para Gratis"
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      background: "rgba(10,12,16,0.8)",
                      color: palette.text,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    Código promocional (opcional)
                  </label>
                  <input
                    type="text"
                    value={draft.codigo ?? ""}
                    onChange={(e) => handleFieldChange("codigo", e.target.value)}
                    placeholder="Ej. BAILE10"
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      background: "rgba(10,12,16,0.8)",
                      color: palette.text,
                      textTransform: "uppercase",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    Estado
                  </label>
                  <button
                    type="button"
                    onClick={() => handleFieldChange("activo", !(draft.activo ?? true))}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem",
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      background: draft.activo === false ? "rgba(255,255,255,0.08)" : "rgba(16,185,129,0.12)",
                      color: draft.activo === false ? "rgba(255,255,255,0.75)" : palette.success,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {draft.activo === false ? "Inactiva" : "Activa"}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                  Nombre de la promoción *
                </label>
                <input
                  type="text"
                  value={draft.nombre}
                  onChange={(e) => handleFieldChange("nombre", e.target.value)}
                  placeholder="Ej. Paquete 4 clases + social"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    background: "rgba(10,12,16,0.8)",
                    color: palette.text,
                    fontSize: "1rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                  Descripción (opcional)
                </label>
                <textarea
                  value={draft.descripcion ?? ""}
                  onChange={(e) => handleFieldChange("descripcion", e.target.value)}
                  placeholder="Incluye clases grupales, práctica social y asesoría personalizada."
                  rows={3}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    background: "rgba(10,12,16,0.8)",
                    color: palette.text,
                    padding: "0.75rem",
                    resize: "vertical",
                    minHeight: "120px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                  Condición / Requisitos
                </label>
                <textarea
                  value={draft.condicion ?? ""}
                  onChange={(e) => handleFieldChange("condicion", e.target.value)}
                  placeholder="Ej. válido solo para estudiantes nuevos o a partir de 2 personas."
                  rows={2}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    background: "rgba(10,12,16,0.8)",
                    color: palette.text,
                    padding: "0.75rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    Vigente desde
                  </label>
                  <input
                    type="date"
                    value={draft.validoDesde || ""}
                    onChange={(e) => handleFieldChange("validoDesde", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.75rem",
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      background: "rgba(10,12,16,0.8)",
                      color: palette.text,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    Vigente hasta
                  </label>
                  <input
                    type="date"
                    value={draft.validoHasta || ""}
                    min={draft.validoDesde || undefined}
                    onChange={(e) => handleFieldChange("validoHasta", e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.75rem",
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      background: "rgba(10,12,16,0.8)",
                      color: palette.text,
                    }}
                  />
                </div>
              </div>
            </div>

            {mode === "adding" && !draft.nombre.trim() && (
              <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.65)" }}>
                El nombre es obligatorio para guardar la promoción.
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={reset}
                style={{
                  padding: "0.65rem 1.1rem",
                  borderRadius: 999,
                  border: `1px solid ${palette.border}`,
                  background: "transparent",
                  color: palette.text,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={!sanitizedDraft.nombre}
                onClick={handleSave}
                style={{
                  padding: "0.65rem 1.4rem",
                  borderRadius: 999,
                  border: "none",
                  background: sanitizedDraft.nombre
                    ? "linear-gradient(135deg, rgba(240,147,251,0.9), rgba(30,136,229,0.9))"
                    : "rgba(255,255,255,0.1)",
                  color: palette.text,
                  fontWeight: 700,
                  cursor: sanitizedDraft.nombre ? "pointer" : "not-allowed",
                  boxShadow: sanitizedDraft.nombre ? "0 12px 26px rgba(240,147,251,0.35)" : "none",
                }}
              >
                {mode === "adding" ? "Guardar promoción" : "Actualizar promoción"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

