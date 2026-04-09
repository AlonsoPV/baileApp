import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../LiveLink";
import { urls } from "@/lib/urls";
import { useFmtDate } from "@/hooks/useFmtDate";
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl } from "@/utils/imageOptimization";
import ExploreResponsiveImage from "@/components/explore/ExploreResponsiveImage";
import { getMediaBySlot, normalizeMediaArray } from "@/utils/mediaSlots";
import { getPrimaryCost, hasDiscount, getMonto, formatCostoMonto } from "@/utils/eventCosts";
import { resolveEventDateYmd } from "@/utils/eventDateDisplay";
import "./EventCarteleraCard.css";

export interface EventCarteleraCardProps {
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

function resolveFlyerUrlRaw(item: any): string | undefined {
  const toUrl = (u: string | null | undefined) =>
    u ? (toDirectPublicStorageUrl(ensureAbsoluteImageUrl(u) ?? u) ?? u) : undefined;
  if (item.flyer_url) return toUrl(item.flyer_url);
  const mediaList = normalizeMediaArray(item.media);
  const p1 = getMediaBySlot(mediaList, "p1") as any;
  const p1Url = p1?.url ?? p1?.path;
  if (p1Url) return toUrl(p1Url);
  const avatarSlot = mediaList.find((m: any) => m?.slot === "avatar");
  const avatarUrl = avatarSlot?.url ?? (avatarSlot as any)?.path;
  if (avatarUrl) return toUrl(avatarUrl);
  if (item.avatar_url) return toUrl(item.avatar_url);
  if (item.portada_url) return toUrl(item.portada_url);
  if (mediaList.length > 0) {
    const first = mediaList[0];
    const url = (first as any)?.url ?? (first as any)?.path ?? (typeof first === "string" ? first : "");
    if (url) return toUrl(url);
  }
  return undefined;
}

/** Vista cartelera: flyer protagonista + overlay (misma data que EventSocialGridCard). */
function EventCarteleraCardInner({ item, priority = false }: EventCarteleraCardProps) {
  const fmtDateLocalized = useFmtDate();
  const ui = item?.__ui;
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

  const rawFlyerForMemo = ui ? ui.flyerUrl : resolveFlyerUrlRaw(item);

  const nombre = item.nombre || item.evento_nombre || item.lugar || item.ciudad || "Evento";
  const horaInicio = item.hora_inicio || item.evento_hora_inicio;

  const lugarFromItem = item.lugar || item.evento_lugar;
  const lugarSoloNombre = React.useMemo(() => {
    if (!lugarFromItem || typeof lugarFromItem !== "string") return lugarFromItem || "";
    const s = String(lugarFromItem).trim();
    const separadores = [" · ", " ·", "· ", ",", " – ", " - "];
    for (const sep of separadores) {
      if (s.includes(sep)) return s.split(sep)[0].trim();
    }
    return s;
  }, [lugarFromItem]);

  const fechaFallback = React.useMemo(() => resolveEventDateYmd(item), [item]);
  const primaryCost = React.useMemo(() => getPrimaryCost(item), [item]);
  const showDiscount = React.useMemo(() => hasDiscount(item), [item]);
  const costMontoFallback = React.useMemo(() => {
    let m = getMonto(primaryCost);
    if (m == null) {
      const raw = item?.costos?.[0] ?? item?.events_parent?.costos?.[0];
      m = getMonto(raw);
    }
    return m ?? 0;
  }, [item, primaryCost]);

  const dateLine = ui ? (ui.fechaYmd ? fmtDateLocalized(ui.fechaYmd) : "") : fechaFallback ? fmtDateLocalized(fechaFallback) : "";
  const timePart = horaInicio ? formatHHMM(horaInicio) : "";
  const lugarLine = ui ? ui.lugarNombre || "" : lugarSoloNombre || "";
  const costMonto = ui ? ui.costoMonto ?? 0 : costMontoFallback;
  const hasDisc = ui ? !!ui.hasDiscount : showDiscount;

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [rawFlyerForMemo, flyerCacheKey]);
  const showPlaceholder = !rawFlyerForMemo || imageError;

  return (
    <LiveLink to={linkTo} asCard={false}>
      <motion.article
        className="event-cartelera-card"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="event-cartelera-card__frame">
          {showPlaceholder ? (
            <div className="event-cartelera-card__placeholder" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          ) : (
            <ExploreResponsiveImage
              rawUrl={rawFlyerForMemo}
              cacheVersion={flyerCacheKey || null}
              preset="carteleraGrid"
              alt={nombre}
              priority={priority}
              onLoad={() => setImageError(false)}
              onError={() => setImageError(true)}
            />
          )}
          <div className="event-cartelera-card__overlay">
            <h3 className="event-cartelera-card__title">{nombre}</h3>
            <div className="event-cartelera-card__meta">
              {dateLine && <span>{dateLine}</span>}
              {dateLine && timePart && <span className="event-cartelera-card__dot">·</span>}
              {timePart && <span>{timePart}</span>}
            </div>
            {lugarLine ? (
              <div className="event-cartelera-card__place" title={lugarLine}>
                {lugarLine}
              </div>
            ) : null}
            <div className="event-cartelera-card__footer">
              <span style={{ flex: 1 }} />
              <div
                className="event-cartelera-card__price"
                aria-label={costMonto === 0 ? "Entrada gratis" : `Costo ${formatCostoMonto(costMonto)}`}
              >
                {costMonto === 0 ? (
                  <span>Gratis</span>
                ) : (
                  <>
                    <span className="event-cartelera-card__currency">$</span>
                    <span>{costMonto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                  </>
                )}
                {hasDisc ? <span className="event-cartelera-card__discount">%</span> : null}
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </LiveLink>
  );
}

const EventCarteleraCard = React.memo(function EventCarteleraCard(props: EventCarteleraCardProps) {
  return <EventCarteleraCardInner {...props} />;
});

export default EventCarteleraCard;
