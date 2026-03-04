import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { getMediaBySlot, normalizeMediaArray } from "../../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../../utils/mediaSlots";
import { toDirectPublicStorageUrl, logCardImage } from "../../../utils/imageOptimization";
import { EXPLORE_CARD_STYLES } from "./_sharedExploreCardStyles";

interface AcademyCardProps {
  item: any;
  /** Si true, evita lazy-loading y eleva prioridad (LCP) */
  priority?: boolean;
}

export default function AcademyCard({ item, priority = false }: AcademyCardProps) {
  const { data: allTags } = useTags() as any;
  const id = item.id;
  // Nombre robusto: aceptar múltiples campos antes de caer en el fallback
  const nombre =
    item.nombre_publico ||
    item.academy_name ||
    item.display_name ||
    item.nombre_academia ||
    item.nombre ||
    item.name ||
    "Academia";
  const bio = item.bio || "";
  const mediaList = normalizeMediaArray(item?.media);
  const primaryAvatar =
    toDirectPublicStorageUrl(
      getMediaBySlot(mediaList, 'p1')?.url ||
      getMediaBySlot(mediaList, 'cover')?.url ||
      item.avatar_url ||
      item.portada_url ||
      (mediaList[0] as any)?.url ||
      (mediaList[0] as any)?.path
    ) || null;

  // Cache-busting para la portada de la academia
  const avatarCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | number | undefined) ||
    (item.nombre_publico as string | undefined) ||
    '';

  const primaryAvatarWithCacheBust = React.useMemo(() => {
    if (!primaryAvatar) return null;
    const separator = String(primaryAvatar).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(avatarCacheKey ?? ''));
    return `${primaryAvatar}${separator}_t=${key}`;
  }, [primaryAvatar, avatarCacheKey]);

  const [imageError, setImageError] = React.useState(false);
  const imageUrlFinal = primaryAvatarWithCacheBust || primaryAvatar;
  React.useEffect(() => setImageError(false), [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;
  const placeholderReason = !primaryAvatar ? 'URL vacía' : imageError ? 'Image load failed' : '';
  logCardImage('academia', id, imageUrlFinal ?? undefined, !!imageUrlFinal, !imageUrlFinal ? 'URL vacía' : undefined);

  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((t: any) => t.id === zid && t.tipo === 'zona')?.nombre)
    .filter(Boolean);

  return (
    <>
      <style>{EXPLORE_CARD_STYLES}</style>
      <LiveLink to={urls.academyLive(id)} asCard={false}>
        <motion.article
          className="explore-card explore-card-mobile"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03, y: -8, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
        >
          <div
            className="explore-card-media"
            style={{
              '--img': !priority && imageUrlFinal && !imageError ? `url(${imageUrlFinal})` : undefined,
            } as React.CSSProperties}
          >
            {showPlaceholder && (
              <div className="explore-card-media-placeholder" data-reason={placeholderReason} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
            {imageUrlFinal && !imageError && (
              <img
                src={imageUrlFinal}
                alt={`Imagen de ${nombre}`}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                onLoad={() => { logCardImage('academia', id, imageUrlFinal, true, 'load'); setImageError(false); }}
                onError={(e) => {
                  const msg = (e.nativeEvent as unknown as { message?: string })?.message ?? 'Image load failed';
                  console.warn('[CardImageError] type=academia id=', id, 'uri=', imageUrlFinal?.slice(0, 80), 'error=', msg);
                  setImageError(true);
                }}
              />
            )}

          </div>

          <div className="explore-card-content">
            <h3 className="explore-card-title">{nombre}</h3>

            {bio && <p className="explore-card-subtitle">{bio}</p>}

            <div className="explore-card-meta">
              {zonaNombres.slice(0, 1).map((z: string, i: number) => (
                <div key={`z-${i}`} className="explore-card-tag">📍 {z}</div>
              ))}
            </div>
          </div>
        </motion.article>
      </LiveLink>
    </>
  );
}
