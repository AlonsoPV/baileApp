import React from "react";
import { motion } from "framer-motion";
import LiveLink from "../../LiveLink";
import { urls } from "../../../lib/urls";
import { useTags } from "../../../hooks/useTags";
import { RITMOS_CATALOG } from "../../../lib/ritmosCatalog";
import { getMediaBySlot } from "../../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../../utils/mediaSlots";
import { normalizeAndOptimizeUrl } from "../../../utils/imageOptimization";
import { EXPLORE_CARD_STYLES } from "./_sharedExploreCardStyles";

interface AcademyCardProps {
  item: any;
}

export default function AcademyCard({ item }: AcademyCardProps) {
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
  const mediaList = Array.isArray(item?.media) ? (item.media as MediaSlotItem[]) : [];
  const primaryAvatar =
    normalizeAndOptimizeUrl(
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

  // Mapear ritmos por catálogo (ritmos_seleccionados) o por ids numéricos (ritmos/estilos)
  const ritmoNombres: string[] = (() => {
    try {
      const labelByCatalogId = new Map<string, string>();
      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
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
              '--img': (primaryAvatarWithCacheBust || primaryAvatar)
                ? `url(${primaryAvatarWithCacheBust || primaryAvatar})`
                : undefined,
            } as React.CSSProperties}
          >
            {(primaryAvatarWithCacheBust || primaryAvatar) && (
              <img
                src={primaryAvatarWithCacheBust || primaryAvatar || undefined}
                alt={`Imagen de ${nombre}`}
                loading="lazy"
                decoding="async"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
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
            <h3 className="explore-card-title">{nombre}</h3>

            {bio && <p className="explore-card-subtitle">{bio}</p>}

            <div className="explore-card-meta">
              {zonaNombres.slice(0, 1).map((z: string, i: number) => (
                <div key={`z-${i}`} className="explore-card-tag">📍 {z}</div>
              ))}
              {ritmoNombres.slice(0, 1).map((r: string, i: number) => (
                <div key={`r-${i}`} className="explore-card-tag">🎵 {r}</div>
              ))}
            </div>
          </div>
        </motion.article>
      </LiveLink>
    </>
  );
}
