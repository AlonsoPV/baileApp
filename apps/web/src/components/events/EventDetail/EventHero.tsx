import React from "react";
import { ArrowLeft, Heart, Share2 } from "lucide-react";
import ExploreResponsiveImage from "@/components/explore/ExploreResponsiveImage";
import { EXPLORE_SIZES_EVENT_HERO } from "@/utils/supabaseResponsiveImage";

export interface EventHeroProps {
  title: string;
  flyerUrl?: string | null;
  flyerCacheKey?: string | number | null;
  dateStr: string;
  timeRange: string;
  venueName: string;
  onShare: () => void;
  onToggleFavorite?: () => void;
  favoriteActive?: boolean;
  togglingEvent?: boolean;
  /** Volver atrás (historial o pantalla anterior) */
  onBack?: () => void;
}

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
  onBack,
}: EventHeroProps) {
  const hasFlyer = !!(flyerUrl && String(flyerUrl).trim());

  return (
    <section className="eds-hero" aria-label="Hero del evento">
      <div className="eds-hero__bg" aria-hidden>
        {hasFlyer ? (
          <div className="eds-hero__img">
            <ExploreResponsiveImage
              rawUrl={flyerUrl}
              cacheVersion={flyerCacheKey ?? null}
              preset="carouselCard"
              sizes={EXPLORE_SIZES_EVENT_HERO}
              alt=""
              priority
            />
          </div>
        ) : null}
      </div>
      <div className="eds-hero__overlay" aria-hidden />
      <div className="eds-hero__actions">
        <div className="eds-hero__actions-start">
          {onBack && (
            <button
              type="button"
              className="eds-hero__btn eds-hero__btn--back"
              onClick={onBack}
              aria-label="Volver"
            >
              <ArrowLeft size={22} strokeWidth={2.25} aria-hidden />
            </button>
          )}
        </div>
        <div className="eds-hero__actions-end">
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
