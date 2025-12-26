import React from 'react';
import { motion } from 'framer-motion';
import LiveLink from '../../LiveLink';
import { useTags } from '../../../hooks/useTags';
import { RITMOS_CATALOG } from '../../../lib/ritmosCatalog';
import { normalizeAndOptimizeUrl } from '../../../utils/imageOptimization';
import { getLocaleFromI18n } from '../../../utils/locale';
import { useTranslation } from 'react-i18next';

type ClaseItem = {
  titulo?: string;
  fecha?: string; // YYYY-MM-DD si espec ífica
  diasSemana?: string[]; // si semanal
  diaSemana?: number; // día específico (0-6) para clases expandidas con múltiples días
  inicio?: string; // HH:MM
  fin?: string;    // HH:MM
  ubicacion?: string;
  ownerType?: 'academy' | 'teacher';
  ownerId?: number | string;
  ownerName?: string;
  ownerCoverUrl?: string;
  ritmos?: number[];
  ritmosSeleccionados?: string[];
  cronogramaIndex?: number; // Índice original en el cronograma
};

interface Props {
  item: ClaseItem;
  /** En sliders/grids, hace que el card llene la altura del item para igualar alturas con CTA cards */
  fillHeight?: boolean;
}

export default function ClassCard({ item, fillHeight = false }: Props) {
  const { t } = useTranslation();
  const isSemanal = Array.isArray(item.diasSemana) && item.diasSemana.length > 0 && !item.fecha;
  // Construir la ruta correcta: /clase/:type/:id
  // Si hay ownerType y ownerId, usar la ruta con parámetros
  // Si no, usar query params como fallback
  const href = React.useMemo(() => {
    // Construir los query params
    const params = new URLSearchParams();
    
    if (item.cronogramaIndex !== null && item.cronogramaIndex !== undefined) {
      params.set('i', String(item.cronogramaIndex));
    }
    
    // Si hay diaSemana específico (para clases expandidas con múltiples días), incluirlo
    if (typeof item.diaSemana === 'number' && item.diaSemana >= 0 && item.diaSemana <= 6) {
      params.set('dia', String(item.diaSemana));
    }
    
    const queryString = params.toString();
    const queryParam = queryString ? `?${queryString}` : '';
    
    if (item.ownerType && item.ownerId) {
      // Asegurar que ownerId sea un string válido
      const ownerIdStr = String(item.ownerId);
      const route = `/clase/${item.ownerType}/${ownerIdStr}${queryParam}`;
      return route;
    }
    if (item.ownerId) {
      const ownerIdStr = String(item.ownerId);
      if (queryString) {
        params.set('type', item.ownerType || 'teacher');
        params.set('id', ownerIdStr);
        const route = `/clase?${params.toString()}`;
        return route;
      }
      const route = `/clase?type=${item.ownerType || 'teacher'}&id=${ownerIdStr}`;
      return route;
    }
    const route = `/clase?type=${item.ownerType || 'teacher'}`;
    return route;
  }, [item.ownerType, item.ownerId, item.cronogramaIndex, item.diaSemana]);
  const bg = normalizeAndOptimizeUrl(item.ownerCoverUrl as any);
  const { data: allTags } = useTags() as any;

  // Cache-busting para la portada de la clase (owner cover)
  const bgCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.ownerId as string | number | undefined) ||
    (item.titulo as string | undefined) ||
    '';

  const bgWithCacheBust = React.useMemo(() => {
    if (!bg) return undefined;
    const separator = String(bg).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(bgCacheKey ?? ''));
    return `${bg}${separator}_t=${key}`;
  }, [bg, bgCacheKey]);

  // Extraer solo el nombre del lugar (similar a EventCard que usa `lugar`)
  // Si ubicacion contiene información adicional (dirección, ciudad, etc.), extraer solo el nombre
  const lugarNombre = React.useMemo(() => {
    if (!item.ubicacion) return '';
    const ubicacion = String(item.ubicacion).trim();
    // Si contiene separadores comunes, tomar solo la primera parte (el nombre)
    // Ejemplos: "Lugar, Dirección" -> "Lugar", "Lugar · Ciudad" -> "Lugar"
    const separadores = [',', '·', '-', '|'];
    for (const sep of separadores) {
      if (ubicacion.includes(sep)) {
        return ubicacion.split(sep)[0].trim();
      }
    }
    // Si no tiene separadores, devolver tal cual (ya es solo el nombre)
    return ubicacion;
  }, [item.ubicacion]);

  const ritmoNames: string[] = React.useMemo(() => {
    try {
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
      const catalogIds = (item.ritmosSeleccionados || []) as string[];
      if (Array.isArray(catalogIds) && catalogIds.length > 0) {
        return catalogIds.map(id => labelByCatalogId.get(id)!).filter(Boolean) as string[];
      }
      const nums = (item.ritmos || []) as number[];
      if (Array.isArray(allTags) && nums.length > 0) {
        return nums
          .map((id: number) => allTags.find((t: any) => t.id === id && t.tipo === 'ritmo'))
          .filter(Boolean)
          .map((t: any) => t.nombre as string);
      }
    } catch {}
    return [] as string[];
  }, [item, allTags]);

  // Determinar si es hoy
  const isToday = React.useMemo(() => {
    if (!item.fecha) return false;
    try {
      const today = new Date();
      const eventDate = new Date(item.fecha);
      return today.toDateString() === eventDate.toDateString();
    } catch {
      return false;
    }
  }, [item.fecha]);

  // Formatear fecha para meta
  const formattedDate = React.useMemo(() => {
    const locale = getLocaleFromI18n();
    if (isSemanal) {
      if (typeof item.diaSemana === 'number') {
        const dayNames = [
          t('sunday'), t('monday'), t('tuesday'), t('wednesday'),
          t('thursday'), t('friday'), t('saturday')
        ];
        const shortDayNames = dayNames.map(d => d.slice(0, 3).toLowerCase());
        return shortDayNames[item.diaSemana] || '';
      }
      // Si hay múltiples días, formatear cada uno
      if (Array.isArray(item.diasSemana) && item.diasSemana.length > 0) {
        const dayNames = [
          t('sunday'), t('monday'), t('tuesday'), t('wednesday'),
          t('thursday'), t('friday'), t('saturday')
        ];
        const dayMap: Record<string, number> = {
          'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
          'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6
        };
        return item.diasSemana
          .map(d => {
            const normalized = String(d).toLowerCase().trim();
            const dayIndex = dayMap[normalized];
            if (dayIndex !== undefined) {
              return dayNames[dayIndex].slice(0, 3).toLowerCase();
            }
            return d.slice(0, 3).toLowerCase();
          })
          .join(', ') || '';
      }
      return '';
    }
    if (item.fecha) {
      try {
        const d = new Date(item.fecha);
        const day = d.getDate();
        const month = d.toLocaleDateString(locale, { month: 'short' });
        return `${day} ${month}`;
      } catch {
        // Fallback usando fmtDate
        try {
          const datePart = item.fecha.split('T')[0];
          const [y, m, day] = datePart.split('-').map((v) => parseInt(v, 10));
          if (y && m && day) {
            const localDate = new Date(y, m - 1, day);
            return localDate.toLocaleDateString(locale, {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
          }
        } catch {}
        return item.fecha;
      }
    }
    return '';
  }, [item.fecha, item.diasSemana, item.diaSemana, isSemanal, t]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
        
        .class-card-mobile {
          width: 100%;
        }

        /* Fuente única de proporción/altura:
           - La altura real la define ".media" (aspect-ratio).
           - ".class-card-mobile" solo controla ancho/márgenes (evita reglas compitiendo). */

        /* Responsive: Mobile */
        @media (max-width: 768px) {
          .class-card-mobile {
            /* Evitar cards gigantes (por vh) en pantallas altas y también evitar que quede muy angosta */
            max-width: min(420px, calc((9 / 16) * 100vh));
            margin: 0 auto;
          }
          .class-card {
            --card-ar: 9 / 16;
          }
          img, [style*="objectFit"] {
            max-width: 100% !important;
            object-fit: cover !important;
            border-radius: 30px;
            height: 100% !important;
            padding: 10px;
          }
        }

        /* Responsive: Mobile pequeño */
        @media (max-width: 480px) {
          .class-card-mobile {
            max-width: 100%;
          }
          /* Menos padding para que no se tape el póster en pantallas pequeñas */
          .class-card-content {
            padding: 10px 10px max(8px, env(safe-area-inset-bottom));
          }
        }

        /* CARD */
        .class-card {
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
        .class-card-media {
          position: relative;
          aspect-ratio: var(--card-ar); /* single source of truth */
          background: rgba(255, 255, 255, 0.04);
        }

        /* fondo "relleno" usando la misma imagen, con blur */
        .class-card-media::before {
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
        .class-card-media::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.82) 100%);
        }

        /* la imagen REAL completa */
        .class-card-media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          filter: drop-shadow(0 18px 30px rgba(0, 0, 0, 0.45));
          z-index: 1;
          /* Optimizaciones de rendimiento */
          transform: translateZ(0);
          willChange: auto;
          backfaceVisibility: hidden;
          WebkitBackfaceVisibility: hidden;
        }

        .class-card-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          z-index: 2;
        }

        .class-card-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(17, 21, 32, 0.55);
          backdrop-filter: blur(8px);
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .class-card-badge.hot {
          border: none;
          background: linear-gradient(135deg, var(--brand1), var(--brand2));
        }

        .class-card-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 14px 14px max(12px, env(safe-area-inset-bottom));
          z-index: 2;
        }

        .class-card-title {
          margin: 0 0 clamp(5px, 1vw, 8px);
          font-size: clamp(14px, 2.2vw, 18px);
          font-weight: 900;
          color: #fff;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px;
          word-break: break-word;
          line-height: 1.3;
          font-family: 'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .class-card-meta {
          display: flex;
          gap: clamp(6px, 1vw, 8px);
          flex-wrap: wrap;
          margin-bottom: clamp(8px, 1vw, 10px);
        }

        .class-card-meta .tag {
          font-size: clamp(10px, 1.6vw, 13px);
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

        .class-card-actions {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .class-card-cta {
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

        .class-card-cta svg {
          width: 18px;
          height: 18px;
          stroke: rgba(255, 255, 255, 0.9);
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: stroke 0.2s ease;
        }

        .class-card:hover .class-card-cta {
          background: rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.1);
        }

        .class-card:hover .class-card-cta svg {
          stroke: rgba(255, 255, 255, 1);
        }
      `}</style>
      <LiveLink to={href} asCard={false}>
        <motion.article
          className="class-card class-card-mobile"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          style={fillHeight ? ({ height: '100%', alignSelf: 'stretch' } as React.CSSProperties) : undefined}
        >
          <div
            className="class-card-media"
            style={{
              '--img': (bgWithCacheBust || bg) ? `url(${bgWithCacheBust || bg})` : undefined,
            } as React.CSSProperties}
          >
            {(bgWithCacheBust || bg) && (
              <img
                src={bgWithCacheBust || bg}
                alt={item.titulo || 'Clase'}
                loading="lazy"
                decoding="async"
                style={{
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

            {isToday && (
              <div className="class-card-badges">
                <div className="class-card-badge hot">HOY</div>
              </div>
            )}

            <div className="class-card-actions">
              <div className="class-card-cta">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="class-card-content">
            <h3 className="class-card-title">{item.titulo || 'Clase'}</h3>

            {item.ownerName && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 8, fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                por <strong style={{ color: '#fff', fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{item.ownerName}</strong>
              </div>
            )}

            <div className="class-card-meta">
              {formattedDate && (
                <div className="tag">🗓️ {formattedDate}</div>
              )}
              {(item.inicio || item.fin) && (
                <div className="tag">🕗 {item.inicio || '—'}{item.fin ? ` - ${item.fin}` : ''}</div>
              )}
              {lugarNombre && (
                <div className="tag">📍 {lugarNombre}</div>
              )}
              {ritmoNames.length > 0 && (
                <div className="tag">🎵 {ritmoNames.slice(0, 2).join(', ')}</div>
              )}
            </div>
          </div>
        </motion.article>
      </LiveLink>
    </>
  );
}


