import React from "react";
import { Calendar, MapPin, Copy, Ticket } from "lucide-react";

export interface InfoGridProps {
  dateStr: string;
  timeRange: string;
  venueName: string;
  city?: string;
  mapsUrl: string;
  fullAddress?: string;
  onCopyAddress?: () => void;
  costsSummary?: string;
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
}: InfoGridProps) {
  const locationLabel = [venueName, city].filter(Boolean).join(", ") || venueName || city;

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
          {costsSummary || "Por confirmar"}
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
