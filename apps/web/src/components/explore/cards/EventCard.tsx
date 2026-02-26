import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { RITMOS_CATALOG } from "../../../lib/ritmosCatalog";
import { fmtDate } from "../../../utils/format";
import { ensureAbsoluteImageUrl, toDirectPublicStorageUrl, logCardImage } from "../../../utils/imageOptimization";
import { getMediaBySlot, normalizeMediaArray } from "../../../utils/mediaSlots";
import { getPrimaryCost, hasDiscount, getMonto, formatCostoMonto } from "../../../utils/eventCosts";
import { getEventDateYmd } from "../../../utils/eventDateDisplay";
import "./Card.css";

interface EventCardProps {
  item: any;
  /** Si true, evita lazy-loading y eleva prioridad (LCP) */
  priority?: boolean;
}

export default function EventCard({ item, priority = false }: EventCardProps) {
  // Si es una ocurrencia recurrente, usar el ID original para la navegación
  const eventId = item.id ?? item.event_date_id ?? item._original_id;
  const linkTo = eventId ? urls.eventDateLive(eventId) : '#';
  const { data: allTags } = useTags() as any;
  const formatHHMM = (t?: string) => {
    if (!t) return '';
    try {
      const s = String(t);
      if (s.includes(':')) {
        const [hh = '', mm = ''] = s.split(':');
        const h2 = hh.padStart(2, '0').slice(-2);
        const m2 = mm.padStart(2, '0').slice(-2);
        return `${h2}:${m2}`;
      }
      // Fallback simple: si viene como "2000" -> "20:00"
      if (s.length === 4) return `${s.slice(0,2)}:${s.slice(2,4)}`;
    } catch {}
    return t;
  };
  // Prioridad para el fondo de la card (flyer/cartel): flyer_url > slot p1 > avatar > portada/avatar_url > primer media
  // URL pública directa (sin render/Image Transformation para evitar fallos en cards)
  const flyer = (() => {
    const toUrl = (u: string | null | undefined) => (u ? (toDirectPublicStorageUrl(ensureAbsoluteImageUrl(u) ?? u) ?? u) : undefined);
    if (item.flyer_url) return toUrl(item.flyer_url);
    const mediaList = normalizeMediaArray(item.media);
    const p1 = getMediaBySlot(mediaList, 'p1') as any;
    const p1Url = p1?.url ?? p1?.path;
    if (p1Url) return toUrl(p1Url);
    const avatarSlot = mediaList.find((m: any) => m?.slot === 'avatar');
    const avatarUrl = avatarSlot?.url ?? (avatarSlot as any)?.path;
    if (avatarUrl) return toUrl(avatarUrl);
    if (item.avatar_url) return toUrl(item.avatar_url);
    if (item.portada_url) return toUrl(item.portada_url);
    if (mediaList.length > 0) {
      const first = mediaList[0];
      const url = (first as any)?.url ?? (first as any)?.path ?? (typeof first === 'string' ? first : '');
      if (url) return toUrl(url);
    }
    return undefined;
  })();

  // Cache-busting para el flyer, usando updated_at/created_at/id para forzar refresco cuando cambie en BD
  const flyerCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    ((item as any)?.events_parent?.updated_at as string | undefined) ||
    ((item as any)?.events_parent?.id as string | number | undefined) ||
    (item._original_id as string | number | undefined) ||
    (item.id as string | number | undefined) ||
    '';

  const flyerWithCacheBust = React.useMemo(() => {
    if (!flyer) return undefined;
    const separator = String(flyer).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(flyerCacheKey ?? ''));
    return `${flyer}${separator}_t=${key}`;
  }, [flyer, flyerCacheKey]);

  const [imageError, setImageError] = React.useState(false);
  const imageUrlFinal = flyerWithCacheBust || flyer;
  React.useEffect(() => {
    setImageError(false);
  }, [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;
  const placeholderReason = !flyer ? "URL vacía" : imageError ? "Image load failed" : "";
  logCardImage("evento", eventId, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? "URL vacía" : undefined);

  const nombre = item.nombre || item.evento_nombre || item.lugar || item.ciudad || "Evento";
  const horaInicio = item.hora_inicio || item.evento_hora_inicio;
  const horaFin = item.hora_fin || item.evento_hora_fin;
  const lugar = item.lugar || item.evento_lugar;
  const ciudad = item.ciudad || item.evento_ciudad;
  const direccion = item.direccion || item.evento_direccion;
  // Solo mostrar el nombre del lugar (antes de " · " o ","), no la dirección completa
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
  
  const fecha = React.useMemo(() => getEventDateYmd(item), [item]);

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[EventCard] id:", item?.id, "fecha:", item?.fecha, "dia_semana:", item?.dia_semana, "display:", fecha);
  }

  const primaryCost = React.useMemo(() => getPrimaryCost(item), [item]);
  const showDiscount = React.useMemo(() => hasDiscount(item), [item]);
  const costMonto = getMonto(primaryCost);

  const ritmoNames: string[] = React.useMemo(() => {
    try {
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));

      const selectedCatalog: string[] =
        (Array.isArray(item?.ritmos_seleccionados) && item.ritmos_seleccionados)
        || (Array.isArray(item?.events_parent?.ritmos_seleccionados) && item.events_parent.ritmos_seleccionados)
        || [];
      if (selectedCatalog.length > 0) {
        return selectedCatalog.map(id => labelByCatalogId.get(id)!).filter(Boolean) as string[];
      }

      const estilosNums: number[] =
        (Array.isArray(item?.estilos) && item.estilos)
        || (Array.isArray(item?.events_parent?.estilos) && item.events_parent.estilos)
        || [];
      if (Array.isArray(allTags) && estilosNums.length > 0) {
        return estilosNums
          .map((id: number) => allTags.find((t: any) => t.id === id && t.tipo === 'ritmo'))
          .filter(Boolean)
          .map((t: any) => t.nombre as string);
      }
    } catch {}
    return [] as string[];
  }, [item, allTags]);

  return (
    <>
      
      <LiveLink to={linkTo} asCard={false}>
        <motion.article
          className="card event-card-mobile"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="media">
            {imageUrlFinal && !imageError && (
              <div
                className="media__bg"
                style={{ backgroundImage: `url(${imageUrlFinal})` }}
                aria-hidden
              />
            )}
            <div className="media__frame">
              {showPlaceholder ? (
                <div
                  className="media-placeholder"
                  data-reason={placeholderReason}
                  aria-hidden
                  style={{ width: '100%', height: '100%', minHeight: 100 }}
                >
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
            {/* <div className="media__overlay" aria-hidden /> */}
        </div>

          <div className="content">
            <h3 className="event-title">{nombre}</h3>

        {item.ownerName && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 8, fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 2px #000' }}>
                por <strong style={{ color: '#fff', fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 2px #000' }}>{item.ownerName}</strong>
              </div>
        )}

            <div className="meta">
              {fecha && (
                <div className="meta-row--date">
                  <div className="tag">📅 {fmtDate(fecha)}</div>
                </div>
              )}
              <div className="meta-row--time-zone">
                {horaInicio && (
                  <div className="tag">🕗 {formatHHMM(horaInicio)}</div>
                )}
                {costMonto != null && (
                  <div
                    className="tag tag--cost"
                    aria-label={costMonto === 0 ? 'Entrada gratis' : `Costo taquilla ${formatCostoMonto(costMonto)}`}
                  >
                    {costMonto === 0 ? (
                      <span>Gratis</span>
                    ) : (
                      <>
                        <span className="tag__cost-icon" aria-hidden>$</span>
                        <span>{costMonto.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</span>
                      </>
                    )}
                    {showDiscount && (
                      <span className="tag__discount-badge" aria-label="Hay descuento o preventa" title="Descuento o precio especial disponible">
                        %
                      </span>
                    )}
                  </div>
                )}
                {lugarSoloNombre && (
                  <div className="tag tag--location">📍 {lugarSoloNombre}</div>
                )}
              </div>
            </div>

        {organizador && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>👤</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }} title={organizador}>
                {organizador}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2, fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>Organizador</div>
            </div>
          </div>
        )}
        </div>

        <div aria-hidden style={{ pointerEvents: 'none', position: 'absolute', inset: -2, borderRadius: 18, boxShadow: '0 0 0 0px rgba(255,255,255,0)', transition: 'box-shadow .2s ease' }} className="card-focus-ring" />
        </motion.article>
      </LiveLink>
    </>
  );
}

