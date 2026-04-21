import React, { useMemo } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTags } from '../../hooks/useTags';
import { colors, typography } from '../../theme/colors';
import './UbicacionesLive.css';

function googleMapsSearchUrl(query: string): string {
  const q = query.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

type Ubicacion = {
  nombre?: string;
  sede?: string; // Formato AcademyLocation
  direccion?: string;
  ciudad?: string;
  referencias?: string;
  zonaIds?: number[];
  zona_id?: number | null;
};

type Props = {
  ubicaciones?: Ubicacion[];
  title?: string;
  /** Texto bajo el título (p. ej. tagline). Si hay conteo, se une con " · ". */
  description?: string;
  style?: React.CSSProperties;
  className?: string;
  headingSize?: string;
};

function normalizeRow(u: Ubicacion, idx: number) {
  const nombreUbicacion = (u.nombre || u.sede || '').trim();
  const direccionCompleta = (u.direccion || '').trim();
  const ciudadUbicacion = (u.ciudad || '').trim();
  const referenciasUbicacion = (u.referencias || '').trim();

  const zonasArray: number[] = [];
  if (u.zonaIds && Array.isArray(u.zonaIds)) {
    zonasArray.push(...u.zonaIds);
  } else if (u.zona_id !== null && u.zona_id !== undefined) {
    zonasArray.push(u.zona_id);
  }

  const hasCore =
    !!nombreUbicacion ||
    !!direccionCompleta ||
    !!ciudadUbicacion ||
    zonasArray.length > 0 ||
    !!referenciasUbicacion;

  return {
    idx,
    nombreUbicacion,
    direccionCompleta,
    ciudadUbicacion,
    referenciasUbicacion,
    zonasArray,
    hasCore,
  };
}

export default function UbicacionesLive({
  ubicaciones = [],
  title = 'Ubicaciones',
  description,
  style,
  className,
  headingSize = '1.25rem',
}: Props) {
  const { t } = useTranslation();
  const { data: allTags } = useTags();
  const getZonaNombre = (id: number) => allTags?.find((t) => t.id === id && t.tipo === 'zona')?.nombre;

  const rows = useMemo(() => {
    return ubicaciones.map((u, idx) => normalizeRow(u, idx)).filter((r) => r.hasCore);
  }, [ubicaciones]);

  const locationCount = rows.length;

  const countLabel = useMemo(() => {
    if (locationCount <= 0) return '';
    if (locationCount === 1) return '1 ubicación';
    return `${locationCount} ubicaciones`;
  }, [locationCount]);

  const headerSubtitle = useMemo(() => {
    const parts = [description?.trim(), countLabel].filter(Boolean) as string[];
    return parts.join(' · ');
  }, [description, countLabel]);

  if (!ubicaciones || ubicaciones.length === 0 || rows.length === 0) return null;

  const showPrimaryBadge = locationCount > 1;

  return (
    <section className={`ubicaciones-live ${className ?? ''}`.trim()} style={style}>
      <header className="ubicaciones-live__header">
        <div
          className="ubicaciones-live__icon-wrap"
          aria-hidden
          style={{
            backgroundImage: colors.gradients.primary,
          }}
        >
          <MapPin size={26} strokeWidth={2.25} color="#fff" />
        </div>
        <div className="ubicaciones-live__title-block">
          <h3
            className="ubicaciones-live__title"
            style={{
              fontSize: headingSize,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {title}
          </h3>
          {headerSubtitle ? (
            <p className="ubicaciones-live__subtitle">{headerSubtitle}</p>
          ) : null}
        </div>
      </header>

      <div className="ubicaciones-live__list" role="list">
        {rows.map((row) => {
          const {
            idx,
            nombreUbicacion,
            direccionCompleta,
            ciudadUbicacion,
            referenciasUbicacion,
            zonasArray,
          } = row;

          const addressLine =
            direccionCompleta && ciudadUbicacion
              ? `${direccionCompleta}, ${ciudadUbicacion}`
              : direccionCompleta || ciudadUbicacion || '';

          const hasName = !!nombreUbicacion;
          const showTopRow = hasName || (showPrimaryBadge && idx === 0);

          const mapsQuery = (() => {
            const addr = addressLine.trim();
            if (addr) return addr;
            const parts: string[] = [];
            if (nombreUbicacion) parts.push(nombreUbicacion);
            if (direccionCompleta) parts.push(direccionCompleta);
            if (ciudadUbicacion) parts.push(ciudadUbicacion);
            for (const zid of zonasArray) {
              const zn = getZonaNombre(zid);
              if (zn) parts.push(zn);
            }
            return parts.join(', ').trim();
          })();

          const mapsHref = mapsQuery ? googleMapsSearchUrl(mapsQuery) : '';

          return (
            <article key={`ub-${idx}-${nombreUbicacion || addressLine || 'loc'}`} className="ubicaciones-live__card" role="listitem">
              <div className="ubicaciones-live__card-inner">
                {showTopRow ? (
                  <div
                    className={`ubicaciones-live__card-top ${
                      !hasName && showPrimaryBadge && idx === 0 ? 'ubicaciones-live__card-top--only-badge' : ''
                    }`}
                  >
                    {hasName ? (
                      <h4 className="ubicaciones-live__name" style={{ fontFamily: typography.fontFamily.primary }}>
                        {nombreUbicacion}
                      </h4>
                    ) : (
                      <span style={{ flex: 1, minWidth: 0 }} aria-hidden />
                    )}
                    {showPrimaryBadge && idx === 0 ? (
                      <span className="ubicaciones-live__badge-primary">Principal</span>
                    ) : null}
                  </div>
                ) : null}

                {(addressLine || mapsHref) ? (
                  <div
                    className={`ubicaciones-live__address-row ${
                      !addressLine && mapsHref ? 'ubicaciones-live__address-row--maps-only' : ''
                    }`}
                  >
                    {addressLine ? (
                      <p
                        className={`ubicaciones-live__address ${!hasName ? 'ubicaciones-live__address--emphasis' : ''}`}
                      >
                        <MapPin className="ubicaciones-live__address-icon" size={18} strokeWidth={2.2} aria-hidden />
                        <span className="ubicaciones-live__address-text">{addressLine}</span>
                      </p>
                    ) : null}
                    {mapsHref ? (
                      <a
                        className="ubicaciones-live__maps-btn"
                        href={mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t('view_on_maps')}: ${mapsQuery}`}
                      >
                        <ExternalLink className="ubicaciones-live__maps-btn-icon" size={16} strokeWidth={2.25} aria-hidden />
                        {t('view_on_maps')}
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {zonasArray.length > 0 ? (
                  <div className="ubicaciones-live__zones">
                    <span className="ubicaciones-live__zone-label">Zona</span>
                    {zonasArray.map((zid) => (
                      <span key={zid} className="ubicaciones-live__zone-chip">
                        {getZonaNombre(zid) || 'Zona'}
                      </span>
                    ))}
                  </div>
                ) : null}

                {referenciasUbicacion ? (
                  <p className="ubicaciones-live__ref">
                    <span className="ubicaciones-live__ref-label" aria-hidden>
                      ⓘ
                    </span>
                    {referenciasUbicacion}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
