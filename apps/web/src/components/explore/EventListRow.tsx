import React from "react";
import { ChevronRight } from "lucide-react";
import LiveLink from "../LiveLink";
import { urls } from "@/lib/urls";
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl } from "@/utils/imageOptimization";
import ExploreResponsiveImage from "@/components/explore/ExploreResponsiveImage";
import { getMediaBySlot, normalizeMediaArray } from "@/utils/mediaSlots";
import { getPrimaryCost, hasDiscount, getMonto, formatCostoMonto } from "@/utils/eventCosts";
import type { ExploreTagMaps } from "@/utils/exploreTagMaps";
import "./EventListRow.css";

export interface EventListRowProps {
  item: any;
  priority?: boolean;
  tagMaps?: ExploreTagMaps;
  allTags?: any[] | null;
}

function formatHHMM(t?: string) {
  if (!t) return "";
  try {
    const s = String(t);
    if (s.includes(":")) {
      const [hh = "", mm = ""] = s.split(":");
      return `${hh.padStart(2, "0").slice(-2)}:${mm.padStart(2, "0").slice(-2)}`;
    }
    if (s.length === 4) return `${s.slice(0, 2)}:${s.slice(2, 4)}`;
  } catch {
    /* ignore */
  }
  return String(t);
}

const toNumericId = (v: any): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  return null;
};

function MetaLine({
  timeText,
  priceLabel,
  placeText,
  hasDiscountMark = false,
  priceAria,
}: {
  timeText?: string;
  priceLabel: string;
  placeText?: string;
  hasDiscountMark?: boolean;
  priceAria: string;
}) {
  const hasLeadingMeta = Boolean(timeText || priceLabel);
  const isFree = priceLabel === "Gratis";

  return (
    <div className="event-list-row__meta">
      {timeText ? (
        <span className="event-list-row__meta-time" title={`Hora ${timeText}`}>
          {timeText}
        </span>
      ) : null}
      {timeText && priceLabel ? <span className="event-list-row__meta-dot">·</span> : null}
      {priceLabel ? (
        <span
          className={`event-list-row__meta-price ${isFree ? "event-list-row__meta-price--free" : ""}`}
          aria-label={priceAria}
        >
          {priceLabel}
        </span>
      ) : null}
      {hasDiscountMark ? (
        <span className="event-list-row__meta-badge event-list-row__discount" aria-hidden>
          %
        </span>
      ) : null}
      {placeText && hasLeadingMeta ? <span className="event-list-row__meta-dot">·</span> : null}
      {placeText ? (
        <span className="event-list-row__meta-place" title={placeText}>
          {placeText}
        </span>
      ) : null}
    </div>
  );
}

function EventListRowDumb({ item, priority = false }: EventListRowProps) {
  const ui = item?.__ui!;
  const eventId = toNumericId(item?.id) ?? toNumericId(item?.event_date_id) ?? toNumericId(item?._original_id);
  const linkTo = eventId ? urls.eventDateLive(eventId) : "#";

  const flyerCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    ((item as any)?.events_parent?.updated_at as string | undefined) ||
    ((item as any)?.events_parent?.id as string | number | undefined) ||
    (item._original_id as string | number | undefined) ||
    (item.id as string | number | undefined) ||
    "";
  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [ui.flyerUrl, flyerCacheKey]);
  const showPlaceholder = !ui.flyerUrl || imageError;
  const placeholderReason = !ui.flyerUrl ? "URL vacía" : imageError ? "Image load failed" : "";

  const nombre = item.nombre || item.evento_nombre || item.lugar || item.ciudad || "Evento";
  const horaInicio = item.hora_inicio || item.evento_hora_inicio;
  const ownerLabel = item.ownerName || item.organizador_nombre || item.organizer_name || "";

  return (
    <LiveLink to={linkTo} asCard={false}>
      <article className="event-list-row">
        <div className="event-list-row__thumb" aria-hidden={showPlaceholder}>
          {showPlaceholder ? (
            <div className="event-list-row__thumb-placeholder" data-reason={placeholderReason}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          ) : (
            <ExploreResponsiveImage
              rawUrl={ui.flyerUrl}
              cacheVersion={flyerCacheKey || null}
              preset="listThumb"
              alt={`Poster del evento ${nombre}`}
              priority={priority}
              onLoad={() => setImageError(false)}
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <div className="event-list-row__main">
          <h3 className="event-list-row__title">{nombre}</h3>
          {ownerLabel && (
            <div className="event-list-row__owner">
              por <strong>{ownerLabel}</strong>
            </div>
          )}
          <MetaLine
            timeText={horaInicio ? formatHHMM(horaInicio) : ""}
            priceLabel={ui.costoMonto === 0 ? "Gratis" : `$${ui.costoMonto?.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`}
            placeText={ui.lugarNombre || ""}
            hasDiscountMark={!!ui.hasDiscount}
            priceAria={ui.costoMonto === 0 ? "Entrada gratis" : `Costo taquilla ${formatCostoMonto(ui.costoMonto)}`}
          />
        </div>

        <div className="event-list-row__chevron" aria-hidden>
          <ChevronRight strokeWidth={2} />
        </div>
      </article>
    </LiveLink>
  );
}

function EventListRowWithTags({ item, priority = false }: EventListRowProps) {
  const eventId = toNumericId(item?.id) ?? toNumericId(item?.event_date_id) ?? toNumericId(item?._original_id);
  const linkTo = eventId ? urls.eventDateLive(eventId) : "#";

  const toUrl = (u: string | null | undefined) =>
    u ? (toDirectPublicStorageUrl(ensureAbsoluteImageUrl(u) ?? u) ?? u) : undefined;
  let flyer: string | undefined;
  if (item.flyer_url) flyer = toUrl(item.flyer_url);
  else {
    const mediaList = normalizeMediaArray(item.media);
    const p1 = getMediaBySlot(mediaList, "p1") as any;
    const p1Url = p1?.url ?? p1?.path;
    if (p1Url) flyer = toUrl(p1Url);
    else {
      const avatarSlot = mediaList.find((m: any) => m?.slot === "avatar");
      const avatarUrl = avatarSlot?.url ?? (avatarSlot as any)?.path;
      if (avatarUrl) flyer = toUrl(avatarUrl);
      else if (item.avatar_url) flyer = toUrl(item.avatar_url);
      else if (item.portada_url) flyer = toUrl(item.portada_url);
      else if (mediaList.length > 0) {
        const first = mediaList[0];
        const url = (first as any)?.url ?? (first as any)?.path ?? (typeof first === "string" ? first : "");
        if (url) flyer = toUrl(url);
      }
    }
  }

  const flyerCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    ((item as any)?.events_parent?.updated_at as string | undefined) ||
    ((item as any)?.events_parent?.id as string | number | undefined) ||
    (item._original_id as string | number | undefined) ||
    (item.id as string | number | undefined) ||
    "";
  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [flyer, flyerCacheKey]);
  const showPlaceholder = !flyer || imageError;
  const placeholderReason = !flyer ? "URL vacía" : imageError ? "Image load failed" : "";

  const nombre = item.nombre || item.evento_nombre || item.lugar || item.ciudad || "Evento";
  const horaInicio = item.hora_inicio || item.evento_hora_inicio;
  const lugar = item.lugar || item.evento_lugar;
  const lugarSoloNombre = React.useMemo(() => {
    if (!lugar || typeof lugar !== "string") return lugar || "";
    const s = String(lugar).trim();
    const separadores = [" · ", " ·", "· ", ",", " – ", " - "];
    for (const sep of separadores) {
      if (s.includes(sep)) return s.split(sep)[0].trim();
    }
    return s;
  }, [lugar]);
  const ownerLabel = item.ownerName || item.organizador_nombre || item.organizer_name || "";
  const primaryCost = React.useMemo(() => getPrimaryCost(item), [item]);
  const showDiscount = React.useMemo(() => hasDiscount(item), [item]);
  const costMonto = React.useMemo(() => {
    let m = getMonto(primaryCost);
    if (m == null) {
      const raw = item?.costos?.[0] ?? item?.events_parent?.costos?.[0];
      m = getMonto(raw);
    }
    return m ?? 0;
  }, [item, primaryCost]);

  return (
    <LiveLink to={linkTo} asCard={false}>
      <article className="event-list-row">
        <div className="event-list-row__thumb" aria-hidden={showPlaceholder}>
          {showPlaceholder ? (
            <div className="event-list-row__thumb-placeholder" data-reason={placeholderReason}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          ) : (
            <ExploreResponsiveImage
              rawUrl={flyer}
              cacheVersion={flyerCacheKey || null}
              preset="listThumb"
              alt={`Poster del evento ${nombre}`}
              priority={priority}
              onLoad={() => setImageError(false)}
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <div className="event-list-row__main">
          <h3 className="event-list-row__title">{nombre}</h3>
          {ownerLabel && (
            <div className="event-list-row__owner">
              por <strong>{ownerLabel}</strong>
            </div>
          )}
          <MetaLine
            timeText={horaInicio ? formatHHMM(horaInicio) : ""}
            priceLabel={costMonto === 0 ? "Gratis" : `$${costMonto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`}
            placeText={lugarSoloNombre || ""}
            hasDiscountMark={showDiscount}
            priceAria={costMonto === 0 ? "Entrada gratis" : `Costo taquilla ${formatCostoMonto(costMonto)}`}
          />
        </div>

        <div className="event-list-row__chevron" aria-hidden>
          <ChevronRight strokeWidth={2} />
        </div>
      </article>
    </LiveLink>
  );
}

const EventListRow = React.memo(function EventListRow(props: EventListRowProps) {
  if (props.item?.__ui) {
    return <EventListRowDumb {...props} />;
  }
  return <EventListRowWithTags {...props} />;
});

export default EventListRow;
