import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useFmtDate } from "../../../hooks/useFmtDate";
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl, logCardImage } from "../../../utils/imageOptimization";
import { withStableCacheBust } from "../../../utils/cacheBuster";
import { getMediaBySlot, normalizeMediaArray } from "../../../utils/mediaSlots";
import { getLowestTaquillaMonto, getPrimaryCost, hasDiscount, getMonto, formatCostoMonto } from "../../../utils/eventCosts";
import { resolveEventDateYmd } from "../../../utils/eventDateDisplay";
import "./Card.css";

interface EventCardProps {
  item: any;
  /** Si true, evita lazy-loading y eleva prioridad (LCP) */
  priority?: boolean;
  /** Tags pre-fetched por el padre. Solo se usa cuando item.__ui NO existe (fallback). */
  allTags?: any[] | null;
}

const resolveEventSetlist = (item: any): string => {
  const candidates = [item?.djs, item?.evento_djs, item?.events_date?.djs, item?.__ui?.djs];
  for (const value of candidates) {
    if (typeof value !== "string") continue;
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized) return normalized;
  }
  return "";
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

const toNumericId = (v: any): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  return null;
};

function useEventCardMotion() {
  const reduceMotion = useReducedMotion();
  return React.useMemo(
    () => ({
      reduceMotion,
      initial: reduceMotion ? (false as const) : ({ opacity: 0, scale: 0.98 } as const),
      hover: reduceMotion ? undefined : { scale: 1.02, y: -6, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const } },
      tap: reduceMotion ? undefined : { scale: 0.99 },
    }),
    [reduceMotion]
  );
}

/** Card "tonta": usa solo item.__ui precomputado. Cero hooks de datos, cero queries. */
function EventCardDumb({ item, priority = false }: EventCardProps) {
  const fmtDateLocalized = useFmtDate();
  const ui = item?.__ui!;
  const eventId = toNumericId(item?.id) ?? toNumericId(item?.event_date_id) ?? toNumericId(item?._original_id);
  const linkTo = eventId ? urls.eventDateLive(eventId) : "#";
  const motionPrefs = useEventCardMotion();
  const isAndroid = React.useMemo(
    () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent),
    []
  );

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
  const placeholderReason = !ui.flyerUrl ? "URL vacía" : imageError ? "Image load failed" : "";
  logCardImage("evento", eventId, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? "URL vacía" : undefined);

  const nombre = item.nombre || item.evento_nombre || item.lugar || item.ciudad || "Evento";
  const horaInicio = item.hora_inicio || item.evento_hora_inicio;
  const organizador = item.organizador_nombre || item.organizer_name;
  const setlist = React.useMemo(() => resolveEventSetlist(item), [item]);

  return (
    <LiveLink to={linkTo} asCard={false}>
      <motion.article
        className="card event-card-mobile"
        initial={motionPrefs.initial}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={motionPrefs.hover}
        whileTap={motionPrefs.tap}
      >
        {setlist && (
          <div className="event-setlist-top" title={setlist}>
            {setlist}
          </div>
        )}
        <div className="media">
          {!isAndroid && imageUrlFinal && !imageError && (
            <div className="media__bg" style={{ backgroundImage: `url(${imageUrlFinal})` }} aria-hidden />
          )}
          <div className="media__frame">
            {showPlaceholder ? (
              <div className="media-placeholder" data-reason={placeholderReason} aria-hidden style={{ width: "100%", height: "100%", minHeight: 100 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            ) : imageUrlFinal && !imageError ? (
              <img
                src={imageUrlFinal}
                alt={`Poster del evento ${nombre}`}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
                onLoad={() => {
                  logCardImage("evento", eventId, imageUrlFinal, true, "load");
                  setImageError(false);
                }}
                onError={() => setImageError(true)}
              />
            ) : null}
          </div>
        </div>
        <div className="content">
          <h3 className="event-title">{nombre}</h3>
          {item.ownerName && (
            <p className="event-card__owner">
              por <strong>{item.ownerName}</strong>
            </p>
          )}
          <div className="meta">
            {ui.fechaYmd && (
              <div className="meta-row--date">
                <div className="tag">📅 {fmtDateLocalized(ui.fechaYmd)}</div>
              </div>
            )}
            <div className="meta-row--time-zone">
              {horaInicio && <div className="tag">🕗 {formatHHMM(horaInicio)}</div>}
              <div className="tag tag--cost" aria-label={ui.costoMonto === 0 ? "Entrada gratis" : `Costo taquilla ${formatCostoMonto(ui.costoMonto)}`}>
                {ui.costoMonto === 0 ? (
                  <span>Gratis</span>
                ) : (
                  <>
                    <span className="tag__cost-icon" aria-hidden>
                      $
                    </span>
                    <span>{ui.costoMonto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                  </>
                )}
                {ui.hasDiscount && (
                  <span className="tag__discount-badge" aria-label="Hay descuento o preventa" title="Descuento o precio especial disponible">
                    %
                  </span>
                )}
              </div>
              {ui.lugarNombre && <div className="tag tag--location">📍 {ui.lugarNombre}</div>}
            </div>
          </div>
          {organizador && (
            <div className="event-card__organizer">
              <div className="event-card__organizer-avatar" aria-hidden>
                👤
              </div>
              <div className="event-card__organizer-text">
                <div className="event-card__organizer-name" title={organizador}>
                  {organizador}
                </div>
                <div className="event-card__organizer-label">Organizador</div>
              </div>
            </div>
          )}
        </div>
        <div
          aria-hidden
          className="card-focus-ring"
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: -2,
            borderRadius: 18,
            boxShadow: "0 0 0 0px rgba(255,255,255,0)",
            transition: "box-shadow .2s ease",
          }}
        />
      </motion.article>
    </LiveLink>
  );
}

/** Card con fallback: usa useTags cuando item.__ui no existe (pantallas fuera de Explore). */
function EventCardWithTags({ item, priority = false }: EventCardProps) {
  const fmtDateLocalized = useFmtDate();
  const eventId = toNumericId(item?.id) ?? toNumericId(item?.event_date_id) ?? toNumericId(item?._original_id);
  const linkTo = eventId ? urls.eventDateLive(eventId) : "#";
  const motionPrefs = useEventCardMotion();
  const isAndroid = React.useMemo(
    () => typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent),
    []
  );

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
  const flyerWithCacheBust = React.useMemo(
    () => withStableCacheBust(flyer, flyerCacheKey || null),
    [flyer, flyerCacheKey]
  );
  const imageUrlFinal = flyerWithCacheBust || flyer;

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;
  const placeholderReason = !flyer ? "URL vacía" : imageError ? "Image load failed" : "";
  logCardImage("evento", eventId, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? "URL vacía" : undefined);

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
  const organizador = item.organizador_nombre || item.organizer_name;
  const setlist = React.useMemo(() => resolveEventSetlist(item), [item]);
  const fecha = React.useMemo(() => resolveEventDateYmd(item), [item]);
  const primaryCost = React.useMemo(() => getPrimaryCost(item), [item]);
  const showDiscount = React.useMemo(() => hasDiscount(item), [item]);
  const costMonto = React.useMemo(() => {
    const taq = getLowestTaquillaMonto(item);
    if (taq != null) return taq;
    let m = getMonto(primaryCost);
    if (m == null) {
      const raw = item?.costos?.[0] ?? item?.events_parent?.costos?.[0];
      m = getMonto(raw);
    }
    return m ?? 0;
  }, [item, primaryCost]);

  return (
    <LiveLink to={linkTo} asCard={false}>
      <motion.article
        className="card event-card-mobile"
        initial={motionPrefs.initial}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={motionPrefs.hover}
        whileTap={motionPrefs.tap}
      >
        {setlist && (
          <div className="event-setlist-top" title={setlist}>
            {setlist}
          </div>
        )}
        <div className="media">
          {!isAndroid && imageUrlFinal && !imageError && (
            <div className="media__bg" style={{ backgroundImage: `url(${imageUrlFinal})` }} aria-hidden />
          )}
          <div className="media__frame">
            {showPlaceholder ? (
              <div className="media-placeholder" data-reason={placeholderReason} aria-hidden style={{ width: "100%", height: "100%", minHeight: 100 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            ) : imageUrlFinal && !imageError ? (
              <img
                src={imageUrlFinal}
                alt={`Poster del evento ${nombre}`}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
                onLoad={() => {
                  logCardImage("evento", eventId, imageUrlFinal, true, "load");
                  setImageError(false);
                }}
                onError={(e) => {
                  const msg = (e.nativeEvent as unknown as { message?: string })?.message ?? "Image load failed";
                  console.warn("[CardImageError] type=evento id=", eventId, "uri=", imageUrlFinal?.slice(0, 80), "error=", msg);
                  setImageError(true);
                }}
              />
            ) : null}
          </div>
        </div>
        <div className="content">
          <h3 className="event-title">{nombre}</h3>
          {item.ownerName && (
            <p className="event-card__owner">
              por <strong>{item.ownerName}</strong>
            </p>
          )}
          <div className="meta">
            {fecha && (
              <div className="meta-row--date">
                <div className="tag">📅 {fmtDateLocalized(fecha)}</div>
              </div>
            )}
            <div className="meta-row--time-zone">
              {horaInicio && <div className="tag">🕗 {formatHHMM(horaInicio)}</div>}
              <div className="tag tag--cost" aria-label={costMonto === 0 ? "Entrada gratis" : `Costo taquilla ${formatCostoMonto(costMonto)}`}>
                {costMonto === 0 ? (
                  <span>Gratis</span>
                ) : (
                  <>
                    <span className="tag__cost-icon" aria-hidden>
                      $
                    </span>
                    <span>{costMonto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                  </>
                )}
                {showDiscount && (
                  <span className="tag__discount-badge" aria-label="Hay descuento o preventa" title="Descuento o precio especial disponible">
                    %
                  </span>
                )}
              </div>
              {lugarSoloNombre && <div className="tag tag--location">📍 {lugarSoloNombre}</div>}
            </div>
          </div>
          {organizador && (
            <div className="event-card__organizer">
              <div className="event-card__organizer-avatar" aria-hidden>
                👤
              </div>
              <div className="event-card__organizer-text">
                <div className="event-card__organizer-name" title={organizador}>
                  {organizador}
                </div>
                <div className="event-card__organizer-label">Organizador</div>
              </div>
            </div>
          )}
        </div>
        <div
          aria-hidden
          className="card-focus-ring"
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: -2,
            borderRadius: 18,
            boxShadow: "0 0 0 0px rgba(255,255,255,0)",
            transition: "box-shadow .2s ease",
          }}
        />
      </motion.article>
    </LiveLink>
  );
}

/** Wrapper: usa EventCardDumb (cero hooks) cuando item.__ui existe; else EventCardWithTags. */
const EventCard = React.memo(function EventCard(props: EventCardProps) {
  if (props.item?.__ui) {
    return <EventCardDumb {...props} />;
  }
  return <EventCardWithTags {...props} />;
});

export default EventCard;
