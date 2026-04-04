import React from "react";
import type { CostPhase, EventCost, EventCostoTipo } from "../../types/events";
import { normalizeEventCosts } from "../../utils/eventCosts";

type Props = {
  value: any[];
  onChange: (value: EventCost[]) => void;
};

const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.25)",
  color: "#fff",
  fontSize: 14,
};

const sectionLabel: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "rgba(255,255,255,0.78)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.2,
};

function emptyPhase(order: number): CostPhase {
  return {
    id: makeId("phase"),
    name: `Preventa ${order}`,
    type: "preventa",
    description: "",
    price: 0,
    order,
    isFinal: false,
  };
}

function emptyCost(): EventCost {
  return {
    id: makeId("cost"),
    name: "",
    type: "taquilla",
    description: "",
    currency: "MXN",
    phases: [],
  };
}

function clonePhase(phase: CostPhase): CostPhase {
  return {
    ...phase,
    id: makeId("phase"),
  };
}

function cloneCost(cost: EventCost): EventCost {
  return {
    ...cost,
    id: makeId("cost"),
    name: cost.name ? `${cost.name} (copia)` : "Nuevo costo (copia)",
    phases: (cost.phases || []).map(clonePhase),
  };
}

const TYPE_OPTIONS: Array<{ value: EventCostoTipo; label: string }> = [
  { value: "taquilla", label: "Taquilla" },
  { value: "preventa", label: "Preventa" },
  { value: "promocion", label: "Promoción" },
  { value: "gratis", label: "Gratis" },
  { value: "otro", label: "Otro" },
];

export default function CostsPhasesEditor({ value, onChange }: Props) {
  const costs = React.useMemo(() => {
    const normalized = normalizeEventCosts(value);
    const normalizedIds = new Set(normalized.map((c) => String(c.id)));
    const raw = Array.isArray(value) ? value : [];

    const parseAmount = (v: any) => {
      if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, v);
      if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? Math.max(0, n) : 0;
      }
      return 0;
    };

    const stagedNoPhase: EventCost[] = raw
      .filter((item: any) => item && typeof item === "object" && Array.isArray(item.phases) && item.phases.length === 0)
      .map((item: any, idx: number) => ({
        id: String(item.id || `cost_raw_${idx}`),
        name: String(item.name || ""),
        type: (item.type || "taquilla") as EventCostoTipo,
        amount: parseAmount(item.amount ?? item.monto),
        description: item.description ? String(item.description) : "",
        currency: "MXN" as const,
        phases: [],
      }))
      .filter((cost) => !normalizedIds.has(String(cost.id)));

    return [...normalized, ...stagedNoPhase].map((c) => ({
      ...c,
      type: (c.type as EventCostoTipo) || "taquilla",
      amount: typeof c.amount === "number" ? c.amount : 0,
      phases: Array.isArray(c.phases) ? c.phases : [],
    }));
  }, [value]);

  const [openCostId, setOpenCostId] = React.useState<string | null>(null);
  const [openPhaseByCost, setOpenPhaseByCost] = React.useState<Record<string, string | null>>({});
  const costNameRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  React.useEffect(() => {
    if (!costs.length) {
      setOpenCostId(null);
      return;
    }
    if (openCostId && !costs.some((c) => c.id === openCostId)) {
      setOpenCostId(null);
    }
  }, [costs, openCostId]);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n || 0);

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  };

  const normalizePhases = (phases: CostPhase[], parentType: EventCostoTipo | string | undefined): CostPhase[] => {
    const sorted = [...phases].sort((a, b) => {
      const af = Boolean(a.isFinal || a.type === "taquilla");
      const bf = Boolean(b.isFinal || b.type === "taquilla");
      if (af !== bf) return af ? 1 : -1;
      return (a.order || 0) - (b.order || 0);
    });
    return sorted.map((phase, idx) => {
      const next = { ...phase, order: idx + 1 };
      if (next.type === "taquilla") next.isFinal = true;
      if (next.isFinal) {
        next.type = "taquilla";
        if (!next.name || /^preventa\s*\d+$/i.test(next.name) || /^fase\s*\d+$/i.test(next.name)) next.name = "Taquilla";
      } else if (!next.type) {
        next.type = parentType === "gratis" ? "gratis" : "preventa";
      }
      return next;
    });
  };

  const commitCosts = (nextCosts: EventCost[]) => {
    const withSync = nextCosts.map((cost) => {
      const phases = normalizePhases(cost.phases || [], cost.type);
      const amountFromPhases = phases[0]?.price ?? 0;
      return {
        ...cost,
        amount: cost.type === "gratis" ? 0 : amountFromPhases,
        phases,
      };
    });
    onChange(withSync);
  };

  const updateCost = (costId: string, patch: Partial<EventCost>) => {
    const next = costs.map((c) => (c.id === costId ? { ...c, ...patch } : c));
    commitCosts(next);
  };

  const removeCost = (costId: string) => {
    commitCosts(costs.filter((c) => c.id !== costId));
    setOpenPhaseByCost((prev) => {
      const next = { ...prev };
      delete next[costId];
      return next;
    });
    if (openCostId === costId) setOpenCostId(null);
  };

  const addCost = () => {
    const created = emptyCost();
    commitCosts([...costs, created]);
    setOpenCostId(created.id);
    setOpenPhaseByCost((prev) => ({ ...prev, [created.id]: null }));
    requestAnimationFrame(() => {
      costNameRefs.current[created.id]?.focus();
    });
  };

  const duplicateCost = (costId: string) => {
    const source = costs.find((c) => c.id === costId);
    if (!source) return;
    const duplicated = cloneCost(source);
    const insertAt = costs.findIndex((c) => c.id === costId);
    const next =
      insertAt >= 0
        ? [...costs.slice(0, insertAt + 1), duplicated, ...costs.slice(insertAt + 1)]
        : [...costs, duplicated];
    commitCosts(next);
    setOpenCostId(duplicated.id);
    setOpenPhaseByCost((prev) => ({ ...prev, [duplicated.id]: null }));
    requestAnimationFrame(() => {
      costNameRefs.current[duplicated.id]?.focus();
    });
  };

  const toggleCostOpen = (costId: string) => {
    setOpenCostId((prev) => {
      if (prev === costId) {
        setOpenPhaseByCost({});
        return null;
      }
      return costId;
    });
  };

  const saveCost = (costId: string) => {
    commitCosts(costs);
    setOpenPhaseByCost({});
    setOpenCostId(null);
  };

  const handleSafeClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const addPhase = (costId: string) => {
    const cost = costs.find((c) => c.id === costId);
    if (!cost) return;
    const nonFinalCount = cost.phases.filter((p) => !p.isFinal).length;
    const ph = emptyPhase(nonFinalCount + 1);
    ph.type = cost.type === "gratis" ? "gratis" : "preventa";
    if (cost.type === "gratis") ph.price = 0;
    updateCost(costId, { phases: [...cost.phases, ph] });
    setOpenCostId(costId);
    setOpenPhaseByCost((prev) => ({ ...prev, [costId]: ph.id }));
  };

  const updatePhase = (costId: string, phaseId: string, patch: Partial<CostPhase>) => {
    const cost = costs.find((c) => c.id === costId);
    if (!cost) return;
    const nextPhases = cost.phases.map((p) => {
      if (p.id !== phaseId) return p;
      const next = { ...p, ...patch };
      if (next.type === "taquilla") next.isFinal = true;
      if (next.type && next.type !== "taquilla" && patch.type) next.isFinal = false;
      if (next.isFinal) next.type = "taquilla";
      if (cost.type === "gratis") next.price = 0;
      return next;
    });
    updateCost(costId, {
      phases: nextPhases,
    });
  };

  const removePhase = (costId: string, phaseId: string) => {
    const cost = costs.find((c) => c.id === costId);
    if (!cost) return;
    const next = cost.phases
      .filter((p) => p.id !== phaseId)
      .map((p, idx) => ({ ...p, order: idx + 1 }));
    updateCost(costId, { phases: next });
    setOpenPhaseByCost((prev) => ({ ...prev, [costId]: prev[costId] === phaseId ? null : prev[costId] }));
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <h4 style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 18 }}>Costos</h4>
          <button
            type="button"
            onClick={addCost}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg, rgba(39,195,255,0.9), rgba(240,147,251,0.9))",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Tipo de costo
          </button>
        </div>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
          Configura primero el tipo de costo y luego agrega sus fases (preventa, taquilla, etc.).
        </p>
      </div>

      {costs.length === 0 && (
        <div style={{ ...inputStyle, borderStyle: "dashed", textAlign: "center", opacity: 0.8 }}>
          Agrega un tipo de costo (ej. Pulsera dorada) y después sus fases (preventa/taquilla).
        </div>
      )}

      {costs.map((cost, idx) => {
        const isOpen = openCostId === cost.id;
        const sortedPhases = [...cost.phases].sort((a, b) => a.order - b.order);
        const priceList = sortedPhases.map((p) => p.price).filter((v) => Number.isFinite(v));
        const minPrice = priceList.length ? Math.min(...priceList) : null;
        const maxPrice = priceList.length ? Math.max(...priceList) : null;
        const range =
          minPrice === null
            ? "Sin fases"
            : minPrice === maxPrice
              ? formatPrice(minPrice)
              : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
        const hasTaquilla = sortedPhases.some((p) => p.isFinal || p.type === "taquilla" || /taquilla/i.test(p.name || ""));
        return (
          <div
            key={cost.id}
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              padding: 10,
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <strong style={{ color: "#fff", fontSize: 14 }}>{cost.name?.trim() || `Tipo ${idx + 1}`}</strong>
                <button
                  type="button"
                  onClick={() => toggleCostOpen(cost.id)}
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "transparent",
                    color: "#fff",
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {isOpen ? "Ocultar costo" : "Editar costo"}
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, color: "rgba(255,255,255,0.78)", fontSize: 12 }}>
                <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.08)" }}>
                  {sortedPhases.length} fases
                </span>
                <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.08)" }}>{range}</span>
                {hasTaquilla && (
                  <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(255,209,102,0.18)", color: "#ffd166" }}>
                    Taquilla
                  </span>
                )}
              </div>
              {cost.description && <small style={{ color: "rgba(255,255,255,0.7)" }}>{cost.description}</small>}
            </div>

            {isOpen && (
              <div style={{ display: "grid", gap: 10, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div>
                    <label style={sectionLabel}>Nombre</label>
                    <input
                      ref={(el) => {
                        costNameRefs.current[cost.id] = el;
                      }}
                      value={cost.name || ""}
                      placeholder="Ej. Pulsera dorada"
                      onChange={(e) => updateCost(cost.id, { name: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={sectionLabel}>Tipo</label>
                    <select
                      value={(cost.type as string) || "taquilla"}
                      onChange={(e) => {
                        const nextType = e.target.value as EventCostoTipo;
                        const nextPhases =
                          nextType === "gratis"
                            ? cost.phases.map((p) => ({ ...p, type: "gratis", price: 0 }))
                            : cost.phases.map((p) => ({ ...p, type: p.type === "gratis" ? "preventa" : p.type || "preventa" }));
                        updateCost(cost.id, { type: nextType, phases: nextPhases });
                      }}
                      style={inputStyle}
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={sectionLabel}>Descripción (opcional)</label>
                    <textarea
                      value={cost.description || ""}
                      placeholder="Descripción breve del tipo de costo"
                      onChange={(e) => updateCost(cost.id, { description: e.target.value })}
                      rows={2}
                      style={{ ...inputStyle, resize: "vertical", minHeight: 62 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <strong style={{ color: "#fff", fontSize: 13 }}>Fases de precio</strong>
                    <button
                      type="button"
                      onClick={() => addPhase(cost.id)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(39,195,255,0.45)",
                        background: "rgba(39,195,255,0.12)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      + Agregar fase
                    </button>
                  </div>

                  {sortedPhases.length === 0 ? (
                    <div style={{ ...inputStyle, borderStyle: "dashed", textAlign: "center", opacity: 0.85 }}>
                      Aun no hay fases para este costo.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {sortedPhases.map((phase) => {
                        const phaseOpen = openPhaseByCost[cost.id] === phase.id;
                        const dateLabel = phase.isFinal
                          ? "Taquilla"
                          : [formatDate(phase.startDate), formatDate(phase.endDate)].filter(Boolean).join(" - ");
                        return (
                          <div
                            key={phase.id}
                            style={{
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 12,
                              background: "rgba(0,0,0,0.2)",
                              padding: 8,
                              display: "grid",
                              gap: 8,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
                                  {phase.name || `Fase ${phase.order}`} - {formatPrice(phase.price)}
                                </div>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", color: "rgba(255,255,255,0.72)", fontSize: 11 }}>
                                  {dateLabel && <span>{dateLabel}</span>}
                                  {phase.isFinal && (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        borderRadius: 999,
                                        padding: "2px 6px",
                                        border: "1px solid rgba(255,209,102,0.45)",
                                        background: "rgba(255,209,102,0.12)",
                                        color: "#ffd166",
                                      }}
                                    >
                                      Taquilla
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenPhaseByCost((prev) => ({
                                      ...prev,
                                      [cost.id]: prev[cost.id] === phase.id ? null : phase.id,
                                    }))
                                  }
                                  style={{
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    background: "transparent",
                                    color: "#fff",
                                    borderRadius: 999,
                                    padding: "5px 9px",
                                    fontSize: 11,
                                    cursor: "pointer",
                                  }}
                                >
                                  {phaseOpen ? "Ocultar" : "Editar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removePhase(cost.id, phase.id)}
                                  style={{
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    background: "rgba(255,255,255,0.04)",
                                    color: "rgba(255,255,255,0.86)",
                                    borderRadius: 999,
                                    padding: "5px 9px",
                                    fontSize: 11,
                                    cursor: "pointer",
                                  }}
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>

                            {phaseOpen && (
                              <div style={{ display: "grid", gap: 8 }}>
                                <div>
                                  <label style={sectionLabel}>Nombre fase</label>
                                  <input
                                    value={phase.name}
                                    onChange={(e) => updatePhase(cost.id, phase.id, { name: e.target.value })}
                                    placeholder="Ej. Preventa 1 / Taquilla"
                                    style={inputStyle}
                                  />
                                </div>
                                <div>
                                  <label style={sectionLabel}>Monto</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={cost.type === "gratis" ? 0 : phase.price}
                                    onChange={(e) => updatePhase(cost.id, phase.id, { price: Math.max(0, Number(e.target.value) || 0) })}
                                    placeholder="Precio"
                                    style={{ ...inputStyle, opacity: cost.type === "gratis" ? 0.6 : 1 }}
                                    disabled={cost.type === "gratis"}
                                  />
                                </div>
                                <div>
                                  <label style={sectionLabel}>Tipo fase</label>
                                  <select
                                    value={(phase.type as string) || (cost.type as string) || "preventa"}
                                    onChange={(e) => {
                                      const nextType = e.target.value as EventCostoTipo;
                                      updatePhase(cost.id, phase.id, {
                                        type: nextType,
                                        isFinal: nextType === "taquilla",
                                      });
                                    }}
                                    style={inputStyle}
                                  >
                                    {TYPE_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={sectionLabel}>Descripción fase (opcional)</label>
                                  <input
                                    value={phase.description || ""}
                                    onChange={(e) => updatePhase(cost.id, phase.id, { description: e.target.value })}
                                    placeholder="Ej. Valida solo con lista de invitados"
                                    style={inputStyle}
                                  />
                                </div>
                                {!phase.isFinal && (
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    <div>
                                      <label style={sectionLabel}>Inicio</label>
                                      <input
                                        type="date"
                                        value={phase.startDate || ""}
                                        onChange={(e) => updatePhase(cost.id, phase.id, { startDate: e.target.value || undefined })}
                                        style={inputStyle}
                                      />
                                    </div>
                                    <div>
                                      <label style={sectionLabel}>Fin</label>
                                      <input
                                        type="date"
                                        value={phase.endDate || ""}
                                        onChange={(e) => updatePhase(cost.id, phase.id, { endDate: e.target.value || undefined })}
                                        style={inputStyle}
                                      />
                                    </div>
                                  </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleSafeClick(e, () =>
                                        setOpenPhaseByCost((prev) => ({
                                          ...prev,
                                          [cost.id]: null,
                                        }))
                                      )
                                    }
                                    style={{
                                      border: "1px solid rgba(39,195,255,0.45)",
                                      background: "rgba(39,195,255,0.12)",
                                      color: "#fff",
                                      borderRadius: 10,
                                      padding: "8px 12px",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Guardar fase
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={(e) => handleSafeClick(e, () => saveCost(cost.id))}
                    style={{
                      border: "1px solid rgba(39,195,255,0.45)",
                      background: "rgba(39,195,255,0.12)",
                      color: "#fff",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginRight: 8,
                    }}
                  >
                    Guardar costo
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateCost(cost.id)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.92)",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                      marginRight: 8,
                    }}
                  >
                    Duplicar tipo
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCost(cost.id)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.84)",
                      borderRadius: 999,
                      padding: "6px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Eliminar tipo
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
