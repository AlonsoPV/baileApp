import React from "react";
import { Calendar, MapPin, Copy, Ticket } from "lucide-react";

type CostItem = {
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
  const items = Array.isArray(costsItems) ? costsItems : [];

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

  return (
    <div className="eds-info-grid">
      <div className="eds-info-card">
        <div className="eds-info-card__row">
          <div className="eds-info-card__icon">
            <Ticket size={20} strokeWidth={2} />
          </div>
          <div className="eds-info-card__label">Costos</div>
        </div>
        <div className="eds-info-card__value">
          {items.length > 0 ? (
            <div style={{ display: "grid", gap: 6 }}>
              {items.map((item, i) => {
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
          )}
        </div>
      </div>
      <div className="eds-info-card">
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
      <div className="eds-info-card">
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
  );
}
