import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../LiveLink";
import { urls } from "@/lib/urls";
import { fmtDate } from "@/utils/format";
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl, logCardImage } from "@/utils/imageOptimization";
import { withStableCacheBust } from "@/utils/cacheBuster";
import { getMediaBySlot, normalizeMediaArray } from "@/utils/mediaSlots";
import { getPrimaryCost, hasDiscount, getMonto, formatCostoMonto } from "@/utils/eventCosts";
import { resolveEventDateYmd } from "@/utils/eventDateDisplay";
import "./EventSocialGridCard.css";

export interface EventSocialGridCardProps {
  item: any;
  priority?: boolean;
}

const toNumericId = (v: any): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  return null;
};

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

/** Card compacta para grilla Explore: flyer, nombre, fecha/hora, lugar, precio. Requiere item.__ui (Explore normalizado). */
function EventSocialGridCardDumb({ item, priority = false }: EventSocialGridCardProps) {
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
  const flyerWithCacheBust = React.useMemo(
    () => withStableCacheBust(ui.flyerUrl, flyerCacheKey || null),
    [ui.flyerUrl, flyerCacheKey]
  );
  const imageUrlFinal = flyerWithCacheBust || ui.flyerUrl;

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;

  const nombre = item.nombre || item.evento_nombre || item.lugar || item.ciudad || "Evento";
  const horaInicio = item.hora_inicio || item.evento_hora_inicio;
  logCardImage("evento", eventId, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? "URL vacía" : undefined);

  const dateLine = ui.fechaYmd ? fmtDate(ui.fechaYmd) : "";
  const timePart = horaInicio ? formatHHMM(horaInicio) : "";

  return (
    <LiveLink to={linkTo} asCard={false}>
      <motion.article
        className="event-social-grid-card"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="event-social-grid-card__media">
          {showPlaceholder ? (
            <div className="event-social-grid-card__placeholder" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          ) : (
            <img
              src={imageUrlFinal}
              alt={nombre}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              onLoad={() => setImageError(false)}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        <div className="event-social-grid-card__body">
          <h3 className="event-social-grid-card__title">{nombre}</h3>
          <div className="event-social-grid-card__line event-social-grid-card__line--meta">
            {dateLine && <span>{dateLine}</span>}
            {dateLine && timePart && <span className="event-social-grid-card__dot">·</span>}
            {timePart && <span>{timePart}</span>}
          </div>
          {ui.lugarNombre ? (
            <div className="event-social-grid-card__line event-social-grid-card__line--place" title={ui.lugarNombre}>
              📍 {ui.lugarNombre}
            </div>
          ) : null}
          <div className="event-social-grid-card__price" aria-label={ui.costoMonto === 0 ? "Entrada gratis" : `Costo ${formatCostoMonto(ui.costoMonto)}`}>
            {ui.costoMonto === 0 ? (
              <span>Gratis</span>
            ) : (
              <>
                <span className="event-social-grid-card__currency">$</span>
                <span>{ui.costoMonto?.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
              </>
            )}
            {ui.hasDiscount ? <span className="event-social-grid-card__discount">%</span> : null}
          </div>
        </div>
      </motion.article>
    </LiveLink>
  );
}

/** Fallback sin __ui (raro en Explore): mismos campos con cálculo local. */
function EventSocialGridCardFallback({ item, priority = false }: EventSocialGridCardProps) {
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
    (item.id as string | number | undefined) ||
    "";
  const flyerWithCacheBust = React.useMemo(
    () => withStableCacheBust(flyer, flyerCacheKey || null),
    [flyer, flyerCacheKey]
  );
  const imageUrlFinal = flyerWithCacheBust || flyer;

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;

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
  const fecha = React.useMemo(() => resolveEventDateYmd(item), [item]);
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

  const dateLine = fecha ? fmtDate(fecha) : "";
  const timePart = horaInicio ? formatHHMM(horaInicio) : "";

  return (
    <LiveLink to={linkTo} asCard={false}>
      <motion.article
        className="event-social-grid-card"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="event-social-grid-card__media">
          {showPlaceholder ? (
            <div className="event-social-grid-card__placeholder" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          ) : (
            <img
              src={imageUrlFinal}
              alt={nombre}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              onLoad={() => setImageError(false)}
              onError={() => setImageError(true)}
            />
          )}
        </div>
        <div className="event-social-grid-card__body">
          <h3 className="event-social-grid-card__title">{nombre}</h3>
          <div className="event-social-grid-card__line event-social-grid-card__line--meta">
            {dateLine && <span>{dateLine}</span>}
            {dateLine && timePart && <span className="event-social-grid-card__dot">·</span>}
            {timePart && <span>{timePart}</span>}
          </div>
          {lugarSoloNombre ? (
            <div className="event-social-grid-card__line event-social-grid-card__line--place" title={lugarSoloNombre}>
              📍 {lugarSoloNombre}
            </div>
          ) : null}
          <div className="event-social-grid-card__price" aria-label={costMonto === 0 ? "Entrada gratis" : `Costo ${formatCostoMonto(costMonto)}`}>
            {costMonto === 0 ? (
              <span>Gratis</span>
            ) : (
              <>
                <span className="event-social-grid-card__currency">$</span>
                <span>{costMonto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
              </>
            )}
            {showDiscount ? <span className="event-social-grid-card__discount">%</span> : null}
          </div>
        </div>
      </motion.article>
    </LiveLink>
  );
}

const EventSocialGridCard = React.memo(function EventSocialGridCard(props: EventSocialGridCardProps) {
  if (props.item?.__ui) {
    return <EventSocialGridCardDumb {...props} />;
  }
  return <EventSocialGridCardFallback {...props} />;
});

export default EventSocialGridCard;
