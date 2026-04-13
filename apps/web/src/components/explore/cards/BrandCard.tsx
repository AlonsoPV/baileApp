import React from "react";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { toDirectPublicStorageUrl } from "../../../utils/imageOptimization";
import ExploreResponsiveImage from "../../explore/ExploreResponsiveImage";
import { RITMOS_CATALOG } from "../../../lib/ritmosCatalog";
import "./ExploreCardsShared.css";

type Props = { item: any; priority?: boolean };

export default function BrandCard({ item, priority = false }: Props) {
  const { data: allTags } = useTags() as any;
  const id = item.id;
  const nombre = item.nombre_publico || item.nombre || "Marca";
  const bio = item.bio || "";
  const cover = toDirectPublicStorageUrl(
    item.portada_url
    || (Array.isArray(item.media) ? ((item.media[0] as any)?.url || (item.media[0] as any)?.path || (item.media[0] as any)) : undefined)
    || item.avatar_url
  ) ?? undefined;
  // Mapear ritmos por catálogo (ritmos_seleccionados) o por ids numéricos (ritmos/estilos)
  const ritmoNombres: string[] = (() => {
    try {
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach((g) => g.items.forEach((i) => labelByCatalogId.set(i.id, i.label)));
      const selectedCatalog: string[] = Array.isArray(item?.ritmos_seleccionados) ? item.ritmos_seleccionados : [];
      if (selectedCatalog.length > 0) {
        return selectedCatalog.map((id: string) => labelByCatalogId.get(id)!).filter(Boolean) as string[];
      }
      const ritmoIds: number[] = (item.ritmos && Array.isArray(item.ritmos) ? item.ritmos : (item.estilos && Array.isArray(item.estilos) ? item.estilos : []));
      return (ritmoIds || [])
        .map((rid: number) => allTags?.find((t: any) => t.id === rid && t.tipo === 'ritmo')?.nombre)
        .filter(Boolean);
    } catch {
      return [];
    }
  })();
  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((t: any) => t.id === zid && t.tipo === 'zona')?.nombre)
    .filter(Boolean);

  // Cache-busting para la portada de la marca
  const coverCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | number | undefined) ||
    (item.nombre_publico as string | undefined) ||
    '';

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [cover, coverCacheKey]);
  const showPlaceholder = !cover || imageError;
  const placeholderReason = !cover ? 'URL vacía' : imageError ? 'Image load failed' : '';

  return (
    <LiveLink to={urls.brandLive(id)} asCard={false}>
      <article className="explore-card explore-card-mobile">
        <div className="explore-card-media">
          {showPlaceholder && (
            <div className="explore-card-media-placeholder" data-reason={placeholderReason} aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
          {cover && !imageError && (
            <ExploreResponsiveImage
              rawUrl={cover}
              cacheVersion={coverCacheKey || null}
              preset="flyerContain"
              alt={`Imagen de ${nombre}`}
              priority={priority}
              onLoad={() => setImageError(false)}
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <div className="explore-card-content">
          <h3 className="explore-card-title">{nombre}</h3>
          {bio ? <p className="explore-card-subtitle">{bio}</p> : null}

          <div className="explore-card-meta">
            {zonaNombres[0] ? <div className="explore-card-tag">{zonaNombres[0]}</div> : null}
            {!zonaNombres[0] && ritmoNombres[0] ? <div className="explore-card-tag">{ritmoNombres[0]}</div> : null}
          </div>
        </div>
      </article>
    </LiveLink>
  );
}


