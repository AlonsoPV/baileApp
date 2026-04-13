import React from "react";
import LiveLink from "../../LiveLink";
import { toDirectPublicStorageUrl } from "../../../utils/imageOptimization";
import ExploreResponsiveImage from "../../explore/ExploreResponsiveImage";
import { getMediaBySlot, normalizeMediaArray } from "../../../utils/mediaSlots";
import { EXPLORE_CARD_STYLES } from "./_sharedExploreCardStyles";

interface OrganizerCardProps {
  item: any;
  priority?: boolean;
}

export default function OrganizerCard({ item, priority = false }: OrganizerCardProps) {
  const toUrl = (u: string | undefined) => u ? toDirectPublicStorageUrl(u) : undefined;
  const mediaList = normalizeMediaArray(item?.media);
  const bannerUrl: string | undefined =
    toUrl(getMediaBySlot(mediaList, 'p1')?.url) ??
    toUrl(getMediaBySlot(mediaList, 'avatar')?.url) ??
    toUrl(item?.avatar_url) ??
    toUrl(item?.portada_url) ??
    toUrl(getMediaBySlot(mediaList, 'cover')?.url) ??
    (mediaList.length > 0 ? toUrl((mediaList[0] as any)?.url || (mediaList[0] as any)?.path) : undefined);

  // Cache-busting para la imagen del organizador
  const bannerCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | number | undefined) ||
    (item.nombre_publico as string | undefined) ||
    '';

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [bannerUrl, bannerCacheKey]);
  const showPlaceholder = !bannerUrl || imageError;
  const placeholderReason = !bannerUrl ? 'URL vacía' : imageError ? 'Image load failed' : '';

  return (
    <>
      <style>{EXPLORE_CARD_STYLES}</style>
      <LiveLink to={`/organizer/${item.id}`} asCard={false}>
        <article className="explore-card explore-card-mobile">
          <div className="explore-card-media">
            {showPlaceholder && (
              <div className="explore-card-media-placeholder" data-reason={placeholderReason} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
            {bannerUrl && !imageError && (
              <ExploreResponsiveImage
                rawUrl={bannerUrl}
                cacheVersion={bannerCacheKey || null}
                preset="flyerContain"
                alt={`Imagen de ${item?.nombre_publico || 'Organizador'}`}
                priority={priority}
                onLoad={() => setImageError(false)}
                onError={() => setImageError(true)}
              />
            )}

          </div>

          <div className="explore-card-content">
            <h3 className="explore-card-title">{item?.nombre_publico || 'Organizador'}</h3>
          </div>
        </article>
      </LiveLink>
    </>
  );
}

