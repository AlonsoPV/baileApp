import React from "react";
import { Ticket } from "lucide-react";

export interface CostItem {
  nombre?: string;
  tipo?: string;
  precio?: number | string | null;
  regla?: string;
}

export interface CostsSectionProps {
  items: CostItem[];
  disclaimer?: string;
  freeLabel?: string;
  formatPrice?: (value: number) => string;
}

const defaultFormat = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);

export function CostsSection({
  items,
  disclaimer = "Precios sujetos a cambios",
  freeLabel = "Gratis",
  formatPrice = defaultFormat,
}: CostsSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="eds-costs" aria-label="Costos">
      {items.map((item, i) => {
        const label = item.nombre || item.tipo || "Entrada";
        const subtitle = item.regla || (item.tipo && item.tipo !== label ? item.tipo : undefined);
        const raw = item.precio;
        const isFree =
          raw === 0 ||
          raw === null ||
          raw === undefined ||
          (typeof raw === "string" && (raw === "" || raw.toLowerCase() === "gratis"));
        const num =
          typeof raw === "number"
            ? raw
            : typeof raw === "string"
              ? parseFloat(raw.replace(/[^\d.]/g, ""))
              : 0;
        const priceStr = isFree ? freeLabel : Number.isFinite(num) ? formatPrice(num) : String(raw ?? freeLabel);
        const hasNumericPrice = !isFree && Number.isFinite(num);
        const priceSymbol = hasNumericPrice ? (priceStr.match(/^[^\d]+/) || ["$"])[0] : "";
        const priceNumber = hasNumericPrice ? (priceStr.replace(/^[^\d]+/, "") || priceStr) : priceStr;

        return (
          <div key={i} className="eds-costs__item">
            <div className="eds-costs__icon">
              <Ticket size={20} strokeWidth={2} />
            </div>
            <div className="eds-costs__info">
              <span className="eds-costs__label">{label}</span>
              {subtitle && <span className="eds-costs__subtitle">{subtitle}</span>}
            </div>
            <div className="eds-costs__price-wrap">
              {hasNumericPrice ? (
                <>
                  <span className="eds-costs__price-symbol">{priceSymbol}</span>
                  <span className="eds-costs__price">{priceNumber}</span>
                </>
              ) : (
                <span className="eds-costs__price">{priceNumber}</span>
              )}
            </div>
          </div>
        );
      })}
      <p className="eds-costs__disclaimer">{disclaimer}</p>
    </section>
  );
}
