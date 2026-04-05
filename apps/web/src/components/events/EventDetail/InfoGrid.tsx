import React from "react";
import { Calendar, ChevronDown, MapPin, Copy, Ticket } from "lucide-react";
import { normalizeEventCosts } from "../../../utils/eventCosts";

type CostItem = {
  id?: string;
  name?: string;
  description?: string;
  currency?: "MXN" | string;
  phases?: Array<{
    id?: string;
    name?: string;
    type?: string;
    description?: string;
    price?: number;
    monto?: number;
    startDate?: string;
    endDate?: string;
    order?: number;
    isFinal?: boolean;
  }>;
  nombre?: string;
  tipo?: string;
  precio?: number | string | null;
  monto?: number | string | null;
  regla?: string;
  descripcion?: string;
};

export interface InfoGridProps {
  dateStr: string;
  timeRange: string;
  venueName: string;
  city?: string;
  mapsUrl: string;
  fullAddress?: string;
  onCopyAddress?: () => void;
  costsSummary?: string;
  costsItems?: CostItem[];
  costsDisclaimer?: string;
  freeLabel?: string;
}

export function InfoGrid({
  dateStr,
  timeRange,
  venueName,
  city,
  mapsUrl,
  fullAddress,
  onCopyAddress,
  costsSummary,
  costsItems,
  costsDisclaimer = "Precios sujetos a cambios",
  freeLabel = "Gratis",
}: InfoGridProps) {
  const locationLabel = [venueName, city].filter(Boolean).join(", ") || venueName || city;
  const legacyItems = Array.isArray(costsItems) ? costsItems : [];
  const phasedCosts = normalizeEventCosts(legacyItems);

  /** Por defecto todos los tableros de costos están colapsados */
  const [expandedCostIds, setExpandedCostIds] = React.useState<Set<string>>(() => new Set());

  const toggleCostBoard = (id: string) => {
    setExpandedCostIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatPrice = (raw: CostItem["monto"] | CostItem["precio"]) => {
    const isFree =
      raw === 0 ||
      raw === null ||
      raw === undefined ||
      (typeof raw === "string" && (raw === "" || raw.toLowerCase() === "gratis"));
    if (isFree) return freeLabel;

    const num =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? parseFloat(raw.replace(/[^\d.]/g, ""))
          : NaN;

    if (!Number.isFinite(num)) return String(raw ?? freeLabel);
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const prettifyType = (tipo?: string) => {
    const t = (tipo || "").trim().toLowerCase();
    if (!t) return "";
    if (t === "preventa") return "Preventa";
    if (t === "taquilla") return "Taquilla";
    if (t === "promocion") return "Promoción";
    if (t === "gratis") return "Gratis";
    if (t === "otro") return "Otro";
    return tipo || "";
  };

  return (
    <div className="eds-info-grid eds-info-grid--costs-loc-date">
      <div className="eds-info-card eds-info-card--costs">
        <div className="eds-info-card__row">
          <div className="eds-info-card__icon">
            <Ticket size={20} strokeWidth={2} />
          </div>
          <div className="eds-info-card__label">Costos</div>
        </div>
        <div className="eds-info-card__value">
          {phasedCosts.length > 0 ? (
            <div style={{ display: "grid", gap: 10 }}>
              {phasedCosts.map((cost) => {
                const isOpen = expandedCostIds.has(cost.id);
                const headId = `eds-cost-head-${cost.id}`;
                const phasesId = `eds-cost-phases-${cost.id}`;
                return (
                  <div
                    key={cost.id}
                    className={`eds-cost-board${isOpen ? " eds-cost-board--open" : " eds-cost-board--collapsed"}`}
                  >
                    <button
                      type="button"
                      className="eds-cost-board__toggle"
                      id={headId}
                      aria-expanded={isOpen}
                      aria-controls={phasesId}
                      onClick={() => toggleCostBoard(cost.id)}
                    >
                      <span className="eds-cost-board__toggle-text">
                        <span className="eds-cost-board__name">{cost.name}</span>
                        {cost.description && <small className="eds-cost-board__desc">{cost.description}</small>}
                      </span>
                      <ChevronDown className="eds-cost-board__chevron" size={20} strokeWidth={2} aria-hidden />
                    </button>
                    {isOpen && (
                      <div
                        className="eds-cost-board__phases"
                        id={phasesId}
                        role="region"
                        aria-labelledby={headId}
                      >
                        {[...cost.phases]
                          .sort((a, b) => a.order - b.order)
                          .map((phase) => (
                            <div key={phase.id} className="eds-cost-board__phase">
                              <div className="eds-cost-board__phase-title">
                                {phase.name}
                                {phase.type && <span className="eds-cost-board__type">{prettifyType(phase.type)}</span>}
                                {phase.isFinal && <span className="eds-cost-board__badge">Taquilla</span>}
                              </div>
                              <strong className="eds-cost-board__phase-price">{formatPrice(phase.price ?? phase.monto)}</strong>
                              {phase.description && <small className="eds-cost-board__phase-desc">{phase.description}</small>}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <small style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>{costsDisclaimer}</small>
            </div>
          ) : (
            legacyItems.length > 0 ? (
              <div style={{ display: "grid", gap: 6 }}>
                {legacyItems.map((item, i) => {
                  const label =
                    item.nombre ||
                    (item.tipo
                      ? String(item.tipo).charAt(0).toUpperCase() + String(item.tipo).slice(1).toLowerCase()
                      : "Entrada");
                  const price = formatPrice(item.monto ?? item.precio);
                  const subtitle = item.descripcion ?? item.regla;
                  return (
                    <div key={`cost-${i}`} style={{ display: "grid", gap: 2 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span>{label}</span>
                        <strong>{price}</strong>
                      </div>
                      {subtitle && (
                        <small style={{ opacity: 0.8, fontSize: 12 }}>{subtitle}</small>
                      )}
                    </div>
                  );
                })}
                <small style={{ opacity: 0.7, fontSize: 12, marginTop: 4 }}>{costsDisclaimer}</small>
              </div>
            ) : (
              costsSummary || "Por confirmar"
            )
          )}
        </div>
      </div>
      <div className="eds-info-grid__loc-date">
        <div className="eds-info-card eds-info-card--location">
          <div className="eds-info-card__row">
            <div className="eds-info-card__icon">
              <MapPin size={20} strokeWidth={2} />
            </div>
            <div className="eds-info-card__label">Ubicación</div>
          </div>
          <div className="eds-info-card__value">{locationLabel || "—"}</div>
          <div className="eds-info-card__actions">
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="eds-info-card__link"
              >
                Ver mapa ↗
              </a>
            )}
            {fullAddress && onCopyAddress && (
              <button
                type="button"
                className="eds-info-card__copy"
                onClick={onCopyAddress}
                aria-label="Copiar dirección"
              >
                <Copy size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        <div className="eds-info-card eds-info-card--datetime">
          <div className="eds-info-card__row">
            <div className="eds-info-card__icon">
              <Calendar size={20} strokeWidth={2} />
            </div>
            <div className="eds-info-card__label">Fecha y horario</div>
          </div>
          <div className="eds-info-card__value">
            {dateStr || "—"}
            {timeRange && (
              <>
                <br />
                {timeRange}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
