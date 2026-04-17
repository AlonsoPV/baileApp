import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import "@/styles/costsPromotionsEditor.css";

export type PromotionType =
  | "clase_suelta"
  | "promocion"
  | "paquete"
  | "descuento"
  | "membresia"
  | "otro";

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

const TIPOS_ORDEN: PromotionType[] = [
  "clase_suelta",
  "promocion",
  "paquete",
  "descuento",
  "membresia",
  "otro",
];

const typeOptions: Array<{ value: PromotionType; label: string; icon: string }> = [
  { value: "clase_suelta", label: "Clase suelta", icon: "🎫" },
  { value: "promocion", label: "Promoción", icon: "✨" },
  { value: "paquete", label: "Paquete", icon: "🧾" },
  { value: "descuento", label: "Descuento", icon: "💸" },
  { value: "membresia", label: "Membresía", icon: "🎟️" },
  { value: "otro", label: "Otro", icon: "💡" },
];

const emptyPromotion: PromotionItem = {
  nombre: "",
  tipo: "clase_suelta",
  descripcion: "",
  condicion: "",
  precio: null,
  validoDesde: "",
  validoHasta: "",
  activo: true,
  codigo: "",
};

function normalizeTipo(raw?: string | null): PromotionType {
  if (raw && TIPOS_ORDEN.includes(raw as PromotionType)) return raw as PromotionType;
  return "otro";
}

function tipoBadgeClass(tipo: string): string {
  const key = TIPOS_ORDEN.includes(tipo as PromotionType) ? tipo : "otro";
  return `cpe__badge cpe__badge--${key}`;
}

const formatCurrency = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "Gratis";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (numeric === null || Number.isNaN(numeric)) return `$${String(value)}`;
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(numeric));
  } catch {
    return `$${Number(numeric).toLocaleString("es-MX")}`;
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
    const tipo = normalizeTipo(current.tipo as string);
    const isSingle = tipo === "clase_suelta";
    setDraft({
      ...emptyPromotion,
      ...current,
      tipo,
      precio: current.precio ?? null,
      condicion: isSingle ? "" : current.condicion || "",
      validoDesde: isSingle ? "" : current.validoDesde || "",
      validoHasta: isSingle ? "" : current.validoHasta || "",
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
    setDraft((prev) => {
      const next = { ...prev, [field]: val } as PromotionItem;
      if (field === "tipo" && val === "clase_suelta") {
        next.condicion = "";
        next.validoDesde = "";
        next.validoHasta = "";
      }
      return next;
    });
  };

  const sanitizedDraft = useMemo(() => {
    const tipo = normalizeTipo(draft.tipo as string);
    const base: PromotionItem = {
      ...draft,
      tipo,
      nombre: (draft.nombre || "").trim(),
      descripcion: draft.descripcion ? draft.descripcion.trim() : "",
      condicion: draft.condicion ? draft.condicion.trim() : "",
      codigo: draft.codigo ? draft.codigo.trim() : "",
      precio:
        draft.precio === null || draft.precio === undefined || Number.isNaN(draft.precio)
          ? null
          : Number(draft.precio),
      validoDesde: draft.validoDesde ? draft.validoDesde : undefined,
      validoHasta: draft.validoHasta ? draft.validoHasta : undefined,
      activo: draft.activo ?? true,
    };
    if (tipo === "clase_suelta") {
      return {
        ...base,
        condicion: "",
        validoDesde: undefined,
        validoHasta: undefined,
      };
    }
    return base;
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

  const draftTipo = normalizeTipo(draft.tipo as string);
  const isClaseSueltaForm = draftTipo === "clase_suelta";

  return (
    <div className="cpe">
      <div className="cpe__header">
        {!hideHeader && (
          <div style={{ minWidth: 0 }}>
            <h3 className="cpe__title">{label}</h3>
            {helperText ? <p className="cpe__subtitle">{helperText}</p> : null}
          </div>
        )}
        <motion.button
          type="button"
          whileHover={{ scale: mode === "adding" ? 1 : 1.02 }}
          whileTap={{ scale: mode === "adding" ? 1 : 0.98 }}
          className="cpe__btn cpe__btn--primary"
          onClick={handleStartAdd}
          disabled={mode === "adding"}
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden />
          Nueva promoción
        </motion.button>
      </div>

      <div className="cpe__list">
        {value.length === 0 && mode === "idle" && (
          <div className="cpe__empty">
            Aún no tienes promociones configuradas. Añade tu primera clase suelta, paquete o descuento.
          </div>
        )}

        {value.map((item, index) => {
          const tipoNorm = normalizeTipo(item.tipo as string);
          const opt = typeOptions.find((o) => o.value === tipoNorm);
          const isFree = item.precio === null || item.precio === 0;
          return (
            <motion.div
              key={`${item.id ?? index}-${item.nombre}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="cpe__item"
            >
              <div className={tipoBadgeClass(tipoNorm)} title={opt?.label}>
                <span aria-hidden>{opt?.icon ?? "💡"}</span>{" "}
                <span className="cpe__badge-label">{opt?.label ?? "Otro"}</span>
              </div>

              <div className="cpe__main">
                <div className="cpe__row-top">
                  <div style={{ minWidth: 0 }}>
                    <h4 className="cpe__name">{item.nombre}</h4>
                    {item.descripcion ? <p className="cpe__desc">{item.descripcion}</p> : null}
                  </div>
                  <div className={`cpe__price${isFree ? " cpe__price--free" : " cpe__price--paid"}`}>
                    {formatCurrency(item.precio)}
                  </div>
                </div>

                <div className="cpe__meta">
                  {item.activo === false && <span className="cpe__pill">Inactiva</span>}
                  {item.codigo ? (
                    <span className="cpe__pill cpe__pill--code">🎫 {item.codigo.toUpperCase()}</span>
                  ) : null}
                  {tipoNorm !== "clase_suelta" && item.condicion ? (
                    <span className="cpe__pill cpe__pill--clamp">
                      📋 {item.condicion}
                    </span>
                  ) : null}
                  {tipoNorm !== "clase_suelta" && (item.validoDesde || item.validoHasta) ? (
                    <span className="cpe__pill cpe__pill--dates">
                      ⏰ {formatDate(item.validoDesde) ?? "hoy"}
                      {item.validoHasta ? ` — ${formatDate(item.validoHasta)}` : ""}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="cpe__actions">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="cpe__btn cpe__btn--ghost cpe__btn--icon"
                  onClick={() => handleStartEdit(index)}
                  title="Editar"
                  aria-label="Editar"
                >
                  <Pencil size={18} />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="cpe__btn cpe__btn--danger cpe__btn--icon"
                  onClick={() => handleRemove(index)}
                  title="Eliminar"
                  aria-label="Eliminar"
                >
                  <Trash2 size={18} />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {mode !== "idle" && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="cpe__panel"
          >
            <div className="cpe__panel-hd">
              <h4 className="cpe__panel-title">{mode === "adding" ? "Nueva promoción" : "Editar promoción"}</h4>
              <button type="button" className="cpe__panel-close" onClick={reset}>
                <X size={16} aria-hidden />
                Cerrar
              </button>
            </div>

            <div className="cpe__grid">
              <div className="cpe__grid-auto">
                <div className="cpe__field">
                  <label className="cpe__label" htmlFor="cpe-tipo">
                    Tipo
                  </label>
                  <div className="cpe__select-wrap">
                    <select
                      id="cpe-tipo"
                      className="cpe__select"
                      value={draft.tipo}
                      onChange={(e) => handleFieldChange("tipo", e.target.value as PromotionType)}
                    >
                      {typeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="cpe__chev" aria-hidden>
                      <ChevronDown />
                    </span>
                  </div>
                </div>

                <div className="cpe__field">
                  <label className="cpe__label" htmlFor="cpe-precio">
                    Precio
                  </label>
                  <input
                    id="cpe-precio"
                    type="number"
                    min={0}
                    step={1}
                    className="cpe__input"
                    value={draft.precio ?? ""}
                    onChange={(e) =>
                      handleFieldChange("precio", e.target.value === "" ? null : Number(e.target.value))
                    }
                    placeholder="Vacío = gratis"
                  />
                </div>

                <div className="cpe__field">
                  <label className="cpe__label" htmlFor="cpe-codigo">
                    Código (opcional)
                  </label>
                  <input
                    id="cpe-codigo"
                    type="text"
                    className="cpe__input"
                    value={draft.codigo ?? ""}
                    onChange={(e) => handleFieldChange("codigo", e.target.value)}
                    placeholder="Ej. BAILE10"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>

                <div className="cpe__field">
                  <span className="cpe__label">Estado</span>
                  <button
                    type="button"
                    className={`cpe__btn cpe__toggle${draft.activo === false ? " cpe__toggle--off" : " cpe__toggle--on"}`}
                    onClick={() => handleFieldChange("activo", !(draft.activo ?? true))}
                  >
                    {draft.activo === false ? "Inactiva" : "Activa"}
                  </button>
                </div>
              </div>

              <div className="cpe__field">
                <label className="cpe__label" htmlFor="cpe-nombre">
                  Nombre <span style={{ color: "var(--cpe-danger)" }}>*</span>
                </label>
                <input
                  id="cpe-nombre"
                  type="text"
                  className="cpe__input"
                  value={draft.nombre}
                  onChange={(e) => handleFieldChange("nombre", e.target.value)}
                  placeholder="Ej. Clase suelta nivel intermedio"
                />
              </div>

              <div className="cpe__field">
                <label className="cpe__label" htmlFor="cpe-desc">
                  Descripción (opcional)
                </label>
                <textarea
                  id="cpe-desc"
                  className="cpe__textarea"
                  value={draft.descripcion ?? ""}
                  onChange={(e) => handleFieldChange("descripcion", e.target.value)}
                  placeholder="Detalle qué incluye o a quién va dirigida."
                  rows={3}
                />
              </div>

              {!isClaseSueltaForm && (
                <div className="cpe__field">
                  <label className="cpe__label" htmlFor="cpe-cond">
                    Condición / requisitos
                  </label>
                  <textarea
                    id="cpe-cond"
                    className="cpe__textarea"
                    value={draft.condicion ?? ""}
                    onChange={(e) => handleFieldChange("condicion", e.target.value)}
                    placeholder="Ej. Solo estudiantes nuevos o mínimo 2 personas."
                    rows={2}
                  />
                </div>
              )}

              {!isClaseSueltaForm && (
                <div className="cpe__grid-2">
                  <div className="cpe__field">
                    <label className="cpe__label" htmlFor="cpe-desde">
                      Vigente desde
                    </label>
                    <input
                      id="cpe-desde"
                      type="date"
                      className="cpe__input"
                      value={draft.validoDesde || ""}
                      onChange={(e) => handleFieldChange("validoDesde", e.target.value)}
                    />
                  </div>
                  <div className="cpe__field">
                    <label className="cpe__label" htmlFor="cpe-hasta">
                      Vigente hasta
                    </label>
                    <input
                      id="cpe-hasta"
                      type="date"
                      className="cpe__input"
                      value={draft.validoHasta || ""}
                      min={draft.validoDesde || undefined}
                      onChange={(e) => handleFieldChange("validoHasta", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {mode === "adding" && !draft.nombre.trim() && (
              <p className="cpe__hint">El nombre es obligatorio para guardar.</p>
            )}

            <div className="cpe__footer">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cpe__btn cpe__btn--ghost"
                onClick={reset}
              >
                Cancelar
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: sanitizedDraft.nombre ? 1.02 : 1 }}
                whileTap={{ scale: sanitizedDraft.nombre ? 0.98 : 1 }}
                className="cpe__btn cpe__btn--primary"
                disabled={!sanitizedDraft.nombre}
                onClick={handleSave}
              >
                {mode === "adding" ? "Guardar" : "Actualizar"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
