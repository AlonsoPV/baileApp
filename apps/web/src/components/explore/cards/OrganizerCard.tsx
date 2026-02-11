import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { normalizeAndOptimizeUrl, logCardImage } from "../../../utils/imageOptimization";
import { getMediaBySlot } from "../../../utils/mediaSlots";
import { EXPLORE_CARD_STYLES } from "./_sharedExploreCardStyles";

interface OrganizerCardProps {
  item: any;
}

export default function OrganizerCard({ item }: OrganizerCardProps) {
  // Priorizar foto 1 de avatar (slot 'p1'), luego slot 'avatar', luego avatar_url, luego portada, luego cover
  const bannerUrl: string | undefined = (() => {
    const mediaList = Array.isArray(item?.media) ? item.media : [];
    
    // 1. Prioridad: slot 'p1' (foto 1 de avatar)
    const slotP1 = getMediaBySlot(mediaList as any, 'p1');
    if (slotP1?.url) {
      return normalizeAndOptimizeUrl(slotP1.url as string) as string;
    }
    
    // 2. Slot 'avatar'
    const slotAvatar = getMediaBySlot(mediaList as any, 'avatar');
    if (slotAvatar?.url) {
      return normalizeAndOptimizeUrl(slotAvatar.url as string) as string;
    }
    
    // 3. avatar_url directo
    if (item?.avatar_url) {
      return normalizeAndOptimizeUrl(item.avatar_url);
    }
    
    // 4. portada_url
    if (item?.portada_url) {
      return normalizeAndOptimizeUrl(item.portada_url);
    }
    
    // 5. Slot 'cover'
    const slotCover = getMediaBySlot(mediaList as any, 'cover');
    if (slotCover?.url) {
      return normalizeAndOptimizeUrl(slotCover.url as string) as string;
    }
    
    // 6. Fallback: primer media
    if (mediaList.length > 0) {
      const first = mediaList[0];
      return normalizeAndOptimizeUrl(first?.url || first?.path || (typeof first === 'string' ? first : undefined));
    }
    
    return undefined;
  })();

  // Cache-busting para la imagen del organizador
  const bannerCacheKey =
    ((item as any)?.updated_at as string | undefined) ||
    ((item as any)?.created_at as string | undefined) ||
    (item.id as string | number | undefined) ||
    (item.nombre_publico as string | undefined) ||
    '';

  const bannerUrlWithCacheBust = React.useMemo(() => {
    if (!bannerUrl) return undefined;
    const separator = String(bannerUrl).includes('?') ? '&' : '?';
    const key = encodeURIComponent(String(bannerCacheKey ?? ''));
    return `${bannerUrl}${separator}_t=${key}`;
  }, [bannerUrl, bannerCacheKey]);

  const [imageError, setImageError] = React.useState(false);
  const imageUrlFinal = bannerUrlWithCacheBust || bannerUrl;
  React.useEffect(() => setImageError(false), [imageUrlFinal]);
  const showPlaceholder = !imageUrlFinal || imageError;
  const placeholderReason = !bannerUrl ? 'URL vacía' : imageError ? 'Image load failed' : '';
  logCardImage('organizador', item.id, imageUrlFinal, !!imageUrlFinal, !imageUrlFinal ? 'URL vacía' : undefined);

  return (
    <>
      <style>{EXPLORE_CARD_STYLES}</style>
      <LiveLink to={`/organizer/${item.id}`} asCard={false}>
        <motion.article
          className="explore-card explore-card-mobile"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{
            scale: 1.03,
            y: -8,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div
            className="explore-card-media"
            style={{
              '--img': imageUrlFinal && !imageError ? `url(${imageUrlFinal})` : undefined,
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
                alt={`Imagen de ${item?.nombre_publico || 'Organizador'}`}
                loading="lazy"
                decoding="async"
                onLoad={() => { logCardImage('organizador', item.id, imageUrlFinal, true, 'load'); setImageError(false); }}
                onError={(e) => {
                  const msg = (e.nativeEvent as unknown as { message?: string })?.message ?? 'Image load failed';
                  console.warn('[CardImageError] type=organizador id=', item.id, 'uri=', imageUrlFinal?.slice(0, 80), 'error=', msg);
                  setImageError(true);
                }}
              />
            )}

            <div className="explore-card-actions">
              <div className="explore-card-cta">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="explore-card-content">
            <h3 className="explore-card-title">{item?.nombre_publico || 'Organizador'}</h3>
          </div>
        </motion.article>
      </LiveLink>
    </>
  );
}

