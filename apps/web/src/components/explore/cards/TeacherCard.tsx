import React from "react";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { getMediaBySlot } from "../../../utils/mediaSlots";
import { toDirectPublicStorageUrl } from "../../../utils/imageOptimization";
import ExploreResponsiveImage from "../../explore/ExploreResponsiveImage";
import type { ExploreTagMaps } from "@/utils/exploreTagMaps";
import { zonaNamesFromMap } from "@/utils/exploreTagMaps";
import "./ExploreCardsShared.css";

function TeacherCardBase({
  item,
  priority = false,
  tagMaps,
}: {
  item: any;
  priority?: boolean;
  tagMaps?: ExploreTagMaps;
}) {
  const { data: allTags } = useTags(undefined, { enabled: !tagMaps }) as any;

  // Nombre robusto: aceptar múltiples campos antes de caer en el fallback
  const displayName =
    item.nombre_publico ||
    item.teacher_name ||
    item.nombre ||
    item.name ||
    "Maestr@";

  // Resolver una URL de imagen robusta (avatar/banner/primer media o por slot). URL pública directa, sin render.
  const bannerUrl: string | undefined = (() => {
    const toUrl = (u: string | undefined) => u ? toDirectPublicStorageUrl(u) : undefined;
    const mediaList = Array.isArray(item?.media) ? item.media : [];
    const slotP1 = getMediaBySlot(mediaList as any, 'p1');
    if (slotP1?.url) return toUrl(slotP1.url as string) ?? undefined;
    const direct = item?.avatar_url || item?.banner_url || item?.portada_url || item?.avatar || item?.portada || item?.banner;
    if (direct) return toUrl(direct as string) ?? undefined;
    if (mediaList.length) {
      const bySlot = mediaList.find((m: any) => m?.slot === 'cover' || m?.slot === 'avatar');
      if (bySlot?.url) return toUrl(bySlot.url as string) ?? undefined;
      if (bySlot?.path) return toUrl(bySlot.path as string) ?? undefined;
      const first = mediaList[0];
      return toUrl(first?.url || first?.path || (typeof first === 'string' ? first : undefined)) ?? undefined;
    }
    return undefined;
  })();

  // Cache-busting para la portada del maestro
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

  const zonaNombres = React.useMemo(
    () =>
      tagMaps
        ? zonaNamesFromMap(item.zonas || [], tagMaps.zonaById)
        : (item.zonas || [])
            .map((zid: number) => allTags?.find((t: any) => t.id === zid && t.tipo === 'zona')?.nombre)
            .filter(Boolean),
    [item.zonas, tagMaps, allTags]
  );
  const handleImageLoad = React.useCallback(() => setImageError(false), []);
  const handleImageError = React.useCallback(() => setImageError(true), []);
  return (
    <LiveLink to={urls.teacherLive(item.id)} asCard={false}>
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
              alt={`Imagen de ${displayName}`}
              priority={priority}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}

        </div>

        <div className="explore-card-content">
          <h3 className="explore-card-title">{displayName}</h3>
          {item.bio && <p className="explore-card-subtitle">{item.bio}</p>}

          <div className="explore-card-meta">
            {zonaNombres.slice(0, 1).map((z: string, i: number) => (
              <div key={`z-${i}`} className="explore-card-tag">📍 {z}</div>
            ))}
          </div>
        </div>
      </article>
    </LiveLink>
  );
}

const TeacherCard = React.memo(TeacherCardBase);

export default TeacherCard;

