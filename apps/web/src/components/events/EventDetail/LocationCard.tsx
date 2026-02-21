import React from "react";
import { MapPin } from "lucide-react";

export interface LocationCardProps {
  venueName: string;
  address: string;
  references?: string;
  mapsUrl: string;
  mapsLabel: string;
}

export function LocationCard({
  venueName,
  address,
  references,
  mapsUrl,
  mapsLabel,
}: LocationCardProps) {
  return (
    <div className="ed-location-card">
      <div className="ed-location-card__name">{venueName}</div>
      {address && (
        <div className="ed-location-card__address">{address}</div>
      )}
      {references && (
        <div className="ed-location-card__refs">{references}</div>
      )}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ed-location-card__btn"
        aria-label={mapsLabel}
      >
        <MapPin size={20} strokeWidth={2} />
        {mapsLabel}
      </a>
    </div>
  );
}
