import React from "react";
import { Heart, Share2 } from "lucide-react";
import { withStableCacheBust } from "@/utils/cacheBuster";
export interface EventHeroProps {
  title: string;
  flyerUrl?: string | null;
  flyerCacheKey?: string;
  dateStr: string;
  timeRange: string;
  venueName: string;
  onShare: () => void;
  onToggleFavorite?: () => void;
  favoriteActive?: boolean;
  togglingEvent?: boolean;
  toDirectUrl?: (url: string) => string;
}

const PLACEHOLDER_GRADIENT =
  "linear-gradient(135deg, #1a1a24 0%, #2d1f3d 50%, #1a1a24 100%)";

export function EventHero({
  title,
  flyerUrl,
  flyerCacheKey,
  dateStr,
  timeRange,
  venueName,
  onShare,
  onToggleFavorite,
  favoriteActive = false,
  togglingEvent = false,
  toDirectUrl = (u) => u,
}: EventHeroProps) {
  const displayUrl = flyerUrl
    ? (withStableCacheBust(flyerUrl, flyerCacheKey || null) ?? flyerUrl)
    : null;
  const src = displayUrl ? toDirectUrl(displayUrl) || displayUrl : null;

  const heroStyle: React.CSSProperties = src
    ? {
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : { background: PLACEHOLDER_GRADIENT };

  return (
    <section
      className="eds-hero"
      aria-label="Hero del evento"
      style={heroStyle}
    >
      {!src && (
        <div
          className="eds-hero__img"
          style={{ background: PLACEHOLDER_GRADIENT, position: "absolute", inset: 0 }}
          aria-hidden
        />
      )}
      <div className="eds-hero__overlay" aria-hidden />
      <div className="eds-hero__actions">
        {onToggleFavorite && (
          <button
            type="button"
            className="eds-hero__btn"
            onClick={onToggleFavorite}
            disabled={togglingEvent}
            aria-label={favoriteActive ? "Quitar favorito" : "Agregar favorito"}
            style={{
              opacity: togglingEvent ? 0.75 : 1,
              cursor: togglingEvent ? "not-allowed" : "pointer",
              color: favoriteActive ? "#F42F7E" : undefined,
            }}
          >
            {favoriteActive ? <Heart size={20} fill="currentColor" strokeWidth={2} /> : <Heart size={20} strokeWidth={2} />}
          </button>
        )}
        <button
          type="button"
          className="eds-hero__btn"
          onClick={onShare}
          aria-label="Compartir"
        >
          <Share2 size={20} strokeWidth={2} />
        </button>
      </div>
      <div className="eds-hero__content">
        <div className="eds-hero__title-plate">
          <h1 className="eds-hero__title">{title || "Evento"}</h1>
        </div>
        <div className="eds-hero__chips">
          {dateStr && <span className="eds-hero__chip">{dateStr}</span>}
          {dateStr && (timeRange || venueName) && <span className="eds-hero__chip-sep" aria-hidden>•</span>}
          {timeRange && <span className="eds-hero__chip">{timeRange}</span>}
          {timeRange && venueName && <span className="eds-hero__chip-sep" aria-hidden>•</span>}
          {venueName && <span className="eds-hero__chip">{venueName}</span>}
        </div>
      </div>
    </section>
  );
}
