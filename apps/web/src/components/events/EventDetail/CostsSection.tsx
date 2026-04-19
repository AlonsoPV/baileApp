import React from "react";
import { Ticket } from "lucide-react";

export interface CostItem {
  nombre?: string;
  tipo?: string;
  precio?: number | string | null;
  monto?: number | string | null;
  regla?: string;
  descripcion?: string;
}

export interface CostsSectionProps {
  items: CostItem[];
  disclaimer?: string;
  freeLabel?: string;
  /** Cuando no hay monto (vacío / sin definir), no usar "Gratis". */
  pendingLabel?: string;
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
  pendingLabel = "Por definir",
  formatPrice = defaultFormat,
}: CostsSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="eds-costs" aria-label="Costos">
      {items.map((item, i) => {
        const label = item.nombre || (item.tipo ? String(item.tipo).charAt(0).toUpperCase() + String(item.tipo).slice(1).toLowerCase() : "Entrada");
        const subtitle = (item.descripcion ?? item.regla) || (item.tipo && item.tipo !== label ? item.tipo : undefined);
        const raw = item.monto ?? item.precio;
        const isEmpty =
          raw === null ||
          raw === undefined ||
          (typeof raw === "string" && raw.trim() === "");
        const rawLower = typeof raw === "string" ? raw.trim().toLowerCase() : "";
        const tipoLower = String(item.tipo || "").toLowerCase();
        const isTipoGratis = tipoLower === "gratis" || tipoLower === "free";
        const num =
          typeof raw === "number"
            ? raw
            : typeof raw === "string" && raw.trim() !== ""
              ? parseFloat(raw.replace(/[^\d.]/g, ""))
              : NaN;
        const isExplicitFreeWord = rawLower === "gratis" || rawLower === "free";
        /** Gratis solo con precio 0 explícito y tipo gratis, o texto "gratis". */
        const showGratis =
          isExplicitFreeWord || (Number.isFinite(num) && num === 0 && isTipoGratis);
        let priceStr: string;
        let hasNumericPrice: boolean;
        if (isEmpty) {
          priceStr = pendingLabel;
          hasNumericPrice = false;
        } else if (Number.isFinite(num) && num > 0) {
          priceStr = formatPrice(num);
          hasNumericPrice = true;
        } else if (showGratis) {
          priceStr = freeLabel;
          hasNumericPrice = false;
        } else if (Number.isFinite(num) && num === 0) {
          priceStr = pendingLabel;
          hasNumericPrice = false;
        } else {
          priceStr = String(raw ?? pendingLabel);
          hasNumericPrice = false;
        }
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
