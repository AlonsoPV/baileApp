import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { getMediaBySlot, normalizeMediaArray } from "../../../utils/mediaSlots";
import { toDirectPublicStorageUrl } from "../../../utils/imageOptimization";
import ExploreResponsiveImage from "../../explore/ExploreResponsiveImage";
import "./ExploreCardsShared.css";

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

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => setImageError(false), [primaryAvatar, avatarCacheKey]);
  const showPlaceholder = !primaryAvatar || imageError;
  const placeholderReason = !primaryAvatar ? 'URL vacía' : imageError ? 'Image load failed' : '';

  const zonaNombres: string[] = (item.zonas || [])
    .map((zid: number) => allTags?.find((t: any) => t.id === zid && t.tipo === 'zona')?.nombre)
    .filter(Boolean);

  return (
    <LiveLink to={urls.academyLive(id)} asCard={false}>
      <motion.article
        className="explore-card explore-card-mobile"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.01, transition: { duration: 0.18 } }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="explore-card-media">
          {showPlaceholder && (
            <div className="explore-card-media-placeholder" data-reason={placeholderReason} aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          )}
          {primaryAvatar && !imageError && (
            <ExploreResponsiveImage
              rawUrl={primaryAvatar}
              cacheVersion={avatarCacheKey || null}
              preset="carouselCard"
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
          </div>
        </div>
      </motion.article>
    </LiveLink>
  );
}
