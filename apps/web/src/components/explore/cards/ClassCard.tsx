import React from 'react';
import LiveLink from '../../LiveLink';
import { useTags } from '../../../hooks/useTags';
import { RITMOS_CATALOG } from '../../../lib/ritmosCatalog';
import { toDirectPublicStorageUrl } from '../../../utils/imageOptimization';
import ExploreResponsiveImage from '../../explore/ExploreResponsiveImage';
import { getLocale } from '../../../utils/locale';
import { useTranslation } from 'react-i18next';
import "./Card.css";


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
  /** Si true, evita lazy-loading y eleva prioridad (LCP) */
  priority?: boolean;
}

export default function ClassCard({ item, fillHeight = false, priority = false }: Props) {
  const { t, i18n } = useTranslation();
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
  const bg = toDirectPublicStorageUrl(item.ownerCoverUrl as any) ?? undefined;
  const { data: allTags } = useTags() as any;

  // Cache-busting para la portada de la clase (owner cover)
  const bgCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.ownerId as string | number | undefined) ||
    (item.titulo as string | undefined) ||
    '';

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [bg, bgCacheKey]);
  const showPlaceholder = !bg || imageError;
  const placeholderReason = !bg ? 'URL vacía' : imageError ? 'Image load failed' : '';

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

  // Formatear fecha para meta
  const formattedDate = React.useMemo(() => {
    const locale = getLocale(i18n.language || "es");
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
          domingo: 0,
          lunes: 1,
          martes: 2,
          miércoles: 3,
          miercoles: 3,
          jueves: 4,
          viernes: 5,
          sábado: 6,
          sabado: 6,
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
          sun: 0,
          mon: 1,
          tue: 2,
          wed: 3,
          thu: 4,
          fri: 5,
          sat: 6,
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
  }, [item.fecha, item.diasSemana, item.diaSemana, isSemanal, t, i18n.language]);

  return (
    <>
      <LiveLink to={href} asCard={false}>
        <article
          className="class-card class-card-mobile"
          style={fillHeight ? ({ height: '100%', alignSelf: 'stretch' } as React.CSSProperties) : undefined}
        >
          <div className="class-card-media">
            <div className="class-card-media__frame">
              {showPlaceholder ? (
                <div className="class-card-media-placeholder" data-reason={placeholderReason} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              ) : bg && !imageError ? (
                <ExploreResponsiveImage
                  rawUrl={bg}
                  cacheVersion={bgCacheKey || null}
                  preset="flyerContain"
                  alt={item.titulo || 'Clase'}
                  priority={priority}
                  onLoad={() => setImageError(false)}
                  onError={() => setImageError(true)}
                />
              ) : null}
            </div>
            <div className="class-card-media__overlay" aria-hidden />

          </div>

          <div className="class-card-content">
            <h3 className="class-card-title">{item.titulo || (item as any).nombre || 'Clase'}</h3>

            {item.ownerName && (
              <div className="event-card__owner">
                por <strong>{item.ownerName}</strong>
              </div>
            )}

            <div className="class-card-meta">
              {formattedDate && (
                <div className="class-card-meta-row--date">
                  <div className="tag">{formattedDate}</div>
                </div>
              )}
              <div className="class-card-meta-row--time-zone">
                {(item.inicio || item.fin) && (
                  <div className="tag">{item.inicio || '—'}{item.fin ? ` - ${item.fin}` : ''}</div>
                )}
                {lugarNombre && (
                  <div className="tag tag--location">{lugarNombre}</div>
                )}
                {ritmoNames.length > 0 && (
                  <div className="tag">{ritmoNames.slice(0, 2).join(', ')}</div>
                )}
              </div>
            </div>
          </div>
        </article>
      </LiveLink>
    </>
  );
}


