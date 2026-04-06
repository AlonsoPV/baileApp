import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import LiveLink from "../LiveLink";
import { urls } from "@/lib/urls";
import { useTags } from "@/hooks/useTags";
import { useFmtDate } from "@/hooks/useFmtDate";
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl, logCardImage } from "@/utils/imageOptimization";
import { withStableCacheBust } from "@/utils/cacheBuster";
import { getMediaBySlot, normalizeMediaArray } from "@/utils/mediaSlots";
import { getPrimaryCost, hasDiscount, getMonto, formatCostoMonto } from "@/utils/eventCosts";
import { resolveEventDateYmd } from "@/utils/eventDateDisplay";
import "./EventListRow.css";

export interface EventListRowProps {
  item: any;
  priority?: boolean;
  /** Solo cuando item.__ui no existe (fallback). */
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

function EventListRowDumb({ item, priority = false }: EventListRowProps) {
  const fmtDateLocalized = useFmtDate();
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
  const placeholderReason = !ui.flyerUrl ? "URL vacía" : imageError ? "Image load failed" : "";
  logCardImage("evento", eventId, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? "URL vacía" : undefined);

  const nombre = item.nombre || item.evento_nombre || item.lugar || item.ciudad || "Evento";
  const horaInicio = item.hora_inicio || item.evento_hora_inicio;
  const organizador = item.organizador_nombre || item.organizer_name;
  const setlist = React.useMemo(() => resolveEventSetlist(item), [item]);

  return (
    <LiveLink to={linkTo} asCard={false}>
      <motion.article
        className="event-list-row"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        whileTap={{ scale: 0.985 }}
      >
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
          )}
        </div>

        <div className="event-list-row__main">
          <h3 className="event-list-row__title">{nombre}</h3>
          {item.ownerName && (
            <div className="event-list-row__owner">
              por{" "}
              <strong>{item.ownerName}</strong>
            </div>
          )}
          {setlist && (
            <div className="event-list-row__setlist" title={setlist}>
              {setlist}
            </div>
          )}
          <div className="event-list-row__meta">
            {ui.fechaYmd && (
              <span title={fmtDateLocalized(ui.fechaYmd)}>
                📅 {fmtDateLocalized(ui.fechaYmd)}
              </span>
            )}
            {horaInicio && (
              <span title={`Hora ${formatHHMM(horaInicio)}`}>🕗 {formatHHMM(horaInicio)}</span>
            )}
            <span
              className="event-list-row__tag--cost"
              aria-label={ui.costoMonto === 0 ? "Entrada gratis" : `Costo taquilla ${formatCostoMonto(ui.costoMonto)}`}
            >
              {ui.costoMonto === 0 ? (
                <span>Gratis</span>
              ) : (
                <>
                  <span aria-hidden>$</span>
                  <span>{ui.costoMonto?.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                </>
              )}
              {ui.hasDiscount && (
                <span className="event-list-row__discount" aria-label="Hay descuento o preventa" title="Descuento o precio especial disponible">
                  %
                </span>
              )}
            </span>
            {ui.lugarNombre && (
              <span title={ui.lugarNombre}>📍 {ui.lugarNombre}</span>
            )}
          </div>
          {organizador && (
            <div className="event-list-row__organizer">
              <div className="event-list-row__org-avatar">👤</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="event-list-row__org-name" title={organizador}>
                  {organizador}
                </div>
                <div className="event-list-row__org-label">Organizador</div>
              </div>
            </div>
          )}
        </div>

        <div className="event-list-row__chevron" aria-hidden>
          <ChevronRight strokeWidth={2} />
        </div>
      </motion.article>
    </LiveLink>
  );
}

function EventListRowWithTags({ item, priority = false, allTags: allTagsProp }: EventListRowProps) {
  const fmtDateLocalized = useFmtDate();
  const eventId = toNumericId(item?.id) ?? toNumericId(item?.event_date_id) ?? toNumericId(item?._original_id);
  const linkTo = eventId ? urls.eventDateLive(eventId) : "#";
  const { data: allTagsFromHook } = useTags() as any;
  const allTags = allTagsProp ?? allTagsFromHook;

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
        className="event-list-row"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        whileTap={{ scale: 0.985 }}
      >
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
          )}
        </div>

        <div className="event-list-row__main">
          <h3 className="event-list-row__title">{nombre}</h3>
          {item.ownerName && (
            <div className="event-list-row__owner">
              por <strong>{item.ownerName}</strong>
            </div>
          )}
          {setlist && (
            <div className="event-list-row__setlist" title={setlist}>
              {setlist}
            </div>
          )}
          <div className="event-list-row__meta">
            {fecha && <span title={fmtDateLocalized(fecha)}>📅 {fmtDateLocalized(fecha)}</span>}
            {horaInicio && <span title={`Hora ${formatHHMM(horaInicio)}`}>🕗 {formatHHMM(horaInicio)}</span>}
            <span
              className="event-list-row__tag--cost"
              aria-label={costMonto === 0 ? "Entrada gratis" : `Costo taquilla ${formatCostoMonto(costMonto)}`}
            >
              {costMonto === 0 ? (
                <span>Gratis</span>
              ) : (
                <>
                  <span aria-hidden>$</span>
                  <span>{costMonto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                </>
              )}
              {showDiscount && (
                <span className="event-list-row__discount" aria-label="Hay descuento o preventa" title="Descuento o precio especial disponible">
                  %
                </span>
              )}
            </span>
            {lugarSoloNombre && <span title={lugarSoloNombre}>📍 {lugarSoloNombre}</span>}
          </div>
          {organizador && (
            <div className="event-list-row__organizer">
              <div className="event-list-row__org-avatar">👤</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="event-list-row__org-name" title={organizador}>
                  {organizador}
                </div>
                <div className="event-list-row__org-label">Organizador</div>
              </div>
            </div>
          )}
        </div>

        <div className="event-list-row__chevron" aria-hidden>
          <ChevronRight strokeWidth={2} />
        </div>
      </motion.article>
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
