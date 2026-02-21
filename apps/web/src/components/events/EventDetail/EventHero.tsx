import React from "react";
import { Share2 } from "lucide-react";
import ImageWithFallback from "../../ImageWithFallback";
export interface EventHeroProps {
  title: string;
  flyerUrl?: string | null;
  flyerCacheKey?: string;
  dateStr: string;
  timeRange: string;
  venueName: string;
  onBack: () => void;
  onShare: () => void;
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
  onBack,
  onShare,
  toDirectUrl = (u) => u,
}: EventHeroProps) {
  const displayUrl = flyerUrl
    ? (flyerCacheKey ? `${flyerUrl}${flyerUrl.includes("?") ? "&" : "?"}_t=${encodeURIComponent(flyerCacheKey)}` : flyerUrl)
    : null;
  const src = displayUrl ? toDirectUrl(displayUrl) || displayUrl : null;

  return (
    <section className="eds-hero" aria-label="Hero del evento">
      <div className="eds-hero__bg" aria-hidden />
      {src ? (
        <ImageWithFallback
          src={src}
          alt=""
          className="eds-hero__img"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          className="eds-hero__img"
          style={{ background: PLACEHOLDER_GRADIENT, position: "absolute", inset: 0 }}
          aria-hidden
        />
      )}
      <div className="eds-hero__overlay" aria-hidden />
      <div className="eds-hero__actions">
        <button
          type="button"
          className="eds-hero__btn"
          onClick={onBack}
          aria-label="Volver"
        >
          ← Volver
        </button>
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
