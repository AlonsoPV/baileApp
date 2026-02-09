import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import AddToCalendarWithStats from "../../AddToCalendarWithStats";
import { useTags } from "../../../hooks/useTags";
import { RITMOS_CATALOG } from "../../../lib/ritmosCatalog";
import { calculateNextDateWithTime } from "../../../utils/calculateRecurringDates";
import { fmtDate } from "../../../utils/format";
import { normalizeAndOptimizeUrl } from "../../../utils/imageOptimization";
import { getMediaBySlot } from "../../../utils/mediaSlots";

interface EventCardProps {
  item: any;
  /** Si true, evita lazy-loading y eleva prioridad (LCP) */
  priority?: boolean;
}

export default function EventCard({ item, priority = false }: EventCardProps) {
  // Si es una ocurrencia recurrente, usar el ID original para la navegación
  const eventId = item._original_id ?? item.id ?? item.event_date_id;
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
  // Alineado con EventDatePublicScreen y OrganizerPublicScreen para que se use la imagen correcta.
  const flyer = (() => {
    if (item.flyer_url) return normalizeAndOptimizeUrl(item.flyer_url);
    const mediaList = Array.isArray(item.media) ? (item.media as any[]) : [];
    const p1 = getMediaBySlot(mediaList, 'p1') as any;
    const p1Url = p1?.url ?? p1?.path;
    if (p1Url) return normalizeAndOptimizeUrl(p1Url);
    const avatarSlot = mediaList.find((m: any) => m?.slot === 'avatar');
    const avatarUrl = avatarSlot?.url ?? (avatarSlot as any)?.path;
    if (avatarUrl) return normalizeAndOptimizeUrl(avatarUrl);
    if (item.avatar_url) return normalizeAndOptimizeUrl(item.avatar_url);
    if (item.portada_url) return normalizeAndOptimizeUrl(item.portada_url);
    if (mediaList.length > 0) {
      const first = mediaList[0];
      const url = (first as any)?.url ?? (first as any)?.path ?? (typeof first === 'string' ? first : '');
      if (url) return normalizeAndOptimizeUrl(url);
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
  const nombre = item.nombre || item.evento_nombre || item.lugar || item.ciudad || "Evento";
  const horaInicio = item.hora_inicio || item.evento_hora_inicio;
  const horaFin = item.hora_fin || item.evento_hora_fin;
  const lugar = item.lugar || item.evento_lugar;
  const ciudad = item.ciudad || item.evento_ciudad;
  const direccion = item.direccion || item.evento_direccion;
  const organizador = item.organizador_nombre || item.organizer_name;
  
  // Calcular la fecha a mostrar: si ya tiene fecha (de expansión recurrente), usarla; si no, calcular
  const fecha = React.useMemo(() => {
    // Si ya tiene fecha (de la expansión), usarla directamente
    const fechaOriginal = item.fecha || item.evento_fecha;
    if (!fechaOriginal) return null;
    
    // Si es una ocurrencia recurrente expandida, la fecha ya está calculada
    if (item._recurrence_index !== undefined) {
      return fechaOriginal;
    }
    
    // Si tiene dia_semana pero no es una ocurrencia expandida, calcular la próxima fecha
    if (item.dia_semana !== null && item.dia_semana !== undefined && typeof item.dia_semana === 'number') {
      try {
        const horaInicioStr = horaInicio || '20:00';
        const proximaFecha = calculateNextDateWithTime(item.dia_semana, horaInicioStr);
        const year = proximaFecha.getFullYear();
        const month = String(proximaFecha.getMonth() + 1).padStart(2, '0');
        const day = String(proximaFecha.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        console.error('Error calculando próxima fecha:', e);
        return fechaOriginal;
      }
    }
    
    // Si no tiene dia_semana, usar la fecha original
    return fechaOriginal;
  }, [item.fecha, item.evento_fecha, item.dia_semana, item._recurrence_index, horaInicio]);

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
      <style>{`
        .event-card-mobile {
          width: 100%;
        }

        /* Fuente única de proporción/altura:
           - La altura real la define ".media" (aspect-ratio).
           - ".event-card-mobile" solo controla ancho/márgenes (evita reglas compitiendo). */
        
        /* Responsive: Mobile */
        @media (max-width: 768px) {
          .event-card-mobile {
            /* Evitar cards gigantes (por vh) en pantallas altas y también evitar que quede muy angosta */
            max-width: min(420px, calc((9 / 16) * 100vh));
            margin: 0 auto;
          }
          .card { --card-ar: 9 / 16; }
          img, [style*="objectFit"] {
            max-width: 100% !important;
            /* height: auto !important; */
            object-fit: cover !important;
          }
        }
        
        /* Responsive: Mobile pequeño */
        @media (max-width: 480px) {
          .event-card-mobile {
            max-width: 100%;
          }
          /* Menos padding para que no se tape el póster en pantallas pequeñas */
          .content {
            padding: 10px 10px max(8px, env(safe-area-inset-bottom));
          }
        }
        /* CARD */
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .card {
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
          position: relative;
          cursor: pointer;
          /* Proporción default (desktop/tablet). Mobile la sobreescribe con --card-ar */
          --card-ar: 4 / 5;
        }
        /* 👇 área media con imagen COMPLETA */
        .media {
          position: relative;
          aspect-ratio: var(--card-ar); /* single source of truth */
          background: rgba(255, 255, 255, 0.04);
        }
        /* fondo "relleno" usando la misma imagen, con blur */
        .media::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: var(--img);
          background-size: cover;
          background-position: center;
          filter: blur(18px) saturate(1.1);
          transform: scale(1.08);
          opacity: 0.55;
        }
        /* capa para oscurecer un poco (mejor legibilidad) */
        .media::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.82) 100%);
        }
        /* la imagen REAL completa */
        .media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          filter: drop-shadow(0 18px 30px rgba(0, 0, 0, 0.45));
          z-index: 1;
        }
        .badges {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          z-index: 2;
        }
        .badge {
          font-size: 11px;
          font-weight: 800;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(17, 21, 32, 0.55);
          backdrop-filter: blur(8px);
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .badge.hot {
          border: none;
          background: linear-gradient(135deg, var(--brand1), var(--brand2));
        }
        .content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 14px 14px max(12px, env(safe-area-inset-bottom));
          z-index: 2;
        }
        .event-title {
          margin: 0 0 clamp(5px, 1vw, 8px);
          font-size: clamp(16px, 2.5vw, 20px);
          font-weight: 900;
          color: #fff;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px;
          word-break: break-word;
          line-height: 1.3;
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .meta {
          display: flex;
          flex-direction: column;
          gap: clamp(6px, 1vw, 8px);
          margin-bottom: clamp(8px, 1vw, 10px);
        }
        .meta-row--date {
          width: 100%;
        }
        .meta-row--date .tag {
          width: 100%;
          box-sizing: border-box;
          display: block;
          text-align: center;
          font-weight: 700;
          text-transform: uppercase;
        }
        .meta-row--time-zone {
          display: flex;
          gap: clamp(6px, 1vw, 8px);
          flex-wrap: wrap;
        }
        .meta .tag {
          font-size: clamp(10px, 1.6vw, 13px);
          font-weight: 700;
          color: rgba(234, 240, 255, 0.85);
          background: rgba(17, 21, 32, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.14);
          padding: clamp(5px, 1vw, 9px) clamp(7px, 1.2vw, 12px);
          border-radius: 999px;
          display: inline-flex;
          gap: 8px;
          align-items: center;
          white-space: nowrap;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          backdrop-filter: blur(8px);
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .meta .meta-row--date .tag {
          display: block;
          text-align: center;
          text-transform: uppercase;
          background: linear-gradient(135deg, #FF6A1A, #E94E1B);
          border-color: rgba(255,255,255,.18);
          color: #111;
        }
        .card-actions {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cta {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          position: relative;
          user-select: none;
          pointer-events: none;
          transition: all 0.2s ease;
        }

        .cta svg {
          width: 18px;
          height: 18px;
          stroke: rgba(255, 255, 255, 0.9);
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: stroke 0.2s ease;
        }

        .card:hover .cta {
          background: rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.1);
        }

        .card:hover .cta svg {
          stroke: rgba(255, 255, 255, 1);
        }
        .ghost {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          display: grid;
          place-items: center;
          cursor: pointer;
          color: var(--text, rgba(255, 255, 255, 0.85));
          transition: all 0.2s;
        }
        .ghost:hover {
          background: rgba(255, 255, 255, 0.12);
        }
      `}</style>
      <LiveLink to={linkTo} asCard={false}>
        <motion.article
          className="card event-card-mobile"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
        >
          <div 
            className="media" 
          style={{ 
              // Para LCP: evitar request extra por background-image; el <img> es el que debe cargar.
              '--img': !priority && (flyerWithCacheBust || flyer) ? `url(${flyerWithCacheBust || flyer})` : undefined,
              '--overlay-opacity': flyer ? 0 : 1
            } as React.CSSProperties}
          >
            {(flyerWithCacheBust || flyer) && (
              <img
                src={flyerWithCacheBust || flyer}
                alt={`Poster del evento ${nombre}`}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center center',
                  // Optimizaciones de rendimiento
                  transform: 'translateZ(0)',
                  willChange: 'auto',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              />
            )}

            <div className="card-actions">
              <div className="cta">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
        </div>

          <div className="content">
            <h3 className="event-title">{nombre}</h3>

        {item.ownerName && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 8, fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                por <strong style={{ color: '#fff', fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{item.ownerName}</strong>
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
                {lugar && (
                  <div className="tag">📍 {lugar}</div>
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

